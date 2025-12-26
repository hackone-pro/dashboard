// src/services/wazuh/mitre-techniques.service.ts
import { getToken } from "../../utils/auth";

/* ============================================
   TYPES
============================================ */
export interface MitreTechniqueItem {
    tecnica: string;      // ex: T1059 ou Command and Scripting Interpreter
    total: number;
    percentual: number;
}

export interface MitreTacticItem {
    tatica: string;       // ex: Execution, Persistence
    total: number;
    percentual: number;
}


/* ============================================
   SERVICE
============================================ */
/**
 * Busca o total de ataques por técnica MITRE
 * agregados no backend (Wazuh).
 */
export async function getMitreTechniquesAndTactics(
    dias: string = "7"
): Promise<{
    techniques: MitreTechniqueItem[];
    tactics: MitreTacticItem[];
}> {
    const token = getToken();
    const baseUrl = import.meta.env.VITE_API_URL;

    const url = new URL(`${baseUrl}/api/acesso/wazuh/mitre-techniques`);
    if (dias) url.searchParams.set("dias", dias);

    const response = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        let mensagem = "Erro ao buscar MITRE";
        try {
            const err = await response.json();
            if (err?.error?.message) mensagem = err.error.message;
        } catch {
            /* ignore */
        }
        throw new Error(mensagem);
    }

    const data = await response.json();

    const techniques: MitreTechniqueItem[] = Array.isArray(
        data?.topMitreTechniques
    )
        ? data.topMitreTechniques.map((item: any) => ({
            tecnica: String(item?.tecnica ?? ""),
            total: Number(item?.total ?? 0),
            percentual: Number(item?.percentual ?? 0),
        }))
        : [];

    const tactics: MitreTacticItem[] = Array.isArray(data?.topMitreTactics)
        ? data.topMitreTactics.map((item: any) => ({
            tatica: String(item?.tatica ?? ""),
            total: Number(item?.total ?? 0),
            percentual: Number(item?.percentual ?? 0),
        }))
        : [];

    return { techniques, tactics };
}