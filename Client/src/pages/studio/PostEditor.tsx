import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminPost, useCreatePost, useUpdatePost } from "@/api/posts";
import type {
  MediaInput,
  PostInput,
  PostListItem,
  PostMedia,
  PostDetail,
  ReadMoreMedia,
} from "@/api/types";
import { ApiError } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { youtubeEmbedUrl } from "@/lib/youtube";
import Field, { inputClass } from "@/components/studio/Field";
import DatePicker from "@/components/DatePicker";
import RichTextEditor from "@/components/studio/RichTextEditor";
import { isHtmlEmpty } from "@/lib/sanitize";
import { useToast } from "@/ui/Toast";
import MediaPicker, {
  emptyMedia,
  type MediaFormValue,
} from "@/components/studio/MediaPicker";
import GalleryEditor, {
  type GalleryItem,
} from "@/components/studio/GalleryEditor";
import NewsCard from "@/components/NewsCard";

interface PostFormState {
  title: string;
  content: string;
  slug: string;
  slugTouched: boolean;
  publishedDate: string;
  primaryMedia: MediaFormValue;
  readMoreEnabled: boolean;
  readMoreTitle: string;
  readMoreContent: string;
  galleryItems: GalleryItem[];
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function emptyForm(): PostFormState {
  return {
    title: "",
    content: "",
    slug: "",
    slugTouched: false,
    publishedDate: todayString(),
    primaryMedia: { ...emptyMedia },
    readMoreEnabled: false,
    readMoreTitle: "",
    readMoreContent: "",
    galleryItems: [],
  };
}

function fromPostMedia(m: PostMedia | ReadMoreMedia): MediaFormValue {
  if (m.type === "YOUTUBE") {
    return {
      type: "YOUTUBE",
      mediaId: null,
      uploadedUrl: null,
      uploadedMimeType: null,
      youtubeUrl: m.embedUrl ?? "",
    };
  }
  return {
    type: m.type,
    mediaId: m.mediaId,
    uploadedUrl: m.url,
    uploadedMimeType: m.mimeType,
    youtubeUrl: "",
  };
}

function fromPost(post: PostDetail): PostFormState {
  return {
    title: post.title,
    content: post.content,
    slug: post.slug,
    slugTouched: true,
    publishedDate: post.publishedDate.split("T")[0],
    primaryMedia: fromPostMedia(post.media),
    readMoreEnabled: post.hasReadMore,
    readMoreTitle: post.readMore?.title ?? "",
    readMoreContent: post.readMore?.content ?? "",
    galleryItems:
      post.readMore?.media.map((m) => ({
        id: crypto.randomUUID(),
        media: fromPostMedia(m),
      })) ?? [],
  };
}

function buildMediaInput(m: MediaFormValue): MediaInput | null {
  if (!m.type) return null;
  if (m.type === "YOUTUBE") {
    const url = m.youtubeUrl.trim();
    if (!url) return null;
    return { type: "YOUTUBE", embedUrl: url };
  }
  if (m.mediaId === null) return null;
  return { type: m.type, mediaId: m.mediaId };
}

function buildPostInput(form: PostFormState): PostInput {
  const primaryMedia = buildMediaInput(form.primaryMedia);
  if (!primaryMedia) {
    throw new Error("Primary media is required");
  }
  return {
    title: form.title.trim(),
    content: form.content,
    slug: form.slug.trim() || undefined,
    publishedDate: form.publishedDate || undefined,
    primaryMedia,
    readMoreEnabled: form.readMoreEnabled,
    readMore: form.readMoreEnabled
      ? {
          title: form.readMoreTitle.trim(),
          content: form.readMoreContent,
          media: form.galleryItems
            .map((g) => buildMediaInput(g.media))
            .filter((m): m is MediaInput => m !== null),
        }
      : undefined,
  };
}

function buildPreviewMedia(m: MediaFormValue): PostMedia | null {
  if (!m.type) return null;
  if (m.type === "YOUTUBE") {
    const embed = youtubeEmbedUrl(m.youtubeUrl);
    if (!embed) return null;
    return {
      type: "YOUTUBE",
      mediaId: null,
      url: null,
      embedUrl: embed,
      mimeType: null,
    };
  }
  if (!m.uploadedUrl) return null;
  return {
    type: m.type,
    mediaId: m.mediaId,
    url: m.uploadedUrl,
    embedUrl: null,
    mimeType: m.uploadedMimeType,
  };
}

function buildPreview(form: PostFormState): PostListItem | null {
  const media = buildPreviewMedia(form.primaryMedia);
  if (!media) return null;
  return {
    postId: 0,
    adminId: 0,
    title: form.title || "Untitled post",
    content: form.content || "Add a short preview…",
    publishedDate: form.publishedDate || todayString(),
    slug: form.slug || "preview",
    hasReadMore: form.readMoreEnabled,
    isDeleted: false,
    media,
    createdAt: "",
    updatedAt: "",
  };
}

export default function PostEditor() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = id !== undefined && id !== "new";
  const editId = isEdit ? Number(id) : null;
  const navigate = useNavigate();

