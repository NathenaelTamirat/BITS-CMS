// Manage posts (CRUD + soft delete)
// Manage admin accounts (create, list, deactivate)
// Handle password updates
// Enforce authentication + role-based authorization
// Validate inputs and normalize query params

import bcrypt from "bcrypt";
import { Router } from "express";
import {
  createAdminAccount,
  deactivateAdmin,
  findAdminById,
  listAdminAccounts,
  revokeRefreshTokensForAdmin,
  updateAdminPassword,
} from "../DB/admin.js";
import {
  countAdminPosts,
  createPost,
  getPostById,
  hardDeletePost,
  listAdminPosts,
  restorePost,
  softDeletePost,
  updatePost,
  type DeletedFilter,
} from "../DB/post.js";
import { authenticate, requireRole } from "../Middleware/auth.js";
import { validateBody } from "../Middleware/validate.js";
import {
  parseCreateAdminBody,
  parseChangePasswordBody,
  parseResetAdminPasswordBody,
} from "../Schemas/admin.js";
import { parsePostBody } from "../Schemas/post.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { badRequest, notFound, unauthorized } from "../Utils/errors.js";

const router = Router();
const SALT_ROUNDS = 12;

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

function parseDeletedFilter(value: string | string[] | undefined): DeletedFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || candidate === "false") {
    return "false";
  }

  if (candidate === "true" || candidate === "all") {
    return candidate;
  }

  throw badRequest("deleted must be one of true, false, or all");
}

function parseId(value: string | string[] | undefined, field: string): number {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }

  return parsed;
}

router.get(
  "/posts",
  authenticate,
  asyncHandler(async (req, res) => {
    const page = parsePositiveInteger(req.query.page as string | undefined, 1, "page");
    const limit = Math.min(
      parsePositiveInteger(req.query.limit as string | undefined, 10, "limit"),
      50,
    );
    const deleted = parseDeletedFilter(req.query.deleted as string | undefined);
    const [posts, total] = await Promise.all([
      listAdminPosts(deleted, page, limit),
      countAdminPosts(deleted),
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

router.post(
  "/posts",
  authenticate,
  validateBody(parsePostBody),
  asyncHandler(async (req, res) => {
    const post = await createPost({
      ...(req.body as ReturnType<typeof parsePostBody>),
      adminId: req.user!.sub,
    });

    res.status(201).json({
      data: post,
      message: "OK",
    });
  }),
);

router.put(
  "/posts/:id",
  authenticate,
  validateBody(parsePostBody),
  asyncHandler(async (req, res) => {
    const postId = parseId(req.params.id, "id");
    const updated = await updatePost(postId, req.body as ReturnType<typeof parsePostBody>);

    if (!updated) {
      throw notFound("Post not found");
    }

    res.json({
      data: updated,
      message: "OK",
    });
  }),
);

router.get(
  "/posts/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const postId = parseId(req.params.id, "id");
    const post = await getPostById(postId, true);

    if (!post) {
      throw notFound("Post not found");
    }

    res.json({
      data: post,
      message: "OK",
    });
  }),
);

router.delete(
  "/posts/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const postId = parseId(req.params.id, "id");
    const deleted = await softDeletePost(postId);

    if (!deleted) {
      throw notFound("Post not found");
    }

    res.status(204).send();
  }),
);

router.post(
  "/posts/:id/restore",
  authenticate,
  asyncHandler(async (req, res) => {
    const postId = parseId(req.params.id, "id");
    const restored = await restorePost(postId);

    if (!restored) {
      throw notFound("Post not found or not deleted");
    }

    const post = await getPostById(postId, true);
    res.json({ data: post, message: "OK" });
  }),
);

router.delete(
  "/posts/:id/permanent",
  authenticate,
  asyncHandler(async (req, res) => {
    const postId = parseId(req.params.id, "id");
    const result = await hardDeletePost(postId);

    if (!result.deleted) {
      throw notFound(
        "Post not found or not soft-deleted. Soft-delete it first.",
      );
    }

    res.json({
      data: { postId, mediaRemoved: result.mediaRemoved },
      message: "OK",
    });
  }),
);

router.post(
  "/admins",
  authenticate,
  requireRole("superadmin"),
  validateBody(parseCreateAdminBody),
  asyncHandler(async (req, res) => {
    const body = req.body as ReturnType<typeof parseCreateAdminBody>;
    const passwordHashed = await bcrypt.hash(body.password, SALT_ROUNDS);
    // Only the seeded superadmin is allowed; this endpoint always creates
    // a regular admin regardless of any role passed in the body.
    const admin = await createAdminAccount({
      email: body.email,
      passwordHashed,
      role: "admin",
    });

    res.status(201).json({
      data: admin,
      message: "OK",
    });
  }),
);

router.get(
  "/admins",
  authenticate,
  requireRole("superadmin"),
  asyncHandler(async (_req, res) => {
    const admins = await listAdminAccounts();

    res.json({
      data: admins,
      message: "OK",
    });
  }),
);

router.patch(
  "/admins/:id/password",
  authenticate,
  requireRole("superadmin"),
  validateBody(parseResetAdminPasswordBody),
  asyncHandler(async (req, res) => {
    const adminId = parseId(req.params.id, "id");
    const body = req.body as ReturnType<typeof parseResetAdminPasswordBody>;

    if (adminId === req.user!.sub) {
      throw badRequest(
        "Use the change-password endpoint for your own account",
      );
    }

    const target = await findAdminById(adminId);
    if (!target) {
      throw notFound("Admin not found");
    }

    const passwordHashed = await bcrypt.hash(body.newPassword, SALT_ROUNDS);
    await updateAdminPassword(adminId, passwordHashed);
    await revokeRefreshTokensForAdmin(adminId);

    res.json({
      data: { adminId },
      message: "OK",
    });
  }),
);

router.patch(
  "/admins/:id/deactivate",
  authenticate,
  requireRole("superadmin"),
  asyncHandler(async (req, res) => {
    const adminId = parseId(req.params.id, "id");

    if (adminId === req.user!.sub) {
      throw badRequest("You cannot deactivate your own account");
    }

    const deactivated = await deactivateAdmin(adminId);

    if (!deactivated) {
      throw notFound("Admin not found");
    }

    await revokeRefreshTokensForAdmin(adminId);

    res.json({
      data: { adminId, isActive: false },
      message: "OK",
    });
  }),
);

router.patch(
  "/me/password",
  authenticate,
  validateBody(parseChangePasswordBody),
  asyncHandler(async (req, res) => {
    const body = req.body as ReturnType<typeof parseChangePasswordBody>;
    const admin = await findAdminById(req.user!.sub);

    if (!admin) {
      throw notFound("Admin not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      body.currentPassword,
      admin.passwordHashed,
    );

    if (!isCurrentPasswordValid) {
      throw unauthorized("Current password is incorrect");
    }

    const passwordHashed = await bcrypt.hash(body.newPassword, SALT_ROUNDS);
    await updateAdminPassword(admin.adminId, passwordHashed);
    await revokeRefreshTokensForAdmin(admin.adminId);

    res.json({
      data: { adminId: admin.adminId },
      message: "Password updated. Please log in again.",
    });
  }),
);

export default router;
