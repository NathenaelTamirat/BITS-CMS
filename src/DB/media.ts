import { query, type QueryExecutor } from "./client.js";

export type MediaRecord = {
  mediaId: number;
  mimeType: string;
  fileData: Buffer;
  uploadedBy: number | null;
  createdAt: Date | string;
};

export type MediaMetadata = Omit<MediaRecord, "fileData">;

const database: QueryExecutor = { query };

export async function insertMedia(
  input: {
    mimeType: string;
    fileData: Buffer;
    uploadedBy: number | null;
  },
  executor: QueryExecutor = database,
): Promise<MediaMetadata> {
  const result = await executor.query<MediaMetadata>(
    `
      INSERT INTO media (mimetype, filedata, uploadedby)
      VALUES ($1, $2, $3)
      RETURNING
        mediaid AS "mediaId",
        mimetype AS "mimeType",
        uploadedby AS "uploadedBy",
        createdat AS "createdAt"
    `,
    [input.mimeType, input.fileData, input.uploadedBy],
  );

  return result.rows[0];
}

export async function getMediaById(
  mediaId: number,
  executor: QueryExecutor = database,
): Promise<MediaRecord | null> {
  const result = await executor.query<MediaRecord>(
    `
      SELECT
        mediaid AS "mediaId",
        mimetype AS "mimeType",
        filedata AS "fileData",
        uploadedby AS "uploadedBy",
        createdat AS "createdAt"
      FROM media
      WHERE mediaid = $1
      LIMIT 1
    `,
    [mediaId],
  );

  return result.rows[0] ?? null;
}

export async function getMediaMetadataById(
  mediaId: number,
  executor: QueryExecutor = database,
): Promise<MediaMetadata | null> {
  const result = await executor.query<MediaMetadata>(
    `
      SELECT
        mediaid AS "mediaId",
        mimetype AS "mimeType",
        uploadedby AS "uploadedBy",
        createdat AS "createdAt"
      FROM media
      WHERE mediaid = $1
      LIMIT 1
    `,
    [mediaId],
  );

  return result.rows[0] ?? null;
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isVideoMimeType(mimeType: string): boolean {
  return mimeType === "video/mp4";
}
