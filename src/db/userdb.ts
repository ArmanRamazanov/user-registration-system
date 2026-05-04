import { UserModel } from "../models/User";
import type {
  LoginInput,
  UpdateInput,
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

      const { email, newPassword, firstName, lastName, username, bio } = input;

      if (email) {
        user.email = email;
      }
      if (newPassword) {
        user.password = newPassword;
      }
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
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN!);

      const user = await UserModel.findOne({ verificationToken: token });

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
      }).select("-password")) as userWithoutPassword;

      return user;
    } catch (error) {
      throw dbErrorHandler(error);
    }
  }
}

export default new UserDB();
