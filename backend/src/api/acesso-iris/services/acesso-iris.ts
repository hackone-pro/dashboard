import axios from "axios";
import https from "https";

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

    // 🔹 injeta o owner_name_iris do usuário logado
    const ownerName = user?.owner_name_iris || null;

    if (Array.isArray(casos) && ownerName) {
      return casos.map((c) => ({
        ...c,
        owner_name: ownerName, // substitui ou adiciona o campo
      }));
    }

    return casos;
  } catch (err) {
    throw err;
  }
}