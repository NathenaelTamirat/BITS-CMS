import { type FieldError, validationError } from "../Utils/errors.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function asObject(
  input: unknown,
  field = "body",
): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw validationError([{ field, message: `${field} must be an object` }]);
  }

  return input as Record<string, unknown>;
}

export function asNestedObject(
  input: unknown,
  field: string,
  errors: FieldError[],
): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    errors.push({ field, message: `${field} must be an object` });
    return null;
  }

  return input as Record<string, unknown>;
}

export function readRequiredString(
  source: Record<string, unknown>,
  key: string,
  errors: FieldError[],
  options: {
    field?: string;
    max?: number;
    min?: number;
  } = {},
): string {
  const field = options.field ?? key;
  const rawValue = source[key];

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    errors.push({ field, message: `${field} is required` });
    return "";
  }

  const value = rawValue.trim();

  if (options.min !== undefined && value.length < options.min) {
    errors.push({
      field,
      message: `${field} must be at least ${options.min} characters`,
    });
  }

  if (options.max !== undefined && value.length > options.max) {
    errors.push({
      field,
      message: `${field} must be at most ${options.max} characters`,
    });
  }

  return value;
}

export function readOptionalString(
  source: Record<string, unknown>,
  key: string,
  errors: FieldError[],
  options: {
    field?: string;
    max?: number;
  } = {},
): string | undefined {
  const field = options.field ?? key;
  const rawValue = source[key];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined;
  }

  if (typeof rawValue !== "string") {
    errors.push({ field, message: `${field} must be a string` });
    return undefined;
  }

  const value = rawValue.trim();

  if (options.max !== undefined && value.length > options.max) {
    errors.push({
      field,
      message: `${field} must be at most ${options.max} characters`,
    });
  }

  return value;
}

export function readRequiredPositiveInteger(
  source: Record<string, unknown>,
  key: string,
  errors: FieldError[],
  field = key,
): number {
  const rawValue = source[key];

  if (!Number.isInteger(rawValue) || Number(rawValue) <= 0) {
    errors.push({ field, message: `${field} must be a positive integer` });
    return 0;
  }

  return Number(rawValue);
}

export function readOptionalBoolean(
  source: Record<string, unknown>,
  key: string,
  errors: FieldError[],
  field = key,
): boolean | undefined {
  const rawValue = source[key];

  if (rawValue === undefined) {
    return undefined;
  }

  if (typeof rawValue !== "boolean") {
    errors.push({ field, message: `${field} must be a boolean` });
    return undefined;
  }

  return rawValue;
}

export function readOptionalDateString(
  source: Record<string, unknown>,
  key: string,
  errors: FieldError[],
  field = key,
): string | undefined {
  const rawValue = source[key];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return undefined;
  }

  if (typeof rawValue !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    errors.push({ field, message: `${field} must be in YYYY-MM-DD format` });
    return undefined;
  }

  const date = new Date(`${rawValue}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    errors.push({ field, message: `${field} must be a valid date` });
    return undefined;
  }

  return rawValue;
}

export function readArray(
  source: Record<string, unknown>,
  key: string,
  errors: FieldError[],
  field = key,
): unknown[] | undefined {
  const rawValue = source[key];

  if (rawValue === undefined) {
    return undefined;
  }

  if (!Array.isArray(rawValue)) {
    errors.push({ field, message: `${field} must be an array` });
    return undefined;
  }

  return rawValue;
}

export function ensureEmail(value: string, field: string, errors: FieldError[]): void {
  if (!emailPattern.test(value)) {
    errors.push({ field, message: `${field} must be a valid email address` });
  }
}

export function ensureSlug(value: string, field: string, errors: FieldError[]): void {
  if (!slugPattern.test(value)) {
    errors.push({
      field,
      message: `${field} must contain only lowercase letters, numbers, and hyphens`,
    });
  }
}

export function throwIfValidationFailed(errors: FieldError[]): void {
  if (errors.length > 0) {
    throw validationError(errors);
  }
}
