"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "../../lib/trpc";
import type { AppRouter } from "../../server/api/router";

const catalogApi = createTRPCReact<AppRouter>();
const categories: Record<string, string> = {
  notebook: "Notebook", monitor: "Monitor", cabo: "Cabo", camera: "Câmera",
};
const statusStyles = {
  Disponível: "text-available",
  Emprestado: "text-muted",
  "Em manutenção": "text-maintenance",
};
const storageOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const dueDate = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
});

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function EquipmentPhoto({ path }: { path: string }) {
  const [failed, setFailed] = useState(false);
  return failed || !storageOrigin || !/^equipment\/TI-\d+\.jpg$/.test(path) ? (
    <div className="grid aspect-[4/3] place-items-center rounded-item bg-sunken text-sm text-muted">
      Foto indisponível
    </div>
  ) : (
    <Image
      alt=""
      className="aspect-[4/3] w-full rounded-item object-cover"
      height={600}
      width={800}
      onError={() => setFailed(true)}
      src={`${storageOrigin}/storage/v1/object/public/equipment-images/${path}`}
      unoptimized
    />
  );
}

function CatalogList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const utils = catalogApi.useUtils();
  const mine = catalogApi.loans.mine.useQuery(undefined, { retry: false });
  const request = catalogApi.loans.request.useMutation({
    onSettled: () => Promise.all([utils.catalog.list.invalidate(), utils.loans.mine.invalidate()]),
  });
  const list = catalogApi.catalog.list.useInfiniteQuery({}, {
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: 30_000,
    retry: false,
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const itemCategories = [...new Set(items.map((item) => item.category))];
  const visible = items.filter((item) =>
    (!category || item.category === category) &&
    (!status || item.status === status) &&
    normalize(`${item.name} ${item.assetTag} ${categories[item.category] ?? item.category}`)
      .includes(normalize(search.trim())),
  );

  return (
    <>
      <h1 className="text-[24px] font-semibold">Catálogo de equipamentos</h1>
      <section aria-labelledby="my-loans" className="my-5 rounded-card border border-card bg-panel p-4">
        <h2 id="my-loans" className="text-sm font-semibold">Meus empréstimos</h2>
        {mine.isPending && <p className="mt-2 text-sm text-muted">Carregando empréstimos…</p>}
        {mine.isError && <p className="mt-2 text-sm text-muted" role="alert">Não foi possível carregar seus empréstimos.</p>}
        {mine.data?.length === 0 && !mine.isError && <p className="mt-2 text-sm text-muted">Você não tem empréstimos em aberto.</p>}
        {!!mine.data?.length && !mine.isError && (
          <ul className="mt-2 space-y-2 text-sm">
            {mine.data.map((loan) => (
              <li key={loan.id}>
                {loan.equipment.name} · {loan.equipment.assetTag}
                <span className="ml-2 text-muted">Devolver até <time dateTime={loan.dueAt.toISOString()}>{dueDate.format(loan.dueAt)}</time></span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {request.error && <p className="my-4 text-sm text-maintenance" role="alert">{request.error.message}</p>}
      {request.data && <p className="my-4 text-sm text-available" role="status">Empréstimo registrado. Devolução prevista para {dueDate.format(request.data.dueAt)}.</p>}
      {list.isPending && <p className="mt-5 text-muted" role="status">Carregando equipamentos…</p>}
      {list.isError && (
        <div className="mt-5 text-muted" role="alert">
          {list.error.data?.code === "UNAUTHORIZED" ? (
            <Link className="underline" href="/">Sua sessão expirou. Entrar novamente</Link>
          ) : (
            <>
              <p>Não foi possível carregar o catálogo.</p>
              <button className="underline" type="button" onClick={() => void list.refetch()}>Tentar novamente</button>
            </>
          )}
        </div>
      )}
      {list.data && !list.isError && (
        <>
          <section aria-label="Filtros do catálogo" className="my-5 flex flex-wrap gap-4 border-b border-soft pb-5 text-sm">
            <label className="grid gap-1">
              Buscar equipamentos
              <input className="rounded-control border border-strong bg-sunken px-3 py-2" type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label className="grid gap-1">
              Categoria
              <select className="rounded-control border border-strong bg-sunken px-3 py-2" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Todas</option>
                {itemCategories.map((value) => <option key={value} value={value}>{categories[value] ?? value}</option>)}
              </select>
            </label>
            <label className="grid gap-1">
              Situação
              <select className="rounded-control border border-strong bg-sunken px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">Todas</option>
                {Object.keys(statusStyles).map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </section>
          <p className="mb-4 text-sm text-muted" role="status">{visible.length} de {items.length} equipamentos carregados</p>
          <section aria-label="Lista de equipamentos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visible.map((item) => (
              <article className="rounded-card border border-card bg-panel p-4" key={item.assetTag}>
                <EquipmentPhoto key={item.imagePath} path={item.imagePath} />
                <p className="mt-3 text-xs text-muted">{categories[item.category] ?? item.category} · {item.assetTag}</p>
                <h2 className="my-1 text-sm font-semibold">{item.name}</h2>
                <p className={`text-xs font-semibold ${statusStyles[item.status]}`}>{item.status}</p>
                {item.status === "Disponível" && (
                  <button
                    className="mt-3 rounded-control border border-accent-500 px-3 py-1.5 text-sm text-accent-300 disabled:opacity-60"
                    disabled={request.isPending}
                    onClick={() => request.mutate({ assetTag: item.assetTag })}
                    type="button"
                  >
                    {request.isPending && request.variables?.assetTag === item.assetTag ? "Solicitando…" : "Solicitar"}
                  </button>
                )}
              </article>
            ))}
          </section>
          {visible.length === 0 && <p className="text-sm text-muted">Nenhum equipamento corresponde aos filtros.</p>}
          {list.hasNextPage && (
            <button className="mt-4 rounded-control border border-strong px-3 py-2 text-sm" type="button" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
              {list.isFetchingNextPage ? "Carregando…" : "Carregar mais equipamentos"}
            </button>
          )}
          <footer className="mt-6 border-t border-soft pt-4 text-xs text-muted">
            <a className="underline" href="https://pixabay.com/">Fotos: Pixabay</a>
          </footer>
        </>
      )}
    </>
  );
}

export function Catalog() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <catalogApi.Provider client={trpc} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <CatalogList />
      </QueryClientProvider>
    </catalogApi.Provider>
  );
}
