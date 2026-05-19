export const NEWS_MEDIA_TYPES = ["IMAGE", "VIDEO", "YOUTUBE"] as const;

export type NewsMediaType = (typeof NEWS_MEDIA_TYPES)[number];

export function isNewsMediaType(value: string): value is NewsMediaType {
  return NEWS_MEDIA_TYPES.includes(value as NewsMediaType);
}
