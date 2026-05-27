import express from "express";
import authRoutes from "./Routes/auth.js";
import postRoutes from "./Routes/posts.js";
import mediaRoutes from "./Routes/media.js";
import adminRoutes from "./Routes/admins.js";
import errorHandler from "./Middleware/errorHandler.js";
import { createRateLimiter } from "./Middleware/rateLimit.js";
import { env } from "./Utils/env.js";

const app = express();

//cors Headers Set
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = env.corsOrigin === "*" ? requestOrigin ?? "*" : env.corsOrigin;

  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }

  next();
});

//Json Body Parser  
app.use(express.json({ limit: "1mb" }));

//health checker
app.get("/api/health", (_req, res) => {
  res.json({
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    message: "OK",
  });
});

//Rate Limiter Applied
app.use(
  "/api/auth",
  createRateLimiter({
    windowMs: 60_000,
    max: 20,
    message: "Too many authentication requests. Please try again in a minute.",
  }),
  authRoutes,
);

//Posts Routes
app.use("/api/posts", postRoutes);

//Media Routes
app.use("/api/media", mediaRoutes);

//Admin Routes
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

export default app;
