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

// Função auxiliar (mantém o padrão que você usa)
function normalizarResposta(res: any): StorageState {
  if (res && typeof res === "object") return res;
  if (res?.data && typeof res.data === "object") return res.data;
  return {};
}

export async function getStorageState(token?: string): Promise<StorageState> {
  const response = await axios.get<any>(
    `${API_URL}/api/storage/state`,
    {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    }
  );

  return normalizarResposta(response.data);
}
