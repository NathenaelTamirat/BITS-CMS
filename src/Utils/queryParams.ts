import { badRequest } from "./errors.js";

/**
 * Parse a query parameter string as a positive integer.
 * Throws a 400 BadRequest if the value is present but not a valid positive integer.
 * Returns `fallback` when the value is absent.
 */
export function parsePositiveInteger(
  value: string | string[] | undefined,
  fallback: number,
  field: string,
): number {
  if (value === undefined) {
    return fallback;
  }

  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }

  return parsed;
}

/**
 * Parse a path parameter (`:id` segment) as a positive integer.
 * Throws a 400 BadRequest if the value is not a valid positive integer.
 */
export function parseId(
  value: string | string[] | undefined,
  field: string,
): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }

  return parsed;
}
