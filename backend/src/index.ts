// src/index.ts
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

      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId,
        { populate: { tenant: true } }
      ) as any;

      // console.log("✅ Tenant encontrado:", user?.tenant?.id);

      ctx.body.jwt = await strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({
          id: userId,
          tenant_id: user?.tenant?.id ?? null,
        });
    });
  },
};