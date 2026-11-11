import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const cli = require.resolve("prisma/build/index.js");
const schema = fileURLToPath(new URL("./schema.prisma", import.meta.url));
const placeholder = "postgresql://localhost:5432/emprestai_codegen";

if (existsSync(new URL("./.env", import.meta.url))) {
  throw new Error("Remova prisma/.env antes de gerar o cliente isoladamente.");
}

// Client generation needs the schema only. Keep the CLI outside the project
// root so its dotenv discovery does not load the application's .env.
const output = execFileSync(process.execPath, [cli, "generate", "--schema", schema], {
  cwd: dirname(cli),
  env: { ...process.env, DATABASE_URL: placeholder, DIRECT_URL: placeholder },
  encoding: "utf8",
});
if (output.includes("Environment variables loaded")) {
  throw new Error("A geração do cliente carregou um arquivo de ambiente inesperado.");
}
process.stdout.write(output);
