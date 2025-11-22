import {
    buscarVulnSeveridades,
    buscarTopVulnerabilidades,
    buscarTopOSVulnerabilidades,
    buscarTopAgentesVulnerabilidades,
    buscarTopPackagesVulnerabilidades,
    buscarTopScoresVulnerabilidades,
    buscarVulnerabilidadesPorAno
} from "../services/acesso-wazuh";

import { getTenantAtivo } from "./_utils";

function validarBy(value: any): "cve" | "package" | "agent" {
    if (value === "cve" || value === "package" || value === "agent") {
        return value;
    }
    return "cve";
}

export default {
    //  1) Severidades das vulnerabilidades
    async vulnSeveridades(ctx) {
        try {
            const tenant = await getTenantAtivo(ctx);
            if (!tenant) {
                return ctx.notFound("Tenant não encontrado ou inativo");
            }

            const resultado = await buscarVulnSeveridades(tenant);

            return ctx.send({ aggregations: resultado });

        } catch (error) {
            console.error("Erro ao buscar vulnerabilidades resumo:", error);
            return ctx.internalServerError("Erro ao consultar vulnerabilidades resumo");
        }
    },

    //  2) Top vulnerabilidades (por CVE, pacote, etc.)
    async topVulnerabilidades(ctx) {
        try {
            const tenant = await getTenantAtivo(ctx);
            if (!tenant) {
                return ctx.notFound("Tenant não encontrado ou inativo");
            }

            const { by = "cve", size = "5", dias = "todos" } = ctx.query;

            const resultado = await buscarTopVulnerabilidades(tenant, {
                by: validarBy(by),
                size: Number(size),
                dias: String(dias),
            });

            return ctx.send({ topVulnerabilidades: resultado });

        } catch (error) {
            console.error("Erro ao buscar top vulnerabilidades:", error);
            return ctx.internalServerError("Erro ao consultar top vulnerabilidades");
        }
    },

    //  3) Top vulnerabilidades por Sistema Operacional
    async topOSVulnerabilidades(ctx) {
        try {
            const tenant = await getTenantAtivo(ctx);
            if (!tenant) {
                return ctx.notFound("Tenant não encontrado ou inativo");
            }

            const { size = "5", dias = "todos" } = ctx.query;

            const resultado = await buscarTopOSVulnerabilidades(tenant, {
                size: Number(size),
                dias: String(dias),
            });

            return ctx.send({ topOS: resultado });

        } catch (error) {
            console.error("Erro ao buscar top OS vulnerabilidades:", error);
            return ctx.internalServerError("Erro ao consultar top OS vulnerabilidades");
        }
    },

    //  4) Top vulnerabilidades por Agentes
    async topAgentesVulnerabilidades(ctx) {
        try {
            const tenant = await getTenantAtivo(ctx);
            if (!tenant) {
                return ctx.notFound("Tenant não encontrado ou inativo");
            }

            const { size = "5", dias = "todos" } = ctx.query;

            const resultado = await buscarTopAgentesVulnerabilidades(tenant, {
                size: Number(size),
                dias: String(dias),
            });

            return ctx.send({ topAgentes: resultado });

        } catch (error) {
            console.error("Erro ao buscar top Agentes vulnerabilidades:", error);
            return ctx.internalServerError("Erro ao consultar top Agentes vulnerabilidades");
        }
    },

    //  5) Top pacotes vulneráveis
    async topPackagesVulnerabilidades(ctx) {
        try {
            const tenant = await getTenantAtivo(ctx);
            if (!tenant) {
                return ctx.notFound("Tenant não encontrado ou inativo");
            }

            const { size = "5", dias = "todos" } = ctx.query;

            const resultado = await buscarTopPackagesVulnerabilidades(tenant, {
                size: Number(size),
                dias: String(dias),
            });

            return ctx.send({ topPackages: resultado });

        } catch (error) {
            console.error("Erro ao buscar top Packages vulnerabilidades:", error);
            return ctx.internalServerError("Erro ao consultar top Packages vulnerabilidades");
        }
    },

    //  6) Top scores de vulnerabilidades (CVSS)
    async topScoresVulnerabilidades(ctx) {
        try {
            const tenant = await getTenantAtivo(ctx);
            if (!tenant) {
                return ctx.notFound("Tenant não encontrado ou inativo");
            }

            const { size = "5", dias = "todos" } = ctx.query;

            const resultado = await buscarTopScoresVulnerabilidades(tenant, {
                size: Number(size),
                dias: String(dias),
            });

            return ctx.send({ topScores: resultado });

        } catch (error) {
            console.error("Erro ao buscar top scores de vulnerabilidades:", error);
            return ctx.internalServerError("Erro ao consultar top scores de vulnerabilidades");
        }
    },

    //  7) Vulnerabilidades por ano
    async porAnoVulnerabilidades(ctx) {
        try {
            const tenant = await getTenantAtivo(ctx);
            if (!tenant) {
                return ctx.notFound("Tenant não encontrado ou inativo");
            }

            const { dias = "todos" } = ctx.query;

            const resultado = await buscarVulnerabilidadesPorAno(tenant, {
                dias: String(dias),
            });

            return ctx.send({ porAno: resultado });

        } catch (error) {
            console.error("Erro ao buscar vulnerabilidades por ano:", error);
            return ctx.internalServerError("Erro ao consultar vulnerabilidades por ano");
        }
    },
};
