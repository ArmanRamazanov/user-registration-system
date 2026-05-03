import mongoose from "mongoose";

export const connectToDatabase = (cb: (err: any) => void) => {
  mongoose
    .connect(process.env.MONGO_URI!)
    .then(() => {
      cb(null);
    })
    .catch((err) => {
      cb(err);
    });
};
