import mongoose, { Schema } from "mongoose";
import type { User } from "../types/User.types";
import bcrypt from "bcrypt";

const userSchema = new Schema<User>({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    unique: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minLength: [6, "Password must be at least 6 characters"],
    validate: {
      validator: function (value: string) {
        return /(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/.test(value);
      },
      message:
        "Password must contain at least one lowercase, one uppercase, and one special character",
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      trim: true,
      minLength: 1,
    },
    bio: {
      type: String,
      trim: true,
      minLength: 1,
    },
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

export const UserModel = mongoose.model<User>("User", userSchema);
