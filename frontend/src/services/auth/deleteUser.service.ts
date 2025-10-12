import { getToken } from "../../utils/auth";

export async function deleteUser(id: number) {
  const token = getToken();

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/acesso/user/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Erro ao deletar usuário.");
  }

  return response.json();
}
