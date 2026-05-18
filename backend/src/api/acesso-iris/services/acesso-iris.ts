import axios from "axios";
import https from "https";
import { parse, isAfter, isBefore, startOfDay, endOfDay, subDays } from "date-fns";

function formatIrisDate(value?: string | null): string {
  if (!value) return "";
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return String(value);
}

export async function buscarCasos(tenant, user) {
  try {
    const irisUrl = `${tenant.iris_url}/manage/cases/filter?case_customer_id=${tenant.iris_customer_id}&per_page=1000&order_by=case_id&sort_dir=desc`;

    const response = await axios.get(irisUrl, {
      headers: {
        Authorization: `Bearer ${tenant.iris_apikey}`,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 60000,
    });

    const payload = response.data?.data;
    const lista = (Array.isArray(payload) ? payload : payload?.cases || [])
      .filter((c: any) => (c.case_id ?? 0) > 22999);

    // Normaliza o novo retorno do IRIS para o formato antigo,
    // mantendo compatibilidade com os consumidores existentes.
    return lista.map((c: any) => {
      const stateName = c.state?.state_name ?? c.state_name ?? null;
      const ownerName = c.owner?.user_name ?? c.owner ?? "";

      return {
        case_id: c.case_id,
        case_uuid: c.case_uuid,
        case_name: c.name ?? c.case_name,
        case_description: c.description ?? c.case_description,
        case_open_date: formatIrisDate(c.open_date ?? c.case_open_date),
        case_initial_date: c.initial_date ?? null,
        case_close_date: formatIrisDate(c.close_date ?? c.case_close_date),
        case_soc_id: c.soc_id ?? c.case_soc_id,
        case_state_id: c.state?.state_id ?? c.state_id ?? c.case_state_id ?? null,
        state_id: c.state_id ?? null,
        state_name: stateName,
        case_status: stateName ? String(stateName).toLowerCase() : "",
        client_name: c.client?.customer_name ?? c.client_name,
        owner_id: c.owner?.id ?? c.owner_id,
        owner: ownerName,
        owner_name: ownerName,
        opened_by_user_id: c.user?.id ?? c.opened_by_user_id,
        opened_by: c.user?.user_name ?? c.opened_by,
        classification_id: c.classification_id ?? null,
        classification: c.classification?.name ?? c.classification ?? null,
        severity: c.severity?.severity_name ?? c.severity ?? "",
        severity_id: c.severity?.severity_id ?? c.severity_id ?? null,
        access_level: c.access_level,
      };
    });
  } catch (err) {
    strapi.log.error("❌ Erro ao buscar casos IRIS:", err);
    throw err;
  }
}

function mapearSeveridadeIris(incidente) {
  const nome = (incidente.case_name || "").toLowerCase();
  const severity = (incidente.severity || "").toLowerCase();
  const classification = incidente.classification_id;

  if (severity.includes("crit")) return "critico";
  if (severity.includes("high") || severity.includes("alto")) return "alto";
  if (severity.includes("med")) return "medio";
  if (severity.includes("low") || severity.includes("baix")) return "baixo";

  if ([17, 18, 19, 20, 21, 24].includes(classification)) return "critico";
  if ([6, 7, 8, 9, 10, 16, 23, 26, 27, 28, 29].includes(classification))
    return "alto";
  if ([3, 4, 5, 14, 15, 22, 30, 31].includes(classification)) return "medio";
  if ([1, 2, 11, 12, 13, 25, 32, 33, 34, 35, 36].includes(classification))
    return "baixo";

  if (nome.includes("crit")) return "critico";
  if (nome.includes("alto") || nome.includes("alta")) return "alto";
  if (nome.includes("med") || nome.includes("méd")) return "medio";
  if (nome.includes("baix")) return "baixo";

  return "medio";
}

/**
 * Determina o nível de severidade de um caso IRIS.
 * Prioridade:
 *  1. Regex "Severidade: <nível>" na descrição (igual ao frontend)
 *  2. severity_name do campo IRIS (Low/Medium/High/Critical)
 *  3. Nome do caso (fallback)
 */
function mapearNivelCaso(caso: any): "critico" | "alto" | "medio" | "baixo" {
  // Prioridade 1: extrai da descrição (espelha extrairSeveridadeDoTexto do frontend)
  const desc = (caso.case_description || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s*-\s*/gm, "")
    .replace(/\u00A0/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const match = desc.match(
    /Severidade\s*:\s*(Baixo|Baixa|Medio|Media|Alto|Alta|Critico|Critica)/i
  );
  if (match) {
    const v = match[1].toLowerCase();
    if (v.startsWith("crit")) return "critico";
    if (v.startsWith("alt"))  return "alto";
    if (v.startsWith("med"))  return "medio";
    if (v.startsWith("baix")) return "baixo";
  }

  // Prioridade 2: severity_name do IRIS → nome do caso
  const sev  = (caso.severity || "").toLowerCase();
  const nome = (caso.case_name || "").toLowerCase();
  if (sev.includes("crit") || nome.includes("crit"))                         return "critico";
  if (sev.includes("high") || sev.includes("alto") || nome.includes("alt")) return "alto";
  if (sev.includes("med")  || nome.includes("med"))                          return "medio";
  if (sev.includes("low")  || sev.includes("baix") || nome.includes("baix")) return "baixo";
  return "medio";
}

export async function buscarIncidentesIris(
  tenant,
  time: { dias: string } | { from: string; to: string },
  user = null,
  opcoes: { filtrarPorOwner?: boolean } = {}
) {
  try {
    const casosResponse = await buscarCasos(tenant, user);
    const casos = Array.isArray(casosResponse)
      ? casosResponse
      : casosResponse.data || [];

    // 🔹 Definição do período (CORRIGIDA)
    let inicio: Date;
    let fim: Date;

    if ("from" in time && "to" in time) {
      // 👉 vindo do calendário
      inicio = startOfDay(new Date(time.from));
      fim = endOfDay(new Date(time.to));
    } else {
      // 👉 vindo de dias
      let diasNum = 1;
      if (time.dias === "7") diasNum = 7;
      else if (time.dias === "15") diasNum = 15;
      else if (time.dias === "30") diasNum = 30;
      else if (time.dias === "todos") diasNum = 0;

      inicio = diasNum === 0
        ? new Date(0)
        : subDays(new Date(), diasNum);

      fim = new Date();
    }

    const usarFiltroOwner = opcoes.filtrarPorOwner !== false;
    const ownerUser = user?.owner_name_iris || "";
    const clienteName = tenant?.cliente_name || "";
    const ownersValidos = [ownerUser, "Inteligencia_Artificial"];

    const recentes = casos.filter((caso) => {
      if (caso.case_state_id === 9 || String(caso.case_status ?? "").includes("clos")) return false; // ignora casos fechados

      if (!caso.case_open_date) return false;

      let data = new Date(caso.case_open_date);

      // fallback para formatos estranhos
      if (isNaN(data.getTime())) {
        const partes = caso.case_open_date.split(/[\/\-]/);
        if (partes.length === 3) {
          const [a, b, c] = partes.map((x) => parseInt(x, 10));
          data = a > 1900
            ? new Date(a, b - 1, c)
            : new Date(c, a - 1, b);
        }
      }

      if (isNaN(data.getTime())) return false;

      // 🔹 Filtro de período
      const dentroDoPeriodo =
        isAfter(data, inicio) && isBefore(data, fim);

      // 🔹 Filtro de owner (desativado quando filtrarPorOwner: false)
      const ownerCaso = caso.owner || caso.owner_name || "";
      const matchOwner =
        ownersValidos.includes(ownerCaso) ||
        (ownerCaso === "Inteligencia_Artificial" &&
          caso.case_name?.includes(clienteName));

      return dentroDoPeriodo && (!usarFiltroOwner || matchOwner);
    });

    // 🔹 Contagem por severidade
    const severidades = { baixo: 0, medio: 0, alto: 0, critico: 0, total: 0 };

    recentes.forEach((c) => {
      const nivel = mapearNivelCaso(c);
      severidades[nivel]++;
      severidades.total++;
    });

    strapi.log.info(
      `IRIS (${
        "from" in time
          ? `${time.from} → ${time.to}`
          : time.dias === "todos"
          ? "todos"
          : `${time.dias} dias`
      }): ${severidades.total} incidentes`
    );

    return severidades;

  } catch (err) {
    strapi.log.error("❌ Erro ao buscar incidentes IRIS:", err);
    return { baixo: 0, medio: 0, alto: 0, critico: 0, total: 0 };
  }
}

export async function buscarUsuariosIris(tenant) {
  try {
    const irisUrl = `${tenant.iris_url}/manage/users/list`;
    const response = await axios.get(
      irisUrl,
      {
        headers: {
          Authorization: `Bearer ${tenant.iris_apikey}`,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );
    const usuarios = response.data?.data || [];
    return usuarios;
  } catch (err) {

    strapi.log.error(
      "❌ Erro ao buscar usuários do IRIS:",
      err?.response?.data || err
    );
    throw err;
  }
}

export async function atualizarCasoIris(tenant, caseId, dados) {
  try {
    const url = `${tenant.iris_url}/manage/cases/update/${caseId}`;

    const response = await axios.post(
      url,
      dados,
      {
        headers: {
          Authorization: `Bearer ${tenant.iris_apikey}`,
          "Content-Type": "application/json",
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );

    return response.data;

  } catch (err) {
    strapi.log.error(
      "❌ Erro ao atualizar caso no IRIS:",
      err?.response?.data || err
    );
    throw err;
  }
}