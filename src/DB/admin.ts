import { query, type QueryExecutor } from "./client.js";

export type AdminRole = "admin" | "superadmin";

export type AdminRecord = {
  adminId: number;
  email: string;
  passwordHashed: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type AdminPublicRecord = Omit<AdminRecord, "passwordHashed">;

export type RefreshTokenRecord = {
  refreshTokenId: number;
  adminId: number;
  tokenHash: string;
  expiresAt: Date | string;
  revokedAt: Date | string | null;
  replacedByTokenHash: string | null;
  lastUsedAt: Date | string | null;
  createdAt: Date | string;
};

const database: QueryExecutor = { query };

export async function findAdminByEmail(
  email: string,
  executor: QueryExecutor = database,
): Promise<AdminRecord | null> {
  const result = await executor.query<AdminRecord>(
    `
      SELECT
        adminid AS "adminId",
        email,
        passwordhashed AS "passwordHashed",
        role,
        isactive AS "isActive",
        createdat AS "createdAt",
        updatedat AS "updatedAt"
      FROM admin
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function findAdminById(
  adminId: number,
  executor: QueryExecutor = database,
): Promise<AdminRecord | null> {
  const result = await executor.query<AdminRecord>(
    `
      SELECT
        adminid AS "adminId",
        email,
        passwordhashed AS "passwordHashed",
        role,
        isactive AS "isActive",
        createdat AS "createdAt",
        updatedat AS "updatedAt"
      FROM admin
      WHERE adminid = $1
      LIMIT 1
    `,
    [adminId],
  );

  return result.rows[0] ?? null;
}

export async function createAdminAccount(
  input: {
    email: string;
    passwordHashed: string;
    role: AdminRole;
  },
  executor: QueryExecutor = database,
): Promise<AdminPublicRecord> {
  const result = await executor.query<AdminPublicRecord>(
    `
      INSERT INTO admin (email, passwordhashed, role)
      VALUES ($1, $2, $3)
      RETURNING
        adminid AS "adminId",
        email,
        role,
        isactive AS "isActive",
        createdat AS "createdAt",
        updatedat AS "updatedAt"
    `,
    [input.email, input.passwordHashed, input.role],
  );

  return result.rows[0];
}

export async function listAdminAccounts(
  executor: QueryExecutor = database,
): Promise<AdminPublicRecord[]> {
  const result = await executor.query<AdminPublicRecord>(
    `
      SELECT
        adminid AS "adminId",
        email,
        role,
        isactive AS "isActive",
        createdat AS "createdAt",
        updatedat AS "updatedAt"
      FROM admin
      ORDER BY createdat DESC
    `,
  );

  return result.rows;
}

export async function deactivateAdmin(
  adminId: number,
  executor: QueryExecutor = database,
): Promise<boolean> {
  const result = await executor.query<{ adminId: number }>(
    `
      UPDATE admin
      SET isactive = FALSE,
          updatedat = CURRENT_TIMESTAMP
      WHERE adminid = $1
        AND isactive = TRUE
      RETURNING adminid AS "adminId"
    `,
    [adminId],
  );

  return Boolean(result.rows[0]);
}

export async function updateAdminPassword(
  adminId: number,
  passwordHashed: string,
  executor: QueryExecutor = database,
): Promise<boolean> {
  const result = await executor.query<{ adminId: number }>(
    `
      UPDATE admin
      SET passwordhashed = $2,
          updatedat = CURRENT_TIMESTAMP
      WHERE adminid = $1
      RETURNING adminid AS "adminId"
    `,
    [adminId, passwordHashed],
  );

  return Boolean(result.rows[0]);
}

export async function storeRefreshToken(
  input: {
    adminId: number;
    tokenHash: string;
    expiresAt: Date;
  },
  executor: QueryExecutor = database,
): Promise<void> {
  await executor.query(
    `
      INSERT INTO refresh_token (adminid, tokenhash, expiresat)
      VALUES ($1, $2, $3)
    `,
    [input.adminId, input.tokenHash, input.expiresAt],
  );
}

export async function findRefreshTokenByHash(
  tokenHash: string,
  executor: QueryExecutor = database,
): Promise<RefreshTokenRecord | null> {
  const result = await executor.query<RefreshTokenRecord>(
    `
      SELECT
        refreshtokenid AS "refreshTokenId",
        adminid AS "adminId",
        tokenhash AS "tokenHash",
        expiresat AS "expiresAt",
        revokedat AS "revokedAt",
        replacedbytokenhash AS "replacedByTokenHash",
        lastusedat AS "lastUsedAt",
        createdat AS "createdAt"
      FROM refresh_token
      WHERE tokenhash = $1
      LIMIT 1
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
}

export async function revokeRefreshToken(
  tokenHash: string,
  replacedByTokenHash: string | null = null,
  executor: QueryExecutor = database,
): Promise<void> {
  await executor.query(
    `
      UPDATE refresh_token
      SET revokedat = CURRENT_TIMESTAMP,
          replacedbytokenhash = COALESCE($2, replacedbytokenhash)
      WHERE tokenhash = $1
        AND revokedat IS NULL
    `,
    [tokenHash, replacedByTokenHash],
  );
}

export async function revokeRefreshTokensForAdmin(
  adminId: number,
  executor: QueryExecutor = database,
): Promise<void> {
  await executor.query(
    `
      UPDATE refresh_token
      SET revokedat = CURRENT_TIMESTAMP
      WHERE adminid = $1
        AND revokedat IS NULL
    `,
    [adminId],
  );
}

export async function touchRefreshToken(
  tokenHash: string,
  executor: QueryExecutor = database,
): Promise<void> {
  await executor.query(
    `
      UPDATE refresh_token
      SET lastusedat = CURRENT_TIMESTAMP
      WHERE tokenhash = $1
    `,
    [tokenHash],
  );
}
