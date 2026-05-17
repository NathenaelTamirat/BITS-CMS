import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "./env.js";

type TokenKind = "access" | "refresh";
type AdminRole = "admin" | "superadmin";

type BaseTokenPayload = {
  sub: number;
  email: string;
  role: AdminRole;
  type: TokenKind;
  iat: number;
  exp: number;
  jti?: string;
};

type SignableAccessPayload = {
  sub: number;
  email: string;
  role: AdminRole;
};

type SignableRefreshPayload = SignableAccessPayload & {
  jti?: string;
};

const header = {
  alg: "HS256",
  typ: "JWT",
} as const;

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign<T extends Omit<BaseTokenPayload, "iat" | "exp">>(
  payload: T,
  secret: string,
  ttlSeconds: number,
): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const fullPayload: BaseTokenPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(fullPayload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verify(token: string, secret: string): BaseTokenPayload {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }

  const [encodedHeader, encodedPayload, providedSignature] = parts;
  const expectedSignature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid token");
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as BaseTokenPayload;

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

export function signAccessToken(payload: SignableAccessPayload): string {
  return sign(
    { ...payload, type: "access" },
    env.jwtAccessSecret,
    env.accessTokenTtlSeconds,
  );
}

export function signRefreshToken(payload: SignableRefreshPayload): string {
  return sign(
    { ...payload, jti: payload.jti ?? randomUUID(), type: "refresh" },
    env.jwtRefreshSecret,
    env.refreshTokenTtlSeconds,
  );
}

export function verifyAccessToken(token: string): BaseTokenPayload {
  const payload = verify(token, env.jwtAccessSecret);

  if (payload.type !== "access") {
    throw new Error("Invalid access token");
  }

  return payload;
}

export function verifyRefreshToken(token: string): BaseTokenPayload {
  const payload = verify(token, env.jwtRefreshSecret);

  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }

  return payload;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getRefreshExpiryDate(): Date {
  return new Date(Date.now() + env.refreshTokenTtlSeconds * 1000);
}
