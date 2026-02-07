import axios from "axios";
import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

/* ============================
   TIPOS (NOVO CONTRATO)
============================ */
export type StorageStateResponse = {
  used: number;
  deleted: number;
  totalAccumulated: number;
  remaining: number;
  totalCapacity: number;
};

/* ============================
   📌 STORAGE STATE
   Backend retorna DIRETO:
   {
     used,
     deleted,
     totalAccumulated,
     remaining,
     totalCapacity
   }
============================ */
export async function getStorageState(
  token?: string
): Promise<StorageStateResponse> {
  const authToken = token ?? getToken();

  const response = await axios.get<StorageStateResponse>(
    `${API_URL}/api/storage/state`,
    {
      headers: authToken
        ? { Authorization: `Bearer ${authToken}` }
        : {},
    }
  );

  return response.data;
}

/* ============================
   📌 STORAGE INTERNAL
   Continua igual
============================ */
export async function getStorageInternal(token?: string): Promise<any> {
  const authToken = token ?? getToken();

  const response = await axios.get<any>(
    `${API_URL}/api/storage/internal`,
    {
      headers: authToken
        ? { Authorization: `Bearer ${authToken}` }
        : {},
    }
  );

  return response.data;
}
