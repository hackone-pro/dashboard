import axios from "axios";
import https from "https";
import { parse, isAfter, isBefore, startOfDay, endOfDay, subDays } from "date-fns";

export async function buscarCasos(tenant, user) {
  try {
    const irisUrl = `${tenant.iris_url}/manage/cases/list`;

    const response = await axios.get(irisUrl, {
      headers: {
        Authorization: `Bearer ${tenant.iris_apikey}`,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    const casos = response.data || [];

    // apenas injeta o owner_name_iris, sem alterar dados
    const ownerName = user?.owner_name_iris || null;
    if (Array.isArray(casos) && ownerName) {
      return casos.map((c) => ({
        ...c,
        owner_name: ownerName,
      }));
    }

    return casos;
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

export async function buscarIncidentesIris(tenant, dias = "1", user = null) {
  try {
    const casosResponse = await buscarCasos(tenant, user);
    const casos = Array.isArray(casosResponse)
      ? casosResponse
      : casosResponse.data || [];

    // converte "7" → 7, "15" → 15, "todos" → 0
    let diasNum = 1;
    if (dias === "7") diasNum = 7;
    else if (dias === "15") diasNum = 15;
    else if (dias === "30") diasNum = 30;
    else if (dias === "todos") diasNum = 0;

    const inicio = startOfDay(subDays(new Date(), diasNum));
    const fim = endOfDay(new Date());

    const ownerUser = user?.owner_name_iris || "";
    const clienteName = tenant?.cliente_name || "";
    const ownersValidos = [ownerUser, "Inteligencia_Artificial"];

    const recentes = casos.filter((caso) => {
      if (!caso.case_open_date) return false;

      let data = new Date(caso.case_open_date);
      // caso o formato não seja reconhecido, tenta manualmente
      if (isNaN(data.getTime())) {
        const partes = caso.case_open_date.split(/[\/\-]/);
        if (partes.length === 3) {
          const [a, b, c] = partes.map((x) => parseInt(x, 10));
          data = a > 1900 ? new Date(a, b - 1, c) : new Date(c, a - 1, b);
        }
      }

      if (isNaN(data.getTime())) return false;

      // aplica filtro de data
      const dentroDoPeriodo =
        diasNum === 0 ? true : isAfter(data, inicio) && isBefore(data, fim);

      // aplica filtro de owner
      const ownerCaso = caso.owner || caso.owner_name || "";
      const matchOwner =
        ownersValidos.includes(ownerCaso) ||
        (ownerCaso === "Inteligencia_Artificial" &&
          caso.case_name?.includes(clienteName));

      return dentroDoPeriodo && matchOwner;
    });

    // 🔹 Contagem por severidade
    const severidades = { baixo: 0, medio: 0, alto: 0, critico: 0, total: 0 };

    recentes.forEach((c) => {
      const nome = c.case_name?.toLowerCase() || "";
      const sev = c.severity?.toLowerCase() || "";

      let nivel = "medio";
      if (sev.includes("crit")) nivel = "critico";
      else if (sev.includes("high") || sev.includes("alto")) nivel = "alto";
      else if (sev.includes("med")) nivel = "medio";
      else if (sev.includes("low") || sev.includes("baix")) nivel = "baixo";
      else if (nome.includes("crit")) nivel = "critico";
      else if (nome.includes("alto") || nome.includes("alta")) nivel = "alto";
      else if (nome.includes("med")) nivel = "medio";
      else if (nome.includes("baix")) nivel = "baixo";

      severidades[nivel]++;
      severidades.total++;
    });

    strapi.log.info(
      `IRIS (${diasNum === 0 ? "todos" : diasNum + " dias"}): ${
        severidades.total
      } incidentes (owners: ${ownersValidos.join(" + ")}) | Crit: ${
        severidades.critico
      }, Alto: ${severidades.alto}, Médio: ${severidades.medio}, Baixo: ${
        severidades.baixo
      }`
    );

    return severidades;
  } catch (err) {
    strapi.log.error("❌ Erro ao buscar incidentes IRIS:", err);
    return { baixo: 0, medio: 0, alto: 0, critico: 0, total: 0 };
  }
}