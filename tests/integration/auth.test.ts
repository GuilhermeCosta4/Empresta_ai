import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { createServer, request, type Server } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type Browser, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, Network, Wait, type StartedNetwork, type StartedTestContainer } from "testcontainers";
import { afterAll, beforeAll, expect, test } from "vitest";

const require = createRequire(import.meta.url);
const password = randomBytes(24).toString("hex");
const signingKey = randomBytes(40).toString("hex");
const memberEmail = "colaborador@example.test";
const outsiderEmail = "sem-vinculo@example.test";

let network: StartedNetwork | undefined;
let postgres: StartedPostgreSqlContainer | undefined;
let gotrue: StartedTestContainer | undefined;
let gateway: Server | undefined;
let browser: Browser | undefined;
let database: PrismaClient | undefined;
let app: ChildProcess | undefined;
let appUrl: string;
let appOutput = "";
let outsiderId: string;

function token(role: "anon" | "service_role") {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ role, exp: Math.floor(Date.now() / 1000) + 3600 });
  const data = `${header}.${payload}`;
  return `${data}.${createHmac("sha256", signingKey).update(data).digest("base64url")}`;
}

async function listen(server: Server) {
  await new Promise<void>((ready, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", ready);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Porta TCP indisponível.");
  return address.port;
}

async function close(server: Server) {
  await new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done()));
}

