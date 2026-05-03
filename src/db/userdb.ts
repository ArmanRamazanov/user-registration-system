import { UserModel } from "../models/User";
import type {
  LoginInput,
  User,
  userWithoutPassword,
} from "../types/User.types";
import { sendEmail } from "../utils/emailService";
import bcrypt from "bcrypt";
import { generateRefreshToken, generateToken } from "../services/authServices";
import { dbErrorHandler } from "./dbErrorHandler";
import jwt from "jsonwebtoken";

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
  async verify(token: string): Promise<true> {
    try {
      const user = await UserModel.findOne({ verificationToken: token });

      if (!user) {
        throw {
          status: 400,
          field: null,
          message: "Invalid or expired verification link",
          isManual: true,
        };
      }

      jwt.verify(token, process.env.ACCESS_TOKEN!, (err, decoded) => {
        if (err) {
          throw {
            status: 400,
            field: null,
            message: "Invalid or expired verification link",
            isManual: true,
          };
        }

        user.verificationToken = null;
        user.isVerified = true;
      });

      await user.save();
      return true;
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

  async authenticate(
    input: LoginInput,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      console.log("authenticate reached");
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

      if (await bcrypt.compare(password, user.password)) {
        const token = generateToken(email, 15);
        const refreshToken = generateRefreshToken(email);
        return { accessToken: token, refreshToken };
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

  async getUser(email: string): Promise<userWithoutPassword> {
    try {
      const user = (await UserModel.findOne({
        email: email,
      })) as userWithoutPassword;
      return user;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }
}

export default new UserDB();
