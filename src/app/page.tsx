"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

const equipment = [
  {
    id: "EQ-014",
    name: "Notebook ultraleve",
    detail: "14 pol. · 16 GB · USB-C",
    category: "Computadores",
    status: "Disponível",
    image: "/images/equipment/laptop.jpg",
    imageAlt: "Notebook aberto sobre uma mesa de trabalho",
    tone: "sage",
  },
  {
    id: "EQ-021",
    name: "Monitor Studio",
    detail: "27 pol. · 4K · USB-C",
    category: "Monitores",
    status: "Disponível",
    image: "/images/equipment/monitor.jpg",
    imageAlt: "Monitor de computador em uma estação de trabalho",
    tone: "peach",
  },
  {
    id: "EQ-008",
    name: "Fone com cancelamento de ruído",
    detail: "Bluetooth · over-ear · estojo",
    category: "Áudio",
    status: "Emprestado",
    image: "/images/equipment/headphones.jpg",
    imageAlt: "Fones de ouvido sem fio",
    tone: "lilac",
  },
  {
    id: "EQ-032",
    name: "Câmera mirrorless",
    detail: "4K · lente 18–55 mm · bolsa",
    category: "Imagem",
    status: "Disponível",
    image: "/images/equipment/camera.jpg",
    imageAlt: "Câmera digital com lente intercambiável",
    tone: "blue",
  },
  {
    id: "EQ-019",
    name: "Notebook de performance",
    detail: "16 pol. · 32 GB · GPU dedicada",
    category: "Computadores",
    status: "Em manutenção",
    image: "/images/equipment/laptop.jpg",
    imageAlt: "Notebook aberto em um ambiente de trabalho",
    tone: "peach",
  },
  {
    id: "EQ-006",
    name: "Fone de estúdio",
    detail: "Com fio · almofadas extra · estojo",
    category: "Áudio",
    status: "Disponível",
    image: "/images/equipment/headphones.jpg",
    imageAlt: "Fones de ouvido para uso em estúdio",
    tone: "sage",
  },
  {
    id: "EQ-013",
    name: "Monitor de criação",
    detail: "24 pol. · QHD · ajuste de altura",
    category: "Monitores",
    status: "Emprestado",
    image: "/images/equipment/monitor.jpg",
    imageAlt: "Monitor de alta resolução em uma mesa",
    tone: "blue",
  },
  {
    id: "EQ-042",
    name: "Câmera para reuniões",
    detail: "4K · foco automático · tripé",
    category: "Imagem",
    status: "Disponível",
    image: "/images/equipment/camera.jpg",
    imageAlt: "Câmera digital pronta para gravação",
    tone: "lilac",
  },
] as const;

