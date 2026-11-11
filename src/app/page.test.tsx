import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import DemoPage from "./demo/page";

async function openCatalog() {
  const user = userEvent.setup();
  render(<DemoPage />);

  await user.type(screen.getByLabelText("E-mail"), "pessoa@empresa.com");
  await user.type(screen.getByLabelText("Senha"), "senha-local");
  await user.click(screen.getByRole("button", { name: "Entrar" }));

  return user;
}

describe("catálogo demonstrativo", () => {
  it("CA-01 distingue equipamentos disponíveis, emprestados e em manutenção", async () => {
    await openCatalog();

    expect(screen.getAllByText("Disponível").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Emprestado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Em manutenção").length).toBeGreaterThan(0);
  });

  it("CA-02 abre o catálogo em modo demonstrativo sem autenticação real", async () => {
    await openCatalog();

    expect(
      screen.getByRole("heading", { name: "Catálogo de equipamentos" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dados e pedidos são locais/i)).toBeInTheDocument();
  });

  it("CA-03 oferece solicitação somente para itens disponíveis", async () => {
    await openCatalog();

    const available = screen.getByRole("heading", { name: "Notebook ultraleve" }).closest("article");
    const borrowed = screen.getByRole("heading", { name: "Fone com cancelamento de ruído" }).closest("article");
    const maintenance = screen.getByRole("heading", { name: "Notebook de performance" }).closest("article");

    expect(available).not.toBeNull();
    expect(borrowed).not.toBeNull();
    expect(maintenance).not.toBeNull();
    expect(within(available!).getByRole("button", { name: /solicitar/i })).toBeInTheDocument();
    expect(within(borrowed!).queryByRole("button", { name: /solicitar/i })).not.toBeInTheDocument();
    expect(within(maintenance!).queryByRole("button", { name: /solicitar/i })).not.toBeInTheDocument();
  });

  it("CA-04 combina busca e filtros sobre a lista demonstrativa", async () => {
    const user = await openCatalog();

    await user.click(screen.getByRole("button", { name: "Computadores" }));
    await user.click(screen.getByRole("radio", { name: "Disponível" }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar equipamentos" }), "ultraleve");

    expect(screen.getByRole("heading", { name: "Notebook ultraleve" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Notebook de performance" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Monitor Studio" })).not.toBeInTheDocument();
  });

  it("CA-05 informa que a solicitação é local e não persistida", async () => {
    const user = await openCatalog();
    const available = screen.getByRole("heading", { name: "Notebook ultraleve" }).closest("article");

    expect(available).not.toBeNull();
    await user.click(within(available!).getByRole("button", { name: /solicitar/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Nada foi salvo");
    expect(within(available!).getByRole("button", { name: "Pedido enviado" })).toBeDisabled();
  });
});
