import clsx from "clsx";
import { Link, useParams } from "react-router-dom";
import { usePublicPost } from "@/api/posts";
import type { PostMedia, ReadMoreMedia } from "@/api/types";
import HeroBand from "@/components/HeroBand";
import MediaRender from "@/components/MediaRender";
import { Skeleton } from "@/components/Skeleton";
import { htmlToText, sanitizeHtml } from "@/lib/sanitize";
import { useDocumentTitle, useMetaTags } from "@/lib/useDocumentTitle";

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = usePublicPost(slug);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !data) {
    return <NotFoundFallback />;
  }

  const post = data.data;
  const rm = post.readMore;

  const title = rm?.title ?? post.title;
  const body = rm?.content ?? post.content;
  const gallery: Array<PostMedia | ReadMoreMedia> =
    rm && rm.media.length > 0 ? rm.media : [post.media];

  return (
    <>
      <SeoTags title={title} body={body} primary={post.media} />
      <HeroBand title={title} />

      <article
        className="bits-prose mx-auto max-w-3xl px-6 py-12"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
      />

      {gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div
            className={clsx(
              "grid gap-6",
              gallery.length > 1 ? "md:grid-cols-2" : "max-w-3xl mx-auto",
            )}
          >
            {gallery.map((m, i) => (
              <div
                key={i}
                className="aspect-[3/2] overflow-hidden rounded-lg bg-gray-100 shadow-card"
              >
                <MediaRender
                  media={m}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <section className="border-b border-gray-100 bg-brand-bg">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <Skeleton className="h-14 w-2/3" />
        </div>
      </section>
      <article className="mx-auto max-w-3xl space-y-3 px-6 py-12">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </article>
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="aspect-[3/2] rounded-lg" />
          <Skeleton className="aspect-[3/2] rounded-lg" />
        </div>
      </section>
    </>
  );
}

function SeoTags({
  title,
  body,
  primary,
}: {
  title: string;
  body: string;
  primary: PostMedia;
}) {
  useDocumentTitle(title);
  const description = htmlToText(body).slice(0, 160);
  const ogImage =
    primary.type === "IMAGE" && primary.url
      ? new URL(primary.url, window.location.origin).toString()
      : undefined;
  useMetaTags({
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage,
    ogType: "article",
  });
  return null;
}

function NotFoundFallback() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight text-brand-charcoal">
        404
      </h1>
      <p className="mt-4 text-brand-muted">
        That news item doesn't exist or has been removed.
      </p>
      <Link
        to="/news"
        className="mt-8 inline-block rounded-pill border-2 border-brand-green px-5 py-2 text-sm font-semibold transition-colors hover:bg-brand-green hover:text-white"
      >
        Back to News
      </Link>
    </div>
  );
}
