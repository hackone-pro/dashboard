import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Tipo do JSON retornado pelo backend
export type StorageState = {
  [coletor: string]: {
    "Em uso": string;                 // ex: "402.64 MB"
    "Deletado": string;
    "Total acumulado": string;
    "Restante (de 1 TB)": string;
  };
};

// ===============================
// 📌 STORAGE STATE
// Backend retorna:
// { cliente: "equatorial", dados: { ... } }
// Precisamos transformar para:
// { "equatorial": { ... } }
// ===============================
export async function getStorageState(token?: string): Promise<StorageState> {
  const response = await axios.get<any>(
    `${API_URL}/api/storage/state`,
    {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    }
  );

  const payload = response.data;

  // Formato do backend:
  // { cliente: "...", dados: {...} }
  if (payload?.cliente && payload?.dados) {
    return {
      [payload.cliente]: payload.dados
    };
  }

  // Se vier fora do padrão:
  return {};
}

// ===============================
// 📌 STORAGE INTERNAL
// Backend retorna exatamente:
// { last_seen: {...}, deleted: [...] }
// Então apenas retornamos direto.
// ===============================
export async function getStorageInternal(token?: string): Promise<any> {
  const response = await axios.get<any>(
    `${API_URL}/api/storage/internal`,
    {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    }
  );

  return response.data;
}
