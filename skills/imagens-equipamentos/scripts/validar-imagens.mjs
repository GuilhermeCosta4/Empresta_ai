import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = process.cwd();
const skillRoot = path.join(root, "skills", "imagens-equipamentos");
const equipmentPath = path.join(skillRoot, "assets", "equipamentos.json");
const reviewPath = path.join(skillRoot, "assets", "revisao.json");
const outputRoot = path.join(root, "public", "images", "equipment");
const manifestPath = path.join(outputRoot, "manifest.json");

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function validate() {
  const equipment = await readJson(equipmentPath);
  const review = await readJson(reviewPath);
  const manifest = await readJson(manifestPath);
  const expectedPatrimonios = equipment.map((item) => item.patrimonio);

  assert(equipment.length === 12, "A entrada precisa conter exatamente 12 equipamentos.");
  assert(Object.keys(review.aprovadas).length === 12, "A revisão precisa ter 12 aprovações.");
  assert(manifest.source === "Pixabay", "O manifesto precisa declarar Pixabay como fonte.");
  assert(manifest.attributionText === "Fotos: Pixabay", "O crédito padronizado está incorreto.");
  assert(manifest.images?.length === 12, "O manifesto precisa conter 12 imagens.");

  const ids = manifest.images.map((item) => item.pixabayId);
  assert(new Set(ids).size === ids.length, "Há um ID do Pixabay repetido.");

  const files = (await fs.readdir(outputRoot)).filter((name) => name.toLowerCase().endsWith(".jpg"));
  const expectedFiles = expectedPatrimonios.map((patrimonio) => `${patrimonio}.jpg`).sort();
  assert(
    JSON.stringify(files.sort()) === JSON.stringify(expectedFiles),
    "A pasta final deve conter somente os 12 JPEGs nomeados por patrimônio.",
  );

  for (const item of manifest.images) {
    assert(expectedPatrimonios.includes(item.patrimonio), `Patrimônio inesperado: ${item.patrimonio}.`);
    assert(item.contributor, `Crédito de fotógrafo ausente em ${item.patrimonio}.`);
    assert(item.contributorUrl?.startsWith("https://pixabay.com/users/"), `Perfil inválido em ${item.patrimonio}.`);
    assert(item.photoPageUrl?.startsWith("https://pixabay.com/"), `Página da foto inválida em ${item.patrimonio}.`);
    assert(item.licenseUrl === "https://pixabay.com/service/license-summary/", `Licença inválida em ${item.patrimonio}.`);

    const metadata = await sharp(path.join(outputRoot, item.filename)).metadata();
    assert(metadata.width === 800 && metadata.height === 600, `${item.filename} não tem 800 × 600.`);
    assert(metadata.format === "jpeg", `${item.filename} não é JPEG.`);
  }

  for (const rejection of review.rejeitadas) {
    assert(rejection.motivo?.trim(), "Toda rejeição precisa ter um motivo.");
  }

  console.log(`OK: ${manifest.images.length} imagens únicas, em 800 × 600, com créditos completos.`);
  console.log(`Reprovações visuais registradas: ${review.rejeitadas.length}.`);
}

try {
  await validate();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Falha inesperada na validação.");
  process.exitCode = 1;
}
