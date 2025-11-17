import { resolveCountryCoords } from '../../../utils/countryResolver';
import {
  buscarSeveridadeIndexer,
  buscarTopGeradoresFirewall,
  buscarTopAgentes,
  buscarTopAgentesCis,
  buscarTopPaisesAtaque,
  buscarVulnSeveridades,
  buscarTopVulnerabilidades,
  buscarTopOSVulnerabilidades,
  buscarTopAgentesVulnerabilidades,
  buscarTopPackagesVulnerabilidades,
  buscarTopScoresVulnerabilidades,
  buscarVulnerabilidadesPorAno,
  buscarEventosSummary,
  buscarEventosOvertime,
  buscarRuleDistribution,
  buscarTopUsers
} from '../services/acesso-wazuh';

import {
  buscarCasos,
  buscarIncidentesIris, // 👈 novo
} from "../../acesso-iris/services/acesso-iris";

export default {
  async severidade(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7"; // 👈 adiciona o filtro

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarSeveridadeIndexer(tenantData, dias); // 👈 passa o segundo argumento

      return ctx.send({ severidade: resultado });
    } catch (error) {
      console.error("Erro ao buscar severidade:", error);
      return ctx.internalServerError("Erro ao consultar severidade");
    }
  },


  async buscarTenantPorUsuario(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      return ctx.send(tenant[0]); // ou retornar apenas alguns campos se quiser limitar

    } catch (error) {
      console.error("Erro ao buscar tenant:", error);
      return ctx.internalServerError("Erro ao consultar tenant");
    }
  },

  async topGeradores(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7"; // valores: "1", "7", "15", "30", "todos"

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarTopGeradoresFirewall(tenantData, dias);

      return ctx.send({ topGeradores: resultado });

    } catch (error) {
      console.error("Erro ao buscar top geradores:", error);
      return ctx.internalServerError("Erro ao consultar top geradores");
    }
  },

  async topAgentes(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7";

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarTopAgentes(tenantData, dias);

      return ctx.send({ topAgentes: resultado });

    } catch (error) {
      console.error("Erro ao buscar top agentes com risco:", error);
      return ctx.internalServerError("Erro ao consultar top agentes");
    }
  },

  async topAgentesCis(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7";

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarTopAgentesCis(tenantData, dias);

      return ctx.send({ topAgentesCis: resultado });

    } catch (error) {
      console.error("Erro ao buscar top agentes CIS:", error);
      return ctx.internalServerError("Erro ao consultar top agentes CIS");
    }
  },

  async topPaisesOrigem(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7"; // "1","7","15","30","todos"

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarTopPaisesAtaque(tenantData, dias);

      return ctx.send({ topPaises: resultado });
    } catch (error) {
      console.error("Erro ao buscar top países de origem:", error);
      return ctx.internalServerError("Erro ao consultar top países");
    }
  },

  async topPaisesOrigemGeo(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const dias = ctx.query.dias || "7";
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
      const resultado = await buscarTopPaisesAtaque(tenantData, dias);
  
      // Pegamos apenas os "destinos"
      const destinos = resultado.filter((p: any) => p.tipo === "destino");
  
      // Criamos os flows juntando ORIGEM → DESTINO
      const flows = destinos.flatMap((dest: any) => {
        return (dest.origens || []).map((o: any) => ({
          origem: {
            ip: o.ip,
            pais: o.pais ?? null,
            city: o.city ?? null,
            region: o.region ?? null,
            lat: o.lat ?? null,
            lng: o.lng ?? null,
            srcport: o.srcport ?? null,
            servico: o.servico ?? null,
            interface: o.interface ?? null,
          },
          destino: {
            ip: dest.destino,
            pais: dest.pais ?? null,
            city: dest.city ?? null,
            region: dest.region ?? null,
            lat: dest.lat ?? null,
            lng: dest.lng ?? null,
            agente: dest.agente ?? null,
            dstintf: dest.dstintf ?? null,
            dstport: dest.dstport ?? null,
            devname: dest.devname ?? null,
          },
          total: o.total,
          severidades: dest.severidades,
        }));
      });
  
      return ctx.send({ flows });
    } catch (error) {
      console.error("Erro ao buscar fluxos de ataque:", error);
      return ctx.internalServerError("Erro ao consultar fluxos de ataque");
    }
  },
  

  async vulnSeveridades(ctx) {
    try {
      // 🔒 1. Valida usuário autenticado
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      // 🔍 2. Busca tenant ativo vinculado ao usuário
      const tenantList = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
        limit: 1,
      });
  
      const tenant = tenantList?.[0];
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      // ⚙️ 3. Busca dados de vulnerabilidades
      const resultado = await buscarVulnSeveridades(tenant);
  
      // 🧩 4. Garante retorno consistente (igual ao Elasticsearch)
      return ctx.send({
        took: 1,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        aggregations: {
          severity: {
            buckets: {
              Pending: { doc_count: resultado.Pending },
              Critical: { doc_count: resultado.Critical },
              High: { doc_count: resultado.High },
              Medium: { doc_count: resultado.Medium },
              Low: { doc_count: resultado.Low },
            },
          },
          total: { doc_count: resultado.Total },
        },
      });
  
    } catch (error) {
      console.error("❌ Erro ao buscar vulnerabilidades resumo:", error);
      return ctx.internalServerError("Erro ao consultar vulnerabilidades resumo");
    }
  },
  

  async topVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];

      // lê query params (opcionais)
      const { by = "cve", size = "5", dias = "todos" } = ctx.query;

      const resultado = await buscarTopVulnerabilidades(tenantData, {
        by: String(by) as any,
        size: Number(size),
        dias: String(dias),
      });

      return ctx.send({ topVulnerabilidades: resultado });
    } catch (error) {
      console.error("Erro ao buscar top vulnerabilidades:", error);
      return ctx.internalServerError("Erro ao consultar top vulnerabilidades");
    }
  },

  async topOSVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];

      // query params opcionais
      const { size = "5", dias = "todos" } = ctx.query;

      const resultado = await buscarTopOSVulnerabilidades(tenantData, {
        size: Number(size),
        dias: String(dias),
      });

      return ctx.send({ topOS: resultado });
    } catch (error) {
      console.error("Erro ao buscar top OS vulnerabilidades:", error);
      return ctx.internalServerError("Erro ao consultar top OS vulnerabilidades");
    }
  },

  async topAgentesVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];

      // query params opcionais
      const { size = "5", dias = "todos" } = ctx.query;

      const resultado = await buscarTopAgentesVulnerabilidades(tenantData, {
        size: Number(size),
        dias: String(dias),
      });

      return ctx.send({ topAgentes: resultado });
    } catch (error) {
      console.error("Erro ao buscar top Agentes vulnerabilidades:", error);
      return ctx.internalServerError("Erro ao consultar top Agentes vulnerabilidades");
    }
  },

  async topPackagesVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];

      // query params opcionais
      const { size = "5", dias = "todos" } = ctx.query;

      const resultado = await buscarTopPackagesVulnerabilidades(tenantData, {
        size: Number(size),
        dias: String(dias),
      });

      return ctx.send({ topPackages: resultado });
    } catch (error) {
      console.error("Erro ao buscar top Packages vulnerabilidades:", error);
      return ctx.internalServerError("Erro ao consultar top Packages vulnerabilidades");
    }
  },

  async topScoresVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];

      // query params opcionais
      const { size = "5", dias = "todos" } = ctx.query;

      const resultado = await buscarTopScoresVulnerabilidades(tenantData, {
        size: Number(size),
        dias: String(dias),
      });

      return ctx.send({ topScores: resultado });
    } catch (error) {
      console.error("Erro ao buscar top scores de vulnerabilidades:", error);
      return ctx.internalServerError(
        "Erro ao consultar top scores de vulnerabilidades"
      );
    }
  },

  async porAnoVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      // busca tenant ativo do usuário
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];

      // query params opcionais
      const { dias = "todos" } = ctx.query;

      const resultado = await buscarVulnerabilidadesPorAno(tenantData, {
        dias: String(dias),
      });

      return ctx.send({ porAno: resultado });
    } catch (error) {
      console.error("Erro ao buscar vulnerabilidades por ano:", error);
      return ctx.internalServerError(
        "Erro ao consultar vulnerabilidades por ano"
      );
    }
  },

  async overtimeEventos(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const { dias = "todos" } = ctx.query;

      // 👇 Corrigido para chamar a função certa
      const resultado = await buscarEventosOvertime(tenantData, {
        dias: String(dias),
      });

      return ctx.send({ overtime: resultado });
    } catch (error) {
      console.error("Erro ao buscar eventos overtime:", error);
      return ctx.internalServerError("Erro ao consultar eventos overtime");
    }
  },

  async eventosSummary(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const { dias = "todos" } = ctx.query;

      const resultado = await buscarEventosSummary(tenantData, {
        dias: String(dias),
      });

      return ctx.send({ eventos: resultado });
    } catch (error) {
      console.error("Erro ao buscar eventos summary:", error);
      return ctx.internalServerError("Erro ao consultar eventos summary");
    }
  },

  async ruleDistribution(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const { dias = "todos" } = ctx.query;

      const resultado = await buscarRuleDistribution(tenantData, {
        dias: String(dias),
      });

      return ctx.send({ rules: resultado });
    } catch (error) {
      console.error("Erro ao buscar rule distribution:", error);
      return ctx.internalServerError("Erro ao consultar rule distribution");
    }
  },

  async topUsers(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      // Buscar tenant ativo vinculado ao usuário
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const { dias = "todos" } = ctx.query;

      // Chama o service que criamos
      const resultado = await buscarTopUsers(tenantData, {
        dias: String(dias),
      });

      return ctx.send({ topUsers: resultado });
    } catch (error) {
      console.error("Erro ao buscar top users:", error);
      return ctx.internalServerError("Erro ao consultar top users");
    }
  },

  async riskLevel(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      // 🔹 Filtros
      const diasGlobal = ctx.query.dias || "1";
      const diasFirewall = ctx.query.firewall || diasGlobal;
      const diasAgentes = ctx.query.agentes || diasGlobal;
      const diasSeveridade = ctx.query.severidade || diasGlobal;
      const diasIris = ctx.query.iris || diasGlobal;

      // 🔹 Tenant ativo do usuário
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0)
        return ctx.notFound("Tenant não encontrado ou inativo");

      const tenantData = tenant[0];

      // 🔹 Buscar dados de todas as fontes
      const [fw, agentes, severidade, iris] = await Promise.all([
        buscarTopGeradoresFirewall(tenantData, diasFirewall),
        buscarTopAgentes(tenantData, diasAgentes),
        buscarSeveridadeIndexer(tenantData, diasSeveridade),
        buscarIncidentesIris(tenantData, diasIris, ctx.state.user), // ✅ IRIS real
      ]);

      // 🔹 Inicializa totais
      let baixo = severidade.baixo || 0;
      let medio = severidade.medio || 0;
      let alto = severidade.alto || 0;
      let critico = severidade.critico || 0;
      let total = severidade.total || 0;

      // 🔹 Firewall
      fw.forEach((item) => {
        baixo += item.severidade.baixo;
        medio += item.severidade.medio;
        alto += item.severidade.alto;
        critico += item.severidade.critico;
        total += item.total;
      });

      // 🔹 Agentes
      agentes.forEach((agente) => {
        agente.severidades.forEach((s) => {
          if (s.key <= 6) baixo += s.doc_count;
          else if (s.key <= 11) medio += s.doc_count;
          else if (s.key <= 14) alto += s.doc_count;
          else critico += s.doc_count;
          total += s.doc_count;
        });
      });

      // 🔹 IRIS (incidentes)
      if (iris && typeof iris === "object") {
        baixo += iris.baixo || 0;
        medio += iris.medio || 0;
        alto += iris.alto || 0;
        critico += iris.critico || 0;
        total += iris.total || 0;
      }

      // 🔹 Calcular índice global ponderado
      const risco =
        total > 0
          ? ((baixo * 0.2 + medio * 0.6 + alto * 0.80 + critico * 1.0) / total) * 100
          : 0;

      // 🔹 Log detalhado para depuração
      strapi.log.info(
        `🧩 RiskLevel (${diasGlobal}d): FW=${fw.length}, Agentes=${agentes.length}, IRIS=${iris.total || 0}, Severidade.total=${severidade.total || 0}`
      );

      return ctx.send({
        severidades: { baixo, medio, alto, critico, total },
        indiceRisco: parseFloat(risco.toFixed(2)),
        filtrosUsados: {
          diasGlobal,
          diasFirewall,
          diasAgentes,
          diasSeveridade,
          diasIris,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao calcular RiskLevel:", error);
      return ctx.internalServerError("Erro ao calcular RiskLevel");
    }
  }

}