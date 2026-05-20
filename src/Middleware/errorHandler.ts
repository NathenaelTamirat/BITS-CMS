import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { AppError, conflict, payloadTooLarge } from "../Utils/errors.js";

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const mapped =
      error.code === "LIMIT_FILE_SIZE"
        ? payloadTooLarge("File exceeds the 10 MB limit")
        : new AppError(400, "UPLOAD_ERROR", error.message);

    res.status(mapped.status).json({
      error: true,
      code: mapped.code,
      message: mapped.message,
      ...(mapped.errors ? { errors: mapped.errors } : {}),
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    const mapped = conflict("A unique value already exists");
    res.status(mapped.status).json({
      error: true,
      code: mapped.code,
      message: mapped.message,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: true,
      code: error.code,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    });
    return;
  }

  console.error("[ERROR]", error);

  res.status(500).json({
    error: true,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
  });
};

export default errorHandler;
