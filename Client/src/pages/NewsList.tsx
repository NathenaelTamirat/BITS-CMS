import { useSearchParams } from "react-router-dom";
import { usePublicPosts } from "@/api/posts";
import HeroBand from "@/components/HeroBand";
import NewsCard from "@/components/NewsCard";
import Pagination from "@/components/Pagination";
import { NewsCardGridSkeleton } from "@/components/Skeleton";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const PAGE_SIZE = 10;

export default function NewsList() {
  useDocumentTitle("News and Events");
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const { data, isLoading, isError, error } = usePublicPosts(page, PAGE_SIZE);

  function setPage(next: number) {
    if (next <= 1) {
      searchParams.delete("page");
      setSearchParams(searchParams, { replace: false });
    } else {
      searchParams.set("page", String(next));
      setSearchParams(searchParams, { replace: false });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages =
    data && data.pagination.limit > 0
      ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit))
      : 1;

  return (
    <>
      <HeroBand title="News and Events" />
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-12">
        {isLoading && <NewsCardGridSkeleton count={4} />}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-base font-semibold text-red-700">
              Couldn't load news right now.
            </p>
            <p className="mt-1 text-sm text-red-600">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
          </div>
        )}

        {data && data.data.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white p-16 text-center">
            <p className="text-lg font-semibold text-brand-charcoal">
              No news yet.
            </p>
            <p className="mt-2 text-sm text-brand-muted">
              Check back soon for updates from BITS College.
            </p>
          </div>
        )}

        {data && data.data.length > 0 && (
          <>
            <div className="grid gap-8 md:grid-cols-2">
              {data.data.map((post) => (
                <NewsCard key={post.postId} post={post} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </>
  );
}
