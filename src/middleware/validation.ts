import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "../types/User.types";

function validateEmail(email: string) {
  if (typeof email !== "string") return false;
  if (email.length > 254) return false;

  const [local, domain, ...extra] = email.split("@");
  if (extra.length > 0 || !local || !domain) return false;
  if (local.length > 64) return false;

  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;
  if (domainParts.some((part) => part.length === 0)) return false;

  const localValid = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local);
  const domainValid = /^[a-zA-Z0-9-]+$/.test(domainParts.join(""));
  const tldValid = /^[a-zA-Z]{2,}$/.test(domainParts[domainParts.length - 1]!);

  return localValid && domainValid && tldValid;
}

function validatePassword(password: string) {
  if (password.length < 6)
    return "The password must contain at least 6 characters";
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(password)) {
    return "The password property must contain at least one lowercase, one uppercase, and one special character";
  }
  return false;
}

export async function validateCreate(
  req: Request,
  res: Response<ApiResponse<{}[]>>,
  next: NextFunction,
) {
  const { username, email, password, firstName, lastName, bio } = req.body;
  const errors = [];

  if (username !== undefined && typeof username !== "string") {
    errors.push({
      field: "username",
      message: "The username property must be string",
    });
  }

  if (!username || !username.trim().length) {
    errors.push({
      field: "username",
      message: "The username property is required",
    });
  }

  if (!email || !email.trim().length) {
    errors.push({
      field: "username",
      message: "The email property is required",
    });
  }

  if (!validateEmail(email)) {
    errors.push({ field: "email", message: "The email property is invalid" });
  }

  if (!password || !password.trim().length) {
    errors.push({
      field: "password",
      message: "The password property is required",
    });
  }

  const result = validatePassword(password);

  if (result) {
    errors.push({ field: "password", message: result });
  }

  if (!firstName || !firstName.trim().length) {
    errors.push({
      field: "firstName",
      message: "The firstName property is required",
    });
  }

  if (firstName !== undefined && typeof firstName !== "string") {
    errors.push({
      field: "firstName",
      message: "The firstName property must be string",
    });
  }

  if (lastName !== undefined && !lastName.trim().length) {
    errors.push({
      field: "lastName",
      message: "The lastName property cannot be empty",
    });
  }

  if (lastName !== undefined && typeof lastName !== "string") {
    errors.push({
      field: "lastName",
      message: "The lastName property must be string",
    });
  }

  if (bio && !bio.trim().length) {
    errors.push({ field: "bio", message: "The property bio cannot be empty" });
  }

  if (bio && typeof bio !== "string") {
    errors.push({ field: "bio", message: "The property bio must be string" });
  }

  if (errors.length) {
    res.status(400).json({
      success: false,
      data: errors,
      message: null,
    });
  } else {
    next();
  }
}
