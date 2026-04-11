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
  // 1. Buscar o tenant direto do usuario (relacao user.tenant)
  const fullUser = await strapi.db
    .query("plugin::users-permissions.user")
    .findOne({
      where: { id: user.id },
      populate: {
        tenant: {
          select: ["id", "uid", "plan"],
        },
      },
    });

  // 2. Buscar todos os registros user-multi-tenant ativos
  const acessos = await strapi.db
    .query("api::user-multi-tenant.user-multi-tenant")
    .findMany({
      where: { users_permissions_user: user.id, ativo: true },
      populate: {
        tenant: {
          select: ["id", "uid", "plan"],
        },
      },
    });

  // 3. Montar lista de tenants (direto + multi-tenant), sem duplicatas
  const seen = new Set<number>();
  const tenants: JwtTenant[] = [];

  const addTenant = (t: any) => {
    if (!t || seen.has(t.id)) return;
    seen.add(t.id);
    tenants.push({
      id: t.id,
      uid: t.uid,
      plan: t.plan ?? "full",
    });
  };

  // Tenant direto do usuario primeiro
  if (fullUser?.tenant) {
    addTenant(fullUser.tenant);
  }

  // Tenants via multi-tenant
  for (const acesso of acessos) {
    addTenant(acesso.tenant);
  }

  return { id: user.id, tenants };
}
