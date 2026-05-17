import { query, type QueryExecutor, withTransaction } from "./client.js";
import {
  getMediaMetadataById,
  isImageMimeType,
  isVideoMimeType,
} from "./media.js";
import {
  deleteReadMoreForPost,
  getReadMoreByPostId,
  type ReadMoreOutput,
  type StoredMediaReference,
  upsertReadMoreForPost,
} from "./readmore.js";
import { badRequest, conflict } from "../Utils/errors.js";
import { slugify } from "../Utils/slug.js";
import type { NewsMediaType } from "../Utils/newsMedia.js";

export type MediaInput =
  | {
      type: "IMAGE" | "VIDEO";
      mediaId: number;
    }
  | {
      type: "YOUTUBE";
      embedUrl: string;
    };

type PostMutationInput = {
  title: string;
  content: string;
  publishedDate?: string;
  slug?: string;
  primaryMedia: MediaInput;
  readMoreEnabled: boolean;
  readMore?: {
    title: string;
    content: string;
      media: MediaInput[];
    };
};

export type CreatePostInput = PostMutationInput & {
  adminId: number;
};

export type UpdatePostInput = PostMutationInput;

export type PostMediaOutput = {
  type: NewsMediaType;
  mediaId: number | null;
  url: string | null;
  embedUrl: string | null;
  mimeType: string | null;
};

export type PostListItem = {
  postId: number;
  adminId: number;
  title: string;
  content: string;
  publishedDate: string;
  slug: string;
  hasReadMore: boolean;
  isDeleted: boolean;
  media: PostMediaOutput;
  createdAt: string;
  updatedAt: string;
};

export type PostDetail = PostListItem & {
  readMore: ReadMoreOutput | null;
};

export type DeletedFilter = "all" | "true" | "false";

