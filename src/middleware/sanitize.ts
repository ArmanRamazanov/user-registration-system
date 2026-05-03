import { body } from "express-validator";

export const registerSanitization = [
  body("username").trim().escape(),
  body("password").trim(),
  body("email").trim().normalizeEmail(),
  body("firstName").trim().escape(),
  body("lastName").trim().escape(),
  body("bio").trim().escape(),
];
export const LoginSanitization = [
  body("email").trim().normalizeEmail(),
  body("password").trim(),
];
