import axios from "axios";
import https from "https";
import jwt from "jsonwebtoken";

// Em dev com localhost, ignora cert self-signed do .NET
function buildAxiosConfig(baseUrl: string): object {
  const isLocalhost = /https?:\/\/(localhost|127\.0\.0\.1)/.test(baseUrl);
  return isLocalhost ? { httpsAgent: new https.Agent({ rejectUnauthorized: false }) } : {};
}

// Cache do token gerado para não assinar a cada chamada
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

/**
 * Gera (ou retorna do cache) um JWT para autenticar o Strapi na API de Alerts.
 * Replica o padding do .NET: UTF-8 bytes da chave, zero-padded até 32 bytes.
 */
function getToken(jwtKey: string): string {
  const now = Date.now();
  if (_cachedToken && _tokenExpiresAt - now > 5 * 60 * 1000) {
    return _cachedToken;
  }

  // Mesmo padding que o .NET usa: Encoding.UTF8.GetBytes(key) + PadKey(bytes, 32)
  const keyBuf = Buffer.alloc(32);
  Buffer.from(jwtKey, "utf8").copy(keyBuf);

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
  const url = process.env.ALERTS_API_URL;
  const key = process.env.ALERTS_JWT_KEY;

  if (!url || !key) {
    strapi.log.debug("[RiskLevel] ALERTS_API_URL ou ALERTS_JWT_KEY ausentes — skip baseline remoto");
    return null;
  }

  try {
    const token = getToken(key);
    const response = await axios.get(`${url}/api/risk-level-baselines`, {
      params:  { tenantId: String(tenantId), windowHours },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 3000,
      validateStatus: (s) => s === 200 || s === 204,
      ...buildAxiosConfig(url),
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
  const url = process.env.ALERTS_API_URL;
  const key = process.env.ALERTS_JWT_KEY;

  if (!url || !key) return;

  try {
    const token = getToken(key);
    await axios.post(
      `${url}/api/risk-level-baselines`,
      {
        tenantId:   String(tenantId),
        windowFrom: windowFrom.toISOString(),
        windowTo:   windowTo.toISOString(),
        ...values,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000,
        ...buildAxiosConfig(url),
      }
    );
  } catch (err: any) {
    strapi.log.warn(
      `[RiskLevel] Falha ao salvar baseline remoto para tenant ${tenantId}: ${err?.message}`
    );
  }
}
