import axios from "axios";
import https from "https";

export async function autenticarWazuh(tenant) {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const response = await axios.post(
    `${tenant.wazuh_url}/security/user/authenticate`,
    {},
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }
  );

  return response.data.data.token;
}

export async function buscarAgentes(tenant, token) {
  const response = await axios.get(`${tenant.wazuh_url}/agents`, {
    headers: { Authorization: `Bearer ${token}` },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });

  return response.data;
}