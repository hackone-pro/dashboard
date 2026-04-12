// src/services/azure-api/headers.ts

import { getToken } from "../../utils/auth";

/**
 * Headers padrão para chamadas aos microserviços (Azure ou futuros).
 * Inclui Authorization (JWT) e X-Tenant-Id do tenant ativo.
 */
export function serviceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const tenantId = localStorage.getItem("tenant_id");
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  return headers;
}
