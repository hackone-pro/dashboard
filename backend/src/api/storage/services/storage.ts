import fs from "fs";
import path from "path";

// Arquivos padrão
const STORAGE_STATE_PROD = "/opt/storage_monitoring/storage_state.json";
const STORAGE_INTERNAL_PROD = "/opt/storage_monitoring/storage_internal.json";

// Arquivos locais (dev)
const STORAGE_STATE_DEV = path.join(process.cwd(), "storage_state_dev.json");
const STORAGE_INTERNAL_DEV = path.join(process.cwd(), "storage_internal_dev.json");

// Escolha dev/prod
const IS_DEV = false; // Altere manualmente se quiser

const PATHS = {
  state: IS_DEV ? STORAGE_STATE_DEV : STORAGE_STATE_PROD,
  internal: IS_DEV ? STORAGE_INTERNAL_DEV : STORAGE_INTERNAL_PROD,
};

// Função genérica
export async function lerArquivo(tipo: "state" | "internal") {
  try {
    const caminho = PATHS[tipo];
    const raw = fs.readFileSync(caminho, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    strapi.log.error(`❌ Erro ao ler arquivo ${tipo}:`, err);
    throw new Error(`Erro ao ler ${tipo}`);
  }
}

export default {
  lerArquivo,
};