async function openLocalApp(authUrl: string, connection: string) {
  const reservation = createServer();
  const port = await listen(reservation);
  await close(reservation);
  appUrl = `http://127.0.0.1:${port}`;
  const next = require.resolve("next/dist/bin/next");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    __NEXT_PROCESSED_ENV: "true",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_SUPABASE_URL: authUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: token("anon"),
    DATABASE_URL: connection,
    DIRECT_URL: connection,
    VERCEL: "0",
  };
  execFileSync(process.execPath, [next, "build"], { env, stdio: "pipe", timeout: 100_000 });
  app = spawn(process.execPath, [next, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout?.on("data", (data) => { appOutput = (appOutput + data).slice(-5000); });
  app.stderr?.on("data", (data) => { appOutput = (appOutput + data).slice(-5000); });
  const deadline = Date.now() + 70_000;
  while (Date.now() < deadline) {
    if (app?.exitCode !== null) throw new Error(appOutput);
    try {
      if ((await fetch(appUrl, { signal: AbortSignal.timeout(3000) })).ok) return;
    } catch {
      // Next may still be compiling the initial route.
    }
    await delay(500);
  }
  throw new Error(`Next não iniciou a tempo. ${appOutput}`);
}

beforeAll(async () => {
  network = await new Network().start();
  const dbPassword = randomUUID();
  postgres = await new PostgreSqlContainer("postgres:16")
    .withDatabase("emprestai_auth_test")
    .withUsername("postgres")
    .withPassword(dbPassword)
    .withNetwork(network)
    .withNetworkAliases("auth-db")
    .start();
  const connection = new URL(postgres.getConnectionUri());
  if (!["localhost", "127.0.0.1", "[::1]"].includes(connection.hostname)) {
    throw new Error("A integração exige PostgreSQL descartável em loopback.");
  }

  database = new PrismaClient({ datasourceUrl: connection.toString() });
  await database.$executeRaw`CREATE SCHEMA auth`;
  execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy", "--schema", resolve("prisma/schema.prisma")], {
    cwd: tmpdir(),
    env: { ...process.env, DATABASE_URL: connection.toString(), DIRECT_URL: connection.toString() },
    stdio: "pipe",
  });

  gotrue = await new GenericContainer("supabase/gotrue:v2.185.0")
    .withNetwork(network)
    .withExposedPorts(9999)
    .withEnvironment({
      API_EXTERNAL_URL: "http://localhost:9999",
      GOTRUE_SITE_URL: "http://localhost:3000",
      GOTRUE_API_HOST: "0.0.0.0",
      GOTRUE_API_PORT: "9999",
      GOTRUE_DB_DRIVER: "postgres",
      GOTRUE_DB_DATABASE_URL: `postgresql://postgres:${dbPassword}@auth-db:5432/emprestai_auth_test?search_path=auth%2Cpublic`,
      GOTRUE_DB_NAMESPACE: "auth",
      GOTRUE_DB_AUTOMIGRATE: "true",
      GOTRUE_JWT_SECRET: signingKey,
      GOTRUE_JWT_AUD: "authenticated",
      GOTRUE_JWT_DEFAULT_GROUP_NAME: "authenticated",
      GOTRUE_JWT_ADMIN_ROLES: "service_role",
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true",
      GOTRUE_DISABLE_SIGNUP: "true",
    })
    .withWaitStrategy(Wait.forHttp("/health", 9999))
    .start();
  const authPort = gotrue.getMappedPort(9999);

  // The managed gateway supplies /auth/v1. The standalone Auth image serves the same API at /.
  gateway = createServer((req, res) => {
    if (!req.url?.startsWith("/auth/v1/")) {
      res.writeHead(404).end();
      return;
    }
    const upstream = request({
      hostname: "127.0.0.1",
      port: authPort,
      path: req.url.slice("/auth/v1".length),
      method: req.method,
      headers: req.headers,
    }, (reply) => {
      res.writeHead(reply.statusCode ?? 502, reply.headers);
      reply.pipe(res);
    });
    upstream.on("error", () => res.writeHead(502).end());
    req.pipe(upstream);
  });
  const authUrl = `http://127.0.0.1:${await listen(gateway)}`;
  const admin = createClient(authUrl, token("service_role"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.createUser({ email: memberEmail, password, email_confirm: true });
  if (error || !data.user) throw new Error(`Conta local indisponível: ${error?.message}`);
  const outsider = await admin.auth.admin.createUser({ email: outsiderEmail, password, email_confirm: true });
  if (outsider.error || !outsider.data.user) throw new Error("Conta local sem vínculo indisponível.");
  outsiderId = outsider.data.user.id;
  const tenant = await database.tenant.create({ data: { slug: "suporte_ti", name: "Suporte TI" } });
  await database.membership.create({ data: { tenantId: tenant.id, userId: data.user.id, role: "colaborador" } });
  execFileSync(process.execPath, [resolve("prisma/seed.mjs")], {
    env: { ...process.env, DATABASE_URL: connection.toString(), SUPABASE_TEACHER_USER_ID: data.user.id },
    stdio: "pipe",
  });
  await prepareLoanFixtures(database);
  await openLocalApp(authUrl, connection.toString());
  browser = await chromium.launch();
}, 230_000);

afterAll(async () => {
  await browser?.close();
  if (app?.pid && app.exitCode === null) {
    if (process.platform === "win32") {
      try {
        execFileSync("taskkill", ["/pid", String(app.pid), "/t", "/f"], { stdio: "ignore" });
      } catch {
        if (app.exitCode === null) app.kill();
      }
    } else {
      app.kill();
    }
  }
  if (gateway) await close(gateway);
  await database?.$disconnect();
  await gotrue?.stop();
  await postgres?.stop();
  await network?.stop();
}, 45_000);

async function fillLogin(page: Page, email: string, credential: string) {
  await page.goto(appUrl);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(credential);
  const [response] = await Promise.all([
    page.waitForResponse((item) => item.url().endsWith("/api/trpc/auth.login")),
    page.getByRole("button", { name: "Entrar", exact: true }).click(),
  ]);
  return response.status();
}

test("CA-01 authenticates a linked user with HttpOnly cookies and clears the session on logout", async () => {
  const page = await browser!.newPage();
  try {
    const first = await page.request.get(appUrl);
    const second = await page.request.get(appUrl);
    const policy = first.headers()["content-security-policy"];
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(policy).not.toContain("'unsafe-inline'");
    expect(second.headers()["content-security-policy"]).not.toContain(`'nonce-${nonce}'`);
    expect(await first.text()).toContain(`nonce="${nonce}"`);
    expect(await fillLogin(page, memberEmail, password)).toBe(200);
    await page.waitForURL(`${appUrl}/inicio`);
    await page.getByText("12 de 12 equipamentos carregados").waitFor();
    expect(await page.getByText(memberEmail).isVisible()).toBe(true);
    const authCookies = (await page.context().cookies()).filter(({ name }) => name.startsWith("emprestai-auth"));
    expect(authCookies.length).toBeGreaterThan(0);
    expect(authCookies.every(({ httpOnly, sameSite }) => httpOnly && sameSite === "Lax")).toBe(true);
    await page.reload();
    expect(await page.getByText(memberEmail).isVisible()).toBe(true);
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await page.waitForURL(`${appUrl}/`);
    expect((await page.context().cookies()).some(({ name }) => name.startsWith("emprestai-auth"))).toBe(false);
    await page.goto(`${appUrl}/inicio`);
    expect(page.url()).toBe(`${appUrl}/`);
  } finally {
    await page.close();
  }
}, 45_000);

test("CA-01 rejects invalid credentials, absent sessions and users without a membership", async () => {
  const page = await browser!.newPage();
  try {
    await page.goto(`${appUrl}/inicio`);
    expect(page.url()).toBe(`${appUrl}/`);
    for (const [email, credential] of [[memberEmail, randomUUID()], [outsiderEmail, password]]) {
      expect(await fillLogin(page, email, credential)).toBe(401);
      await page.getByText("E-mail, senha ou acesso inválido.", { exact: true }).waitFor();
      expect((await page.context().cookies()).some(({ name }) => name.startsWith("emprestai-auth"))).toBe(false);
    }
  } finally {
    await page.close();
  }
}, 45_000);

test("CA-01 rejects cross-origin login and enforces the database account limit", async () => {
  async function attempt(origin: string) {
    return fetch(`${appUrl}/api/trpc/auth.login`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ json: { email: "limit@example.test", password: randomUUID() } }),
    });
  }
  expect((await attempt("https://outra-origem.example")).status).toBe(403);
  for (let count = 0; count < 5; count++) {
    expect((await attempt(appUrl)).status).toBe(401);
  }
  expect((await attempt(appUrl)).status).toBe(429);
}, 45_000);

