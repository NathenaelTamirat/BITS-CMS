import type { MediaInput, UpdatePostInput } from "../DB/post.js";
import {
  asNestedObject,
  asObject,
  ensureSlug,
  readArray,
  readOptionalBoolean,
  readOptionalDateString,
  readOptionalString,
  readRequiredPositiveInteger,
  readRequiredString,
  throwIfValidationFailed,
} from "./helpers.js";
import { isNewsMediaType } from "../Utils/newsMedia.js";
import { normalizeYouTubeInput } from "../Utils/youtube.js";
import { sanitizeHtml } from "../Utils/sanitizeHtml.js";
import type { FieldError } from "../Utils/errors.js";

function parseMediaInput(input: unknown, field: string, errors: FieldError[]): MediaInput | null {
  const mediaObject = asNestedObject(input, field, errors);

  if (!mediaObject) {
    return null;
  }

  const type = readRequiredString(mediaObject, "type", errors, {
    field: `${field}.type`,
    max: 20,
  });

  if (!type || !isNewsMediaType(type)) {
    errors.push({
      field: `${field}.type`,
      message: `${field}.type must be IMAGE, VIDEO, or YOUTUBE`,
    });
    return null;
  }

  if (type === "YOUTUBE") {
    const rawInput =
      readOptionalString(mediaObject, "embedUrl", errors, {
        field: `${field}.embedUrl`,
        max: 500,
      }) ??
      readOptionalString(mediaObject, "url", errors, {
        field: `${field}.url`,
        max: 500,
      }) ??
      readOptionalString(mediaObject, "iframe", errors, {
        field: `${field}.iframe`,
        max: 2000,
      });

    if (!rawInput) {
      errors.push({
        field: `${field}.embedUrl`,
        message: `${field}.embedUrl is required for YOUTUBE media`,
      });
      return null;
    }

    const normalized = normalizeYouTubeInput(rawInput);

    if (!normalized) {
      errors.push({
        field: `${field}.embedUrl`,
        message: `${field}.embedUrl must be a valid YouTube URL or iframe`,
      });
      return null;
    }

    return {
      type: "YOUTUBE",
      embedUrl: normalized,
    };
  }

  const mediaId = readRequiredPositiveInteger(
    mediaObject,
    "mediaId",
    errors,
    `${field}.mediaId`,
  );

  return {
    type,
    mediaId,
  };
}

function parseReadMore(
  input: unknown,
  errors: FieldError[],
): UpdatePostInput["readMore"] | undefined {
  if (input === undefined) {
    return undefined;
  }

  const readMoreObject = asNestedObject(input, "readMore", errors);

  if (!readMoreObject) {
    return undefined;
  }

  const title = readRequiredString(readMoreObject, "title", errors, {
    field: "readMore.title",
    max: 255,
  });
  const content = readRequiredString(readMoreObject, "content", errors, {
    field: "readMore.content",
  });

  const mediaArray = readArray(readMoreObject, "media", errors, "readMore.media") ?? [];

  if (mediaArray.length > 6) {
    errors.push({
      field: "readMore.media",
      message: "readMore.media can contain at most 6 items",
    });
  }

  const media = mediaArray
    .map((item, index) => parseMediaInput(item, `readMore.media.${index}`, errors))
    .filter((item): item is MediaInput => item !== null);

  return {
    title,
    content,
    media,
  };
}

export function parsePostBody(input: unknown): UpdatePostInput {
  const body = asObject(input);
  const errors: FieldError[] = [];
  const title = readRequiredString(body, "title", errors, { max: 255 });
  const content = readRequiredString(body, "content", errors);
  const slug = readOptionalString(body, "slug", errors, { max: 160 });
  const publishedDate = readOptionalDateString(body, "publishedDate", errors);
  const readMoreEnabled = readOptionalBoolean(body, "readMoreEnabled", errors) ?? false;
  const primaryMedia = parseMediaInput(body.primaryMedia, "primaryMedia", errors);
  const readMore = parseReadMore(body.readMore, errors);

  if (slug) {
    ensureSlug(slug, "slug", errors);
  }

  if (readMoreEnabled && !readMore) {
    errors.push({
      field: "readMore",
      message: "readMore is required when readMoreEnabled is true",
    });
  }

  if (!readMoreEnabled && body.readMore !== undefined) {
    errors.push({
      field: "readMore",
      message: "readMore must be omitted when readMoreEnabled is false",
    });
  }

  if (!primaryMedia) {
    errors.push({
      field: "primaryMedia",
      message: "primaryMedia is required",
    });
  }

  throwIfValidationFailed(errors);

  return {
    title,
    content: sanitizeHtml(content),
    slug,
    publishedDate,
    primaryMedia: primaryMedia as MediaInput,
    readMoreEnabled,
    readMore: readMore
      ? { ...readMore, content: sanitizeHtml(readMore.content) }
      : undefined,
  };
}
