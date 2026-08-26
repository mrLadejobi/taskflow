import { api } from "./client";
import type { RegisterInput, TokenResponse, User } from "@/lib/types";

/** Register a new account (JSON body). Returns the created user. */
export async function register(input: RegisterInput): Promise<User> {
  const { data } = await api.post<User>("/auth/register", input);
  return data;
}

/**
 * Exchange email + password for a JWT.
 *
 * The backend uses the OAuth2 password flow, so credentials must be sent as
 * form-encoded fields with the email in the `username` field.
 */
export async function login(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  const { data } = await api.post<TokenResponse>("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

/**
 * Request a password-reset link for an email address.
 *
 * The backend endpoint is added in the collaboration phase. The UI always
 * reports success regardless of the outcome so it never reveals whether an
 * email is registered.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

/** Complete a password reset using the token from the emailed link. */
export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  await api.post("/auth/reset-password", { token, password });
}
