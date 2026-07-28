export type MediaType = "IMAGE" | "VIDEO" | "YOUTUBE";
export type Role = "admin" | "superadmin";

export interface PostMedia {
  type: MediaType;
  mediaId: number | null;
  url: string | null;
  embedUrl: string | null;
  mimeType: string | null;
}

export interface ReadMoreMedia extends PostMedia {
  position: number;
}

export interface ReadMore {
  title: string;
  content: string;
  media: ReadMoreMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface PostListItem {
  postId: number;
  adminId: number;
  title: string;
  content: string;
  publishedDate: string;
  slug: string;
  hasReadMore: boolean;
  isDeleted: boolean;
  media: PostMedia;
  createdAt: string;
  updatedAt: string;
}

export interface PostDetail extends PostListItem {
  readMore: ReadMore | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface Envelope<T> {
  data: T;
  message: string;
}

export interface PaginatedEnvelope<T> {
  data: T;
  pagination: Pagination;
  message: string;
}

export interface AuthUser {
  adminId: number;
  email: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface MediaUploadResponse {
  mediaId: number;
  url: string;
  mimeType: string;
}

export type MediaInput =
  | { type: "IMAGE"; mediaId: number }
  | { type: "VIDEO"; mediaId: number }
  | { type: "YOUTUBE"; embedUrl: string };

export interface ReadMoreInput {
  title: string;
  content: string;
  media?: MediaInput[];
}

export interface PostInput {
  title: string;
  content: string;
  slug?: string;
  publishedDate?: string;
  primaryMedia: MediaInput;
  readMoreEnabled: boolean;
  readMore?: ReadMoreInput;
}

export interface AdminAccount {
  adminId: number;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
