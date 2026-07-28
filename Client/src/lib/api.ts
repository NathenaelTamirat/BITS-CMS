const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const DEFAULT_TIMEOUT_MS = 15_000;

function url(path: string): string {
  return `${API_BASE}${path}`;
}

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let authFailureHandler: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setAuthFailureHandler(fn: (() => void) | null) {
  authFailureHandler = fn;
}

export interface ApiErrorBody {
  error: true;
  code: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function refresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(url("/api/auth/refresh"), {
        method: "POST",
        credentials: "include",
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { data?: { accessToken?: string } };
      const token = data?.data?.accessToken ?? null;
      if (token) accessToken = token;
      return token;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function bootstrapSession(): Promise<string | null> {
  return refresh();
}

export async function api<T = unknown>(
  path: string,
  opts: RequestOpts = {},
): Promise<T> {
  const { method = "GET", body, auth = false, signal } = opts;

  const baseHeaders = new Headers();
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    baseHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  const effectiveSignal = signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);

  const doFetch = (overrideToken?: string | null) => {
    const h = new Headers(baseHeaders);
    const token = overrideToken !== undefined ? overrideToken : accessToken;
    if (auth && token) h.set("Authorization", `Bearer ${token}`);
    return fetch(url(path), {
      method,
      headers: h,
      body: payload,
      credentials: "include",
      signal: effectiveSignal,
    });
  };

  let res: Response;
  try {
    res = await doFetch();
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new ApiError(
        0,
        "TIMEOUT",
        "Request timed out. Check your connection.",
      );
    }
    throw e;
  }

  if (res.status === 401 && auth) {
    const newToken = await refresh();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      setAccessToken(null);
      authFailureHandler?.();
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    let errBody: ApiErrorBody | null = null;
    if (contentType.includes("application/json")) {
      try {
        errBody = (await res.json()) as ApiErrorBody;
      } catch {
        // ignore body parse errors
      }
    }
    throw new ApiError(
      res.status,
      errBody?.code ?? "UNKNOWN",
      errBody?.message ?? `Request failed with ${res.status}`,
      errBody?.errors,
    );
  }

  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return undefined as T;
}