type CategoryFilter = "Todos" | (typeof equipment)[number]["category"];
type StatusFilter = "Todos" | (typeof equipment)[number]["status"];

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

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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

  if (view === "login") {
    return (
      <main className="login-screen">
        <header className="login-topbar">
          <a
            className="brand-lockup"
            href="#inicio"
            onClick={(event) => event.preventDefault()}
            aria-label="EmprestAI início"
          >
            <span className="brand-symbol" aria-hidden="true">
              e
            </span>
            <span>emprestai</span>
          </a>
          <span className="environment-label">
            <span className="environment-dot" />
            AMBIENTE DE DEMONSTRAÇÃO
          </span>
        </header>

        <section className="login-layout" id="inicio">
          <div className="login-content">
            <div className="login-kicker">
              <span className="kicker-line" />
              EQUIPAMENTOS INTERNOS
            </div>
            <h1>
              Bom trabalho
              <br />
              começa com
              <br />
              <em>boas ferramentas.</em>
            </h1>
            <p className="login-description">
              Entre para explorar os equipamentos disponíveis para o seu
              próximo projeto.
            </p>

            <form className="login-form" onSubmit={enterDemo}>
              <label htmlFor="email">E-mail de trabalho</label>
              <input
                autoComplete="email"
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@empresa.com.br"
                required
                type="email"
                value={email}
              />

              <div className="password-label-row">
                <label htmlFor="password">Senha</label>
                <span>Somente demonstração</span>
              </div>
              <input
                autoComplete="current-password"
                id="password"
                name="password"
                placeholder="••••••••••"
                required
                type="password"
              />

              <button className="primary-button login-submit" type="submit">
                Entrar no catálogo <span aria-hidden="true">↗</span>
              </button>
            </form>

            <div className="login-divider">
              <span />
              <span>ou</span>
              <span />
            </div>

            <button
              className="text-button demo-entry"
              onClick={() => enterDemo()}
              type="button"
            >
              Explorar sem entrar <span aria-hidden="true">→</span>
            </button>
            <p className="login-footnote">
              Entrada visual apenas. Nenhuma credencial é verificada.
            </p>
          </div>

          <aside className="login-visual" aria-label="Equipamentos de trabalho">
            <Image
              alt="Câmera digital pronta para um projeto criativo"
              className="login-photo"
              fill
              sizes="(max-width: 760px) 100vw, 50vw"
              src="/images/equipment/camera.jpg"
            />
            <div className="login-photo-shade" />
            <div className="photo-topline">
              <span>01 / 04</span>
              <span>FEITO PARA COMPARTILHAR</span>
            </div>
            <div className="photo-caption">
              <span className="caption-tag">IDEIAS EM MOVIMENTO</span>
              <p>
                A ferramenta certa
                <br />
                muda o ritmo.
              </p>
              <span className="photo-caption-note">
                Um espaço comum para criar coisas extraordinárias.
              </span>
            </div>
            <span className="photo-index" aria-hidden="true">
              E—01
            </span>
          </aside>
        </section>

        <footer className="login-footer">
          <span>EMPRESTAI · OPERAÇÕES INTERNAS</span>
          <span>CATÁLOGO DE EQUIPAMENTOS</span>
        </footer>
      </main>
    );
  }

  return (
    <main className="catalog-screen">
      <div className="demo-banner">
        <span>DEMONSTRAÇÃO</span>
        <span>Dados e pedidos são locais e não ficam salvos.</span>
        <button className="banner-exit" onClick={leaveDemo} type="button">
          Sair da demonstração <span aria-hidden="true">↗</span>
        </button>
      </div>

      <header className="catalog-header">
        <a
          className="brand-lockup catalog-brand"
          href="#catalogo"
          onClick={(event) => event.preventDefault()}
          aria-label="EmprestAI catálogo"
        >
          <span className="brand-symbol" aria-hidden="true">
            e
          </span>
          <span>emprestai</span>
        </a>
        <nav className="catalog-nav" aria-label="Navegação principal">
          <span className="nav-current">Catálogo</span>
          <span className="nav-muted">Equipamentos internos</span>
        </nav>
        <div className="profile-summary">
          <span className="profile-avatar" aria-hidden="true">
            {email ? email.slice(0, 1).toUpperCase() : "D"}
          </span>
          <span className="profile-label">Demonstração</span>
        </div>
      </header>

      <div className="catalog-content" id="catalogo">
        <section className="catalog-intro">
          <div>
            <div className="login-kicker catalog-kicker">
              <span className="kicker-line" />
              O QUE VOCÊ PRECISA HOJE?
            </div>
            <h1>
              Boas ideias
              <br />
              <em>pedem boas ferramentas.</em>
            </h1>
            <p className="catalog-description">
              Equipamentos compartilhados, prontos para entrar no seu próximo
              projeto.
            </p>
          </div>
          <div className="availability-note">
            <span className="availability-number">
              {equipment.filter((item) => item.status === "Disponível").length
                .toString()
                .padStart(2, "0")}
            </span>
            <span>
              <strong>disponíveis</strong>
              <br />
              agora no catálogo
            </span>
          </div>
        </section>

        <section className="catalog-tools" aria-label="Filtros do catálogo">
          <div className="category-row" aria-label="Filtrar por categoria">
            {categories.map((category) => (
              <button
                aria-pressed={categoryFilter === category}
                className={`filter-chip ${categoryFilter === category ? "selected" : ""}`}
                key={category}
                onClick={() => setCategoryFilter(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="tool-row">
            <label className="search-control">
              <span className="search-mark" aria-hidden="true" />
              <span className="visually-hidden">Buscar equipamentos</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar equipamento"
                type="search"
                value={search}
              />
              <kbd>/</kbd>
            </label>
            <div className="status-filters" aria-label="Filtrar por situação">
              {statuses.map((status) => (
                <button
                  aria-pressed={statusFilter === status}
                  className={`status-filter ${statusFilter === status ? "selected" : ""}`}
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  type="button"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="results-heading">
          <h2>Equipamentos</h2>
          <span>
            {filteredEquipment.length.toString().padStart(2, "0")} ITENS
          </span>
        </div>

        {feedback && (
          <p className="demo-feedback" role="status">
            <span aria-hidden="true">✓</span> {feedback}
          </p>
        )}

        {filteredEquipment.length > 0 ? (
          <section className="equipment-grid" aria-label="Lista de equipamentos">
            {filteredEquipment.map((item) => {
              const requested = requestedIds.includes(item.id);
              const available = item.status === "Disponível";
              const statusClass =
                item.status === "Disponível"
                  ? "available"
                  : item.status === "Emprestado"
                    ? "loaned"
                    : "maintenance";

              return (
                <article className="equipment-card" key={item.id}>
                  <div className={`equipment-image ${item.tone}`}>
                    <Image
                      alt={item.imageAlt}
                      className="equipment-photo"
                      fill
                      loading={item.id === "EQ-014" ? "eager" : "lazy"}
                      sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
                      src={item.image}
                    />
                    <span className={`equipment-status ${statusClass}`}>
                      <span className="status-dot" />
                      {item.status}
                    </span>
                    <span className="equipment-id">{item.id}</span>
                  </div>
                  <div className="equipment-info">
                    <div className="equipment-meta">
                      <span>{item.category}</span>
                      <span>14 DIAS</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                    <div className="equipment-action-row">
                      <span className="pickup-note">Retirada com Operações</span>
                      {available ? (
                        <button
                          className={`request-button ${requested ? "requested" : ""}`}
                          disabled={requested}
                          onClick={() => requestEquipment(item.id, item.name)}
                          type="button"
                        >
                          {requested ? "Pedido enviado" : "Solicitar"}
                          {!requested && <span aria-hidden="true">↗</span>}
                        </button>
                      ) : (
                        <span className="unavailable-note">
                          {item.status === "Emprestado"
                            ? "Indisponível"
                            : "Em revisão"}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="empty-results">
            <span>SEM RESULTADOS</span>
            <p>Nenhum equipamento corresponde a esses filtros.</p>
            <button
              className="text-button"
              onClick={() => {
                setCategoryFilter("Todos");
                setStatusFilter("Todos");
                setSearch("");
              }}
              type="button"
            >
              Limpar filtros <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        <footer className="catalog-footer">
          <span>EMPRESTAI · OPERAÇÕES INTERNAS</span>
          <span>VERSÃO DE DEMONSTRAÇÃO</span>
        </footer>
      </div>
    </main>
  );
}