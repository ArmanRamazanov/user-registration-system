import { UserModel } from "../models/User";
import {
  Role,
  type LoginInput,
  type UpdateInput,
  type User,
  type userWithoutPassword,
} from "../types/User.types";
import { sendEmail } from "../utils/emailService";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
} from "../services/authServices";
import { dbErrorHandler } from "./dbErrorHandler";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import redis from "./redis-db";

class UserDB {
  async register(newUser: User): Promise<userWithoutPassword> {
    try {
      const user = await UserModel.create(newUser);
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }

  async update(id: string, input: UpdateInput): Promise<userWithoutPassword> {
    try {
      const user = await UserModel.findById(id);

      if (!user) {
        throw {
          status: 404,
          field: null,
          message: "The user was not found",
          isManual: true,
        };
      }

      const { firstName, lastName, username, bio } = input;

      if (firstName) {
        user.profile.firstName = firstName;
      }
      if (lastName) {
        user.profile.lastName = lastName;
      }
      if (username) {
        user.username = username;
      }
      if (bio) {
        user.profile.bio = bio;
      }

      const { password, ...userWithoutPassword } = user.toObject();
      await user.save();

      return userWithoutPassword;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }

  async verify(token: string): Promise<true> {
    try {
      const payload = jwt.verify(
        token,
        process.env.ACCESS_TOKEN!,
      ) as JwtPayload;

      const user = await UserModel.findOne({ email: payload.email });

      if (!user) {
        throw {
          status: 400,
          field: null,
          message: "Invalid or expired verification link",
          isManual: true,
        };
      }

      user.verificationToken = null;
      user.isVerified = true;

      await user.save();
      return true;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }

  async newTokenGeneration(refreshToken: string): Promise<string> {
    try {
      if (!refreshToken) {
        throw {
          status: 401,
          message: "The refresh token was not provided",
          isManual: true,
        };
      }

      const refreshTokenPayload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN!,
      ) as JwtPayload;

      if (!redis.get(`refreshToken:jti:${refreshTokenPayload.jti}`)) {
        throw {
          status: 401,
          message: "The refresh token is no longer available",
          isManual: true,
        };
      }

      const accessToken = generateAccessToken(
        refreshTokenPayload.sub!,
        refreshTokenPayload.role,
      );

      return accessToken;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }

  async resendEmail(email: string, token: string): Promise<true> {
    try {
      const user = await UserModel.findOne({ email: email });

      if (!user) {
        throw {
          status: 404,
          field: "email",
          message: "The user with this email was not found",
          isManual: true,
        };
      }

      user.verificationToken = token;
      await user.save();
      await sendEmail(token, email);
      return true;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }

  async changeToAdmin(email: string): Promise<userWithoutPassword | null> {
    try {
      const user = await UserModel.findOne({ email: email }).select(
        "-password",
      );
      if (user) {
        user.role = Role.Admin;
      }
      return user;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }

  async authenticate(
    input: LoginInput,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { email, password } = input;

      const user = await UserModel.findOne({ email: email });

      if (!user) {
        throw {
          status: 404,
          field: "email",
          message: "The user with this email was not found",
          isManual: true,
        };
      }

      if (!user.isVerified) {
        throw {
          status: 403,
          field: null,
          message: "The user has not verified his account yet",
          isManual: true,
        };
      }

      if (await bcrypt.compare(password, user.password)) {
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id, user.role);
        return { accessToken, refreshToken };
      } else {
        throw {
          status: 400,
          messsage: "The password is incorrect",
          field: "password",
          isManual: true,
        };
      }
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }

  async getUser(id: string): Promise<userWithoutPassword> {
    try {
      const user = (await UserModel.findById(id).select(
        "-password",
      )) as userWithoutPassword;

      return user;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }

  async getUsers(): Promise<userWithoutPassword[]> {
    try {
      return await UserModel.find({});
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }
}

export default new UserDB();
