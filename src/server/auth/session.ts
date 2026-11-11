import "server-only";
import { cookies } from "next/headers";
import { getDb } from "../db";
import { createAuthClient, isAuthCookie } from "./supabase";

export function findMembership(userId: string) {
  return getDb().membership.findFirst({
    where: { userId, tenant: { slug: "suporte_ti" } },
    select: { id: true, tenantId: true, role: true },
  });
}

export async function getSession() {
  const jar = await cookies();
  if (!jar.getAll().some(({ name }) => isAuthCookie(name))) return null;

  const client = createAuthClient(() => jar.getAll(), () => {
    // Proxy refreshes cookies before Server Component rendering.
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;

  const membership = await findMembership(data.user.id);
  return membership ? { user: data.user, membership } : null;
}
