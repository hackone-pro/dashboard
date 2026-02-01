import fs from "fs";
import path from "path";

/* ============================
   AMBIENTE
============================ */
const IS_DEV = process.env.NODE_ENV === "development";

/* ============================
   CAMINHOS
============================ */
// PRODUÇÃO
const STORAGE_STATE_PROD = "/opt/storage_monitoring/storage_state.json";
const STORAGE_INTERNAL_PROD = "/opt/storage_monitoring/storage_internal.json";

// DEV
const STORAGE_STATE_DEV = path.join(process.cwd(), "storage_state_dev.json");
const STORAGE_INTERNAL_DEV = path.join(process.cwd(), "storage_internal_dev.json");

const PATHS = {
  state: IS_DEV ? STORAGE_STATE_DEV : STORAGE_STATE_PROD,
  internal: IS_DEV ? STORAGE_INTERNAL_DEV : STORAGE_INTERNAL_PROD,
};

/* ============================
   LEITURA DE ARQUIVO
============================ */
function lerArquivo(tipo: "state" | "internal") {
  const caminho = PATHS[tipo];

  if (!fs.existsSync(caminho)) {
    throw new Error(`Arquivo não encontrado: ${caminho}`);
  }

  strapi.log.info(
    `📄 Storage (${tipo}) [${IS_DEV ? "DEV" : "PROD"}] → ${caminho}`
  );

  return JSON.parse(fs.readFileSync(caminho, "utf8"));
}

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
   EXTRAI DATA (yyyy-mm-dd)
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
  gerarTimeline,
};
