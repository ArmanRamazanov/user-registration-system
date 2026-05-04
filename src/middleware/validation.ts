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
  const { username, email, password, firstName, lastName } = req.body;
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

export async function validateUpdate(
  req: Request,
  res: Response<ApiResponse<{}[]>>,
  next: NextFunction,
) {
  const { username, email, newPassword, firstName, lastName, bio } = req.body;
  const errors = [];

  if (username !== undefined && typeof username !== "string") {
    errors.push("The username property must be a string");
    return errors;
  }

  if (username !== undefined && !username.trim().length) {
    errors.push("The username property cannot be empty");
  }

  if (email !== undefined && typeof email !== "string") {
    errors.push("The email property must be a string");
    return errors;
  }

  if (email !== undefined && !email.trim().length) {
    errors.push("The email property is required");
  }

  if (newPassword !== undefined && !validateEmail(newPassword)) {
    errors.push("The password property is invalid");
  }

  if (newPassword !== undefined && !newPassword.trim().length) {
    errors.push("The password property cannot be empty");
  }

  if (firstName !== undefined && !firstName.trim().length) {
    errors.push("The firstName property cannot be empty");
  }

  if (firstName !== undefined && typeof firstName !== "string") {
    errors.push("The firstName property must be string");
  }

  if (lastName !== undefined && !lastName.trim().length) {
    errors.push("The lastName property cannot be empty");
  }

  if (lastName !== undefined && typeof lastName !== "string") {
    errors.push("The lastName property must be string");
  }

  if (bio !== undefined && !bio.trim().length) {
    errors.push("The property bio cannot be empty");
  }

  if (bio !== undefined && typeof bio !== "string") {
    errors.push("The property bio must be string");
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
