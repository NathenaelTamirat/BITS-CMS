import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminAccount, Envelope, Role } from "./types";

export function useAdmins() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: () =>
      api<Envelope<AdminAccount[]>>("/api/admin/admins", { auth: true }),
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; role?: Role }) =>
      api<Envelope<AdminAccount>>("/api/admin/admins", {
        method: "POST",
        body: input,
        auth: true,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
  });
}

export function useDeactivateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<Envelope<{ adminId: number; isActive: boolean }>>(
        `/api/admin/admins/${id}/deactivate`,
        { method: "PATCH", auth: true },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
  });
}

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      api<Envelope<{ adminId: number }>>(
        `/api/admin/admins/${id}/password`,
        {
          method: "PATCH",
          body: { newPassword },
          auth: true,
        },
      ),
  });
}
