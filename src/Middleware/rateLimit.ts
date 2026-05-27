import type { RequestHandler } from "express";
import { AppError } from "../Utils/errors.js";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}): RequestHandler {
  const buckets = new Map<string, RateLimitBucket>();

  return (req, _res, next) => {
    const now = Date.now();
    const forwardedFor = req.headers["x-forwarded-for"];
    const ipSource = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor ?? req.ip ?? "unknown";
    const key = ipSource.split(",")[0].trim();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > options.max) {
      next(
        new AppError(
          429,
          "TOO_MANY_REQUESTS",
          options.message ?? "Too many requests",
        ),
      );
      return;
    }

    next();
  };
}