async function prepareLoanFixtures(database: PrismaClient) {
  const tenant = await database.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } });
  const other = await database.tenant.create({ data: { slug: "outro_tenant", name: "Outro tenant" } });
  await database.equipment.create({
    data: { tenantId: other.id, assetTag: "TI-9000", name: "Equipamento externo", category: "cabo", imagePath: "equipment/TI-9000.jpg" },
  });
  const membership = await database.membership.findFirstOrThrow({ where: { tenantId: tenant.id } });
  for (const assetTag of ["TI-0001", "TI-0004"]) {
    const item = await database.equipment.findUniqueOrThrow({ where: { tenantId_assetTag: { tenantId: tenant.id, assetTag } } });
    await database.loan.create({
      data: { tenantId: tenant.id, equipmentId: item.id, borrowerMembershipId: membership.id, dueAt: new Date(Date.now() + 86_400_000) },
    });
  }
  const returnedItem = await database.equipment.findUniqueOrThrow({
    where: { tenantId_assetTag: { tenantId: tenant.id, assetTag: "TI-0002" } },
  });
  await database.loan.create({
    data: {
      tenantId: tenant.id,
      equipmentId: returnedItem.id,
      borrowerMembershipId: membership.id,
      startedAt: new Date("2026-01-01T12:00:00Z"),
      dueAt: new Date("2026-01-15T12:00:00Z"),
      returnedAt: new Date("2026-01-02T12:00:00Z"),
      returnedByMembershipId: membership.id,
    },
  });
}

