import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const tenantA = randomUUID();
const tenantB = randomUUID();
const borrowerId = randomUUID();
const otherBorrowerId = randomUUID();
const staffId = randomUUID();
const outsiderId = randomUUID();
const userA = randomUUID();
const userStaff = randomUUID();
const equipmentA = randomUUID();
const equipmentB = randomUUID();
const secondEquipmentA = randomUUID();
const dueAt = new Date("2030-01-15T00:00:00Z");
const startedAt = new Date("2030-01-01T00:00:00Z");

let container: StartedPostgreSqlContainer | undefined;
let db: PrismaClient;
let testUrl: URL;

function migrate(connection: string) {
  const schema = resolve("prisma/schema.prisma");
  execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy", "--schema", schema], {
    cwd: tmpdir(),
    env: { ...process.env, DATABASE_URL: connection, DIRECT_URL: connection },
    stdio: "pipe",
  });
}

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16")
    .withDatabase("emprestai_integration")
    .withUsername("integration_owner")
    .withPassword(randomUUID())
    .start();
  testUrl = new URL(container.getConnectionUri());
  if (!["localhost", "127.0.0.1", "[::1]"].includes(testUrl.hostname)) {
    throw new Error("A integração exige um PostgreSQL descartável em loopback.");
  }
  const connection = testUrl.toString();
  db = new PrismaClient({ datasourceUrl: connection });

  // Simulate Supabase grants on newly created tables.
  await db.$executeRaw`CREATE ROLE anon NOLOGIN`;
  await db.$executeRaw`CREATE ROLE authenticated NOLOGIN`;
  await db.$executeRaw`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated`;
  migrate(connection);
  await db.$executeRaw`CREATE ROLE integration_app NOLOGIN NOBYPASSRLS`;
  await db.$executeRaw`GRANT SELECT ON tenants, memberships, equipment, loans, audit_events TO integration_app`;
  await db.$executeRaw`GRANT INSERT ON audit_events TO integration_app`;

  await db.tenant.createMany({
    data: [
      { id: tenantA, slug: "suporte_ti", name: "Tenant A" },
      { id: tenantB, slug: "outro_tenant", name: "Tenant B" },
    ],
  });
  await db.membership.createMany({
    data: [
      { id: borrowerId, tenantId: tenantA, userId: userA, role: "colaborador" },
      { id: otherBorrowerId, tenantId: tenantA, userId: randomUUID(), role: "colaborador" },
      { id: staffId, tenantId: tenantA, userId: userStaff, role: "operacoes" },
      { id: outsiderId, tenantId: tenantB, userId: randomUUID(), role: "colaborador" },
    ],
  });
  await db.equipment.createMany({
    data: [
      { id: equipmentA, tenantId: tenantA, assetTag: "TI-0001", name: "Notebook A" },
      { id: equipmentB, tenantId: tenantB, assetTag: "TI-0001", name: "Notebook B" },
      { id: secondEquipmentA, tenantId: tenantA, assetTag: "TI-0002", name: "Notebook 2" },
    ].map((item) => ({ ...item, category: "notebook", imagePath: `equipment/${item.assetTag}.jpg` })),
  });
  await db.loan.createMany({
    data: [
      { tenantId: tenantA, equipmentId: equipmentA, borrowerMembershipId: borrowerId },
      { tenantId: tenantA, equipmentId: secondEquipmentA, borrowerMembershipId: otherBorrowerId },
      { tenantId: tenantB, equipmentId: equipmentB, borrowerMembershipId: outsiderId },
    ].map((item) => ({ ...item, startedAt, dueAt })),
  });
});

afterAll(async () => {
  try {
    await db?.$disconnect();
  } finally {
    await container?.stop();
  }
});

