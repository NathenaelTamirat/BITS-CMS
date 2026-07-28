import { Link } from "react-router-dom";
import type { PostListItem } from "@/api/types";
import { formatDate } from "@/lib/format";
import { htmlToText } from "@/lib/sanitize";
import MediaRender from "./MediaRender";

interface Props {
  post: PostListItem;
}

export default function NewsCard({ post }: Props) {
  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-card">
      <Link to={`/news/${post.slug}`} className="block aspect-[16/10] bg-gray-100">
        <MediaRender
          media={post.media}
          alt={post.title}
          className="h-full w-full object-cover"
        />
      </Link>
      <div className="p-7">
        <Link to={`/news/${post.slug}`} className="block group">
          <h2 className="text-2xl font-bold leading-tight text-brand-charcoal group-hover:text-brand-green-dark transition-colors">
            {post.title}
          </h2>
        </Link>
        <p className="mt-1 text-sm text-brand-muted">
          {formatDate(post.publishedDate)}
        </p>
        <p className="mt-4 line-clamp-3 text-base leading-relaxed text-brand-muted">
          {htmlToText(post.content)}
        </p>
        {post.hasReadMore && (
          <Link
            to={`/news/${post.slug}`}
            className="mt-6 inline-block rounded-pill border-2 border-brand-green px-5 py-2 text-sm font-semibold text-brand-charcoal transition-colors hover:bg-brand-green hover:text-white"
          >
            Read More
          </Link>
        )}
      </div>
    </article>
  );
}
