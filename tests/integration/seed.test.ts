import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const teacherUserId = randomUUID();
let container: StartedPostgreSqlContainer;
let database: PrismaClient;
let connection: string;

function migrate() {
  execFileSync(process.execPath, [
    require.resolve("prisma/build/index.js"),
    "migrate",
    "deploy",
    "--schema",
    resolve("prisma/schema.prisma"),
  ], {
    cwd: process.env.TEMP ?? process.cwd(),
    env: { ...process.env, DATABASE_URL: connection, DIRECT_URL: connection },
    stdio: "pipe",
  });
}

function seed() {
  return execFileSync(process.execPath, [resolve("prisma/seed.mjs")], {
    env: { ...process.env, DATABASE_URL: connection, DIRECT_URL: connection, SUPABASE_TEACHER_USER_ID: teacherUserId },
    encoding: "utf8",
  });
}

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16")
    .withDatabase("emprestai_seed_test")
    .withUsername("seed_owner")
    .withPassword(randomUUID())
    .start();
  connection = container.getConnectionUri();
  database = new PrismaClient({ datasourceUrl: connection });
  migrate();
});

afterAll(async () => {
  await database.$disconnect();
  await container.stop();
});

test("CA-02 cria os 12 equipamentos, as situações da lista e nenhum empréstimo", async () => {
  const output = seed();
  expect(JSON.parse(output)).toMatchObject({ tenant: "suporte_ti", memberships: 1, equipment: 12, loans: 0 });
  const items = await database.equipment.findMany({
    where: { tenant: { slug: "suporte_ti" } },
    orderBy: { assetTag: "asc" },
    select: { assetTag: true, inMaintenance: true, imagePath: true },
  });
  expect(items).toHaveLength(12);
  expect(items.filter(({ inMaintenance }) => inMaintenance).map(({ assetTag }) => assetTag))
    .toEqual(["TI-0004", "TI-0007", "TI-0010"]);
  expect(new Set(items.map(({ imagePath }) => imagePath)).size).toBe(12);
  expect(await database.loan.count()).toBe(0);
});

test("CA-03 repetir a carga preserva IDs e empréstimos existentes", async () => {
  const before = await database.equipment.findMany({
    where: { tenant: { slug: "suporte_ti" } },
    select: { id: true, assetTag: true },
    orderBy: { assetTag: "asc" },
  });
  const tenant = await database.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } });
  const membership = await database.membership.findFirstOrThrow({ where: { tenantId: tenant.id, userId: teacherUserId } });
  const equipment = before[0];
  const startedAt = new Date("2030-01-01T00:00:00Z");
  await database.loan.create({
    data: {
      tenantId: tenant.id,
      equipmentId: equipment.id,
      borrowerMembershipId: membership.id,
      startedAt,
      dueAt: new Date("2030-01-15T00:00:00Z"),
    },
  });
  expect(JSON.parse(seed())).toMatchObject({ equipment: 12, loans: 1 });
  const after = await database.equipment.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, assetTag: true },
    orderBy: { assetTag: "asc" },
  });
  expect(after).toEqual(before);
  expect(await database.loan.count()).toBe(1);
});

test("CA-04 rejeita seed sem UUID do Auth", async () => {
  expect(() => execFileSync(process.execPath, [resolve("prisma/seed.mjs")], {
    env: { ...process.env, DATABASE_URL: connection, DIRECT_URL: connection, SUPABASE_TEACHER_USER_ID: "" },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })).toThrow("SUPABASE_TEACHER_USER_ID");
});
