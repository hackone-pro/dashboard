import fs from "fs";
import path from "path";

/* ============================
   AMBIENTE
============================ */
const IS_DEV = process.env.NODE_ENV === "development";

/* ============================
   DIRETÓRIOS
============================ */
// PROD
const STORAGE_DIR_PROD = "/opt/storage_monitoring";

// DEV (raiz do projeto)
const STORAGE_DIR_DEV = process.cwd();

const STORAGE_DIR = IS_DEV ? STORAGE_DIR_DEV : STORAGE_DIR_PROD;

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
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");
}

/* ============================
   LOCALIZA ARQUIVO DINÂMICO
============================ */
function localizarArquivo(
  tipo: "state" | "internal",
  tenantKey: string
) {
  if (!fs.existsSync(STORAGE_DIR)) {
    throw new Error(`Diretório não encontrado: ${STORAGE_DIR}`);
  }

  const arquivos = fs.readdirSync(STORAGE_DIR);

  const regex = new RegExp(
    `^.*-storage_${tipo}-${tenantKey}\\.json$`,
    "i"
  );

  const encontrado = arquivos.find(nome => regex.test(nome));

  if (!encontrado) {
    throw new Error(
      `Arquivo storage_${tipo} não encontrado para tenant="${tenantKey}"`
    );
  }

  const caminho = path.join(STORAGE_DIR, encontrado);

  strapi.log.info(
    `📄 Storage (${tipo}) [${IS_DEV ? "DEV" : "PROD"}] → ${caminho}`
  );

  return caminho;
}

/* ============================
   LEITURA DE ARQUIVO
============================ */
function lerArquivo(
  tipo: "state" | "internal",
  tenantKey: string
) {
  const caminho = localizarArquivo(tipo, tenantKey);
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
  const tenantKey = normalizarTenant(tenantFromDb);
  const raw = lerArquivo("state", tenantKey);

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
  tenantKey: string
) {
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
   NORMALIZA DELETED (GLOBAL)
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
  const tenantKey = normalizarTenant(tenantFromDb);
  const internal = lerArquivo("internal", tenantKey);

  const lastSeenRaw = internal?.last_seen ?? {};
  const deletedList = Array.isArray(internal?.deleted)
    ? internal.deleted
    : [];

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
