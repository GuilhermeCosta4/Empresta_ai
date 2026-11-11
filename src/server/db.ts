import "server-only";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const globalPrisma = globalThis as typeof globalThis & { emprestAiPrisma?: PrismaClient };

export function getDb() {
  if (!globalPrisma.emprestAiPrisma) {
    const datasourceUrl = z.url({ protocol: /^postgres(?:ql)?$/ }).parse(process.env.DATABASE_URL);
    globalPrisma.emprestAiPrisma = new PrismaClient({ datasourceUrl });
  }
  return globalPrisma.emprestAiPrisma;
}
