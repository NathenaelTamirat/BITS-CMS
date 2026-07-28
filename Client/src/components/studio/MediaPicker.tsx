import { useRef, useState, type DragEvent } from "react";
import clsx from "clsx";
import { useUploadMedia } from "@/api/media";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { ApiError } from "@/lib/api";

export type MediaFormType = "IMAGE" | "VIDEO" | "YOUTUBE";

export interface MediaFormValue {
  type: MediaFormType | null;
  mediaId: number | null;
  uploadedUrl: string | null;
  uploadedMimeType: string | null;
  youtubeUrl: string;
}

export const emptyMedia: MediaFormValue = {
  type: null,
  mediaId: null,
  uploadedUrl: null,
  uploadedMimeType: null,
  youtubeUrl: "",
};

interface Props {
  value: MediaFormValue;
  onChange: (v: MediaFormValue) => void;
  error?: string;
}

export default function MediaPicker({ value, onChange, error }: Props) {
  const upload = useUploadMedia();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function setType(type: MediaFormType) {
    setUploadError(null);
    onChange({ ...emptyMedia, type });
  }

  async function handleFile(file: File) {
    setUploadError(null);
    try {
      const result = await upload.mutateAsync(file);
      onChange({
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
        mediaId: result.mediaId,
        uploadedUrl: result.url,
        uploadedMimeType: result.mimeType,
        youtubeUrl: "",
      });
    } catch (e) {
      setUploadError(
        e instanceof ApiError ? e.message : "Upload failed. Please try again.",
      );
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex gap-1 rounded-md bg-brand-bg p-1">
        <TypeTab
          active={value.type === "IMAGE"}
          onClick={() => setType("IMAGE")}
          label="Image"
        />
        <TypeTab
          active={value.type === "VIDEO"}
          onClick={() => setType("VIDEO")}
          label="Video"
        />
        <TypeTab
          active={value.type === "YOUTUBE"}
          onClick={() => setType("YOUTUBE")}
          label="YouTube"
        />
      </div>

      <div className="mt-4">
        {(value.type === "IMAGE" || value.type === "VIDEO") &&
          (value.uploadedUrl ? (
            <UploadedPreview
              type={value.type}
              url={value.uploadedUrl}
              onReplace={() => fileRef.current?.click()}
              onClear={() => onChange({ ...emptyMedia, type: value.type })}
            />
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={clsx(
                "flex aspect-[16/10] cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition-colors",
                dragOver
                  ? "border-brand-green bg-brand-green/5"
                  : "border-gray-300 bg-brand-bg hover:border-brand-green hover:bg-brand-green/5",
              )}
            >
              <div className="text-center">
                <p className="text-sm font-medium text-brand-charcoal">
                  {upload.isPending
                    ? "Uploading…"
                    : `Drag ${value.type === "VIDEO" ? "a video" : "an image"} here, or click to select`}
                </p>
                <p className="mt-1 text-xs text-brand-muted">
                  {value.type === "IMAGE"
                    ? "JPEG, PNG, GIF or WebP up to 10MB"
                    : "MP4 up to 10MB"}
                </p>
              </div>
            </div>
          ))}

        {value.type === "YOUTUBE" && (
          <div>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={value.youtubeUrl}
              onChange={(e) =>
                onChange({ ...value, youtubeUrl: e.target.value })
              }
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-brand-charcoal placeholder-brand-muted focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
            <YouTubePreview url={value.youtubeUrl} />
          </div>
        )}

        {value.type === null && (
          <div className="rounded-md border border-dashed border-gray-200 bg-brand-bg py-8 text-center text-sm text-brand-muted">
            Pick a media type above.
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={
          value.type === "VIDEO" ? "video/mp4" : "image/jpeg,image/png,image/gif,image/webp"
        }
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      {(uploadError || error) && (
        <p className="mt-2 text-xs text-red-600">{uploadError ?? error}</p>
      )}
    </div>
  );
}

function TypeTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-white text-brand-charcoal shadow-sm"
          : "text-brand-muted hover:text-brand-charcoal",
      )}
    >
      {label}
    </button>
  );
}

function UploadedPreview({
  type,
  url,
  onReplace,
  onClear,
}: {
  type: "IMAGE" | "VIDEO";
  url: string;
  onReplace: () => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="aspect-[16/10] overflow-hidden rounded-md bg-gray-100">
        {type === "IMAGE" ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <video src={url} controls className="h-full w-full object-cover" />
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onReplace}
          className="text-xs font-medium text-brand-green-dark hover:text-brand-green"
        >
          Replace
        </button>
        <span className="text-xs text-brand-muted">·</span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-brand-muted hover:text-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function YouTubePreview({ url }: { url: string }) {
  const embed = youtubeEmbedUrl(url);
  if (!url) return null;
  if (!embed) {
    return (
      <p className="mt-2 text-xs text-amber-600">
        URL not recognized. Use a YouTube watch, embed, share, or shorts URL.
      </p>
    );
  }
  return (
    <div className="mt-3 aspect-[16/10] overflow-hidden rounded-md bg-black">
      <iframe
        src={embed}
        title="YouTube preview"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
