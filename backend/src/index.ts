// src/index.ts
import { buildJwtPayload } from "./api/auth/utils/build-jwt-payload";

export default {
  register({ strapi }: { strapi: any }) {},

  async bootstrap({ strapi }: { strapi: any }) {
    // Registra um middleware global que intercepta o login
    strapi.server.use(async (ctx: any, next: any) => {
      await next();

      // Só intercepta POST /api/auth/local com status 200
      if (
        ctx.method !== "POST" ||
        ctx.path !== "/api/auth/local" ||
        ctx.status !== 200
      ) return;

      const userId = ctx.body?.user?.id;
      if (!userId) return;

      // console.log("✅ Login interceptado, userId:", userId);

      const payload = await buildJwtPayload({ id: userId });
      ctx.body.jwt = await strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue(payload);
    });
  },
};