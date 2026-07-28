import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { bootstrapSession, setAuthFailureHandler } from "@/lib/api";
import { decodeJwt } from "@/lib/jwt";
import { loginRequest, logoutRequest } from "@/api/auth";
import type { AuthUser, Role } from "@/api/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  const adminId =
    typeof payload.sub === "number" ? payload.sub : Number(payload.sub);
  if (!Number.isFinite(adminId)) return null;
  return {
    adminId,
    email: payload.email,
    role: payload.role as Role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    bootstrapSession().then((token) => {
      if (cancelled) return;
      setUser(userFromToken(token));
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    return () => setAuthFailureHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

interface RequireAuthProps {
  children: ReactNode;
  role?: Role;
}

export function RequireAuth({ children, role }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-brand-muted">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/studio/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (role === "superadmin" && user.role !== "superadmin") {
    return <Navigate to="/studio/posts" replace />;
  }

  return <>{children}</>;
}