  const existing = useAdminPost(editId ?? undefined);
  const create = useCreatePost();
  const update = useUpdatePost(editId ?? 0);
  const toast = useToast();

  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<PostFormState>(emptyForm);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && existing.data && !hydrated) {
      setForm(fromPost(existing.data.data));
      setHydrated(true);
    }
  }, [isEdit, existing.data, hydrated]);

  // Cmd/Ctrl+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const preview = useMemo(() => buildPreview(form), [form]);

  function setTitle(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: f.slugTouched ? f.slug : slugify(title),
    }));
  }

  function setSlug(slug: string) {
    setForm((f) => ({ ...f, slug, slugTouched: true }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setTopError(null);

    const localErrors: Record<string, string> = {};
    if (!form.title.trim()) localErrors.title = "Title is required";
    if (isHtmlEmpty(form.content)) localErrors.content = "Content is required";
    if (!buildMediaInput(form.primaryMedia))
      localErrors.primaryMedia = "Pick a media and either upload or paste a URL";
    if (form.readMoreEnabled) {
      if (!form.readMoreTitle.trim())
        localErrors["readMore.title"] = "Read More title is required";
      if (isHtmlEmpty(form.readMoreContent))
        localErrors["readMore.content"] = "Read More content is required";
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setTopError("Please fix the highlighted fields.");
      return;
    }

    try {
      const input = buildPostInput(form);
      if (isEdit && editId !== null) {
        await update.mutateAsync(input);
        toast.success("Saved.");
      } else {
        const created = await create.mutateAsync(input);
        toast.success("Post published.");
        navigate(`/studio/posts/${created.data.postId}`, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setTopError(err.message);
        if (err.fieldErrors) {
          const map: Record<string, string> = {};
          for (const f of err.fieldErrors) map[f.field] = f.message;
          setErrors(map);
        }
        toast.error(err.message);
      } else {
        setTopError("Save failed. Please try again.");
        toast.error("Save failed. Please try again.");
      }
    }
  }

  if (isEdit && existing.isLoading && !hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-10 text-sm text-brand-muted">
        Loading post…
      </div>
    );
  }

  if (isEdit && existing.isError) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-10">
        <p className="text-red-600">Couldn't load this post.</p>
        <Link
          to="/studio/posts"
          className="mt-4 inline-block text-sm font-medium text-brand-green-dark hover:text-brand-green"
        >
          ← Back to posts
        </Link>
      </div>
    );
  }

  const saving = create.isPending || update.isPending;
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/studio/posts"
            className="text-xs font-medium text-brand-muted hover:text-brand-charcoal"
          >
            ← Posts
          </Link>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
            {isEdit ? "Edit post" : "New post"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-brand-muted md:inline">
            {isMac ? "⌘S" : "Ctrl+S"}
          </span>
          <button
            type="submit"
            disabled={saving}
            className="rounded-pill bg-brand-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Publish"}
          </button>
        </div>
      </div>

      {topError && (
        <div className="mt-6 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {topError}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Field label="Title" required error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              className={inputClass}
            />
          </Field>

          <Field
            label="Slug"
            hint="Auto-generated from the title. Edit if you want a custom URL."
            error={errors.slug}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-muted">/news/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto"
                maxLength={160}
                className={inputClass}
              />
            </div>
          </Field>

          <Field label="Published date" error={errors.publishedDate}>
            <DatePicker
              value={form.publishedDate}
              onChange={(v) =>
                setForm((f) => ({ ...f, publishedDate: v }))
              }
            />
          </Field>

          <Field label="Content" required error={errors.content}>
            {hydrated && (
              <RichTextEditor
                value={form.content}
                onChange={(html) =>
                  setForm((f) => ({ ...f, content: html }))
                }
                placeholder="Write the body of this post…"
                minHeight={320}
              />
            )}
          </Field>

          <Field
            label="Primary media"
            required
            hint="One image, video, or YouTube embed for the news card."
            error={errors.primaryMedia ?? errors["primaryMedia.mediaId"]}
          >
            <MediaPicker
              value={form.primaryMedia}
              onChange={(m) => setForm((f) => ({ ...f, primaryMedia: m }))}
            />
          </Field>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.readMoreEnabled}
                onChange={(e) =>
                  setForm((f) => ({ ...f, readMoreEnabled: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
              />
              <span>
                <span className="block text-sm font-semibold text-brand-charcoal">
                  Add a Read More page
                </span>
                <span className="mt-0.5 block text-xs text-brand-muted">
                  Adds a "Read More" button on the card linking to a
                  dedicated page with extended content and a gallery of up
                  to 6 items.
                </span>
              </span>
            </label>

            {form.readMoreEnabled && (
              <div className="mt-6 space-y-6 border-t border-gray-100 pt-6">
                <Field
                  label="Read More title"
                  required
                  error={errors["readMore.title"]}
                >
                  <input
                    type="text"
                    value={form.readMoreTitle}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, readMoreTitle: e.target.value }))
                    }
                    maxLength={255}
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Read More content"
                  required
                  error={errors["readMore.content"]}
                >
                  <RichTextEditor
                    value={form.readMoreContent}
                    onChange={(html) =>
                      setForm((f) => ({ ...f, readMoreContent: html }))
                    }
                    placeholder="Write the full article body…"
                    minHeight={560}
                  />
                </Field>

                <Field
                  label="Gallery"
                  hint="Up to 6 items. Drag the handle to reorder."
                  error={errors["readMore.media"]}
                >
                  <GalleryEditor
                    items={form.galleryItems}
                    onChange={(items) =>
                      setForm((f) => ({ ...f, galleryItems: items }))
                    }
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Live preview
            </p>
            {preview ? (
              <NewsCard post={preview} />
            ) : (
              <div className="aspect-[16/12] rounded-lg border-2 border-dashed border-gray-200 bg-white p-8 text-center text-sm text-brand-muted">
                Pick a media and add a title to see a live preview of the
                news card.
              </div>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
