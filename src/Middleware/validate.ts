import type { RequestHandler } from "express";

export function validateBody<T>(parser: (input: unknown) => T): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = parser(req.body) as T;
      next();
    } catch (error) {
      next(error);
    }
  };
}
