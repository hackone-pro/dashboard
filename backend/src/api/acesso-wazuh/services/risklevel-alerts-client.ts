import axios from "axios";

const ALERTS_API_URL   = process.env.ALERTS_API_URL;
const ALERTS_API_TOKEN = process.env.ALERTS_API_TOKEN;

export interface RemoteBaseline {
  topHosts:     number;
  cis:          number;
  firewall:     number;
  incidents:    number;
  windowHours:  number;
  calculatedAt: string;
}

/**
 * Busca o baseline mais recente para o tenant na API de Alerts.
 * Retorna null se não configurado, não encontrado (204) ou erro de rede.
 */
export async function getBaselineFromAlerts(
  tenantId: string | number,
  windowHours = 24
): Promise<RemoteBaseline | null> {
  if (!ALERTS_API_URL || !ALERTS_API_TOKEN) return null;

  try {
    const response = await axios.get(`${ALERTS_API_URL}/api/risk-level-baselines`, {
      params:  { tenantId: String(tenantId), windowHours },
      headers: { Authorization: `Bearer ${ALERTS_API_TOKEN}` },
      timeout: 3000,
      validateStatus: (s) => s === 200 || s === 204,
    });

    return response.status === 204 ? null : (response.data as RemoteBaseline);
  } catch (err: any) {
    strapi.log.warn(
      `[RiskLevel] Baseline remoto indisponível para tenant ${tenantId}: ${err?.message}`
    );
    return null;
  }
}

/**
 * Persiste o baseline calculado na API de Alerts (cria nova linha — histórico).
 * Silencia erros: falha aqui não deve interromper o cron.
 */
export async function saveBaselineToAlerts(
  tenantId: string | number,
  windowFrom: Date,
  windowTo: Date,
  values: {
    topHosts:  number;
    cis:       number;
    firewall:  number;
    incidents: number;
  }
): Promise<void> {
  if (!ALERTS_API_URL || !ALERTS_API_TOKEN) return;

  try {
    await axios.post(
      `${ALERTS_API_URL}/api/risk-level-baselines`,
      {
        tenantId:  String(tenantId),
        windowFrom: windowFrom.toISOString(),
        windowTo:   windowTo.toISOString(),
        ...values,
      },
      {
        headers: { Authorization: `Bearer ${ALERTS_API_TOKEN}` },
        timeout: 3000,
      }
    );
  } catch (err: any) {
    strapi.log.warn(
      `[RiskLevel] Falha ao salvar baseline remoto para tenant ${tenantId}: ${err?.message}`
    );
  }
}
