import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";

import { authEvents, tokenStorage } from "@/lib/auth/tokens";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/* ------------------------------------------------------------------ */
/* Request: attach the bearer token.                                   */
/* ------------------------------------------------------------------ */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ------------------------------------------------------------------ */
/* Response: transparently refresh the token on a single 401.          */
/*                                                                     */
/* While a refresh is in flight, concurrent 401s are queued and        */
/* replayed once the new token arrives. If the refresh fails, the      */
/* session is cleared and an "unauthorized" event is emitted so the    */
/* AuthProvider can bounce the user to /login.                         */
/* ------------------------------------------------------------------ */

// Endpoints that must never trigger the refresh dance.
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });
  pendingQueue = [];
}

/**
 * Exchange the current session for a fresh access token.
 *
 * The backend refresh endpoint is added in the collaboration phase; until
 * then this rejects, which cleanly forces a re-login on token expiry.
 */
async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post<{ access_token: string }>(
    `${API_URL}/auth/refresh`,
    {},
    { withCredentials: true },
  );
  tokenStorage.set(data.access_token);
  return data.access_token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthCall = AUTH_PATHS.some((p) => url.includes(p));

    if (status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Wait for the in-flight refresh, then retry this request.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers = original.headers ?? {};
            (original.headers as Record<string, string>).Authorization =
              `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const token = await refreshAccessToken();
      flushQueue(null, token);
      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>).Authorization =
        `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      tokenStorage.clear();
      authEvents.emit("unauthorized");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

/** Normalize an axios error into a human-readable message. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    if (error.message) return error.message;
  }
  return fallback;
}
