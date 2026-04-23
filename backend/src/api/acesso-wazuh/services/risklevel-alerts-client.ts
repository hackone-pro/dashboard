import axios from "axios";
import jwt from "jsonwebtoken";

const ALERTS_API_URL = process.env.ALERTS_API_URL;
const ALERTS_JWT_KEY = process.env.ALERTS_JWT_KEY;

// Cache do token gerado para não assinar a cada chamada
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

/**
 * Gera (ou retorna do cache) um JWT para autenticar o Strapi na API de Alerts.
 * Replica o padding do .NET: UTF-8 bytes da chave, zero-padded até 32 bytes.
 */
function getToken(): string | null {
  if (!ALERTS_JWT_KEY) return null;

  const now = Date.now();
  // Reutiliza token existente se ainda válido por mais de 5 min
  if (_cachedToken && _tokenExpiresAt - now > 5 * 60 * 1000) {
    return _cachedToken;
  }

  // Mesmo padding que o .NET usa: Encoding.UTF8.GetBytes(key) + PadKey(bytes, 32)
  const keyBuf = Buffer.alloc(32);
  Buffer.from(ALERTS_JWT_KEY, "utf8").copy(keyBuf);

  _cachedToken = jwt.sign(
    { sub: "strapi-cron", role: "app-strapi" },
    keyBuf,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  _tokenExpiresAt = now + 60 * 60 * 1000;
  return _cachedToken;
}

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
  if (!ALERTS_API_URL || !ALERTS_JWT_KEY) return null;

  const token = getToken();
  if (!token) return null;

  try {
    const response = await axios.get(`${ALERTS_API_URL}/api/risk-level-baselines`, {
      params:  { tenantId: String(tenantId), windowHours },
      headers: { Authorization: `Bearer ${token}` },
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
  if (!ALERTS_API_URL || !ALERTS_JWT_KEY) return;

  const token = getToken();
  if (!token) return;

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
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000,
      }
    );
  } catch (err: any) {
    strapi.log.warn(
      `[RiskLevel] Falha ao salvar baseline remoto para tenant ${tenantId}: ${err?.message}`
    );
  }
}
