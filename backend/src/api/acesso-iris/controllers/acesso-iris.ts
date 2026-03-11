import { buscarCasos, atualizarCasoIris, buscarUsuariosIris } from "../services/acesso-iris";
import {
  parse,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns";

export default {
  // ======================================================
  // LISTA TODOS OS CASOS IRIS (COM FILTRO from / to)
  // ======================================================
  async listCases(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado para este usuário");

      // 🔹 injeta dinamicamente o owner_name do usuário logado no tenant
      if (user.owner_name_iris) {
        fullUser.tenant.owner_name = user.owner_name_iris;
      }

      // 🔹 período vindo do frontend
      const { from, to } = ctx.query;

      const inicio = from ? startOfDay(new Date(from)) : null;
      const fim = to ? endOfDay(new Date(to)) : null;

      // 🔹 busca casos no IRIS
      const dataResponse = await buscarCasos(fullUser.tenant, fullUser);

      // ✅ normaliza retorno (array ou { data: [] })
      const casos = Array.isArray(dataResponse)
        ? dataResponse
        : Array.isArray(dataResponse?.data)
          ? dataResponse.data
          : [];

      // 🔥 filtro real por data (IRIS usa MM/DD/YYYY)
      const filtrados = casos.filter((caso) => {
        if (!caso.case_open_date) return false;

        const dataCaso = parse(
          caso.case_open_date,
          "MM/dd/yyyy",
          new Date()
        );

        if (isNaN(dataCaso.getTime())) return false;

        if (inicio && isBefore(dataCaso, inicio)) return false;
        if (fim && isAfter(dataCaso, fim)) return false;

        return true;
      });

      return filtrados;
    } catch (err) {
      strapi.log.error(
        "❌ Erro ao buscar casos no Iris:",
        err?.response?.data || err
      );
      return ctx.badRequest("Erro ao acessar Iris");
    }
  },

  // ======================================================
  // LISTA SOMENTE CASOS RECENTES (endpoint legado)
  // ======================================================
  async listarRecentes(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado para este usuário");

      // 🔹 injeta o owner_name do usuário logado também neste endpoint
      if (user.owner_name_iris) {
        fullUser.tenant.owner_name = user.owner_name_iris;
      }

      const casosResponse = await buscarCasos(fullUser.tenant, fullUser);

      // normaliza retorno
      const casos = Array.isArray(casosResponse)
        ? casosResponse
        : Array.isArray(casosResponse?.data)
          ? casosResponse.data
          : [];

      // trata query param ?range=7d etc
      const range = ctx.query.range || "1d"; // default 24h

      let dias = 1;
      if (range === "7d") dias = 7;
      if (range === "30d") dias = 30;

      const inicio = startOfDay(subDays(new Date(), dias));
      const fim = endOfDay(new Date());

      const recentes = casos.filter((caso) => {
        if (!caso.case_open_date) return false;

        const data = parse(
          caso.case_open_date,
          "MM/dd/yyyy",
          new Date()
        );

        return isAfter(data, inicio) && isBefore(data, fim);
      });

      return ctx.send(recentes);
    } catch (err) {
      strapi.log.error(
        "❌ Erro ao listar casos recentes:",
        err?.response?.data || err
      );
      return ctx.internalServerError("Erro ao buscar casos recentes");
    }
  },


  // ======================================================
  // UPDATE Cases
  // ======================================================
  async updateCase(ctx) {
    try {

      const user = ctx.state.user;
      const { caseId, status, severity, outcome, owner, notas, descricaoAtual } = ctx.request.body;
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado");

      const mapStatus = {
        open: 3,
        closed: 9
      };

      const mapOutcome = {
        positivo: 5,
        falso_positivo: 1,  // confirme o id correto no seu IRIS
      };

      const payload: any = {};

      // estado do incidente (open / closed)
      if (status) {
        payload.state_id = mapStatus[status] || 3;
      }
      
      // severidade
      if (severity) {
        payload.severity_id = Number(severity);
      }

      // outcome (false positive / legitimate)
      if (outcome) {
        payload.status_id = mapOutcome[outcome] ?? Number(outcome);
      }

      if (descricaoAtual !== undefined) {
        payload.case_description = descricaoAtual + (notas || "");
      }

      //owner
      if (owner) {
        const usuariosIris = await buscarUsuariosIris(fullUser.tenant);
        const usuarioIris = usuariosIris.find(
          (u) => u.user_name === owner
        );

        if (usuarioIris) {
          payload.owner_id = usuarioIris.user_id;
        } else {
          strapi.log.warn(`Usuário IRIS não encontrado: ${owner}`);
        }
      }

      const result = await atualizarCasoIris(
        fullUser.tenant,
        caseId,
        payload
      );

      return ctx.send(result);

    } catch (err) {

      strapi.log.error(
        "Erro update IRIS:",
        err?.response?.data || err
      );

      return ctx.internalServerError("Erro ao atualizar caso");
    }
  }
};