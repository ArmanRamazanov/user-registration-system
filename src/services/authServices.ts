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
import { Role } from "../types/User.types";
import { v4 as uuidv4 } from "uuid";
import type { SignOptions } from "jsonwebtoken";
import redis from "../db/redis-db";

export function generateToken(
  user: {},
  exp: SignOptions["expiresIn"] = "15m",
  secret: string,
) {
  const token = jwt.sign(user, secret, {
    expiresIn: exp,
  });
  return token;
}

export function generateAccessToken(id: string, role: string) {
  const jti = uuidv4();

  // redis.set(`accessToken:jti:${jti}`, "1", { ex: 900 });

  const user = { sub: id, role, jti };
  const accessToken = generateToken(user, "15m", process.env.ACCESS_TOKEN!);
  return accessToken;
}

export function generateRefreshToken(id: string, role: string) {
  const jti = uuidv4();

  redis.set(`refreshToken:jti:${jti}`, "1", { ex: 604800 });
  const user = { sub: id, role, jti };
  const refreshToken = generateToken(user, "7d", process.env.REFRESH_TOKEN!);
  return refreshToken;
}

export async function signup(input: SignupInput): Promise<userWithoutPassword> {
  const { email, password, firstName, lastName, username } = input;
  const token = generateToken({ email }, "5m", process.env.ACCESS_TOKEN!);

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
    role: Role.User,
  };

  await sendEmail(token, email);

  return await db.register(newUser);
}

export async function emailVerification(token: string): Promise<true> {
  return await db.verify(token);
}

export async function resendEmail(input: SignupInput): Promise<true> {
  const { email } = input;
  const token = generateToken({ email }, "5m", process.env.ACCESS_TOKEN!);

  return await db.resendEmail(email, token);
}

export async function login(
  input: LoginInput,
): Promise<{ accessToken: string; refreshToken: string }> {
  return await db.authenticate(input);
}

export async function logout(
  refreshToken: string,
  accessToken: string | undefined,
): Promise<true> {
  try {
    const refreshTokenPayload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN!,
    ) as JwtPayload;
    await redis.del(`refreshToken:jti:${refreshTokenPayload.jti}`);

    const accessTokenPayload = jwt.verify(
      accessToken ?? "",
      process.env.ACCESS_TOKEN!,
    ) as JwtPayload;
    const remainingTime =
      accessTokenPayload.exp! - Math.floor(Date.now() / 1000);
    await redis.set(`accessToken:jti:${accessTokenPayload.jti}`, "1", {
      ex: remainingTime,
    });
    return true;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return true;
    }
    throw error;
  }
}

export async function update(id: string, input: UpdateInput) {
  return await db.update(id, input);
}

export async function newTokenGeneration(
  refreshToken: string,
): Promise<string> {
  return db.newTokenGeneration(refreshToken);
}

export async function getUsers(): Promise<userWithoutPassword[]> {
  return await db.getUsers();
}

export async function getUser(id: string): Promise<userWithoutPassword> {
  return await db.getUser(id);
}

async function changeToAdmin(email: string) {
  return db.changeToAdmin(email);
}
