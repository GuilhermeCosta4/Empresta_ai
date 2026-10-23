"use client";

import Image from "next/image";
import { useState, type FormEvent, type KeyboardEvent } from "react";

const equipment = [
  {
    id: "EQ-014",
    name: "Notebook ultraleve",
    detail: "14 pol. · 16 GB · USB-C",
    category: "Computadores",
    status: "Disponível",
    icon: "ph-laptop",
  },
  {
    id: "EQ-021",
    name: "Monitor Studio",
    detail: "27 pol. · 4K · USB-C",
    category: "Monitores",
    status: "Disponível",
    icon: "ph-monitor",
  },
  {
    id: "EQ-008",
    name: "Fone com cancelamento de ruído",
    detail: "Bluetooth · over-ear · estojo",
    category: "Áudio",
    status: "Emprestado",
    icon: "ph-headphones",
  },
  {
    id: "EQ-032",
    name: "Câmera mirrorless",
    detail: "4K · lente 18–55 mm · bolsa",
    category: "Imagem",
    status: "Disponível",
    icon: "ph-video-camera",
  },
  {
    id: "EQ-019",
    name: "Notebook de performance",
    detail: "16 pol. · 32 GB · GPU dedicada",
    category: "Computadores",
    status: "Em manutenção",
    icon: "ph-laptop",
  },
  {
    id: "EQ-006",
    name: "Fone de estúdio",
    detail: "Com fio · almofadas extra · estojo",
    category: "Áudio",
    status: "Disponível",
    icon: "ph-headphones",
  },
  {
    id: "EQ-013",
    name: "Monitor de criação",
    detail: "24 pol. · QHD · ajuste de altura",
    category: "Monitores",
    status: "Emprestado",
    icon: "ph-monitor",
  },
  {
    id: "EQ-042",
    name: "Câmera para reuniões",
    detail: "4K · foco automático · tripé",
    category: "Imagem",
    status: "Disponível",
    icon: "ph-video-camera",
  },
] as const;

type Equipment = (typeof equipment)[number];
type CategoryFilter = "Todos" | Equipment["category"];
type StatusFilter = "Todos" | Equipment["status"];

const categories: CategoryFilter[] = [
  "Todos",
  "Computadores",
  "Monitores",
  "Áudio",
  "Imagem",
];

const statuses: StatusFilter[] = [
  "Todos",
  "Disponível",
  "Emprestado",
  "Em manutenção",
];

const statusStyles: Record<Equipment["status"], string> = {
  Disponível: "border border-available/35 bg-available/10 text-available",
  Emprestado: "border border-strong bg-soft text-muted",
  "Em manutenção":
    "border border-maintenance/35 bg-maintenance/10 text-maintenance",
};

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-semibold text-foreground ${compact ? "text-[17px]" : "text-[19px]"}`}
    >
      <span className="grid size-8 place-items-center rounded-compact bg-accent-800 text-accent-200">
        <i className="ph ph-package text-[19px]" aria-hidden="true" />
      </span>
      emprestai
    </span>
  );
}

function StatusPill({ status }: { status: Equipment["status"] }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 rounded-pill px-[9px] text-[11px] font-semibold ${statusStyles[status]}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-pill ${status === "Disponível" ? "bg-available" : status === "Emprestado" ? "bg-borrowed" : "bg-maintenance"}`}
      />
      {status}
    </span>
  );
}

