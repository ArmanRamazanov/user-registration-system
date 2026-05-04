import mongoose from "mongoose";

export function dbErrorHandler(error: unknown) {
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));

    return { status: 400, details };
  }

  if ((error as { code: number }).code === 11000) {
    const field = Object.keys(
      (error as { keyValue: {} }).keyValue,
    )[0] as string;
    const details = {
      field,
      message: `This ${field} already exists`,
    };
    return {
      status: 409,
      details,
    };
  }

  if (
    (error as { name: string }).name === "TokenExpiredError" ||
    (error as { name: string }).name === "JsonWebTokenError"
  ) {
    return {
      status: 400,
      message: "Invalid or expired token",
    };
  }

  if ((error as { isManual: boolean }).isManual) {
    const { status, message, field } = error as {
      status: number;
      message: string;
      field: string;
    };

    if (field) {
      return { status, details: { field, message } };
    }
    return { status, message };
  }

  return { status: 500, message: (error as { stack: string }).stack };
}
