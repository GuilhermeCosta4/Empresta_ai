import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = process.cwd();
const skillRoot = path.join(root, "skills", "imagens-equipamentos");
const equipmentPath = path.join(skillRoot, "assets", "equipamentos.json");
const reviewPath = path.join(skillRoot, "assets", "revisao.json");
const cacheRoot = path.join(root, ".cache", "imagens-equipamentos");
const candidatesPath = path.join(cacheRoot, "candidatos.json");
const outputRoot = path.join(root, "public", "images", "equipment");
const manifestPath = path.join(outputRoot, "manifest.json");
const licenseUrl = "https://pixabay.com/service/license-summary/";

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function requireApiKey() {
  const key = process.env.PIXABAY_API_KEY?.trim();
  if (!key) throw new Error("PIXABAY_API_KEY não está configurada em .env.local.");
  return key;
}

async function requestPixabay(parameters) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", requireApiKey());
  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, String(value));
  }

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`A API do Pixabay respondeu com HTTP ${response.status}.`);
  }
  return response.json();
}

function toCandidate(hit) {
  return {
    id: hit.id,
    pageUrl: hit.pageURL,
    previewUrl: hit.webformatURL,
    imageUrl: hit.largeImageURL || hit.webformatURL,
    width: hit.imageWidth,
    height: hit.imageHeight,
    contributor: hit.user,
    contributorUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
  };
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar uma imagem: HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, bytes);
}

async function searchCandidates() {
  const equipment = await readJson(equipmentPath);
  const candidates = { source: "Pixabay", generatedAt: new Date().toISOString(), equipment: {} };

  for (const item of equipment) {
    const result = await requestPixabay({
      q: item.busca,
      image_type: "photo",
      orientation: "horizontal",
      safesearch: "true",
      min_width: 800,
      min_height: 600,
      per_page: 12,
    });
    const photos = (result.hits ?? []).slice(0, 6).map(toCandidate);
    if (photos.length === 0) throw new Error(`Nenhum candidato encontrado para ${item.patrimonio}.`);

    candidates.equipment[item.patrimonio] = photos;
    for (const photo of photos) {
      await download(
        photo.previewUrl,
        path.join(cacheRoot, item.patrimonio, `${photo.id}.jpg`),
      );
    }
    console.log(`${item.patrimonio}: ${photos.length} candidatos preparados.`);
  }

  await writeJson(candidatesPath, candidates);
  console.log("Busca concluída. Faça a revisão visual antes de aprovar.");
}

async function candidateFor(patrimonio, rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id)) throw new Error("O ID do Pixabay deve ser um número inteiro.");
  const candidates = await readJson(candidatesPath);
  const candidate = candidates.equipment?.[patrimonio]?.find((item) => item.id === id);
  if (!candidate) throw new Error(`O candidato ${id} não pertence a ${patrimonio}.`);
  return candidate;
}

async function rejectCandidate(patrimonio, rawId, reasonParts) {
  const candidate = await candidateFor(patrimonio, rawId);
  const reason = reasonParts.join(" ").trim();
  if (!reason) throw new Error("Informe um motivo concreto para a rejeição.");
  const review = await readJson(reviewPath);

  review.rejeitadas = review.rejeitadas.filter(
    (item) => !(item.patrimonio === patrimonio && item.pixabayId === candidate.id),
  );
  review.rejeitadas.push({ patrimonio, pixabayId: candidate.id, motivo: reason });
  if (review.aprovadas[patrimonio]?.pixabayId === candidate.id) delete review.aprovadas[patrimonio];
  await writeJson(reviewPath, review);
  console.log(`${patrimonio}: candidato ${candidate.id} rejeitado.`);
}

async function approveCandidate(patrimonio, rawId) {
  const candidate = await candidateFor(patrimonio, rawId);
  const review = await readJson(reviewPath);
  const rejected = review.rejeitadas.some(
    (item) => item.patrimonio === patrimonio && item.pixabayId === candidate.id,
  );
  if (rejected) throw new Error("Remova a rejeição antes de aprovar este candidato.");

  const duplicate = Object.entries(review.aprovadas).find(
    ([otherPatrimonio, item]) => otherPatrimonio !== patrimonio && item.pixabayId === candidate.id,
  );
  if (duplicate) throw new Error(`A foto já foi aprovada para ${duplicate[0]}.`);

  review.aprovadas[patrimonio] = {
    pixabayId: candidate.id,
    contributor: candidate.contributor,
    contributorUrl: candidate.contributorUrl,
    photoPageUrl: candidate.pageUrl,
  };
  await writeJson(reviewPath, review);
  console.log(`${patrimonio}: candidato ${candidate.id} aprovado.`);
}

async function fetchPhotoById(id) {
  const result = await requestPixabay({ id });
  const hit = result.hits?.[0];
  if (!hit || hit.id !== id) throw new Error(`A foto ${id} não foi encontrada no Pixabay.`);
  return toCandidate(hit);
}

async function finalizeImages() {
  const equipment = await readJson(equipmentPath);
  const review = await readJson(reviewPath);
  const missing = equipment.filter((item) => !review.aprovadas[item.patrimonio]);
  if (missing.length > 0) {
    throw new Error(`Ainda faltam aprovações: ${missing.map((item) => item.patrimonio).join(", ")}.`);
  }

  await fs.mkdir(outputRoot, { recursive: true });
  const images = [];
  for (const item of equipment) {
    const approved = review.aprovadas[item.patrimonio];
    const photo = await fetchPhotoById(approved.pixabayId);
    const response = await fetch(photo.imageUrl);
    if (!response.ok) throw new Error(`Falha ao baixar a foto aprovada de ${item.patrimonio}.`);
    const input = Buffer.from(await response.arrayBuffer());
    const filename = `${item.patrimonio}.jpg`;

    await sharp(input)
      .resize(800, 600, { fit: "cover", position: "attention" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toFile(path.join(outputRoot, filename));

    images.push({
      patrimonio: item.patrimonio,
      filename,
      pixabayId: photo.id,
      contributor: photo.contributor,
      contributorUrl: photo.contributorUrl,
      photoPageUrl: photo.pageUrl,
      licenseUrl,
    });
    console.log(`${item.patrimonio}: imagem final gerada.`);
  }

  await writeJson(manifestPath, {
    version: 1,
    source: "Pixabay",
    sourceUrl: "https://pixabay.com/",
    attributionText: "Fotos: Pixabay",
    licenseUrl,
    generatedAt: new Date().toISOString(),
    images,
  });
  console.log("Finalização concluída. Execute npm run images:validate.");
}

function printHelp() {
  console.log(`Uso:
  npm run images:workflow -- buscar
  npm run images:workflow -- rejeitar <patrimonio> <pixabay-id> <motivo>
  npm run images:workflow -- aprovar <patrimonio> <pixabay-id>
  npm run images:workflow -- finalizar`);
}

const [command, patrimonio, id, ...rest] = process.argv.slice(2);

try {
  if (command === "buscar") await searchCandidates();
  else if (command === "rejeitar") await rejectCandidate(patrimonio, id, rest);
  else if (command === "aprovar") await approveCandidate(patrimonio, id);
  else if (command === "finalizar") await finalizeImages();
  else printHelp();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Falha inesperada no preparo de imagens.");
  process.exitCode = 1;
}
