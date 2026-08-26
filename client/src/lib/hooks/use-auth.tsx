"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import * as authApi from "@/lib/api/auth";
import { getMe } from "@/lib/api/users";
import { authEvents, isTokenExpired, tokenStorage } from "@/lib/auth/tokens";
import type { RegisterInput, User } from "@/lib/types";
import { queryKeys } from "./keys";

interface AuthContextValue {
  /** The authenticated user, or null when signed out / still loading. */
  user: User | null;
  /** True while the initial session is being resolved from a stored token. */
  isLoading: boolean;
  /** True once a valid session with a loaded user exists. */
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Owns the client-side session.
 *
 * A JWT in localStorage is the source of truth for "is there a session"; the
 * `/users/me` query turns that into a real user object. The axios interceptor
 * emits "unauthorized" when a token can't be recovered, and we treat that as a
 * forced logout.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();

  // Read localStorage only after mount so server and first client render agree
  // (avoids a hydration mismatch); `initializing` gates the guard's spinner.
  const [hasToken, setHasToken] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setHasToken(!isTokenExpired(tokenStorage.get()));
    setInitializing(false);
  }, []);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setHasToken(false);
    qc.clear();
  }, [qc]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token } = await authApi.login(email, password);
      tokenStorage.set(access_token);
      setHasToken(true);
      await qc.invalidateQueries({ queryKey: queryKeys.me });
      router.replace("/dashboard");
    },
    [qc, router],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await authApi.register(input);
      // Registration returns the user but no token; sign in to get one.
      await login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [clearSession, router]);

  // The interceptor lives outside React; bridge its "unauthorized" signal in.
  useEffect(() => {
    return authEvents.on("unauthorized", () => {
      clearSession();
      router.replace("/login");
    });
  }, [clearSession, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoading: initializing || (hasToken && meQuery.isLoading),
      isAuthenticated: !!meQuery.data,
      login,
      register,
      logout,
    }),
    [
      meQuery.data,
      meQuery.isLoading,
      initializing,
      hasToken,
      login,
      register,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
