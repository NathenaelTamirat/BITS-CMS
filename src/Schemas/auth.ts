import {
  asObject,
  ensureEmail,
  readRequiredString,
  throwIfValidationFailed,
} from "./helpers.js";
import type { FieldError } from "../Utils/errors.js";

export type LoginBody = {
  email: string;
  password: string;
};

export function parseLoginBody(input: unknown): LoginBody {
  const body = asObject(input);
  const errors: FieldError[] = [];
  const email = readRequiredString(body, "email", errors, { max: 255 });
  const password = readRequiredString(body, "password", errors, { min: 6, max: 255 });

  if (email) {
    ensureEmail(email, "email", errors);
  }

  throwIfValidationFailed(errors);

  return {
    email: email.toLowerCase(),
    password,
  };
}
