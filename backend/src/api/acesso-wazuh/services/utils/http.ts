// src/api/acesso-wazuh/services/utils/http.ts
import axios from "axios";
import https from "https";

export const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export const http = axios.create({
  httpsAgent,
  timeout: 15000, // 🔹 seguro, não obrigatório
});
