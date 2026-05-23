import type { RequestHandler } from "express";
import { forbidden, unauthorized } from "../Utils/errors.js";
import { verifyAccessToken } from "../Utils/tokens.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    next(unauthorized("Token required"));
    return;
  }

  try {
    const payload = verifyAccessToken(authorization.slice("Bearer ".length));
    req.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (error) {
    next(
      unauthorized(
        error instanceof Error ? error.message : "Invalid or expired token",
      ),
    );
  }
};

export function requireRole(role: "admin" | "superadmin"): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(unauthorized("Token required"));
      return;
    }

    if (req.user.role !== role) {
      next(forbidden("Insufficient role"));
      return;
    }

    next();
  };
}
