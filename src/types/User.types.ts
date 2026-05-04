export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export interface User {
  username: string;
  password: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string | null;
    bio: string | null;
  };
  isVerified: boolean;
  verificationToken: string | null;
}

export type userWithoutPassword = Omit<User, "password">;

export type SignupInput = Omit<
  User,
  "profile" | "isVerified" | "verificationToken"
> & {
  firstName: string;
  lastName?: string;
};

export type LoginInput = Pick<User, "email" | "password">;

export type UpdateInput = Partial<
  Omit<SignupInput, "password"> & {
    bio?: string;
    newPassword?: string;
  }
>;
