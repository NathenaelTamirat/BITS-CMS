import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Envelope,
  PaginatedEnvelope,
  PostDetail,
  PostInput,
  PostListItem,
} from "./types";

export type DeletedFilter = "true" | "false" | "all";

export function usePublicPosts(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["public-posts", { page, limit }],
    queryFn: () =>
      api<PaginatedEnvelope<PostListItem[]>>(
        `/api/posts?page=${page}&limit=${limit}`,
      ),
  });
}

export function usePublicPost(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-post", slug],
    enabled: !!slug,
    queryFn: () =>
      api<Envelope<PostDetail>>(`/api/posts/${encodeURIComponent(slug!)}`),
  });
}

export function useAdminPosts(
  opts: { page?: number; limit?: number; deleted?: DeletedFilter } = {},
) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 10;
  const deleted = opts.deleted ?? "false";
  return useQuery({
    queryKey: ["admin-posts", { page, limit, deleted }],
    queryFn: () =>
      api<PaginatedEnvelope<PostListItem[]>>(
        `/api/admin/posts?page=${page}&limit=${limit}&deleted=${deleted}`,
        { auth: true },
      ),
  });
}

export function useAdminPost(id: number | undefined) {
  return useQuery({
    queryKey: ["admin-post", id],
    enabled: typeof id === "number" && Number.isFinite(id),
    queryFn: () =>
      api<Envelope<PostDetail>>(`/api/admin/posts/${id!}`, { auth: true }),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) =>
      api<Envelope<PostDetail>>("/api/admin/posts", {
        method: "POST",
        body: input,
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["public-posts"] });
    },
  });
}

export function useUpdatePost(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) =>
      api<Envelope<PostDetail>>(`/api/admin/posts/${id}`, {
        method: "PUT",
        body: input,
        auth: true,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["public-posts"] });
      qc.invalidateQueries({ queryKey: ["admin-post", id] });
      qc.invalidateQueries({ queryKey: ["public-post", res.data.slug] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<void>(`/api/admin/posts/${id}`, {
        method: "DELETE",
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["public-posts"] });
    },
  });
}

export function useRestorePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<Envelope<PostDetail>>(`/api/admin/posts/${id}/restore`, {
        method: "POST",
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["public-posts"] });
    },
  });
}

export function useHardDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<Envelope<{ postId: number; mediaRemoved: number }>>(
        `/api/admin/posts/${id}/permanent`,
        { method: "DELETE", auth: true },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      qc.invalidateQueries({ queryKey: ["public-posts"] });
    },
  });
}
