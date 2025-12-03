import fs from "fs";
import path from "path";

// Caminhos de produção (agora dinâmicos)
const STORAGE_PROD_FOLDER = "/opt/storage_monitoring";

// Caminhos de desenvolvimento
const STORAGE_DEV_FOLDER = process.cwd();

// Alternar manualmente
const IS_DEV = false; // true para DEV, false para PRODUÇÃO

// Apenas converte para minúsculo
function normalizeTenantName(name: string): string {
  return name.toLowerCase();
}

export async function lerArquivo(tipo: "state" | "internal", tenantName?: string) {
  try {
    if (!tenantName) {
      throw new Error("Tenant não informado ao ler storage");
    }

    // Apenas lowercase
    const normalized = normalizeTenantName(tenantName);

    const fileName =
      tipo === "state"
        ? `storage_state-${normalized}.json`
        : `storage_internal-${normalized}.json`;

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
