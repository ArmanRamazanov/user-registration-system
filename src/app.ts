import "dotenv/config";
import express from "express";
import { router } from "./routes/auth";
import type { Request, Response, NextFunction } from "express";
import { connectToDatabase } from "./db/dbConnection";
import cors from "cors";
import { errorHandler } from "./errorHandler";

const app = express();
const PORT = process.env.PORT;
connectToDatabase((err) => {
  if (!err) {
    app.use(express.json());
    app.use(
      cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      }),
    );
    app.get("/test", (req, res) => {
      res.json({ ok: true });
    });
    app.use("/api/auth", router);
    app.use(errorHandler);
    app.listen(PORT, () => {
      console.log(`app is running on PORT ${PORT}`);
    });
  }
});
