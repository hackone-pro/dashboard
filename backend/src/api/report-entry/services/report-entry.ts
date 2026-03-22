/**
 * report-entry service (extendido — Vulnerabilidades + RiskLevel Completo)
 */

import { factories } from "@strapi/strapi";

// Services usados
import { buscarVulnSeveridades, buscarTopOSVulnerabilidades } from "../../acesso-wazuh/services/vulnerabilidades.service";
import { buscarTopGeradoresFirewall } from "../../acesso-wazuh/services/firewalls.service";
import { buscarTopAgentes, buscarTopAgentesCis, buscarTopAlteracoesArquivo, buscarTopAgentesSyscheck } from "../../acesso-wazuh/services/agentes.service";
import { buscarIncidentesIris, buscarCasos } from "../../acesso-iris/services/acesso-iris";
import { buscarTopUsers } from "../../acesso-wazuh/services/usuarios.service";
import { buscarDadosReport } from "../../n-eight-n/services/n-eight-n";

import { getTenantAtivo } from "../../acesso-wazuh/controllers/_utils";

import {
  startOfDay,
  endOfDay,
  subDays,
  isAfter,
  isBefore
} from "date-fns";

export default factories.createCoreService(
  "api::report-entry.report-entry",
  ({ strapi }) => ({

    /**
     * ===========================================
     * FUNÇÃO: NORMALIZA PERÍODO EM DIAS
     * ===========================================
     */
    normalizarPeriodoEmDias(period) {
      if (!period) return "1";

      // Ex.: "24h"
      if (period.endsWith("h")) {
        const horas = parseInt(period.replace("h", ""));
        if (!isNaN(horas) && horas > 0) {
          return String(Math.ceil(horas / 24)); // 24h → 1
        }
      }

      // Ex.: "5d"
      if (period.endsWith("d")) {
        return period.replace("d", "");
      }

      // Ex.: "15"
      if (!isNaN(Number(period))) return period;

      return "1";
    },

    /**
     * ====================================================
     * FUNÇÃO: CALCULA O RISKLEVEL COMPLETO (FIRE, AGENTS, IRIS)
     * ====================================================
     */
     async calcularRiskLevelCompleto(tenant, dias, user) {
      const diasFirewall = dias;
      const diasAgentes = dias;
      const diasIris = dias;
    
      let baixo = 0;
      let medio = 0;
      let alto = 0;
      let critico = 0;
    
      // =============================
      // 1. FIREWALL
      // =============================
      const firewall = await buscarTopGeradoresFirewall(tenant, diasFirewall);
      firewall?.forEach((fw: any) => {
        baixo += fw?.severidade?.baixo || 0;
        medio += fw?.severidade?.medio || 0;
        alto += fw?.severidade?.alto || 0;
        critico += fw?.severidade?.critico || 0;
      });
    
      // =============================
      // 2. AGENTES
      // =============================
      const agentes = await buscarTopAgentes(tenant, { dias: diasAgentes });
      agentes?.forEach((agente: any) => {
        agente?.severidades?.forEach((s: any) => {
          if (s.key <= 6) baixo += s.doc_count || 0;
          else if (s.key <= 11) medio += s.doc_count || 0;
          else if (s.key <= 14) alto += s.doc_count || 0;
          else critico += s.doc_count || 0;
        });
      });
    
      // =============================
      // 3. IRIS
      // =============================
      const iris = await buscarIncidentesIris(tenant, { dias: diasIris }, user);
      if (iris && typeof iris === "object") {
        baixo += iris.baixo || 0;
        medio += iris.medio || 0;
        alto += iris.alto || 0;
        critico += iris.critico || 0;
      }
    
      // =============================
      // 4. CÁLCULO — mesma fórmula do risklevel.service
      // =============================
      function calcularRiskLevel({ critico, alto, medio, baixo }) {
        if (critico > 0) return Math.min(100, 75 + Math.log10(1 + critico) * 10);
        if (alto > 0) return Math.min(75, 50 + Math.log10(1 + alto) * 8);
        if (medio > 0) return Math.min(50, 25 + Math.log10(1 + medio) * 6);
        if (baixo > 0) return Math.min(25, Math.log10(1 + baixo) * 5);
        return 0;
      }
    
      const indiceRisco = calcularRiskLevel({ critico, alto, medio, baixo });
    
      return {
        gauge: parseFloat(indiceRisco.toFixed(0)),
      };
    },


    /**
   * ============================================================
   * COLETAR TOP HOSTS (ordenado pelos maiores alertas)
   * ============================================================
   */
    async coletarTopHosts(tenant, dias) {
      const agentes = await buscarTopAgentes(tenant, { dias });

      // Caso não venha nada
      if (!agentes || agentes.length === 0) return [];

      let lista = agentes.map((ag) => {
        const nomeHost = ag.agente || ag.agent || ag.name;

        // Ignora hosts sem nome
        if (!nomeHost || nomeHost.trim() === "") {
          return null;
        }

        let baixo = 0;
        let medio = 0;
        let alto = 0;
        let critico = 0;

        // severidades = buckets → ex.: [{ key: 3, doc_count: 50 }]
        const severidades = ag.severidades || [];

        severidades.forEach((s) => {
          const nivel = Number(s.key);
          const qtd = Number(s.doc_count);

          if (nivel <= 6) baixo += qtd;
          else if (nivel <= 11) medio += qtd;
          else if (nivel <= 14) alto += qtd;
          else critico += qtd;
        });

        const total = ag.total_alertas || (baixo + medio + alto + critico);

        return {
          host: nomeHost,
          baixo,
          medio,
          alto,
          critico,
          total
        };
      });

      // Remove nulos
      lista = lista.filter((h) => h !== null);

      // Ordena pelo maior total
      lista.sort((a, b) => b.total - a.total);

      return lista;
    },


    /**
     * ============================================================
     * TOP AGENTES — CIS SCORE (pior → melhor)
     * ============================================================
     */
    async coletarTopAgentesCis(tenant, dias) {
      const agentes = await buscarTopAgentesCis(tenant, dias);

      if (!agentes || agentes.length === 0) return [];

      let lista = agentes.map((ag) => {
        const host = ag.agente;
        const score = Number(ag.score_cis_percent ?? ag.score ?? 0);

        if (!host || host.trim() === "") return null;

        return {
          host,
          score
        };
      });

      // remove hosts nulos
      lista = lista.filter((h) => h !== null);

      // ordenar pelo menor score primeiro (mais crítico)
      lista.sort((a, b) => a.score - b.score);

      return lista;
    },


    /**
   * ============================================================
   * TOP HOSTS — ALTERAÇÃO DE ARQUIVOS (syscheck)
   * ============================================================
   */
    async coletarTopHostsAlteracoes(tenant, dias) {
      const agentes = await buscarTopAgentesSyscheck(tenant, { dias });

      if (!agentes || agentes.length === 0) return [];

      let lista = agentes.map((ag) => {
        const host = ag.agente;
        if (!host || host.trim() === "") return null;

        const modified = Number(ag.modified ?? 0);
        const added = Number(ag.added ?? 0);
        const deleted = Number(ag.deleted ?? 0);

        const total = modified + added + deleted;

        return {
          host,
          modified,
          added,
          deleted,
          total,
        };
      });

      // remove nulos
      lista = lista.filter((h) => h !== null);

      // ordena pelo maior total
      lista.sort((a, b) => b.total - a.total);

      return lista;
    },

    /**
     * ============================================================
     * TOP HOSTS ALTERADOS POR ORIGEM DA ALTERAÇÃO (syscheck)
     * ============================================================
    */
    async coletarTopHostsPorOrigem(tenant, dias) {
      const lista = await buscarTopUsers(tenant, { dias });

      if (!lista || lista.length === 0) return [];

      return lista.map(u => ({
        usuario: u.user,
        agent_id: u.agent_id,
        host: u.agent_name,
        contagem: u.count,
      }));
    },

    /**
     * ============================================================
     * RESUMO DE AÇÕES NOS ARQUIVOS (syscheck)
     * ============================================================
    */
     async coletarResumoAcoesArquivos(tenant, dias) {
      // ← usa buscarTopAgentesSyscheck em vez de buscarTopAgentes
      const agentes = await buscarTopAgentesSyscheck(tenant, { dias });
    
      if (!agentes || agentes.length === 0) {
        return { modificados: 0, adicionados: 0, deletados: 0 };
      }
    
      let modificados = 0;
      let adicionados = 0;
      let deletados = 0;
    
      for (const ag of agentes) {
        modificados += Number(ag.modified ?? 0);
        adicionados += Number(ag.added ?? 0);
        deletados += Number(ag.deleted ?? 0);
      }
    
      return { modificados, adicionados, deletados };
    },

    /**
     * ============================================================
     * Top Acessos N8N
     * ============================================================
    */
    async coletarTopAcessosN8N(tenant, dias) {
      try {
        // 1. obter dados do n8n
        const dados = await buscarDadosReport(dias, tenant.cliente_name);

        if (!dados?.topUrls || dados.topUrls.length === 0) {
          return [];
        }

        // 2. transformar no formato padronizado
        return dados.topUrls.map(item => ({
          url: item[0],
          ocorrencias: item[1],
        }));

      } catch (e) {
        strapi.log.error("Erro ao coletar Top Acessos N8N:", e);
        return [];
      }
    },

    /**
     * ============================================================
     * Top Usuarios N8N
     * ============================================================
    */
    async coletarTopUsuariosN8N(tenant, dias = "15") {
      try {
        // Chama diretamente o buscarDadosReport do módulo n-eight-n
        const dados = await buscarDadosReport(dias, tenant.cliente_name);

        if (!dados) return [];

        const lista =
          dados.topUsers ||
          dados.output?.topUsers ||
          [];

        return lista.map((item) => {
          // Caso venha em forma de array [user, acessos]
          if (Array.isArray(item)) {
            return {
              user: item[0],
              acessos: item[1],
            };
          }

          // Caso venha como objeto
          return {
            user: item.user || "-",
            acessos: item.logs ?? item.total ?? 0,
          };
        });

      } catch (e) {
        strapi.log.error("❌ Erro ao coletar top usuários (n8n):", e);
        return [];
      }
    },

    /**
     * ============================================================
     * Top Aplicações N8N
     * ============================================================
    */
    async coletarTopAplicacoesN8N(tenant, dias: string) {
      try {
        const dados = await buscarDadosReport(dias, tenant.cliente_name);

        // dados.topApps vem no formato: [ ["HTTPS",999], ["PING",781], ... ]
        return dados?.topApps ?? [];

      } catch (err) {
        strapi.log.error("❌ Erro ao coletar Top Aplicações via n8n:", err);
        return [];
      }
    },

    /**
     * ============================================================
     * COLETAR — Top Categorias via n8n
     * ============================================================
    */
    async coletarTopCategoriasN8N(tenant, dias: string) {
      try {

        const dados = await buscarDadosReport(dias, tenant.cliente_name);

        // O n8n retorna:
        // topCats: [ ["unscanned", 4591924], ["DNS", 111], ... ]

        return dados?.topCats ?? [];

      } catch (err) {
        strapi.log.error("❌ Erro ao coletar Top Categorias via n8n:", err);
        return [];
      }
    },

    /**
     * ============================================================
     * COLETAR — Top Usuários por Volume de Aplicação via N8N
     * ============================================================
    */
    async coletarTopUsuariosAplicacaoN8N(tenant, dias: string) {
      try {
        const dados = await buscarDadosReport(dias, tenant.cliente_name);

        // n8n retorna: { tabelaResumo: [ { user, application, total_bytes } ] }
        return dados?.tabelaResumo ?? [];

      } catch (err) {
        strapi.log.error("❌ Erro ao coletar Top Usuários por Aplicação via n8n:", err);
        return [];
      }
    },

    /**
     * ============================================================
     * Top Acesso Detalhado — N8N
     * ============================================================
    */
    async coletarTopAcessoDetalhadoN8N(tenant, dias: string) {
      try {
        const dados = await buscarDadosReport(dias, tenant.cliente_name);

        // esperados:
        // { tabelaResumo: [ { "#": 1, application: "...", category: "...", user: "...", total_bytes: "..." } ] }
        return dados?.tabelaResumo ?? [];

      } catch (err) {
        strapi.log.error("❌ Erro ao coletar Top Acesso Detalhado via n8n:", err);
        return [];
      }
    },

    async coletarIncidentesDetalhados(tenant, dias, user) {

      const casosResponse = await buscarCasos(tenant, user);
      const casos = Array.isArray(casosResponse)
        ? casosResponse
        : casosResponse?.data || [];

      // converte dias
      let diasNum = 1;
      if (dias === "5") diasNum = 5;
      else if (dias === "15") diasNum = 15;
      else if (dias === "30") diasNum = 30;
      else if (dias === "todos") diasNum = 0;

      const inicio = startOfDay(subDays(new Date(), diasNum));
      const fim = endOfDay(new Date());

      const ownerUser = user?.owner_name_iris || "";
      const clienteName = tenant?.cliente_name || "";
      const ownersValidos = [ownerUser, "Inteligencia_Artificial"];

      const filtrados = casos.filter((caso) => {
        if (!caso.case_open_date) return false;

        let data = new Date(caso.case_open_date);
        if (isNaN(data.getTime())) {
          const partes = caso.case_open_date.split(/[\/\-]/);
          if (partes.length === 3) {
            const [a, b, c] = partes.map((x) => parseInt(x, 10));
            data = a > 1900 ? new Date(a, b - 1, c) : new Date(c, a - 1, b);
          }
        }
        if (isNaN(data.getTime())) return false;

        const dentroDoPeriodo =
          diasNum === 0 ? true : isAfter(data, inicio) && isBefore(data, fim);

        const ownerCaso = caso.owner || caso.owner_name || "";
        const matchOwner =
          ownersValidos.includes(ownerCaso) ||
          (ownerCaso === "Inteligencia_Artificial" &&
            caso.case_name?.includes(clienteName));

        return dentroDoPeriodo && matchOwner;
      });

      const total = filtrados.length;

      const abertos = filtrados.filter(
        i => (i.case_status || "").toLowerCase() === "open"
      ).length;

      const fechados = filtrados.filter(
        i => (i.case_status || "").toLowerCase() === "closed"
      ).length;

      const atribuidos = filtrados.filter(
        i => i.owner || i.owner_name
      ).length;

      const nao_atribuidos = total - atribuidos;

      const ultimos = [...filtrados]
        .sort(
          (a, b) =>
            new Date(b.case_open_date).getTime() -
            new Date(a.case_open_date).getTime()
        )
        .slice(0, 5);

        return {
          total,
          abertos,
          fechados,
          atribuidos,
          nao_atribuidos,
          lista: filtrados,
          ultimos,
        };
    },

    /**
     * ==========================================================
     * GERAR RELATÓRIO
     * ==========================================================
     */

    gerarNomeRelatorio() {
      const agora = new Date();

      // Converte para horário do Brasil
      const brasil = new Date(
        agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
      );

      const pad = (n) => String(n).padStart(2, "0");

      const ano = brasil.getFullYear();
      const mes = pad(brasil.getMonth() + 1);
      const dia = pad(brasil.getDate());
      const hora = pad(brasil.getHours());
      const min = pad(brasil.getMinutes());
      const seg = pad(brasil.getSeconds());

      return `securityone_${dia}${mes}${ano}_${hora}${min}${seg}`;
    },

    async gerarRelatorio(ctx) {
      try {
        const user = ctx.state.user;
        if (!user) throw new Error("Usuário não autenticado");

        const tenant = await getTenantAtivo(ctx);
        if (!tenant) throw new Error("Tenant ativo não encontrado");

        const { period = "24h", sections = [] } = ctx.request.body;

        // Normaliza período
        const diasNormalizados = this.normalizarPeriodoEmDias(period);

        // Criar registro inicial
        const entry = await strapi.entityService.create(
          "api::report-entry.report-entry",
          {
            data: {
              tenant: tenant.cliente_name,
              period,
              sections,
              progress: "gerando",
              nome: this.gerarNomeRelatorio(),
              snapshot: {},
            },
          }
        );

        const snapshot: Record<string, any> = {};

        // ==================================================
        // 1. Vulnerabilidades Detectadas
        // ==================================================
        if (sections.includes("Vulnerabilidades Detectadas")) {
          snapshot.vulnerabilidades = await buscarVulnSeveridades(tenant, {
            // dias: `${diasNormalizados}d`,
            dias: "todos",
          });
        }

        // ==================================================
        // 2. NÍVEL DE RISCO COMPLETO (FIRE + AGENTES + IRIS)
        // ==================================================
        if (sections.includes("Nível de Risco")) {
          snapshot.riskLevel = await this.calcularRiskLevelCompleto(
            tenant,
            diasNormalizados,
            user
          );
        }

        // ==================================================
        // 3. Top Hosts por Nível de Alertas
        // ==================================================
        if (sections.includes("Top Hosts por Nível de Alertas")) {
          snapshot.topHosts = await this.coletarTopHosts(
            tenant,
            // diasNormalizados,
            "todos"
          );
        }

        // ==================================================
        // 4. Top CIS
        // ==================================================
        if (sections.includes("Segurança dos Servidores (CIS Score)")) {
          snapshot.cisHosts = await this.coletarTopAgentesCis(
            tenant,
            diasNormalizados
          );
        }

        // ==================================================
        // 5. Top 5 Sistemas Operacionais Detectados
        // ==================================================
        if (sections.includes("Top 5 Sistemas Operacionais Detectados")) {
          snapshot.topOS = await buscarTopOSVulnerabilidades(tenant, {
            size: 50,
            dias: "todos",
          });
        }

        // ===============================================================
        //  6 — Top Hosts por Alteração de Arquivos
        // ===============================================================
        if (sections.includes("Top Hosts por Alteração de Arquivos")) {

          const diasNormalizados = "todos";

          snapshot.topHostsAlteracoes =
            await this.coletarTopHostsAlteracoes(tenant, diasNormalizados);
        }

        // ===============================================================
        // 7 - TOP HOSTS ALTERADOS POR ORIGEM DA ALTERAÇÃO (syscheck)
        // ===============================================================
        if (sections.includes("Top Hosts Alterados por Origem da Alteração")) {

          const diasNormalizados = "todos";

          snapshot.topHostsOrigem =
            await this.coletarTopHostsPorOrigem(tenant, diasNormalizados);
        }

        // ===============================================================
        //  8 - RESUMO DE AÇÕES NOS ARQUIVOS (syscheck)
        // ===============================================================
        if (sections.includes("Resumo de Ações nos Arquivos")) {

          const diasNormalizados = "todos";  // igual às outras seções syscheck

          snapshot.resumoAcoes =
            await this.coletarResumoAcoesArquivos(tenant, diasNormalizados);
        }

        // ===============================================================
        // 9 — Top Acessos (URLs) — via integração n8n
        // ===============================================================
        if (sections.includes("Top Acessos (URLs)")) {

          try {
            // 🔹 Puxa dados do n8n usando o tenant ativo
            const cliente = tenant.cliente_name;
            const periodo = diasNormalizados;     // você pode usar "todos" se quiser

            const dadosN8N = await buscarDadosReport(periodo, cliente);

            // 🔹 Salva no snapshot
            snapshot.topAcessos = {
              urls: dadosN8N?.topUrls ?? [],
              total: dadosN8N?.totals ?? null,
            };

          } catch (err) {
            strapi.log.error("Erro ao buscar Top Acessos (n8n):", err);
            snapshot.topAcessos = {
              urls: [],
              total: null,
              erro: true,
            };
          }
        }

        // ===============================================================
        // 10 — Top Usuarios n8n
        // ===============================================================
        if (sections.includes("Top Usuários")) {

          const diasNormalizados = "15"; // padrão igual ao n8n

          snapshot.topUsers =
            await this.coletarTopUsuariosN8N(tenant, diasNormalizados);
        }

        // ===============================================================
        // 11 — Top Aplicações (n8n)
        // ===============================================================
        if (sections.includes("Top Aplicações")) {

          const diasNormalizados = "15"; // mesmo padrão usado para Top Usuários

          snapshot.topApps =
            await this.coletarTopAplicacoesN8N(tenant, diasNormalizados);
        }

        // ===============================================================
        // 12 — Top Categorias n8n
        // ===============================================================
        if (sections.includes("Top Categorias")) {

          const diasNormalizados = "15"; // seu padrão

          snapshot.topCategorias =
            await this.coletarTopCategoriasN8N(tenant, diasNormalizados);
        }

        // ============================================================
        // 13 - Top Usuários por Aplicação (n8n)
        // ============================================================
        if (sections.includes("Top Usuários por Volume de Aplicação")) {

          const diasNormalizados = "15"; // mesmo padrão n8n

          snapshot.topUsuariosAplicacao =
            await this.coletarTopUsuariosAplicacaoN8N(tenant, diasNormalizados);
        }

        // ============================================================
        // 14 - Top Acesso Detalhado N8N
        // ============================================================
        if (sections.includes("Top Acesso Detalhado")) {

          const diasNormalizados = "15"; // mesmo padrão do restante

          snapshot.topAcessoDetalhado =
            await this.coletarTopAcessoDetalhadoN8N(tenant, diasNormalizados);
        }

        // ============================================================
        // 15 — Incidentes (IRIS)
        // ============================================================
        if (sections.includes("Incidentes")) {

          snapshot.incidentes =
            await this.coletarIncidentesDetalhados(
              tenant,
              diasNormalizados,
              user
            );
        }


        // Finalização
        const finalizado = await strapi.entityService.update(
          "api::report-entry.report-entry",
          entry.id,
          {
            data: {
              progress: "finalizado",
              snapshot,
              updatedAt: new Date(),
            },
          }
        );

        return finalizado;

      } catch (e) {
        console.error("❌ Erro ao gerar relatório:", e);
        throw e;
      }
    },

  })
);
