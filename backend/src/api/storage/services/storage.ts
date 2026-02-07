import fs from "fs";
import path from "path";

/* ============================
   STORAGE DIRECTORY (MANUAL)
   ATIVE APENAS UM
============================ */

// PRODUÇÃO (ative no servidor)
const STORAGE_DIR = "/opt/storage_monitoring";

// DESENVOLVIMENTO LOCAL (ative no localhost)
// const STORAGE_DIR = process.cwd();

/* ============================
   LOG DE CONFIRMAÇÃO
============================ */
strapi.log.warn(`📁 STORAGE_DIR ATIVO = ${STORAGE_DIR}`);

/* ============================
   NORMALIZA TENANT
============================ */
function normalizarTenant(input: string) {
  return (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s]+/g, "_")
    .replace(/_+/g, "_");
}

/* ============================
   LOCALIZA ARQUIVO DINÂMICO
   ✔ aceita - ou _
   ✔ ignora prd / pocXX
============================ */
function localizarArquivo(
  tipo: "state" | "internal",
  tenantFromDb: string
) {
  if (!fs.existsSync(STORAGE_DIR)) {
    throw new Error(`Diretório não encontrado: ${STORAGE_DIR}`);
  }

  const arquivos = fs.readdirSync(STORAGE_DIR);

  const tenantBase = tenantFromDb
    .toString()
    .trim()
    .toLowerCase();

  const tenantNormalizado = normalizarTenant(tenantBase);

  const variantes = new Set<string>([
    tenantBase,
    tenantNormalizado,
    tenantNormalizado.replace(/_/g, "-"),
    tenantNormalizado.replace(/-/g, "_"),
  ]);

  const encontrado = arquivos.find(nome => {
    const lower = nome.toLowerCase();

    if (!lower.includes(`storage_${tipo}`)) return false;
    if (!lower.endsWith(".json")) return false;

    return Array.from(variantes).some(v =>
      lower.includes(`-${v}.json`)
    );
  });

  if (!encontrado) {
    throw new Error(
      `Arquivo storage_${tipo} não encontrado para tenant="${tenantFromDb}"`
    );
  }

  const caminho = path.join(STORAGE_DIR, encontrado);

  strapi.log.info(`📄 Storage (${tipo}) → ${encontrado}`);

  return caminho;
}

/* ============================
   LEITURA DE ARQUIVO
============================ */
function lerArquivo(
  tipo: "state" | "internal",
  tenantFromDb: string
) {
  const caminho = localizarArquivo(tipo, tenantFromDb);
  return JSON.parse(fs.readFileSync(caminho, "utf8"));
}

/* ============================
   EXTRAI NÚMERO (GB)
============================ */
function extrairNumeroGB(valor: string | number): number {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;

  return Number(
    valor
      .toString()
      .replace(",", ".")
      .replace(/[^\d.]/g, "")
  );
}

/* ============================
   STATE NORMALIZADO (SNAPSHOT)
============================ */
function lerStateNormalizado(tenantFromDb: string) {
  const raw = lerArquivo("state", tenantFromDb);

  return {
    used: extrairNumeroGB(raw["Em uso"]),
    deleted: extrairNumeroGB(raw["Deletado"]),
    totalAccumulated: extrairNumeroGB(raw["Total acumulado"]),
    remaining: extrairNumeroGB(raw["Restante (de 1 TB)"]),
    totalCapacity: 1024,
  };
}

/* ============================
   EXTRAI DATA yyyy-mm-dd
============================ */
function extrairDataDaKey(key: string): string | null {
  const match = key.match(/(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

/* ============================
   NORMALIZA LAST_SEEN
============================ */
function normalizarLastSeen(
  lastSeen: Record<string, number>,
  tenantFromDb: string
) {
  const tenantKey = normalizarTenant(tenantFromDb);
  const porDia: Record<string, number> = {};

  for (const [key, valor] of Object.entries(lastSeen)) {
    if (typeof valor !== "number") continue;

    const keyLower = key.toLowerCase();
    if (!keyLower.includes(`-${tenantKey}-`)) continue;

    const data = extrairDataDaKey(keyLower);
    if (!data) continue;

    porDia[data] = (porDia[data] || 0) + valor;
  }

  return porDia;
}

/* ============================
   NORMALIZA DELETED (ARRAY)
============================ */
function normalizarDeleted(lista: any[]) {
  const porDia: Record<string, number> = {};

  (lista || []).forEach(item => {
    if (!item?.data || typeof item.volume !== "number") return;
    if (item.data === "desconhecida") return;

    const [dia, mes, ano] = String(item.data).split("/");
    if (!dia || !mes || !ano) return;

    const iso = `${ano}-${mes}-${dia}`;
    porDia[iso] = (porDia[iso] || 0) + item.volume;
  });

  return porDia;
}

/* ============================
   GERAR TIMELINE
============================ */
async function gerarTimeline(tenantFromDb: string) {
  const internal = lerArquivo("internal", tenantFromDb);

  const lastSeenRaw = internal?.last_seen ?? {};
  const deletedList = Array.isArray(internal?.deleted)
    ? internal.deleted
    : [];

  const usoPorDia = normalizarLastSeen(lastSeenRaw, tenantFromDb);
  const deletadoPorDia = normalizarDeleted(deletedList);

  const datas = new Set([
    ...Object.keys(usoPorDia),
    ...Object.keys(deletadoPorDia),
  ]);

  let totalUsed = 0;

  const series = Array.from(datas)
    .sort()
    .map(date => {
      const used = usoPorDia[date] || 0;
      const deleted = deletadoPorDia[date] || 0;

      totalUsed += used;
      totalUsed -= deleted;

      return { date, used, deleted };
    });

  const safeTotalUsed = Math.max(totalUsed, 0);

  return {
    totalCapacity: 1024,
    totalUsed: Number(safeTotalUsed.toFixed(4)),
    usagePercent: Number(((safeTotalUsed / 1024) * 100).toFixed(2)),
    series,
  };
}

/* ============================
   EXPORT
============================ */
export default {
  lerArquivo,
  lerStateNormalizado,
  gerarTimeline,
};
