import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Envelope } from "./types";

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api<Envelope<{ adminId: number }>>("/api/admin/me/password", {
        method: "PATCH",
        body: input,
        auth: true,
      }),
  });
}
