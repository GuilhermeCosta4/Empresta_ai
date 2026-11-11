import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import superjson from "superjson";
import { z } from "zod";
import { loginInput } from "../../lib/auth-input";
import { consumeLoginAttempt } from "../auth/rate-limit";
import { findMembership, getSession } from "../auth/session";
import { createAuthClient, isAuthCookie } from "../auth/supabase";
import { listEquipment } from "../catalog";
import { listMyLoans, requestLoan } from "../loans";

export async function createContext(request: Request) {
  return { request, jar: await cookies() };
}

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    const message = shape.data.code === "INTERNAL_SERVER_ERROR"
      ? "Não foi possível concluir a operação. Tente novamente."
      : shape.message;
    return { ...shape, message, data: { code: shape.data.code, httpStatus: shape.data.httpStatus } };
  },
});

const mutation = t.procedure.use(({ ctx, next }) => {
  const host = ctx.request.headers.get("host");
  const protocol = process.env.VERCEL === "1" ? "https:" : new URL(ctx.request.url).protocol;
  if (!host || ctx.request.headers.get("origin") !== `${protocol}//${host}`) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Origem da solicitação inválida." });
  }
  return next();
});

const accessDenied = "E-mail, senha ou acesso inválido.";
const requireTenant = t.middleware(async ({ next }) => {
  const session = await getSession();
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: accessDenied });
  return next({ ctx: { membership: session.membership } });
});
const tenantProcedure = t.procedure.use(requireTenant);
const loanErrors = {
  noMembership: { code: "UNAUTHORIZED", message: accessDenied },
  notFound: { code: "NOT_FOUND", message: "Equipamento não encontrado." },
  maintenance: { code: "CONFLICT", message: "O equipamento está em manutenção." },
  unavailable: { code: "CONFLICT", message: "O equipamento já está emprestado." },
  overdue: { code: "CONFLICT", message: "Você tem um empréstimo em atraso." },
  limit: { code: "CONFLICT", message: "Você já tem 3 empréstimos em aberto." },
} as const;

export const appRouter = t.router({
  loans: t.router({
    mine: tenantProcedure.query(({ ctx }) => listMyLoans(ctx.membership)),
    request: mutation.use(requireTenant).input(z.object({ assetTag: z.string().min(1).max(100) })).mutation(async ({ ctx, input }) => {
      const result = await requestLoan(ctx.membership, input.assetTag);
      if (result.error) throw new TRPCError(loanErrors[result.error]);
      return result.loan;
    }),
  }),
  catalog: t.router({
    list: tenantProcedure
      .input(z.object({ cursor: z.string().min(1).optional() }).optional())
      .query(({ ctx, input }) => listEquipment(ctx.membership.tenantId, input?.cursor)),
  }),
  auth: t.router({
    login: mutation.input(loginInput).mutation(async ({ ctx, input }) => {
      if (!await consumeLoginAttempt(input.email, ctx.request.headers)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Tente novamente em alguns minutos." });
      }

      const writes = new Map<string, { value: string; options: CookieOptions }>();
      const stagedCookies = new Map(ctx.jar.getAll().map(({ name, value }) => [name, value]));
      const client = createAuthClient(
        () => Array.from(stagedCookies, ([name, value]) => ({ name, value })),
        (changes) => {
          for (const { name, value, options } of changes) {
            writes.set(name, { value, options });
            if (options.maxAge === 0) stagedCookies.delete(name);
            else stagedCookies.set(name, value);
          }
        },
      );
      const { data, error } = await client.auth.signInWithPassword(input);
      if (error || !data.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: accessDenied });
      }

      if (!await findMembership(data.user.id)) {
        await client.auth.signOut({ scope: "local" });
        throw new TRPCError({ code: "UNAUTHORIZED", message: accessDenied });
      }

      for (const [name, { value, options }] of writes) ctx.jar.set(name, value, options);
      return { ok: true };
    }),
    logout: mutation.input(z.void()).mutation(async ({ ctx }) => {
      const client = createAuthClient(() => ctx.jar.getAll(), (changes) => {
        for (const { name, value, options } of changes) ctx.jar.set(name, value, options);
      });
      if (ctx.jar.getAll().some(({ name }) => isAuthCookie(name))) {
        try {
          await client.auth.signOut({ scope: "local" });
        } finally {
          for (const { name } of ctx.jar.getAll()) {
            if (isAuthCookie(name)) ctx.jar.delete(name);
          }
        }
      }
      return { ok: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
