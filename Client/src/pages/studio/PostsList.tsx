import clsx from "clsx";
import { Link, useSearchParams } from "react-router-dom";
import {
  useAdminPosts,
  useDeletePost,
  useHardDeletePost,
  useRestorePost,
  type DeletedFilter,
} from "@/api/posts";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/Skeleton";
import MediaRender from "@/components/MediaRender";
import Pagination from "@/components/Pagination";
import { useConfirm } from "@/ui/ConfirmDialog";
import { useToast } from "@/ui/Toast";
import { ApiError } from "@/lib/api";

const PAGE_SIZE = 20;

export default function PostsList() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const filter = (params.get("filter") as DeletedFilter | null) ?? "false";

  const { data, isLoading, isError, error } = useAdminPosts({
    page,
    limit: PAGE_SIZE,
    deleted: filter,
  });

  const totalPages =
    data && data.pagination.limit > 0
      ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit))
      : 1;

  function setFilter(next: DeletedFilter) {
    params.set("filter", next);
    params.delete("page");
    setParams(params);
  }

  function setPage(next: number) {
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    setParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
            Posts
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Create, edit, and manage news and events.
          </p>
        </div>
        <Link
          to="/studio/posts/new"
          className="rounded-pill bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dark"
        >
          + New post
        </Link>
      </div>

      <div className="mt-8 flex gap-2 border-b border-gray-200">
        <FilterTab
          active={filter === "false"}
          onClick={() => setFilter("false")}
          label="Published"
        />
        <FilterTab
          active={filter === "true"}
          onClick={() => setFilter("true")}
          label="Deleted"
        />
        <FilterTab
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
      </div>

      <div className="mt-6">
        {isLoading && <ListSkeleton />}

        {isError && (
          <ErrorPanel
            message={error instanceof Error ? error.message : "Couldn't load posts."}
          />
        )}

        {data && data.data.length === 0 && (
          <EmptyState filter={filter} />
        )}

        {data && data.data.length > 0 && (
          <>
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
              {data.data.map((post) => (
                <PostRow key={post.postId} post={post} />
              ))}
            </ul>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

function FilterTab({
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
        "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-brand-green text-brand-charcoal"
          : "border-transparent text-brand-muted hover:text-brand-charcoal",
      )}
    >
      {label}
    </button>
  );
}

function PostRow({
  post,
}: {
  post: import("@/api/types").PostListItem;
}) {
  const del = useDeletePost();
  const restore = useRestorePost();
  const hardDelete = useHardDeletePost();
  const confirm = useConfirm();
  const toast = useToast();

  async function onSoftDelete() {
    const ok = await confirm({
      title: `Delete "${post.title}"?`,
      message:
        "It will be soft-deleted. You can restore it from the Deleted filter.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await del.mutateAsync(post.postId);
      toast.success(`Deleted "${post.title}".`);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Couldn't delete the post.",
      );
    }
  }

  async function onRestore() {
    try {
      await restore.mutateAsync(post.postId);
      toast.success(`Restored "${post.title}".`);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Couldn't restore the post.",
      );
    }
  }

  async function onHardDelete() {
    const ok = await confirm({
      title: `Permanently delete "${post.title}"?`,
      message:
        "This cannot be undone. The post and any media owned by it will be removed forever.",
      confirmLabel: "Delete forever",
      danger: true,
    });
    if (!ok) return;
    try {
      const r = await hardDelete.mutateAsync(post.postId);
      const removed = r.data.mediaRemoved;
      toast.success(
        `Deleted permanently${removed > 0 ? ` (and ${removed} media file${removed === 1 ? "" : "s"})` : ""}.`,
      );
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Couldn't delete permanently.",
      );
    }
  }

  return (
    <li className="flex items-center gap-4 p-4 hover:bg-brand-bg">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-gray-100">
        <MediaRender
          media={post.media}
          alt={post.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to={`/studio/posts/${post.postId}`}
          className="block truncate font-semibold text-brand-charcoal hover:text-brand-green-dark"
        >
          {post.title}
        </Link>
        <div className="mt-1 flex items-center gap-3 text-xs text-brand-muted">
          <span>{formatDate(post.publishedDate)}</span>
          <span>·</span>
          <span className="font-mono">/{post.slug}</span>
          {post.hasReadMore && (
            <>
              <span>·</span>
              <span>Has read more</span>
            </>
          )}
          {post.isDeleted && (
            <>
              <span>·</span>
              <span className="font-medium text-red-600">Deleted</span>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {!post.isDeleted && (
          <a
            href={`/news/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand-muted hover:text-brand-charcoal"
          >
            View live ↗
          </a>
        )}
        {!post.isDeleted && (
          <Link
            to={`/studio/posts/${post.postId}`}
            className="text-sm font-medium text-brand-green-dark hover:text-brand-green"
          >
            Edit
          </Link>
        )}
        {!post.isDeleted && (
          <button
            type="button"
            onClick={onSoftDelete}
            disabled={del.isPending}
            className="text-sm font-medium text-brand-muted hover:text-red-600 disabled:opacity-50"
          >
            Delete
          </button>
        )}
        {post.isDeleted && (
          <button
            type="button"
            onClick={onRestore}
            disabled={restore.isPending}
            className="text-sm font-medium text-brand-green-dark hover:text-brand-green disabled:opacity-50"
          >
            Restore
          </button>
        )}
        {post.isDeleted && (
          <button
            type="button"
            onClick={onHardDelete}
            disabled={hardDelete.isPending}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Delete forever
          </button>
        )}
      </div>
    </li>
  );
}

function EmptyState({ filter }: { filter: DeletedFilter }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white p-16 text-center">
      <p className="text-lg font-semibold text-brand-charcoal">
        {filter === "true" ? "No deleted posts." : "No posts yet."}
      </p>
      {filter !== "true" && (
        <>
          <p className="mt-2 text-sm text-brand-muted">
            Create your first news item to get started.
          </p>
          <Link
            to="/studio/posts/new"
            className="mt-6 inline-block rounded-pill bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-dark"
          >
            + New post
          </Link>
        </>
      )}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-semibold text-red-700">Couldn't load posts.</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 bg-white">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-16 w-24 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
