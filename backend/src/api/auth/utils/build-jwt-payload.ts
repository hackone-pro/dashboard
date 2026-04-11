// backend/src/api/auth/utils/build-jwt-payload.ts

interface JwtTenant {
  id: number;
  uid: string;
  plan: "essentials" | "full";
}

interface JwtPayload {
  id: number;
  tenants: JwtTenant[];
}

export async function buildJwtPayload(user: { id: number }): Promise<JwtPayload> {
  // Reutiliza o servico existente que ja resolve tenant direto + multi-tenant,
  // deduplica, e filtra corretamente
  const resultado = await strapi
    .service("api::user-multi-tenant.user-multi-tenant")
    .buscarTenantsUsuario(user);

  // Buscar uid e plan dos tenants retornados (o servico nao inclui esses campos)
  const tenantIds = resultado.tenantsAcessiveis.map((t: any) => t.id);

  const tenants: JwtTenant[] = [];

  if (tenantIds.length > 0) {
    const tenantRecords = await strapi.db
      .query("api::tenant.tenant")
      .findMany({
        where: { id: { $in: tenantIds } },
        select: ["id", "uid", "plan"],
      });

    // Manter a ordem do servico (tenant ativo primeiro)
    for (const id of tenantIds) {
      const t = tenantRecords.find((r: any) => r.id === id);
      if (t) {
        tenants.push({
          id: t.id,
          uid: t.uid,
          plan: t.plan ?? "full",
        });
      }
    }
  }

  return { id: user.id, tenants };
}
