import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export type UsuarioTenant = {
  id: number;
  nome: string;
  email: string;
  owner_name_iris: string | null;
  confirmed: boolean;
  blocked: boolean;
};

type UsuarioListResponse = {
  usuarios: UsuarioTenant[];
};

export async function getUsuariosTenant(
  token: string
): Promise<UsuarioTenant[]> {

  const response = await axios.get<UsuarioListResponse>(
    `${API_URL}/api/acesso/user/list`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.usuarios || [];
}