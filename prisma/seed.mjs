import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const root = resolve(import.meta.dirname, "..");
const userId = process.env.SUPABASE_TEACHER_USER_ID;

if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId ?? "")) {
  throw new Error("SUPABASE_TEACHER_USER_ID deve conter o UUID do usuário já criado no Supabase Auth.");
}

const [equipment, manifest] = await Promise.all([
  readFile(resolve(root, "skills/imagens-equipamentos/assets/equipamentos.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "public/images/equipment/manifest.json"), "utf8").then(JSON.parse),
]);

const manifestByAsset = new Map(manifest.images.map((image) => [image.patrimonio, image]));
if (equipment.length !== 12 || manifest.images.length !== equipment.length) {
  throw new Error("A carga exige exatamente 12 equipamentos e 12 entradas no manifesto.");
}
for (const item of equipment) {
  const image = manifestByAsset.get(item.patrimonio);
  if (!image || image.filename !== `${item.patrimonio}.jpg`) {
    throw new Error(`Imagem ausente ou caminho inválido para ${item.patrimonio}.`);
  }
}

const prisma = new PrismaClient();
try {
  const loansBefore = await prisma.loan.count({ where: { tenant: { slug: "suporte_ti" } } });
  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.upsert({
      where: { slug: "suporte_ti" },
      update: { name: "Suporte TI" },
      create: { slug: "suporte_ti", name: "Suporte TI" },
    });

    await tx.membership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId } },
      update: { role: "colaborador" },
      create: { tenantId: tenant.id, userId, role: "colaborador" },
    });

    for (const item of equipment) {
      const image = manifestByAsset.get(item.patrimonio);
      await tx.equipment.upsert({
        where: { tenantId_assetTag: { tenantId: tenant.id, assetTag: item.patrimonio } },
        update: {
          name: item.nome,
          category: item.categoria,
          inMaintenance: item.situacao === "manutencao",
          imagePath: `equipment/${image.filename}`,
        },
        create: {
          tenantId: tenant.id,
          assetTag: item.patrimonio,
          name: item.nome,
          category: item.categoria,
          inMaintenance: item.situacao === "manutencao",
          imagePath: `equipment/${image.filename}`,
        },
      });
    }
  });

  const [tenant, memberships, equipmentCount, loanCount] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug: "suporte_ti" }, select: { id: true } }),
    prisma.membership.count({ where: { userId, tenant: { slug: "suporte_ti" } } }),
    prisma.equipment.count({ where: { tenant: { slug: "suporte_ti" } } }),
    prisma.loan.count({ where: { tenant: { slug: "suporte_ti" } } }),
  ]);
  if (!tenant || memberships !== 1 || equipmentCount !== 12 || loanCount !== loansBefore) {
    throw new Error("A verificação pós-seed encontrou uma contagem inesperada.");
  }
  console.log(JSON.stringify({ tenant: "suporte_ti", memberships, equipment: equipmentCount, loans: loanCount }));
} finally {
  await prisma.$disconnect();
}
