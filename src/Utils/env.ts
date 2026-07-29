import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const candidatePaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "src/.env"),
];

for (const candidatePath of candidatePaths) {
  if (fs.existsSync(candidatePath)) {
    dotenv.config({ path: candidatePath });
    break;
  }
}

function getRequired(name: string, fallback?: string): string {
  const value = (process.env[name] ?? fallback)?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getNumber(name: string, fallback: number): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: getNumber("PORT", 3000),
  dbHost: getRequired("DB_HOST"),
  dbPort: getNumber("DB_PORT", 5432),
  dbUser: getRequired("DB_USER"),
  dbPassword: (process.env.DB_PASSWORD ?? "").trim(),
  dbName: getRequired("DB_NAME"),
  jwtAccessSecret: getRequired("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: getRequired("JWT_REFRESH_SECRET"),
  corsOrigins: (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? "refreshToken",
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlSeconds: 7 * 24 * 60 * 60,
} as const;
