import axios from "axios";
import https from "https";

export async function buscarCasos(tenant) {
  try {
    const irisUrl = `${tenant.iris_url}/manage/cases/list`;

    const response = await axios.get(irisUrl, {
      headers: {
        Authorization: `Bearer ${tenant.iris_apikey}`,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    return response.data;
  } catch (err) {
    throw err;
  }
}