test("Catálogo CA-01, CA-02 e CA-03 lista o tenant da sessão, filtra os cartões e trata fotos ausentes", async () => {
  const page = await browser!.newPage({ bypassCSP: true });
  try {
    expect((await page.request.get(`${appUrl}/api/trpc/catalog.list`)).status()).toBe(401);
    await page.goto(`${appUrl}/inicio`);
    expect(page.url()).toBe(`${appUrl}/`);
    await page.route("**/storage/v1/object/public/equipment-images/equipment/*.jpg", async (route) => {
      if (route.request().url().endsWith("TI-0012.jpg")) {
        await route.fulfill({ status: 404 });
      } else {
        await route.fulfill({ path: resolve("public/images/equipment/TI-0001.jpg"), contentType: "image/jpeg" });
      }
    });
    expect(await fillLogin(page, memberEmail, password)).toBe(200);
    await page.getByText("12 de 12 equipamentos carregados").waitFor();
    const cards = page.getByRole("article");
    const card = (tag: string) => cards.filter({ hasText: tag });
    expect(await cards.count()).toBe(12);
    expect(await card("TI-9000").count()).toBe(0);
    expect(await card("TI-0001").getByText("Emprestado", { exact: true }).isVisible()).toBe(true);
    expect(await card("TI-0002").getByText("Disponível", { exact: true }).isVisible()).toBe(true);
    expect(await card("TI-0001").getByRole("heading", { name: "Notebook 14 polegadas" }).isVisible()).toBe(true);
    expect(await card("TI-0001").getByText("Notebook · TI-0001", { exact: true }).isVisible()).toBe(true);
    for (const tag of ["TI-0004", "TI-0007", "TI-0010"]) {
      expect(await card(tag).getByText("Em manutenção", { exact: true }).isVisible()).toBe(true);
    }
    expect(await card("TI-0001").locator("img").getAttribute("src")).toContain("/equipment-images/equipment/TI-0001.jpg");
    await card("TI-0012").getByText("Foto indisponível").waitFor();
    expect(await page.getByRole("link", { name: "Fotos: Pixabay" }).getAttribute("href")).toBe("https://pixabay.com/");
    await page.getByLabel("Situação").selectOption("Em manutenção");
    await page.getByText("3 de 12 equipamentos carregados").waitFor();
    await page.getByLabel("Categoria").selectOption("monitor");
    await page.getByText("1 de 12 equipamentos carregados").waitFor();
    expect(await card("TI-0007").isVisible()).toBe(true);
    await page.getByLabel("Situação").selectOption("");
    await page.getByLabel("Categoria").selectOption("");
    const search = page.getByLabel("Buscar equipamentos");
    await search.fill("camera compacta");
    await page.getByText("1 de 12 equipamentos carregados").waitFor();
    expect(await card("TI-0012").isVisible()).toBe(true);
    await search.fill("ti-0006");
    await card("TI-0006").waitFor();
    expect(await cards.count()).toBe(1);
    await search.fill("camera");
    await page.getByText("2 de 12 equipamentos carregados").waitFor();
    expect(await card("TI-0011").isVisible()).toBe(true);
    expect(await card("TI-0012").isVisible()).toBe(true);
  } finally {
    await page.close();
  }
}, 45_000);

