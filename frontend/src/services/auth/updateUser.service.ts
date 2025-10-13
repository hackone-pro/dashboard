import { getToken } from "../../utils/auth";

export async function updateUser(id: number, dados: any) {
  const token = getToken();

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/acesso/user/${id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const mensagem =
      errorData?.error?.message || errorData?.message || "Erro ao atualizar usuário.";
    throw new Error(mensagem);
  }

  return response.json();
}
