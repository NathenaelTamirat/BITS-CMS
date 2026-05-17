export type FieldError = {
  field: string;
  message: string;
};

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors?: FieldError[];

  constructor(
    status: number,
    code: string,
    message: string,
    errors?: FieldError[],
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export function validationError(
  errors: FieldError[],
  message = "Validation failed",
): AppError {
  return new AppError(400, "VALIDATION_ERROR", message, errors);
}

export function badRequest(message: string): AppError {
  return new AppError(400, "BAD_REQUEST", message);
}

export function unauthorized(message: string): AppError {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message: string): AppError {
  return new AppError(403, "FORBIDDEN", message);
}

export function notFound(message: string): AppError {
  return new AppError(404, "NOT_FOUND", message);
}

export function conflict(message: string): AppError {
  return new AppError(409, "CONFLICT", message);
}

export function payloadTooLarge(message: string): AppError {
  return new AppError(413, "PAYLOAD_TOO_LARGE", message);
}