export default function HomePage() {
  const [view, setView] = useState<"login" | "catalog">("login");
  const [email, setEmail] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");
  const [search, setSearch] = useState("");
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  const filteredEquipment = equipment.filter((item) => {
    const matchesCategory =
      categoryFilter === "Todos" || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === "Todos" || item.status === statusFilter;
    const searchText = normalizeSearch(
      `${item.name} ${item.detail} ${item.category}`,
    );

    return (
      matchesCategory &&
      matchesStatus &&
      searchText.includes(normalizeSearch(search.trim()))
    );
  });

  function enterDemo(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setView("catalog");
    setFeedback("");
  }

  function requestEquipment(id: string, name: string) {
    setRequestedIds((currentIds) => [...currentIds, id]);
    setFeedback(`Pedido demonstrativo registrado: ${name}. Nada foi salvo.`);
  }

  function leaveDemo() {
    setView("login");
    setFeedback("");
  }

  function moveStatusSelection(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;

    if (!direction) return;

    event.preventDefault();
    const nextIndex = (currentIndex + direction + statuses.length) % statuses.length;
    setStatusFilter(statuses[nextIndex]);
    document.getElementById(`status-filter-${nextIndex}`)?.focus();
  }

  if (view === "login") {
    return (
      <main className="min-h-screen bg-page p-3 text-foreground sm:p-6 lg:p-8">
        <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-7xl overflow-hidden rounded-frame border border-frame bg-background shadow-shell sm:min-h-[calc(100svh-3rem)] lg:min-h-[calc(100svh-4rem)] lg:grid-cols-2">
          <section className="flex flex-col p-6 sm:p-10 lg:p-12">
            <header className="flex items-center justify-between gap-4">
              <Brand />
              <span className="inline-flex items-center gap-2 rounded-pill border border-frame px-3 py-1.5 text-[10px] font-semibold text-muted">
                <span className="size-1.5 rounded-pill bg-available" />
                AMBIENTE DE DEMONSTRAÇÃO
              </span>
            </header>

            <div className="my-auto w-full max-w-md py-12 lg:py-16">
              <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold text-accent-400">
                <span className="h-px w-6 bg-accent-500" />
                EQUIPAMENTOS INTERNOS
              </div>
              <h1 className="max-w-[15ch] text-[34px] leading-[1.15] font-semibold text-foreground">
                Bom trabalho começa com boas ferramentas.
              </h1>
              <p className="mt-4 max-w-sm text-[14px] leading-6 text-muted [text-wrap:pretty]">
                Entre para explorar os equipamentos disponíveis para o seu
                próximo projeto.
              </p>

              <form className="mt-8 flex flex-col gap-3" onSubmit={enterDemo}>
                <label className="text-[12px] text-muted" htmlFor="email">
                  E-mail de trabalho
                </label>
                <input
                  autoComplete="email"
                  className="h-[42px] rounded-control border border-strong bg-sunken px-3 text-[14px] text-foreground placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                  id="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@empresa.com.br"
                  required
                  type="email"
                  value={email}
                />

                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <label className="text-[12px] text-muted" htmlFor="password">
                    Senha
                  </label>
                  <span className="text-[12px] text-faint">
                    Somente demonstração
                  </span>
                </div>
                <input
                  autoComplete="current-password"
                  className="h-[42px] rounded-control border border-strong bg-sunken px-3 text-[14px] text-foreground placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                  id="password"
                  name="password"
                  placeholder="••••••••••"
                  required
                  type="password"
                />

                <button
                  className="mt-3 flex h-11 items-center justify-between rounded-control border border-accent-500 bg-transparent px-4 text-[13px] font-semibold text-accent-300 transition-colors duration-[140ms] hover:bg-accent-500/12 hover:text-accent-100 active:translate-y-px active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 motion-reduce:transition-none"
                  type="submit"
                >
                  Entrar no catálogo
                  <i className="ph ph-arrow-right text-[17px]" aria-hidden="true" />
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-[12px] text-faint">
                <span className="h-px flex-1 bg-soft" />
                ou
                <span className="h-px flex-1 bg-soft" />
              </div>
              <button
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-control border border-strong text-[13px] font-semibold text-muted transition-colors duration-[120ms] hover:border-frame hover:bg-sunken hover:text-foreground active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 motion-reduce:transition-none"
                onClick={() => enterDemo()}
                type="button"
              >
                Explorar sem entrar
                <i className="ph ph-arrow-right text-[16px]" aria-hidden="true" />
              </button>
              <p className="mt-3 text-center text-[12px] text-faint">
                Entrada visual apenas. Nenhuma credencial é verificada.
              </p>
            </div>

            <footer className="flex flex-wrap justify-between gap-2 border-t border-soft pt-4 text-[10px] text-faint">
              <span>EMPRESTAI · OPERAÇÕES INTERNAS</span>
              <span>CATÁLOGO DE EQUIPAMENTOS</span>
            </footer>
          </section>

          <aside
            aria-label="Equipamentos de trabalho"
            className="relative min-h-[340px] overflow-hidden bg-[image:var(--gradient-login)] lg:min-h-[680px]"
          >
            <Image
              alt="Câmera digital pronta para um projeto criativo"
              className="object-cover object-center"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 50vw"
              src="/images/equipment/camera.jpg"
            />
            <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-3 sm:inset-x-7 sm:top-7">
              <span className="rounded-pill border border-frame bg-background/90 px-3 py-1.5 text-[11px] text-foreground">
                01 / 04
              </span>
              <span className="rounded-pill border border-frame bg-background/90 px-3 py-1.5 text-[11px] font-semibold text-foreground">
                FEITO PARA COMPARTILHAR
              </span>
            </div>
            <div className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
              <span className="text-[11px] font-semibold text-accent-200">
                IDEIAS EM MOVIMENTO
              </span>
              <p className="mt-2 max-w-md text-[24px] leading-tight font-semibold text-white sm:text-[30px]">
                A ferramenta certa muda o ritmo.
              </p>
              <span className="mt-2 block text-[12px] text-white/80">
                Um espaço comum para criar coisas extraordinárias.
              </span>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-[236px] shrink-0 flex-col border-r border-soft bg-sidebar px-[14px] py-[22px] md:flex">
        <div className="px-2">
          <Brand compact />
        </div>
        <p className="mb-2 mt-10 px-2 text-[10px] text-ghost">EQUIPAMENTOS</p>
        <nav aria-label="Navegação principal">
          <span
            aria-current="page"
            className="flex h-10 items-center gap-2.5 rounded-control bg-panel px-2.5 text-[13px] text-foreground shadow-[inset_2px_0_0_var(--accent-500)]"
          >
            <i className="ph-fill ph-squares-four text-[16px] text-accent-400" aria-hidden="true" />
            Catálogo
          </span>
        </nav>
        <div className="mt-auto border-t border-soft pt-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
            <i className="ph ph-info text-[16px] text-accent-400" aria-hidden="true" />
            Modo de demonstração
          </div>
          <p className="mt-2 text-[12px] leading-5 text-muted">
            Pedidos locais, sem persistência.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-soft px-4 sm:px-6 lg:px-7">
          <div className="flex min-w-0 items-center gap-2 text-[13px]">
            <span className="hidden text-muted sm:inline">EmprestAI</span>
            <i className="ph ph-caret-right hidden text-[13px] text-faint sm:block" aria-hidden="true" />
            <span className="truncate font-semibold text-foreground">Catálogo</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-[12px] text-muted sm:inline">
              Demonstração
            </span>
            <span className="grid size-9 place-items-center rounded-pill bg-accent-800 text-[13px] font-semibold text-accent-200">
              {email ? email.slice(0, 1).toUpperCase() : "D"}
            </span>
            <button
              className="inline-flex min-h-9 items-center gap-2 rounded-control border border-strong px-3 text-[12px] text-muted transition-colors duration-[120ms] hover:border-frame hover:bg-sunken hover:text-foreground active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 motion-reduce:transition-none"
              onClick={leaveDemo}
              type="button"
            >
              Sair
              <i className="ph ph-arrow-up-right text-[15px]" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
          <div className="mb-7 flex items-start gap-3 rounded-control border border-accent-700 bg-[image:var(--gradient-notice)] px-4 py-3">
            <i className="ph ph-info mt-0.5 text-[17px] text-accent-400" aria-hidden="true" />
            <p className="text-[12px] leading-5 text-muted">
              Esta é uma demonstração. Dados e pedidos são locais e não ficam salvos.
            </p>
          </div>

          <section className="flex flex-col justify-between gap-5 border-b border-soft pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[11px] font-semibold text-accent-400">
                EQUIPAMENTOS INTERNOS
              </p>
              <h1 className="text-[24px] leading-tight font-semibold text-foreground">
                Catálogo de equipamentos
              </h1>
              <p className="mt-2 max-w-xl text-[13px] leading-5 text-muted [text-wrap:pretty]">
                Encontre ferramentas compartilhadas para o seu próximo projeto.
              </p>
            </div>
            <div className="flex items-center gap-3 sm:pb-1">
              <span className="text-[26px] leading-none font-semibold text-accent-300">
                {equipment.filter((item) => item.status === "Disponível").length
                  .toString()
                  .padStart(2, "0")}
              </span>
              <span className="text-[12px] leading-5 text-muted">
                disponíveis
                <br />
                agora no catálogo
              </span>
            </div>
          </section>

          <section className="flex flex-col gap-4 border-b border-soft py-5" aria-label="Filtros do catálogo">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
              {categories.map((category) => {
                const selected = categoryFilter === category;
                return (
                  <button
                    aria-pressed={selected}
                    className={`min-h-[30px] rounded-pill border px-3 text-[12px] transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 motion-reduce:transition-none ${selected ? "border-accent-700 bg-accent-800 text-accent-200" : "border-frame bg-transparent text-muted hover:bg-sunken hover:text-foreground"}`}
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    type="button"
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="flex h-9 w-full items-center gap-2.5 rounded-control border border-strong bg-sunken px-3 text-muted focus-within:border-accent-500 lg:max-w-[360px]">
                <i className="ph ph-magnifying-glass text-[16px]" aria-hidden="true" />
                <span className="sr-only">Buscar equipamentos</span>
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-faint"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar equipamento"
                  type="search"
                  value={search}
                />
              </label>

              <div
                aria-label="Filtrar por situação"
                className="flex w-full overflow-x-auto rounded-control border border-strong lg:w-auto"
                role="radiogroup"
              >
                {statuses.map((status, index) => {
                  const selected = statusFilter === status;
                  return (
                    <button
                      aria-checked={selected}
                      className={`min-h-9 flex-1 whitespace-nowrap px-3 text-[12px] transition-colors duration-[120ms] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent-500 motion-reduce:transition-none lg:flex-none lg:px-4 ${index > 0 ? "border-l border-strong" : ""} ${selected ? "bg-accent-800 text-accent-200" : "text-muted hover:bg-sunken hover:text-foreground"}`}
                      id={`status-filter-${index}`}
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      onKeyDown={(event) => moveStatusSelection(event, index)}
                      role="radio"
                      tabIndex={selected ? 0 : -1}
                      type="button"
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="flex items-baseline justify-between gap-4 py-5">
            <h2 className="text-[17px] font-semibold text-foreground">
              Equipamentos
            </h2>
            <span className="text-[11px] text-faint">
              {filteredEquipment.length.toString().padStart(2, "0")} ITENS
            </span>
          </div>

          {feedback && (
            <p
              className="mb-4 flex items-center gap-2 rounded-control border border-available/35 bg-available/10 px-4 py-3 text-[13px] text-available"
              role="status"
            >
              <i className="ph ph-check-circle text-[17px]" aria-hidden="true" />
              {feedback}
            </p>
          )}

          {filteredEquipment.length > 0 ? (
            <section
              aria-label="Lista de equipamentos"
              className="grid grid-cols-1 gap-3 pb-8 sm:grid-cols-2 xl:grid-cols-4"
            >
              {filteredEquipment.map((item) => {
                const requested = requestedIds.includes(item.id);
                const available = item.status === "Disponível";

                return (
                  <article
                    className="flex min-w-0 flex-col gap-3 rounded-card border border-card bg-panel p-4 transition-colors duration-[160ms] hover:border-accent-600 motion-reduce:transition-none"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-item bg-sunken text-accent-400">
                        <i className={`ph ${item.icon} text-[20px]`} aria-hidden="true" />
                      </span>
                      <StatusPill status={item.status} />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2 text-[12px] text-dim">
                        <span>{item.category}</span>
                        <span>{item.id}</span>
                      </div>
                      <h3 className="min-h-10 text-[14px] leading-5 font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <p className="mt-1 min-h-9 text-[12px] leading-[18px] text-muted">
                        {item.detail}
                      </p>
                    </div>
                    <div className="mt-auto flex min-h-9 items-center justify-between gap-2 border-t border-row pt-3">
                      <span className="text-[12px] text-dim">
                        {available
                          ? "Retirada com Operações"
                          : item.status === "Emprestado"
                            ? "Indisponível"
                            : "Em revisão"}
                      </span>
                      {available ? (
                        <button
                          className={`inline-flex min-h-[30px] shrink-0 items-center gap-1.5 rounded-control border px-2.5 text-[12px] font-semibold transition-colors duration-[140ms] active:translate-y-px active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 motion-reduce:transition-none ${requested ? "border-accent-500 bg-accent-500/12 text-accent-200 opacity-[0.45]" : "border-accent-500 bg-transparent text-accent-300 hover:bg-accent-500/12 hover:text-accent-100"}`}
                          disabled={requested}
                          onClick={() => requestEquipment(item.id, item.name)}
                          type="button"
                        >
                          {requested ? "Pedido enviado" : "Solicitar"}
                          {!requested && (
                            <i className="ph ph-arrow-right text-[14px]" aria-hidden="true" />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <div className="grid min-h-56 justify-items-center content-center border-t border-soft text-center">
              <span className="text-[11px] font-semibold text-faint">
                SEM RESULTADOS
              </span>
              <p className="mt-2 text-[14px] text-muted">
                Nenhum equipamento corresponde a esses filtros.
              </p>
              <button
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-control px-3 text-[13px] font-semibold text-accent-300 hover:bg-sunken hover:text-accent-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                onClick={() => {
                  setCategoryFilter("Todos");
                  setStatusFilter("Todos");
                  setSearch("");
                }}
                type="button"
              >
                Limpar filtros
                <i className="ph ph-arrow-right text-[15px]" aria-hidden="true" />
              </button>
            </div>
          )}

          <footer className="mt-auto flex flex-wrap justify-between gap-2 border-t border-soft pt-4 text-[10px] text-faint">
            <span>EMPRESTAI · OPERAÇÕES INTERNAS</span>
            <span>VERSÃO DE DEMONSTRAÇÃO</span>
          </footer>
        </main>
      </div>
    </div>
  );
}