
// GET /
// Returns a paginated list of public posts
// Supports page and limit
// Returns total count for pagination UI
// GET /:slug
// Returns one public post by its slug
// Slugs are human-readable URLs like /how-to-learn-nodejs


import { Router } from "express";
import {
  countPublicPosts,
  getPublicPostBySlug,
  listPublicPosts,
} from "../DB/post.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { badRequest, notFound } from "../Utils/errors.js";

const router = Router();

function parsePositiveInteger(
  value: string | string[] | undefined,
  fallback: number,
  field: string,
): number {
  if (value === undefined) {
    return fallback;
  }

  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }

  return parsed;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = parsePositiveInteger(req.query.page as string | undefined, 1, "page");
    const limit = Math.min(
      parsePositiveInteger(req.query.limit as string | undefined, 10, "limit"),
      50,
    );
    const [posts, total] = await Promise.all([
      listPublicPosts(page, limit),
      countPublicPosts(),
    ]);

    res.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
      },
      message: "OK",
    });
  }),
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const post = await getPublicPostBySlug(slug);

    if (!post) {
      throw notFound("Post not found");
    }

    res.json({
      data: post,
      message: "OK",
    });
  }),
);

export default router;
