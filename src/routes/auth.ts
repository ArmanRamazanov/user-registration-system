import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import {
  emailVerification,
  login,
  newTokenGeneration,
  resendEmail,
  signup,
  getUser,
  update,
  getUsers,
  logout,
} from "../services/authServices";
import type { ApiResponse, userWithoutPassword } from "../types/User.types";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { validateCreate } from "../middleware/validation";
import {
  registerSanitization,
  LoginSanitization,
} from "../middleware/sanitize";

import redis from "../db/redis-db";

export const router = Router();

export async function authorize(
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction,
) {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token)
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token was not provided",
      });

    jwt.verify(token, process.env.ACCESS_TOKEN!, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Invalid token",
        });
      }
      if (await redis.get(`accessToken:jti:${(decoded as JwtPayload).jti!}`)) {
        return res.status(401).json({
          success: false,
          data: null,
          message: "Token is no longer available",
        });
      }
      req.userId = (decoded as JwtPayload).sub!;
      req.role = (decoded as JwtPayload).role!;
      next();
    });
  } catch (error) {
    next(error);
  }
}

async function checkAdmin(
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction,
) {
  const role = req.role;
  if (role !== "admin") {
    return res.status(403).json({
      success: false,
      data: null,
      message: "The user cannot access this data",
    });
  }
  next();
}

router.get(
  "/me",
  authorize,
  async (
    req: Request,
    res: Response<ApiResponse<userWithoutPassword>>,
    next: NextFunction,
  ) => {
    try {
      const user = await getUser(req.userId);
      res.json({
        success: true,
        data: user,
        message: null,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/admin/users",
  authorize,
  checkAdmin,
  async (
    req: Request,
    res: Response<ApiResponse<userWithoutPassword[]>>,
    next: NextFunction,
  ) => {
    try {
      const result = await getUsers();
      res.json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/admin/users/:id",
  authorize,
  checkAdmin,
  async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<userWithoutPassword>>,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const result = await getUser(id);
      res.json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/token",
  async (
    req: Request,
    res: Response<ApiResponse<string>>,
    next: NextFunction,
  ) => {
    try {
      const result = await newTokenGeneration(req.cookies.refreshToken);
      res.json({
        success: true,
        data: result,
        message: "The new token was successfully generated",
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/login",
  LoginSanitization,
  async (
    req: Request,
    res: Response<ApiResponse<string>>,
    next: NextFunction,
  ) => {
    try {
      const result = await login(req.body);
      const { accessToken, refreshToken } = result;
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({
        success: true,
        data: accessToken,
        message: "The user was successfully logged in",
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/logout",
  async (
    req: Request,
    res: Response<ApiResponse<null>>,
    next: NextFunction,
  ) => {
    try {
      const accessToken = req.headers["authorization"]?.split(" ")[1];

      const result = await logout(req.cookies.refreshToken, accessToken);

      if (result) {
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });

        res.json({
          success: true,
          data: null,
          message: "The user successfully logged out",
        });
      }
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/admin/users/:id",
  authorize,
  checkAdmin,
  async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<userWithoutPassword>>,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const result = await update(id, req.body);

      res.json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      next(error);
    }
  },
);
router.patch(
  "/me",
  authorize,
  async (
    req: Request,
    res: Response<ApiResponse<userWithoutPassword>>,
    next: NextFunction,
  ) => {
    try {
      const userId = req.userId;
      const result = await update(userId, req.body);

      return res.json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/register",
  registerSanitization,
  validateCreate,
  async (
    req: Request,
    res: Response<ApiResponse<userWithoutPassword>>,
    next: NextFunction,
  ) => {
    try {
      const result = await signup(req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: null,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/resend",
  async (
    req: Request,
    res: Response<ApiResponse<null>>,
    next: NextFunction,
  ) => {
    try {
      const result = await resendEmail(req.body);

      res.json({
        success: true,
        data: null,
        message: "The email was successfully resent",
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/email-verify",
  async (
    req: Request<{ token: string }>,
    res: Response<ApiResponse<null>>,
    next: NextFunction,
  ) => {
    try {
      const { token } = req.query;

      if (typeof token !== "string") {
        throw {
          status: 400,
          message: "Invalid url token",
          isManual: true,
        };
      }

      const result = await emailVerification(token);

      if (result) {
        res.json({
          success: true,
          data: null,
          message: "The email was verified successfully",
        });
      }
    } catch (error) {
      next(error);
    }
  },
);
