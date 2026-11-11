"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TRPCClientError } from "@trpc/client";
import { loginInput, type LoginInput } from "../lib/auth-input";
import { trpc } from "../lib/trpc";

const fieldClass = "h-[42px] rounded-control border border-strong bg-sunken px-3 text-[14px] text-foreground placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500";

export default function LoginPage() {
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginInput),
  });

  const login = handleSubmit(async (input) => {
    setError("");
    try {
      await trpc.auth.login.mutate(input);
      window.location.replace("/inicio");
    } catch (cause) {
      setError(cause instanceof TRPCClientError && cause.data
        ? cause.message
        : "Não foi possível entrar. Tente novamente.");
    }
  });

  return (
    <main className="min-h-svh bg-page text-foreground md:grid md:grid-cols-[36.5%_1fr]">
      <section className="flex min-h-[300px] flex-col bg-[image:var(--gradient-login)] px-7 py-7 md:min-h-svh md:px-[10%] md:py-[60px]">
        <div className="inline-flex items-center gap-2.5 text-[17px] font-semibold">
          <span className="grid size-[38px] place-items-center rounded-control border border-accent-700 text-accent-300">
            <i className="ph ph-package text-[19px]" aria-hidden="true" />
          </span>
          EmpresTI
        </div>
        <div className="my-auto max-w-[440px] py-12">
          <h1 className="text-[28px] font-semibold sm:text-[32px]">Quem está com o quê</h1>
          <p className="mt-4 text-[14px] leading-6 text-muted">Pedido e devolução sem planilha.</p>
          <dl className="mt-6 flex gap-10 border-t border-soft pt-6">
            <div><dd className="text-[24px] font-semibold">3</dd><dt className="text-[12px] text-muted">itens por pessoa</dt></div>
            <div><dd className="text-[24px] font-semibold">14</dd><dt className="text-[12px] text-muted">dias de prazo</dt></div>
          </dl>
        </div>
      </section>
      <section className="flex min-h-[500px] items-center justify-center px-6 py-14 md:min-h-svh md:px-10">
        <div className="w-full max-w-[388px]">
          <h2 className="text-[24px] font-semibold">Entrar</h2>
          <p className="mt-2 text-[13px] text-muted">Use o e-mail e a senha do convite.</p>
          <form className="mt-5 flex flex-col" method="post" onSubmit={login}>
            <label className="mb-2 text-[12px] text-muted" htmlFor="email">E-mail</label>
            <input {...register("email")} autoComplete="email" className={fieldClass} id="email" maxLength={254} required type="email" />
            <label className="mb-2 mt-5 text-[12px] text-muted" htmlFor="password">Senha</label>
            <input {...register("password")} autoComplete="current-password" className={fieldClass} id="password" maxLength={1024} required type="password" />
            {(error || errors.email || errors.password) && (
              <p className="mt-3 text-[13px] text-foreground" role="alert">{error || "Confira o e-mail e a senha."}</p>
            )}
            <button
              className="mt-5 flex h-[46px] items-center justify-center gap-2 rounded-control border border-accent-500 text-[13px] font-semibold text-accent-300 hover:bg-accent-500/12 disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Entrando…" : "Entrar"}
              <i className="ph ph-arrow-right text-[16px]" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-5 rounded-control bg-[image:var(--gradient-notice)] px-3 py-2 text-center text-[11px] text-muted">
            Sem acesso? Fale com Operações.
          </p>
        </div>
      </section>
    </main>
  );
}