async function asApp<T>(
  context: { tenantId: string; userId: string } | undefined,
  query: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL ROLE integration_app`;
    if (context) {
      await tx.$queryRaw`SELECT set_config('emprestai.tenant_id', ${context.tenantId}, true),
                               set_config('emprestai.user_id', ${context.userId}, true)`;
    }
    return query(tx);
  });
}

test("CA-01 applies the migration and maps the five domain models", async () => {
  expect(await db.tenant.count()).toBe(2);
  expect(await db.membership.count()).toBe(4);
  expect(await db.equipment.count()).toBe(3);
  expect(await db.loan.count()).toBe(3);
  expect(await db.auditEvent.count()).toBe(0);
});

test("CA-02 rejects cross-tenant references and duplicate active loans", async () => {
  const data = { tenantId: tenantA, equipmentId: equipmentA, borrowerMembershipId: borrowerId, startedAt, dueAt };
  await expect(db.loan.create({ data: { ...data, equipmentId: equipmentB } }))
    .rejects.toMatchObject({ code: "P2003" });
  await expect(db.loan.create({
    data: { ...data, borrowerMembershipId: outsiderId, returnedAt: dueAt, returnedByMembershipId: borrowerId },
  })).rejects.toMatchObject({ code: "P2003" });
  await expect(db.loan.create({ data: { ...data, returnedAt: dueAt, returnedByMembershipId: outsiderId } }))
    .rejects.toMatchObject({ code: "P2003" });
  await expect(db.loan.create({ data })).rejects.toMatchObject({ code: "P2002" });
  await expect(db.loan.create({ data: { ...data, returnedAt: dueAt, returnedByMembershipId: borrowerId } }))
    .resolves.toMatchObject({ returnedAt: dueAt });
});

test("CA-03 enables RLS on every domain table and revokes browser grants", async () => {
  const protections = await db.$queryRaw<{ rls: boolean; anon: boolean; authenticated: boolean }[]>`
    SELECT relrowsecurity AS rls,
      has_table_privilege('anon', oid, 'SELECT') AS anon,
      has_table_privilege('authenticated', oid, 'SELECT') AS authenticated
    FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
      AND relname IN ('tenants', 'memberships', 'equipment', 'loans', 'audit_events')
  `;
  expect(protections).toHaveLength(5);
  for (const table of protections) {
    expect(table).toEqual({ rls: true, anon: false, authenticated: false });
  }
});

test("CA-04 scopes data to the session's tenant and loans to the borrower or staff", async () => {
  const read = async (tx: Prisma.TransactionClient) => ({
    equipment: await tx.equipment.findMany({ select: { id: true } }),
    memberships: await tx.membership.findMany({ select: { id: true } }),
    loans: await tx.loan.findMany({ distinct: ["borrowerMembershipId"], select: { borrowerMembershipId: true } }),
  });
  const empty = { equipment: [], memberships: [], loans: [] };
  expect(await asApp(undefined, read)).toEqual(empty);
  expect(await asApp({ tenantId: tenantB, userId: userA }, read)).toEqual(empty);
  const borrower = await asApp({ tenantId: tenantA, userId: userA }, read);
  expect(new Set(borrower.equipment.map((row) => row.id))).toEqual(new Set([equipmentA, secondEquipmentA]));
  expect(borrower.memberships).toEqual([{ id: borrowerId }]);
  expect(borrower.loans).toEqual([{ borrowerMembershipId: borrowerId }]);
  const staff = await asApp({ tenantId: tenantA, userId: userStaff }, read);
  expect(new Set(staff.loans.map((row) => row.borrowerMembershipId)))
    .toEqual(new Set([borrowerId, otherBorrowerId]));
  expect(await asApp(undefined, read)).toEqual(empty);
});

test("CA-04 permits audit inserts by the actor and blocks mutation even for the owner", async () => {
  const data = {
    tenantId: tenantA,
    actorMembershipId: borrowerId,
    action: "loan.created",
    resourceType: "loan",
    resourceId: randomUUID(),
  };
  const context = { tenantId: tenantA, userId: userA };
  await asApp(context, (tx) => tx.auditEvent.createMany({ data }));
  await expect(asApp(context, (tx) => tx.auditEvent.createMany({
    data: { ...data, actorMembershipId: staffId },
  }))).rejects.toThrow(/row-level security/i);
  await expect(db.$executeRaw`UPDATE audit_events SET action = 'changed'`).rejects.toThrow(/append-only/);
  await expect(db.$executeRaw`DELETE FROM audit_events`).rejects.toThrow(/append-only/);
  await expect(db.$executeRaw`TRUNCATE audit_events`).rejects.toThrow(/append-only/);
  expect(await db.auditEvent.count()).toBe(1);
});

test("CA-05 connects exclusively to the disposable loopback test database", async () => {
  expect(["localhost", "127.0.0.1", "[::1]"]).toContain(testUrl.hostname);
  expect(testUrl.port).toBe(String(container?.getMappedPort(5432)));
  const [row] = await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  expect(row.name).toBe("emprestai_integration");
});
