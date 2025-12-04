// src/services/wazuh/packagesvulnerabilidades.service.ts
import { getToken } from "../../utils/auth";

export interface TopPackageVulnerabilidade {
  package: string;                  // Nome do pacote vulnerável
  total: number;                    // Total de vulnerabilidades
  severity: Record<string, number>; // Ex: { Critical: 2, High: 5, Medium: 1, Low: 0 }
}

/**
 * Busca os top pacotes (packages) com mais vulnerabilidades.
 * @param size Quantidade de pacotes a retornar (default 5)
 * @param dias Intervalo de tempo ("1" | "7" | "15" | "30" | "todos")
 */
 export async function getTopPackagesVulnerabilidades(
  size: number = 5,
  dias: string = "todos"
): Promise<TopPackageVulnerabilidade[]> {

  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/vulnerabilidades/top-packages`);
  url.searchParams.set("size", String(size));
  url.searchParams.set("dias", dias);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar top packages de vulnerabilidades";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();

  // 🔥 backend retorna { topPackages: [...] }
  const lista = Array.isArray(data?.topPackages) ? data.topPackages : [];

  return lista.map((item: any) => {
    const severity: Record<string, number> = {};

    if (item?.severity && typeof item.severity === "object") {
      Object.assign(severity, item.severity);
    }

    return {
      package: String(item?.package ?? item?.key ?? "Desconhecido"),
      total: Number(item?.total ?? item?.doc_count ?? 0),
      severity,
    };
  });
}