test("Empréstimo CA-01, CA-02, CA-03 e CA-04 registra, isola e serializa solicitações", async () => {
  if (!database) throw new Error("Banco descartável indisponível.");
  const tenant = await database.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } });
  const member = await database.membership.create({
    data: { tenantId: tenant.id, userId: outsiderId, role: "colaborador" },
  });
  const page = await browser!.newPage();
  const other = await browser!.newPage();
  const submit = (actor: Page, assetTag: string) => actor.request.post(`${appUrl}/api/trpc/loans.request`, {
    headers: { origin: appUrl },
    data: { json: { assetTag } },
  });
  try {
    expect((await submit(page, "TI-0003")).status()).toBe(401);
    expect(await fillLogin(page, outsiderEmail, password)).toBe(200);
    expect(await fillLogin(other, memberEmail, password)).toBe(200);
    const otherMine = other.getByRole("region", { name: "Meus empréstimos" });
    await otherMine.getByText(/TI-0001/).waitFor();
    expect(await otherMine.getByText(/TI-0002/).count()).toBe(0);
    const externalItem = await database.equipment.findFirstOrThrow({ where: { assetTag: "TI-9000" } });
    const externalMembership = await database.membership.create({
      data: { tenantId: externalItem.tenantId, userId: outsiderId, role: "colaborador" },
    });
    await database.loan.create({
      data: { tenantId: externalItem.tenantId, equipmentId: externalItem.id, borrowerMembershipId: externalMembership.id, dueAt: new Date(Date.now() + 86_400_000) },
    });
    await page.reload();
    const mine = page.getByRole("region", { name: "Meus empréstimos" });
    await mine.getByText("Você não tem empréstimos em aberto.").waitFor();
    const card = (tag: string) => page.getByRole("article").filter({ hasText: tag });
    expect(await card("TI-0007").getByRole("button", { name: "Solicitar" }).count()).toBe(0);
    const maintenance = await submit(page, "TI-0007");
    expect(maintenance.status()).toBe(409);
    expect(await maintenance.text()).toContain("em manutenção");
    expect((await submit(page, "TI-9000")).status()).toBe(404);
    await database.$executeRaw`ALTER TABLE audit_events ADD CONSTRAINT test_reject_loan_audit CHECK (action <> 'loan.created')`;
    try {
      expect((await submit(page, "TI-0003")).status()).toBe(500);
      expect(await database.loan.count({ where: { borrowerMembershipId: member.id } })).toBe(0);
    } finally {
      await database.$executeRaw`ALTER TABLE audit_events DROP CONSTRAINT test_reject_loan_audit`;
    }
    await card("TI-0003").getByRole("button", { name: "Solicitar" }).click();
    await card("TI-0003").getByText("Emprestado", { exact: true }).waitFor();
    await mine.getByText("Devolver até", { exact: false }).waitFor();
    expect(await mine.getByText(/TI-0001|TI-0004/).count()).toBe(0);
    const loan = await database.loan.findFirstOrThrow({ where: { borrowerMembershipId: member.id } });
    expect(loan.dueAt.getTime() - loan.startedAt.getTime()).toBe(14 * 86_400_000);
    expect(await mine.locator("time").getAttribute("datetime")).toBe(loan.dueAt.toISOString());
    expect(await mine.locator("time").textContent()).toBe(new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
    }).format(loan.dueAt));
    expect(await database.auditEvent.count({ where: { tenantId: tenant.id, actorMembershipId: member.id, resourceId: loan.id, action: "loan.created" } })).toBe(1);
    const unavailable = await submit(other, "TI-0003");
    expect(unavailable.status()).toBe(409);
    expect(await unavailable.text()).toContain("já está emprestado");

    const sameItem = await Promise.all([submit(page, "TI-0005"), submit(other, "TI-0005")]);
    expect(sameItem.map((response) => response.status()).sort()).toEqual([200, 409]);
    expect(await database.loan.count({ where: { returnedAt: null, equipment: { assetTag: "TI-0005" } } })).toBe(1);
    if (sameItem[0].status() === 409) expect((await submit(page, "TI-0006")).status()).toBe(200);

    const sameBorrower = await Promise.all([submit(page, "TI-0008"), submit(page, "TI-0009")]);
    expect(sameBorrower.map((response) => response.status()).sort()).toEqual([200, 409]);
    expect(await database.loan.count({ where: { borrowerMembershipId: member.id, returnedAt: null } })).toBe(3);
    await card("TI-0011").getByRole("button", { name: "Solicitar" }).click();
    await page.getByRole("alert").filter({ hasText: "Você já tem 3 empréstimos em aberto." }).waitFor();

    await database.loan.update({
      where: { id: loan.id },
      data: { startedAt: new Date("2026-01-01T12:00:00Z"), dueAt: new Date("2026-01-15T12:00:00Z") },
    });
    await card("TI-0011").getByRole("button", { name: "Solicitar" }).click();
    await page.getByRole("alert").filter({ hasText: "Você tem um empréstimo em atraso." }).waitFor();
  } finally {
    await page.close();
    await other.close();
  }
}, 45_000);
