import type { RequestHandler } from "express";
import { AppError } from "../Utils/errors.js";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const MAX_MAP_SIZE = 10_000;
const SWEEP_INTERVAL_MS = 60_000;

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}): RequestHandler {
  const buckets = new Map<string, RateLimitBucket>();

  // Periodic sweep to evict expired buckets and cap memory
  const sweep = () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
    // If still over cap after sweep, remove oldest entries
    if (buckets.size > MAX_MAP_SIZE) {
      const entries = [...buckets.entries()]
        .sort((a, b) => a[1].resetAt - b[1].resetAt);
      const toRemove = entries.slice(0, entries.length - MAX_MAP_SIZE);
      for (const [key] of toRemove) {
        buckets.delete(key);
      }
    }
  };

  const intervalId = setInterval(sweep, SWEEP_INTERVAL_MS);
  // Allow Node.js to exit even if the interval is still running
  if (intervalId.unref) intervalId.unref();

  return (req, _res, next) => {
    const now = Date.now();
    // req.ip is reliable because trust proxy is set in app.ts (A5).
    // It parses X-Forwarded-For from the RIGHT, counting nginx as the
    // single trusted hop — so an attacker cannot spoof their rate-limit
    // bucket by injecting a fake leftmost IP.
    const key = req.ip ?? "unknown";
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
