import fs from "fs";
import path from "path";

// Caminhos de produção (agora dinâmicos)
const STORAGE_PROD_FOLDER = "/opt/storage_monitoring";

// Caminhos de desenvolvimento
const STORAGE_DEV_FOLDER = process.cwd();

// Alternar manualmente
const IS_DEV = false; // ← AGORA DEFINA COMO FALSE NA PRODUÇÃO

export async function lerArquivo(tipo: "state" | "internal", tenantName?: string) {
  try {
    if (!tenantName) {
      throw new Error("Tenant não informado ao ler storage");
    }

    // Nome do arquivo esperado
    const fileName =
      tipo === "state"
        ? `storage_state-${tenantName}.json`
        : `storage_internal-${tenantName}.json`;

    // DEV → lê da raiz do projeto
    // PROD → lê do /opt/storage_monitoring/
    const baseFolder = IS_DEV ? STORAGE_DEV_FOLDER : STORAGE_PROD_FOLDER;

    const caminho = path.join(baseFolder, fileName);

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
