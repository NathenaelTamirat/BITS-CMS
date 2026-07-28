import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Envelope, MediaUploadResponse } from "./types";

export function useUploadMedia() {
  return useMutation({
    mutationFn: async (file: File): Promise<MediaUploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api<Envelope<MediaUploadResponse>>(
        "/api/media/upload",
        {
          method: "POST",
          body: formData,
          auth: true,
        },
      );
      return res.data;
    },
  });
}

export function mediaUrl(mediaId: number): string {
  return `/api/media/${mediaId}`;
}
