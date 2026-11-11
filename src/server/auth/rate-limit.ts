import "server-only";
import { createHash, randomInt } from "node:crypto";
import { isIP } from "node:net";
import { Prisma } from "@prisma/client";
import { getDb } from "../db";

export async function consumeLoginAttempt(email: string, headers: Headers) {
  const forwarded = process.env.VERCEL === "1" ? headers.get("x-vercel-forwarded-for") : null;
  const ip = forwarded?.split(",")[0]?.trim();
  const limits = [
    { key: `account:${createHash("sha256").update(email).digest("hex")}`, limit: 5 },
    { key: `ip:${createHash("sha256").update(ip && isIP(ip) ? ip : "unknown").digest("hex")}`, limit: 30 },
  ];
  const db = getDb();
  if (randomInt(100) === 0) {
    await db.$executeRaw`DELETE FROM login_rate_limits WHERE expires_at <= CURRENT_TIMESTAMP`;
  }

  const rows = await db.$queryRaw<{ key: string; attempts: number }[]>`
    INSERT INTO login_rate_limits (key, expires_at, attempts)
    SELECT bucket.key, CURRENT_TIMESTAMP + INTERVAL '15 minutes', 1
    FROM (VALUES ${Prisma.join(limits.map(({ key }) => Prisma.sql`(${key})`))}) AS bucket(key)
    ORDER BY bucket.key
    ON CONFLICT (key) DO UPDATE SET
      expires_at = CASE WHEN login_rate_limits.expires_at <= CURRENT_TIMESTAMP
                        THEN EXCLUDED.expires_at ELSE login_rate_limits.expires_at END,
      attempts = CASE WHEN login_rate_limits.expires_at <= CURRENT_TIMESTAMP THEN 1
                      ELSE LEAST(login_rate_limits.attempts + 1, 31) END
    RETURNING key, attempts
  `;
  return limits.every(({ key, limit }) => rows.some((row) => row.key === key && row.attempts <= limit));
}
