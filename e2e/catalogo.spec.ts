import { expect, test } from "@playwright/test";

test("CA-06 mantém o catálogo legível em viewport desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/demo");

  await page.getByLabel("E-mail").fill("pessoa@empresa.com");
  await page.getByLabel("Senha").fill("senha-local");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Catálogo de equipamentos" }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Buscar equipamentos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Notebook ultraleve" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("aplica os headers HTTP de segurança", async ({ request }) => {
  const response = await request.get("/");

  expect(response.headers()["content-security-policy"]).toContain(
    "default-src 'self'",
  );
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
  expect(response.headers()["permissions-policy"]).toBe(
    "camera=(), microphone=(), geolocation=()",
  );
});

test("Catálogo CA-03 permite imagens somente no caminho público do bucket configurado", async ({ request }) => {
  const response = await request.get("/");
  const csp = response.headers()["content-security-policy"];
  expect(csp.split("; ").find((directive) => directive.startsWith("img-src "))).toBe(
    "img-src 'self' blob: data: https://emprestai-test.supabase.co/storage/v1/object/public/equipment-images/",
  );
});
