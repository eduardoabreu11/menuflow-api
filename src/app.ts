// src/app.ts

import "dotenv/config";

import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import Routes from "./routes/routes.js";

import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://serviu-web.vercel.app",
  process.env.FRONTEND_URL?.trim().replace(/\/$/, ""),
].filter((origin): origin is string => Boolean(origin));

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origem não permitida pelo CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
  },
});

app.use("/login", loginLimiter);

app.get("/", (req, res) => {
  return res.json({
    name: "MenuFlow API",
    status: "online",
  });
});

app.use(Routes);

app.use(notFoundHandler);

app.use(errorHandler);

export { app };