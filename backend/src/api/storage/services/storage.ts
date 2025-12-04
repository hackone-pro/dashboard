import fs from "fs";
import path from "path";

// Caminhos
const STORAGE_PROD_FOLDER = "/opt/storage_monitoring";
const STORAGE_DEV_FOLDER = process.cwd();

// Alternar manualmente
const IS_DEV = false;

// Função utilitária para localizar arquivo com final dinâmico
function encontrarArquivo(baseFolder: string, final: string): string | null {
  const arquivos = fs.readdirSync(baseFolder);

  // Exemplo final: "storage_state-equatorial.json"
  const match = arquivos.find((nome) => nome.endsWith(final));

  return match ? path.join(baseFolder, match) : null;
}

export async function lerArquivo(tipo: "state" | "internal", tenantName?: string) {
  try {
    if (!tenantName) {
      throw new Error("Tenant não informado ao ler storage");
    }

    const baseFolder = IS_DEV ? STORAGE_DEV_FOLDER : STORAGE_PROD_FOLDER;

    const final =
      tipo === "state"
        ? `storage_state-${tenantName}.json`
        : `storage_internal-${tenantName}.json`;

    const caminho = encontrarArquivo(baseFolder, final);

    if (!caminho) {
      throw new Error(`Arquivo não encontrado com final: ${final}`);
    }

    strapi.log.info(`📄 Usando arquivo detectado: ${caminho}`);

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
