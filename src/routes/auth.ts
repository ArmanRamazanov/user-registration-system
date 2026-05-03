import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import {
  emailVerification,
  login,
  newTokenGeneration,
  resendEmail,
  signup,
  getUser,
} from "../services/authServices";
import type { ApiResponse, userWithoutPassword } from "../types/User.types";
import jwt from "jsonwebtoken";
import { validateCreate } from "../middleware/validation";
import {
  registerSanitization,
  LoginSanitization,
} from "../middleware/sanitize";

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

    jwt.verify(token, process.env.ACCESS_TOKEN!, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Invalid token",
        });
      }
      req.user = (decoded as { email: string }).email;
      next();
    });
  } catch (error) {
    throw error;
  }
}

router.get(
  "/main",
  authorize,
  async (
    req: Request,
    res: Response<ApiResponse<userWithoutPassword>>,
    next: NextFunction,
  ) => {
    try {
      if (req.user) {
        const user = await getUser(req.user);
        res.json({
          success: true,
          data: user,
          message: null,
        });
      }
    } catch (error) {
      throw error;
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
      const result = await newTokenGeneration(req.body.token);
      res.json({
        success: true,
        data: result,
        message: "The new token was successfully generated",
      });
    } catch (error) {
      throw error;
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
      throw error;
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
    } catch (error) {
      throw error;
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
      console.log("register is reached");
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
      console.log("resend reached");
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