type PostRow = {
  postId: number;
  adminId: number;
  title: string;
  content: string;
  publishedDate: Date | string;
  slug: string;
  hasReadMore: boolean;
  isDeleted: boolean;
  mediaType: NewsMediaType;
  mediaId: number | null;
  mediaUrl: string | null;
  mimeType: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const database: QueryExecutor = { query };

function toIsoString(value: Date | string): string {
  return new Date(value).toISOString();
}

function toDateOnly(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function mapPostRow(row: PostRow): PostListItem {
  return {
    postId: row.postId,
    adminId: row.adminId,
    title: row.title,
    content: row.content,
    publishedDate: toDateOnly(row.publishedDate),
    slug: row.slug,
    hasReadMore: row.hasReadMore,
    isDeleted: row.isDeleted,
    media: {
      type: row.mediaType,
      mediaId: row.mediaId,
      url: row.mediaId ? `/api/media/${row.mediaId}` : null,
      embedUrl: row.mediaUrl,
      mimeType: row.mimeType,
    },
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

async function getUniqueSlug(
  baseValue: string,
  executor: QueryExecutor,
  excludePostId?: number,
): Promise<string> {
  const baseSlug = slugify(baseValue);
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const result = await executor.query<{ exists: number }>(
      `
        SELECT 1 AS exists
        FROM post
        WHERE slug = $1
          AND ($2::INT IS NULL OR postid <> $2)
        LIMIT 1
      `,
      [candidate, excludePostId ?? null],
    );

    if (!result.rows[0]) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

async function ensureSlugAvailable(
  slug: string,
  executor: QueryExecutor,
  excludePostId?: number,
): Promise<void> {
  const result = await executor.query<{ exists: number }>(
    `
      SELECT 1 AS exists
      FROM post
      WHERE slug = $1
        AND ($2::INT IS NULL OR postid <> $2)
      LIMIT 1
    `,
    [slug, excludePostId ?? null],
  );

  if (result.rows[0]) {
    throw conflict("Slug already exists");
  }
}

async function normalizeMediaReference(
  input: MediaInput,
  executor: QueryExecutor,
  field: string,
): Promise<StoredMediaReference> {
  if (input.type === "YOUTUBE") {
    return {
      type: "YOUTUBE",
      mediaId: null,
      mediaUrl: input.embedUrl,
    };
  }

  const media = await getMediaMetadataById(input.mediaId, executor);

  if (!media) {
    throw badRequest(`${field}.mediaId does not reference an uploaded file`);
  }

  if (input.type === "IMAGE" && !isImageMimeType(media.mimeType)) {
    throw badRequest(`${field}.mediaId must reference an image upload`);
  }

  if (input.type === "VIDEO" && !isVideoMimeType(media.mimeType)) {
    throw badRequest(`${field}.mediaId must reference an MP4 upload`);
  }

  return {
    type: input.type,
    mediaId: input.mediaId,
    mediaUrl: null,
  };
}

async function normalizeMediaCollection(
  inputs: MediaInput[],
  executor: QueryExecutor,
  fieldPrefix: string,
): Promise<StoredMediaReference[]> {
  const normalized: StoredMediaReference[] = [];

  for (const [index, media] of inputs.entries()) {
    normalized.push(
      await normalizeMediaReference(media, executor, `${fieldPrefix}.${index}`),
    );
  }

  return normalized;
}

async function getPostRowById(
  postId: number,
  executor: QueryExecutor = database,
): Promise<PostRow | null> {
  const result = await executor.query<PostRow>(
    `
      SELECT
        p.postid AS "postId",
        p.adminid AS "adminId",
        p.title AS title,
        p.content AS content,
        p.publisheddate AS "publishedDate",
        p.slug AS slug,
        p.hasreadmore AS "hasReadMore",
        p.isdeleted AS "isDeleted",
        p.mediatype AS "mediaType",
        p.mediaid AS "mediaId",
        p.mediaurl AS "mediaUrl",
        m.mimetype AS "mimeType",
        p.createdat AS "createdAt",
        p.updatedat AS "updatedAt"
      FROM post p
      LEFT JOIN media m ON m.mediaid = p.mediaid
      WHERE p.postid = $1
      LIMIT 1
    `,
    [postId],
  );

  return result.rows[0] ?? null;
}

export async function createPost(input: CreatePostInput): Promise<PostDetail> {
  return withTransaction(async (client) => {
    const primaryMedia = await normalizeMediaReference(
      input.primaryMedia,
      client,
      "primaryMedia",
    );
    const slug = input.slug
      ? input.slug
      : await getUniqueSlug(input.title, client);

    if (input.slug) {
      await ensureSlugAvailable(slug, client);
    }

    const postResult = await client.query<{ postId: number }>(
      `
        INSERT INTO post (
          adminid,
          title,
          content,
          publisheddate,
          mediatype,
          mediaid,
          mediaurl,
          hasreadmore,
          slug
        )
        VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7, $8, $9)
        RETURNING postid AS "postId"
      `,
      [
        input.adminId,
        input.title,
        input.content,
        input.publishedDate ?? null,
        primaryMedia.type,
        primaryMedia.mediaId,
        primaryMedia.mediaUrl,
        input.readMoreEnabled,
        slug,
      ],
    );

    const postId = postResult.rows[0].postId;

    if (input.readMoreEnabled && input.readMore) {
      const readMoreMedia = await normalizeMediaCollection(
        input.readMore.media,
        client,
        "readMore.media",
      );

      await upsertReadMoreForPost(
        postId,
        {
          title: input.readMore.title,
          content: input.readMore.content,
          media: readMoreMedia,
        },
        client,
      );
    }

    const detail = await getPostById(postId, true, client);

    if (!detail) {
      throw badRequest("Post could not be created");
    }

    return detail;
  });
}

export async function updatePost(
  postId: number,
  input: UpdatePostInput,
): Promise<PostDetail | null> {
  return withTransaction(async (client) => {
    const existing = await getPostRowById(postId, client);

    if (!existing || existing.isDeleted) {
      return null;
    }

    const primaryMedia = await normalizeMediaReference(
      input.primaryMedia,
      client,
      "primaryMedia",
    );
    const slug = input.slug
      ? input.slug
      : await getUniqueSlug(input.title, client, postId);

    if (input.slug) {
      await ensureSlugAvailable(slug, client, postId);
    }

    await client.query(
      `
        UPDATE post
        SET
          title = $2,
          content = $3,
          publisheddate = COALESCE($4, publisheddate),
          mediatype = $5,
          mediaid = $6,
          mediaurl = $7,
          hasreadmore = $8,
          slug = $9,
          updatedat = CURRENT_TIMESTAMP
        WHERE postid = $1
      `,
      [
        postId,
        input.title,
        input.content,
        input.publishedDate ?? null,
        primaryMedia.type,
        primaryMedia.mediaId,
        primaryMedia.mediaUrl,
        input.readMoreEnabled,
        slug,
      ],
    );

    if (input.readMoreEnabled && input.readMore) {
      const readMoreMedia = await normalizeMediaCollection(
        input.readMore.media,
        client,
        "readMore.media",
      );

      await upsertReadMoreForPost(
        postId,
        {
          title: input.readMore.title,
          content: input.readMore.content,
          media: readMoreMedia,
        },
        client,
      );
    } else {
      await deleteReadMoreForPost(postId, client);
    }

    return getPostById(postId, true, client);
  });
}

export async function softDeletePost(postId: number): Promise<boolean> {
  const result = await query<{ postId: number }>(
    `
      UPDATE post
      SET isdeleted = TRUE,
          updatedat = CURRENT_TIMESTAMP
      WHERE postid = $1
        AND isdeleted = FALSE
      RETURNING postid AS "postId"
    `,
    [postId],
  );

  return Boolean(result.rows[0]);
}

export async function restorePost(postId: number): Promise<boolean> {
  const result = await query<{ postId: number }>(
    `
      UPDATE post
      SET isdeleted = FALSE,
          updatedat = CURRENT_TIMESTAMP
      WHERE postid = $1
        AND isdeleted = TRUE
      RETURNING postid AS "postId"
    `,
    [postId],
  );

  return Boolean(result.rows[0]);
}

// Hard-delete a post and any media owned by it (primary + readMore gallery).
// Only operates on already-soft-deleted posts so live posts can't be wiped
// by accident. Returns the count of media rows removed.
export async function hardDeletePost(
  postId: number,
): Promise<{ deleted: boolean; mediaRemoved: number }> {
  return withTransaction(async (client) => {
    // Collect media ids to delete: primary (if IMAGE/VIDEO) + readmore gallery items
    const mediaResult = await client.query<{ mediaId: number }>(
      `
        SELECT mediaid AS "mediaId"
        FROM post
        WHERE postid = $1
          AND isdeleted = TRUE
          AND mediaid IS NOT NULL
        UNION
        SELECT rm.mediaid AS "mediaId"
        FROM readmore r
        JOIN readmore_media rm ON rm.readmoreid = r.readmoreid
        WHERE r.postid = $1
          AND rm.mediaid IS NOT NULL
      `,
      [postId],
    );

    const mediaIds = mediaResult.rows.map((row) => row.mediaId);

    // Delete the post (cascades to readmore + readmore_media)
    const deleted = await client.query<{ postId: number }>(
      `
        DELETE FROM post
        WHERE postid = $1
          AND isdeleted = TRUE
        RETURNING postid AS "postId"
      `,
      [postId],
    );

    if (deleted.rows.length === 0) {
      return { deleted: false, mediaRemoved: 0 };
    }

    // Delete the media rows
    let mediaRemoved = 0;
    if (mediaIds.length > 0) {
      const mediaDel = await client.query<{ mediaId: number }>(
        `DELETE FROM media WHERE mediaid = ANY($1::int[]) RETURNING mediaid AS "mediaId"`,
        [mediaIds],
      );
      mediaRemoved = mediaDel.rows.length;
    }

    return { deleted: true, mediaRemoved };
  });
}

export async function countPublicPosts(): Promise<number> {
  const result = await query<{ total: string }>(
    `SELECT COUNT(*)::TEXT AS total FROM post WHERE isdeleted = FALSE`,
  );

  return Number(result.rows[0]?.total ?? 0);
}

export async function countAdminPosts(filter: DeletedFilter): Promise<number> {
  const result = await query<{ total: string }>(
    `
      SELECT COUNT(*)::TEXT AS total
      FROM post
      WHERE (
        $1 = 'all'
        OR ($1 = 'true' AND isdeleted = TRUE)
        OR ($1 = 'false' AND isdeleted = FALSE)
      )
    `,
    [filter],
  );

  return Number(result.rows[0]?.total ?? 0);
}

export async function listPublicPosts(
  page: number,
  limit: number,
): Promise<PostListItem[]> {
  const offset = (page - 1) * limit;
  const result = await query<PostRow>(
    `
      SELECT
        p.postid AS "postId",
        p.adminid AS "adminId",
        p.title AS title,
        p.content AS content,
        p.publisheddate AS "publishedDate",
        p.slug AS slug,
        p.hasreadmore AS "hasReadMore",
        p.isdeleted AS "isDeleted",
        p.mediatype AS "mediaType",
        p.mediaid AS "mediaId",
        p.mediaurl AS "mediaUrl",
        m.mimetype AS "mimeType",
        p.createdat AS "createdAt",
        p.updatedat AS "updatedAt"
      FROM post p
      LEFT JOIN media m ON m.mediaid = p.mediaid
      WHERE p.isdeleted = FALSE
      ORDER BY p.publisheddate DESC, p.createdat DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );

  return result.rows.map(mapPostRow);
}

export async function listAdminPosts(
  filter: DeletedFilter,
  page: number,
  limit: number,
): Promise<PostListItem[]> {
  const offset = (page - 1) * limit;
  const result = await query<PostRow>(
    `
      SELECT
        p.postid AS "postId",
        p.adminid AS "adminId",
        p.title AS title,
        p.content AS content,
        p.publisheddate AS "publishedDate",
        p.slug AS slug,
        p.hasreadmore AS "hasReadMore",
        p.isdeleted AS "isDeleted",
        p.mediatype AS "mediaType",
        p.mediaid AS "mediaId",
        p.mediaurl AS "mediaUrl",
        m.mimetype AS "mimeType",
        p.createdat AS "createdAt",
        p.updatedat AS "updatedAt"
      FROM post p
      LEFT JOIN media m ON m.mediaid = p.mediaid
      WHERE (
        $1 = 'all'
        OR ($1 = 'true' AND p.isdeleted = TRUE)
        OR ($1 = 'false' AND p.isdeleted = FALSE)
      )
      ORDER BY p.publisheddate DESC, p.createdat DESC
      LIMIT $2 OFFSET $3
    `,
    [filter, limit, offset],
  );

  return result.rows.map(mapPostRow);
}

export async function getPostById(
  postId: number,
  includeDeleted = false,
  executor: QueryExecutor = database,
): Promise<PostDetail | null> {
  const row = await getPostRowById(postId, executor);

  if (!row || (!includeDeleted && row.isDeleted)) {
    return null;
  }

  return {
    ...mapPostRow(row),
    readMore: row.hasReadMore ? await getReadMoreByPostId(postId, executor) : null,
  };
}

export async function getPublicPostBySlug(
  slug: string,
  executor: QueryExecutor = database,
): Promise<PostDetail | null> {
  const result = await executor.query<PostRow>(
    `
      SELECT
        p.postid AS "postId",
        p.adminid AS "adminId",
        p.title AS title,
        p.content AS content,
        p.publisheddate AS "publishedDate",
        p.slug AS slug,
        p.hasreadmore AS "hasReadMore",
        p.isdeleted AS "isDeleted",
        p.mediatype AS "mediaType",
        p.mediaid AS "mediaId",
        p.mediaurl AS "mediaUrl",
        m.mimetype AS "mimeType",
        p.createdat AS "createdAt",
        p.updatedat AS "updatedAt"
      FROM post p
      LEFT JOIN media m ON m.mediaid = p.mediaid
      WHERE p.slug = $1
        AND p.isdeleted = FALSE
      LIMIT 1
    `,
    [slug],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    ...mapPostRow(row),
    readMore: row.hasReadMore ? await getReadMoreByPostId(row.postId, executor) : null,
  };
}
