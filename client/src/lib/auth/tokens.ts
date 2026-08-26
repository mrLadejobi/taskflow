/**
 * Access-token persistence and a tiny event bus.
 *
 * The token lives in localStorage so it survives reloads. The axios
 * interceptor (which lives outside React) emits "unauthorized" here when a
 * request fails irrecoverably with 401; the AuthProvider subscribes and
 * redirects to /login.
 */

const ACCESS_TOKEN_KEY = "taskflow.access_token";

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

type AuthEvent = "unauthorized";
type Listener = () => void;

const listeners: Record<AuthEvent, Set<Listener>> = {
  unauthorized: new Set(),
};

export const authEvents = {
  on(event: AuthEvent, cb: Listener): () => void {
    listeners[event].add(cb);
    return () => listeners[event].delete(cb);
  },
  emit(event: AuthEvent): void {
    listeners[event].forEach((cb) => cb());
  },
};

/** Decode a JWT payload without verifying the signature (client-side only). */
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** True when the token is missing or past its `exp` (seconds since epoch). */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}
