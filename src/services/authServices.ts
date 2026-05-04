import type {
  SignupInput,
  User,
  userWithoutPassword,
  LoginInput,
  UpdateInput,
} from "../types/User.types";
import { sendEmail } from "../utils/emailService";
import jwt, { type JwtPayload } from "jsonwebtoken";
import db from "../db/userdb";

export function generateToken(email: string, exp: number) {
  const user = { email };
  const token = jwt.sign(user, process.env.ACCESS_TOKEN!, {
    expiresIn: `${exp}m`,
  });
  return token;
}

export function generateRefreshToken(email: string) {
  const user = { email };
  const token = jwt.sign(user, process.env.REFRESH_TOKEN!, {
    expiresIn: "7d",
  });
  return token;
}

export async function signup(input: SignupInput): Promise<userWithoutPassword> {
  const { email, password, firstName, lastName, username } = input;
  const token = generateToken(email, 5);

  const newUser: User = {
    email: email.trim(),
    password: password.trim(),
    username: username.trim(),
    profile: {
      firstName: firstName.trim(),
      lastName: (lastName && lastName.trim()) ?? null,
      bio: null,
    },
    isVerified: false,
    verificationToken: token,
  };

  await sendEmail(token, email);

  return await db.register(newUser);
}

export async function emailVerification(token: string): Promise<true> {
  return await db.verify(token);
}

export async function resendEmail(input: SignupInput): Promise<true> {
  const { email } = input;
  const token = generateToken(email, 5);

  return await db.resendEmail(email, token);
}

export async function login(
  input: LoginInput,
): Promise<{ accessToken: string; refreshToken: string }> {
  return await db.authenticate(input);
}

export async function update(id: string, input: UpdateInput) {
  return await db.update(id, input);
}

export async function newTokenGeneration(
  refreshToken: string,
): Promise<string> {
  if (!refreshToken) {
    throw {
      status: 401,
      message: "The refresh token was not provided",
      isManual: true,
    };
  }
  let accessToken = "";
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN!, (err, decoded) => {
    if (err) {
      throw {
        status: 403,
        message: "The refresh token is invalid",
        isManual: true,
      };
    }
    const token = generateToken((decoded as JwtPayload).email, 15);
    accessToken = token;
  });
  return accessToken;
}

export async function getUser(email: string): Promise<userWithoutPassword> {
  return await db.getUser(email);
}
