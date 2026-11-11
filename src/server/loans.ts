import "server-only";
import { Prisma } from "@prisma/client";
import { getDb } from "./db";

type Member = { tenantId: string; id: string };
const loanPeriodMs = 14 * 24 * 60 * 60 * 1000;

export function listMyLoans({ tenantId, id }: Member) {
  return getDb().loan.findMany({
    where: { tenantId, borrowerMembershipId: id, returnedAt: null },
    orderBy: [{ dueAt: "asc" }, { id: "asc" }],
    select: { id: true, dueAt: true, equipment: { select: { name: true, assetTag: true } } },
  });
}

export async function requestLoan({ tenantId, id }: Member, assetTag: string) {
  try {
    return await getDb().$transaction(async (tx) => {
      // All requests lock the member first, then the item, to serialize both limits.
      const members = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM memberships WHERE tenant_id = ${tenantId}::uuid AND id = ${id}::uuid FOR UPDATE
      `;
      if (!members.length) return { error: "noMembership" } as const;

      const [item] = await tx.$queryRaw<{ id: string; in_maintenance: boolean }[]>`
        SELECT id, in_maintenance FROM equipment WHERE tenant_id = ${tenantId}::uuid AND asset_tag = ${assetTag} FOR UPDATE
      `;
      if (!item) return { error: "notFound" } as const;
      if (item.in_maintenance) return { error: "maintenance" } as const;
      if (await tx.loan.findFirst({ where: { tenantId, equipmentId: item.id, returnedAt: null }, select: { id: true } })) {
        return { error: "unavailable" } as const;
      }

      const startedAt = new Date();
      const active = await tx.loan.findMany({
        where: { tenantId, borrowerMembershipId: id, returnedAt: null },
        orderBy: { dueAt: "asc" },
        select: { dueAt: true },
        take: 3,
      });
      if (active[0] && active[0].dueAt < startedAt) return { error: "overdue" } as const;
      if (active.length >= 3) return { error: "limit" } as const;

      const loan = await tx.loan.create({
        data: { tenantId, equipmentId: item.id, borrowerMembershipId: id, startedAt, dueAt: new Date(startedAt.getTime() + loanPeriodMs) },
        select: { id: true, dueAt: true },
      });
      await tx.auditEvent.create({
        data: { tenantId, actorMembershipId: id, action: "loan.created", resourceType: "loan", resourceId: loan.id },
      });
      return { loan } as const;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "unavailable" } as const;
    }
    throw error;
  }
}
