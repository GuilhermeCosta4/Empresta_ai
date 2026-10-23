"use client";

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
      <main className="min-h-svh bg-page text-foreground md:grid md:grid-cols-[36.5%_1fr]">
        <section className="flex min-h-[300px] flex-col justify-between bg-[image:var(--gradient-login)] px-7 py-7 sm:min-h-[340px] sm:px-10 sm:py-9 md:min-h-svh md:px-[10%] md:py-[60px]">
          <a
            aria-label="EmpresTI início"
            className="inline-flex w-fit items-center gap-2.5 text-[17px] font-semibold text-foreground"
            href="#inicio"
            onClick={(event) => event.preventDefault()}
          >
            <span className="grid size-[38px] place-items-center rounded-control border border-accent-700 text-accent-300">
              <i className="ph ph-package text-[19px]" aria-hidden="true" />
            </span>
            EmpresTI
          </a>

          <div className="my-12 max-w-[440px] md:my-auto md:py-16">
            <h1 className="text-[28px] leading-[1.2] font-semibold text-foreground sm:text-[32px]">
              Quem está com o quê
            </h1>
            <p className="mt-4 text-[14px] leading-6 text-muted sm:text-[15px]">
              Pedido e devolução sem planilha.
            </p>
            <div className="my-6 h-px w-full bg-[linear-gradient(to_right,rgba(230,234,246,0),#222c4a_48px,#222c4a_calc(100%-48px),rgba(230,234,246,0))]" />
            <div className="flex gap-10 sm:gap-14">
              <div>
                <p className="text-[24px] leading-none font-semibold text-foreground">
                  3
                </p>
                <p className="mt-2 text-[12px] text-muted">itens por pessoa</p>
              </div>
              <div>
                <p className="text-[24px] leading-none font-semibold text-foreground">
                  14
                </p>
                <p className="mt-2 text-[12px] text-muted">dias de prazo</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[500px] items-center justify-center px-6 py-14 md:min-h-svh md:px-10">
          <div className="w-full max-w-[388px]">
            <h2 className="text-[24px] leading-[1.2] font-semibold text-foreground">
              Entrar
            </h2>
            <p className="mt-2 text-[13px] text-muted">
              E-mail e senha do convite.
            </p>

            <form className="mt-5 flex flex-col" onSubmit={enterDemo}>
              <label className="mb-2 text-[12px] text-muted" htmlFor="email">
                E-mail
              </label>
              <input
                autoComplete="email"
                className="h-[42px] rounded-control border border-strong bg-sunken px-3 text-[14px] text-foreground placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@empresa.com"
                required
                type="email"
                value={email}
              />

              <label className="mb-2 mt-5 text-[12px] text-muted" htmlFor="password">
                Senha
              </label>
              <input
                autoComplete="current-password"
                className="h-[42px] rounded-control border border-strong bg-sunken px-3 text-[14px] text-foreground placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
              />

              <button
                className="mt-5 flex h-[46px] items-center justify-center gap-2 rounded-control border border-accent-500 bg-transparent text-[13px] font-semibold text-accent-300 transition-colors duration-[140ms] hover:bg-accent-500/12 hover:text-accent-100 active:translate-y-px active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 motion-reduce:transition-none"
                type="submit"
              >
                Entrar
                <i className="ph ph-arrow-right text-[16px]" aria-hidden="true" />
              </button>
            </form>

            <p className="mt-5 flex min-h-9 items-center justify-center rounded-control bg-[image:var(--gradient-notice)] px-3 text-center text-[11px] text-muted">
              Sem acesso? Fale com Operações.
            </p>
            <button
              className="mt-3 min-h-9 w-full text-[12px] text-faint underline-offset-4 hover:text-accent-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
              onClick={() => enterDemo()}
              type="button"
            >
              Explorar sem entrar
            </button>
          </div>
        </section>
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