import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import { authCacheControl, createAuthClient, isAuthCookie } from "./server/auth/supabase";

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const development = process.env.NODE_ENV === "development";
  const storageOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.match(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/)?.[0].replace(/\/$/, "");
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    development ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' blob: data:${storageOrigin ? ` ${storageOrigin}/storage/v1/object/public/equipment-images/` : ""}`,
    "font-src 'self' data:",
    `connect-src 'self'${development ? " ws: http: https:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const refreshed = new Map<string, { value: string; options: CookieOptions }>();
  if (request.cookies.getAll().some(({ name }) => isAuthCookie(name))) {
    const client = createAuthClient(() => request.cookies.getAll(), (changes) => {
      for (const { name, value, options } of changes) {
        request.cookies.set(name, value);
        refreshed.set(name, { value, options });
      }
    });
    await client.auth.getUser();
  }

  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  for (const [name, { value, options }] of refreshed) response.cookies.set(name, value, options);
  response.headers.set("Cache-Control", authCacheControl);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images/).*)"],
};
