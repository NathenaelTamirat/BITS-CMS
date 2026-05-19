import {
  asObject,
  ensureEmail,
  readOptionalString,
  readRequiredString,
  throwIfValidationFailed,
} from "./helpers.js";
import type { AdminRole } from "../DB/admin.js";
import type { FieldError } from "../Utils/errors.js";

export type CreateAdminBody = {
  email: string;
  password: string;
  role: AdminRole;
};

export type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
};

export type ResetAdminPasswordBody = {
  newPassword: string;
};

export function parseCreateAdminBody(input: unknown): CreateAdminBody {
  const body = asObject(input);
  const errors: FieldError[] = [];
  const email = readRequiredString(body, "email", errors, { max: 255 });
  const password = readRequiredString(body, "password", errors, { min: 6, max: 255 });
  const roleValue = readOptionalString(body, "role", errors, { max: 20 }) ?? "admin";

  if (email) {
    ensureEmail(email, "email", errors);
  }

  if (roleValue !== "admin" && roleValue !== "superadmin") {
    errors.push({ field: "role", message: "role must be either admin or superadmin" });
  }

  throwIfValidationFailed(errors);

  return {
    email: email.toLowerCase(),
    password,
    role: roleValue as AdminRole,
  };
}

export function parseResetAdminPasswordBody(
  input: unknown,
): ResetAdminPasswordBody {
  const body = asObject(input);
  const errors: FieldError[] = [];
  const newPassword = readRequiredString(body, "newPassword", errors, {
    min: 6,
    max: 255,
  });

  throwIfValidationFailed(errors);

  return { newPassword };
}

export function parseChangePasswordBody(input: unknown): ChangePasswordBody {
  const body = asObject(input);
  const errors: FieldError[] = [];
  const currentPassword = readRequiredString(body, "currentPassword", errors, {
    min: 6,
    max: 255,
  });
  const newPassword = readRequiredString(body, "newPassword", errors, {
    min: 6,
    max: 255,
  });

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push({
      field: "newPassword",
      message: "newPassword must be different from currentPassword",
    });
  }

  throwIfValidationFailed(errors);

  return {
    currentPassword,
    newPassword,
  };
}
