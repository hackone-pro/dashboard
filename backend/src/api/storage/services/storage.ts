import fs from "fs";
import path from "path";

/* ============================
   AMBIENTE
============================ */
const IS_DEV = process.env.NODE_ENV === "development";

// PRODUÇÃO (ative no servidor)
// const STORAGE_DIR = "/opt/storage_monitoring";

// DESENVOLVIMENTO LOCAL (ative no localhost)
const STORAGE_DIR = process.cwd();

/* ============================
   LEITURA DE ARQUIVO
============================ */
console.warn(`📁 STORAGE_DIR ATIVO = ${STORAGE_DIR}`);

/* ============================
   NORMALIZA TENANT
   "Qolinty" -> "qolinty"
   "Dora Retail" -> "dora_retail"
============================ */
function normalizarTenant(input: string) {
  return (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s-]+/g, "_")
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

function lerStateUsedGB(tenantFromDb: string): number {
  const raw = lerArquivo("state", tenantFromDb);

  // Formato novo (seu exemplo):
  if (raw && typeof raw.used !== "undefined") {
    return extrairNumeroGB(raw.used);
  }

  // Formato antigo:
  return extrairNumeroGB(raw?.["Em uso"]);
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
   (HISTÓRICO DE USO REAL)
============================ */
function normalizarLastSeen(
  lastSeen: Record<string, number>,
  tenantKey: string
) {
  const porDia: Record<string, number> = {};

  for (const [key, valor] of Object.entries(lastSeen)) {
    if (typeof valor !== "number") continue;

    const keyLower = key.toLowerCase();

    // garante que a key pertence ao tenant
    // ex: wazuh-alerts-qolinty-2026.01.27
    if (!keyLower.includes(`-${tenantKey}-`)) continue;

    const data = extrairDataDaKey(keyLower);
    if (!data) continue;

    porDia[data] = (porDia[data] || 0) + valor;
  }

  return porDia;
}

/* ============================
   NORMALIZA DELETED
============================ */
function normalizarDeleted(lista: any[]) {
  const porDia: Record<string, number> = {};

  (lista || []).forEach(item => {
    if (!item?.data || typeof item.volume !== "number") return;

    // dd/mm/yyyy → yyyy-mm-dd
    const [dia, mes, ano] = String(item.data).split("/");
    if (!dia || !mes || !ano) return;

    const iso = `${ano}-${mes}-${dia}`;
    porDia[iso] = (porDia[iso] || 0) + item.volume;
  });

  return porDia;
}

/* ============================
   GERAR TIMELINE (FINAL)
============================ */
async function gerarTimeline(tenantFromDb: string) {
  const tenantKey = normalizarTenant(tenantFromDb);

  // 🔹 STATE: apenas snapshot (não usado na timeline)
  const state = lerArquivo("state");

  // 🔹 INTERNAL: fonte real de histórico
  const internal = lerArquivo("internal");

  // 🔑 USO DIÁRIO REAL
  const lastSeenRaw = internal?.last_seen ?? {};

  // 🔑 DELETADO POR TENANT
  const deletedList = internal?.deleted?.[tenantKey] ?? [];

  const usoPorDia = normalizarLastSeen(lastSeenRaw, tenantKey);
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

  // 🧪 LOG FINAL
  strapi.log.info(
    `📦 Storage timeline tenant="${tenantFromDb}" -> key="${tenantKey}" | usedDays=${Object.keys(usoPorDia).length} | delDays=${Object.keys(deletadoPorDia).length} | series=${series.length}`
  );

  return {
    totalCapacity: 1024, // GB
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
  lerStateUsedGB,
  lerStateNormalizado,
  gerarTimeline,
};
