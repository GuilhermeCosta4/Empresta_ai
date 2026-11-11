import "server-only";
import { getDb } from "./db";

const pageSize = 24;

export async function listEquipment(tenantId: string, cursor?: string) {
  const rows = await getDb().equipment.findMany({
    where: { tenantId, assetTag: cursor ? { gt: cursor } : undefined },
    orderBy: { assetTag: "asc" },
    take: pageSize + 1,
    select: {
      assetTag: true,
      name: true,
      category: true,
      imagePath: true,
      inMaintenance: true,
      loans: { where: { returnedAt: null }, select: { id: true }, take: 1 },
    },
  });
  const items = rows.slice(0, pageSize).map(({ inMaintenance, loans, ...item }) => ({
    ...item,
    status: inMaintenance ? "Em manutenção" as const
      : loans.length ? "Emprestado" as const : "Disponível" as const,
  }));
  return { items, nextCursor: rows[pageSize] ? items.at(-1)?.assetTag : undefined };
}
