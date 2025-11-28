/* ======================================================
   EDR SERVICE — CONSULTA SIMPLES
   Lista eventos com integration e timestamp
====================================================== */

import { http } from "./utils/http";
import { authHeader } from "./utils/auth";

export interface EdrItem {
  deviceName: string;   // agora representa o valor de integration
  timestamp: string;
}

/**
 * Buscar logs EDR com campos existentes
 */
export async function buscarEventosEDR(
  tenant: any,
  opts?: { size?: string }
): Promise<EdrItem[]> {
  if (!tenant?.wazuh_url) {
    throw new Error("Tenant sem wazuh_url configurado.");
  }

  const size = Number(opts?.size ?? 200);

  const body = {
    size,
    query: {
      bool: {
        must: [
          { exists: { field: "data.integration" } }
        ]
      }
    },
    sort: [{ "@timestamp": { order: "desc" } }],
    _source: [
      "data.integration",
      "@timestamp"
    ]
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const hits = response.data?.hits?.hits ?? [];

  return hits.map((h: any) => {
    const src = h._source ?? {};

    // pegar integration diretamente
    const integration = src.data?.integration ?? "Desconhecido";

    return {
      deviceName: integration,  // mantendo o nome para não quebrar o card
      timestamp: src["@timestamp"] ?? "",
    };
  });
}
