import type { PostMedia, ReadMoreMedia } from "@/api/types";

interface Props {
  media: PostMedia | ReadMoreMedia;
  className?: string;
  alt?: string;
}

export default function MediaRender({ media, className, alt = "" }: Props) {
  switch (media.type) {
    case "IMAGE":
      if (!media.url) return null;
      return (
        <img
          src={media.url}
          alt={alt}
          className={className}
          loading="lazy"
        />
      );
    case "VIDEO":
      if (!media.url) return null;
      return (
        <video
          src={media.url}
          className={className}
          controls
          preload="metadata"
        />
      );
    case "YOUTUBE":
      if (!media.embedUrl) return null;
      return (
        <iframe
          src={media.embedUrl}
          title={alt || "YouTube video"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={className}
        />
      );
  }
}
