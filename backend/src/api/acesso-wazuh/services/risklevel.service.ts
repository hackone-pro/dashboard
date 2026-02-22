import {
    buscarTopGeradoresFirewall,
    buscarTopAgentes,
  } from "../services/acesso-wazuh";
  
  import { buscarIncidentesIris } from "../../acesso-iris/services/acesso-iris";
  
  // =====================================================
  // 🔹 TIPAGEM
  // =====================================================
  
  interface Periodo {
    from: string;
    to: string;
  }
  
  interface RiskFilters {
    diasFirewall?: string;
    diasAgentes?: string;
    diasIris?: string;
    periodo?: Periodo | null;
    user?: any;
  }
  
  // =====================================================
  // 🔹 FUNÇÃO MATEMÁTICA PURA
  // =====================================================
  
  function calcularRiskLevel({
    critico,
    alto,
    medio,
    baixo,
  }: {
    critico: number;
    alto: number;
    medio: number;
    baixo: number;
  }) {
    if (critico > 0) {
      return Math.min(100, 75 + Math.log10(1 + critico) * 10);
    }
  
    if (alto > 0) {
      return Math.min(75, 50 + Math.log10(1 + alto) * 8);
    }
  
    if (medio > 0) {
      return Math.min(50, 25 + Math.log10(1 + medio) * 6);
    }
  
    if (baixo > 0) {
      return Math.min(25, Math.log10(1 + baixo) * 5);
    }
  
    return 0;
  }
  
  // =====================================================
  // 🔹 FUNÇÃO PRINCIPAL (REUTILIZÁVEL)
  // =====================================================
  
  export async function calcularRiskOperacionalTenant(
    tenant: any,
    filtros: RiskFilters = {}
  ) {
    try {
      const diasFirewall = filtros?.diasFirewall || "1";
      const diasAgentes = filtros?.diasAgentes || "1";
      const diasIris = filtros?.diasIris || "1";
      const periodo = filtros?.periodo || null;
      const user = filtros?.user || null;
  
      // =====================================================
      // 🔹 PROMISES RESILIENTES
      // =====================================================
  
      const firewallPromise =
        tenant?.wazuh_url
          ? buscarTopGeradoresFirewall(tenant, diasFirewall, periodo)
          : Promise.resolve([]);
  
      const agentesPromise =
        tenant?.wazuh_url
          ? buscarTopAgentes(tenant, {
              dias: diasAgentes,
              from: periodo?.from,
              to: periodo?.to,
            })
          : Promise.resolve([]);
  
      const irisPromise =
        tenant?.iris_url
          ? buscarIncidentesIris(
              tenant,
              periodo
                ? { from: periodo.from, to: periodo.to }
                : { dias: diasIris },
              user
            )
          : Promise.resolve(null);
  
      // =====================================================
      // 🔹 EXECUTAR EM PARALELO
      // =====================================================
  
      const [firewalls, agentes, iris] = await Promise.all([
        firewallPromise,
        agentesPromise,
        irisPromise,
      ]);
  
      // =====================================================
      // 🔹 AGREGAR SEVERIDADES
      // =====================================================
  
      let baixo = 0;
      let medio = 0;
      let alto = 0;
      let critico = 0;
  
      // 🔸 Firewall
      firewalls?.forEach((fw: any) => {
        baixo += fw?.severidade?.baixo || 0;
        medio += fw?.severidade?.medio || 0;
        alto += fw?.severidade?.alto || 0;
        critico += fw?.severidade?.critico || 0;
      });
  
      // 🔸 Agentes
      agentes?.forEach((agente: any) => {
        agente?.severidades?.forEach((s: any) => {
          if (s.key <= 6) baixo += s.doc_count || 0;
          else if (s.key <= 11) medio += s.doc_count || 0;
          else if (s.key <= 14) alto += s.doc_count || 0;
          else critico += s.doc_count || 0;
        });
      });
  
      // 🔸 IRIS
      if (iris && typeof iris === "object") {
        baixo += iris.baixo || 0;
        medio += iris.medio || 0;
        alto += iris.alto || 0;
        critico += iris.critico || 0;
      }
  
      const total = baixo + medio + alto + critico;
  
      // =====================================================
      // 🔹 CÁLCULO FINAL
      // =====================================================
  
      const indiceRisco = calcularRiskLevel({
        critico,
        alto,
        medio,
        baixo,
      });
  
      return {
        severidades: {
          baixo,
          medio,
          alto,
          critico,
          total,
        },
        indiceRisco: parseFloat(indiceRisco.toFixed(2)),
      };
  
    } catch (error: any) {
      strapi.log.warn(
        `⚠️ Risk operacional falhou tenant ${tenant?.id}: ${error?.message}`
      );
  
      return {
        severidades: {
          baixo: 0,
          medio: 0,
          alto: 0,
          critico: 0,
          total: 0,
        },
        indiceRisco: 0,
      };
    }
  }
  