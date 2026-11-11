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

async function createContactSheet(patrimonio, photos) {
  const cellWidth = 320;
  const imageHeight = 220;
  const labelHeight = 40;
  const columns = 3;
  const rows = 2;
  const width = cellWidth * columns;
  const height = (imageHeight + labelHeight) * rows;
  const composites = [];

  for (const [index, photo] of photos.entries()) {
    const left = (index % columns) * cellWidth;
    const top = Math.floor(index / columns) * (imageHeight + labelHeight);
    const thumbnail = await sharp(path.join(cacheRoot, patrimonio, `${photo.id}.jpg`))
      .resize(cellWidth, imageHeight, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82 })
      .toBuffer();
    composites.push({ input: thumbnail, left, top });
  }

  const labels = photos
    .map((photo, index) => {
      const x = (index % columns) * cellWidth;
      const y = Math.floor(index / columns) * (imageHeight + labelHeight) + imageHeight;
      return `<rect x="${x}" y="${y}" width="${cellWidth}" height="${labelHeight}" fill="#111827"/><text x="${x + 16}" y="${y + 26}" fill="#f9fafb" font-size="20" font-family="Arial, sans-serif">Pixabay ID ${photo.id}</text>`;
    })
    .join("");

  const labelLayer = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${labels}</svg>`,
  );
  composites.push({ input: labelLayer, left: 0, top: 0 });

  await sharp({ create: { width, height, channels: 3, background: "#111827" } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(path.join(cacheRoot, patrimonio, "contact-sheet.jpg"));
}

async function searchCandidates(targetPatrimonio, rawPage = "1", alternateQuery = "") {
  const allEquipment = await readJson(equipmentPath);
  const equipment = targetPatrimonio
    ? allEquipment.filter((item) => item.patrimonio === targetPatrimonio)
    : allEquipment;
  if (equipment.length === 0) throw new Error(`Patrimônio desconhecido: ${targetPatrimonio}.`);

  const page = Number(rawPage);
  if (!Number.isInteger(page) || page < 1) throw new Error("A página da busca deve ser um inteiro positivo.");

  let candidates;
  try {
    candidates = await readJson(candidatesPath);
  } catch {
    candidates = { source: "Pixabay", generatedAt: null, queries: {}, equipment: {} };
  }
  candidates.queries ??= {};
  candidates.generatedAt = new Date().toISOString();

  for (const item of equipment) {
    const query = alternateQuery.trim() || item.busca;
    const result = await requestPixabay({
      q: query,
      image_type: "photo",
      orientation: "horizontal",
      safesearch: "true",
      min_width: 800,
      min_height: 600,
      per_page: 12,
      page,
    });
    const photos = (result.hits ?? []).slice(0, 6).map(toCandidate);
    if (photos.length === 0) throw new Error(`Nenhum candidato encontrado para ${item.patrimonio}.`);

    candidates.queries[item.patrimonio] = query;
    candidates.equipment[item.patrimonio] = photos;
    for (const photo of photos) {
      await download(
        photo.previewUrl,
        path.join(cacheRoot, item.patrimonio, `${photo.id}.jpg`),
      );
    }
    await createContactSheet(item.patrimonio, photos);
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

async function reconsiderCandidate(patrimonio, rawId, justificationParts) {
  const candidate = await candidateFor(patrimonio, rawId);
  const justification = justificationParts.join(" ").trim();
  if (!justification) throw new Error("Informe uma justificativa concreta para a reconsideração.");
  const review = await readJson(reviewPath);
  const rejection = review.rejeitadas.find(
    (item) => item.patrimonio === patrimonio && item.pixabayId === candidate.id,
  );
  if (!rejection) throw new Error("Este candidato não possui rejeição ativa.");

  review.rejeitadas = review.rejeitadas.filter(
    (item) => !(item.patrimonio === patrimonio && item.pixabayId === candidate.id),
  );
  review.reconsideradas ??= [];
  review.reconsideradas.push({ ...rejection, justificativa: justification });
  await writeJson(reviewPath, review);
  console.log(`${patrimonio}: rejeição do candidato ${candidate.id} reconsiderada.`);
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

async function finalizeImages(targetPatrimonio) {
  const equipment = await readJson(equipmentPath);
  if (targetPatrimonio && !equipment.some((item) => item.patrimonio === targetPatrimonio)) {
    throw new Error("Patrimônio desconhecido.");
  }
  const previous = targetPatrimonio ? await readJson(manifestPath) : null;
  const review = await readJson(reviewPath);
  const missing = equipment.filter((item) => !review.aprovadas[item.patrimonio]);
  if (missing.length > 0) {
    throw new Error(`Ainda faltam aprovações: ${missing.map((item) => item.patrimonio).join(", ")}.`);
  }

  await fs.mkdir(outputRoot, { recursive: true });
  const images = [];
  for (const item of equipment) {
    if (targetPatrimonio && item.patrimonio !== targetPatrimonio) {
      const existing = previous.images.find((image) => image.patrimonio === item.patrimonio);
      if (!existing) throw new Error("Manifesto anterior incompleto.");
      images.push(existing);
      continue;
    }
    const approved = review.aprovadas[item.patrimonio];
    const photo = await fetchPhotoById(approved.pixabayId);
    const response = await fetch(photo.imageUrl);
    if (!response.ok && !targetPatrimonio) throw new Error(`Falha ao baixar a foto aprovada de ${item.patrimonio}.`);
    const input = response.ok ? Buffer.from(await response.arrayBuffer())
      : await fs.readFile(path.join(cacheRoot, item.patrimonio, `${photo.id}.jpg`));
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
  npm run images:workflow -- buscar [patrimonio] [pagina] [consulta alternativa]
  npm run images:workflow -- rejeitar <patrimonio> <pixabay-id> <motivo>
  npm run images:workflow -- reconsiderar <patrimonio> <pixabay-id> <justificativa>
  npm run images:workflow -- aprovar <patrimonio> <pixabay-id>
  npm run images:workflow -- finalizar`);
}

const [command, patrimonio, id, ...rest] = process.argv.slice(2);

try {
  if (command === "buscar") await searchCandidates(patrimonio, id, rest.join(" "));
  else if (command === "rejeitar") await rejectCandidate(patrimonio, id, rest);
  else if (command === "reconsiderar") await reconsiderCandidate(patrimonio, id, rest);
  else if (command === "aprovar") await approveCandidate(patrimonio, id);
  else if (command === "finalizar") await finalizeImages(patrimonio);
  else printHelp();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Falha inesperada no preparo de imagens.");
  process.exitCode = 1;
}
