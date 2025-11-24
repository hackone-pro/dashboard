import fs from "fs";
import path from "path";

/*
 * ============================================================
 *  CAMINHO 1 — Arquivo REAL do servidor (PRODUÇÃO)
 *     /opt/storage_monitoring/storage_state.json
 * ============================================================
 */
const STORAGE_PATH_PROD = "/opt/storage_monitoring/storage_state.json";

/*
 * ============================================================
 *  CAMINHO 2 — Arquivo local para testes (DEV)
 *     backend/storage_state_dev.json
 * ============================================================
 */
const STORAGE_PATH_DEV = path.join(process.cwd(), "storage_state_dev.json");

// ============================================================
//  ESCOLHA AQUI QUAL DOS DOIS CAMINHOS USAR
//  Basta comentar/descomentar UMA linha
// ============================================================

// const STORAGE_PATH = STORAGE_PATH_DEV;   // ← usar arquivo local (teste)
const STORAGE_PATH = STORAGE_PATH_PROD;    // ← usar arquivo real do servidor


// ============================================================
//  FUNÇÃO PRINCIPAL
// ============================================================
export async function lerStorageJSON() {
  try {
    const raw = fs.readFileSync(STORAGE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    strapi.log.error(`❌ Erro ao ler storage: ${STORAGE_PATH}`, err);
    throw new Error("Não foi possível ler o arquivo de storage.");
  }
}

export default {
  lerStorageJSON,
};
