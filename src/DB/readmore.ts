import { query, type QueryExecutor } from "./client.js";
import type { NewsMediaType } from "../Utils/newsMedia.js";

export type StoredMediaReference = {
  type: NewsMediaType;
  mediaId: number | null;
  mediaUrl: string | null;
};

export type UpsertReadMoreInput = {
  title: string;
  content: string;
  media: StoredMediaReference[];
};

export type ReadMoreMediaOutput = {
  position: number;
  type: NewsMediaType;
  mediaId: number | null;
  url: string | null;
  embedUrl: string | null;
  mimeType: string | null;
};

export type ReadMoreOutput = {
  title: string;
  content: string;
  media: ReadMoreMediaOutput[];
  createdAt: string;
  updatedAt: string;
};

type ReadMoreRow = {
  readMoreId: number;
  title: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ReadMoreMediaRow = {
  position: number;
  type: NewsMediaType;
  mediaId: number | null;
  mediaUrl: string | null;
  mimeType: string | null;
};

const database: QueryExecutor = { query };

function toIsoString(value: Date | string): string {
  return new Date(value).toISOString();
}

export async function upsertReadMoreForPost(
  postId: number,
  input: UpsertReadMoreInput,
  executor: QueryExecutor = database,
): Promise<void> {
  const result = await executor.query<{ readMoreId: number }>(
    `
      INSERT INTO readmore (postid, title, content)
      VALUES ($1, $2, $3)
      ON CONFLICT (postid)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        updatedat = CURRENT_TIMESTAMP
      RETURNING readmoreid AS "readMoreId"
    `,
    [postId, input.title, input.content],
  );

  const readMoreId = result.rows[0].readMoreId;

  await executor.query(`DELETE FROM readmore_media WHERE readmoreid = $1`, [
    readMoreId,
  ]);

  for (const [index, media] of input.media.entries()) {
    await executor.query(
      `
        INSERT INTO readmore_media (readmoreid, position, mediatype, mediaid, mediaurl)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [readMoreId, index + 1, media.type, media.mediaId, media.mediaUrl],
    );
  }
}

export async function deleteReadMoreForPost(
  postId: number,
  executor: QueryExecutor = database,
): Promise<void> {
  await executor.query(`DELETE FROM readmore WHERE postid = $1`, [postId]);
}

export async function getReadMoreByPostId(
  postId: number,
  executor: QueryExecutor = database,
): Promise<ReadMoreOutput | null> {
  const readMoreResult = await executor.query<ReadMoreRow>(
    `
      SELECT
        readmoreid AS "readMoreId",
        title,
        content,
        createdat AS "createdAt",
        updatedat AS "updatedAt"
      FROM readmore
      WHERE postid = $1
      LIMIT 1
    `,
    [postId],
  );

  const readMore = readMoreResult.rows[0];

  if (!readMore) {
    return null;
  }

  const mediaResult = await executor.query<ReadMoreMediaRow>(
    `
      SELECT
        rm.position AS position,
        rm.mediatype AS type,
        rm.mediaid AS "mediaId",
        rm.mediaurl AS "mediaUrl",
        m.mimetype AS "mimeType"
      FROM readmore_media rm
      LEFT JOIN media m ON m.mediaid = rm.mediaid
      WHERE rm.readmoreid = $1
      ORDER BY rm.position ASC
    `,
    [readMore.readMoreId],
  );

  return {
    title: readMore.title,
    content: readMore.content,
    media: mediaResult.rows.map((item) => ({
      position: item.position,
      type: item.type,
      mediaId: item.mediaId,
      url: item.mediaId ? `/api/media/${item.mediaId}` : null,
      embedUrl: item.mediaUrl,
      mimeType: item.mimeType,
    })),
    createdAt: toIsoString(readMore.createdAt),
    updatedAt: toIsoString(readMore.updatedAt),
  };
}
