import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";

export const authCookieName = "emprestai-auth";
export const authCacheControl = "private, no-store";

export function createAuthClient(
  getAll: () => { name: string; value: string }[],
  writeCookies: (cookies: { name: string; value: string; options: CookieOptions }[]) => void,
) {
  const url = z.url({ protocol: /^https?$/ }).parse(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = z.string().min(1).parse(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  return createServerClient(url, key, {
    cookieOptions: {
      name: authCookieName,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    cookies: {
      getAll,
      setAll: (changes) => writeCookies(changes),
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

export function isAuthCookie(name: string) {
  return name === authCookieName || name.startsWith(`${authCookieName}.`);
}
