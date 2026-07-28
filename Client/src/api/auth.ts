import { api, setAccessToken } from "@/lib/api";
import type { Envelope, LoginResponse } from "./types";

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await api<Envelope<LoginResponse>>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setAccessToken(res.data.accessToken);
  return res.data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await api("/api/auth/logout", { method: "POST", auth: true });
  } finally {
    setAccessToken(null);
  }
}
