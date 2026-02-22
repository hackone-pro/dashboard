// ======================================================
// FUNÇÕES INTERNAS
// ======================================================

// Buscar tenants admin (somente id + nome)
async function getTenantsAdmin(user: any) {
  if (!user?.id) {
    throw new Error("Usuário não autenticado");
  }

  const registros = await strapi.db
    .query("api::user-multi-tenant.user-multi-tenant")
    .findMany({
      where: {
        role: "admin",
        ativo: true,
        publishedAt: { $notNull: true },
        users_permissions_user: user.id,
      },
      populate: {
        tenant: {
          select: ["id", "organizacao", "documentId"],
          where: {
            publishedAt: { $notNull: true },
          },
        },
      },
    });

  return registros
    .filter((r) => r.tenant?.id)
    .map((r) => r.tenant);
}

// Buscar ativos por tenant
async function getAtivosPorTenant(tenantIds: number[]) {
  if (tenantIds.length === 0) return {};

  const contratos = await strapi.db
    .query("api::contract.contract")
    .findMany({
      where: {
        tenant: { id: { $in: tenantIds } },
        active: true,
        publishedAt: { $notNull: true },
      },
      select: ["edr", "servers", "firewalls"],
      populate: {
        tenant: {
          select: ["id"],
        },
      },
    });

  const ativosPorTenant: Record<number, number> = {};

  contratos.forEach((c) => {
    const tenantId = c.tenant?.id;
    if (!tenantId) return;

    if (!ativosPorTenant[tenantId]) {
      ativosPorTenant[tenantId] = 0;
    }

    ativosPorTenant[tenantId] +=
      (c.edr || 0) +
      (c.servers || 0) +
      (c.firewalls || 0);
  });

  return ativosPorTenant;
}

// Buscar snapshot de risk por tenants (period = 1)
async function getRiskSnapshotPorTenants(tenantDocumentIds: string[]) {
  if (tenantDocumentIds.length === 0) return {};

  const snapshots = await (strapi as any)
    .documents("api::tenant-summary.tenant-summary")
    .findMany({
      filters: { period: 1 },
      fields: ["risk", "critical_inc", "high_inc", "volume_gb"],
      populate: {
        tenant: {
          fields: ["documentId"],
        },
      },
    });

  const riskMap: Record<
    string,
    { risk: number; critical_inc: number; high_inc: number, volume_gb: number  }
  > = {};

  snapshots.forEach((snap: any) => {
    if (
      snap.tenant?.documentId &&
      tenantDocumentIds.includes(snap.tenant.documentId)
    ) {
      riskMap[snap.tenant.documentId] = {
        risk: snap.risk || 0,
        critical_inc: snap.critical_inc || 0,
        high_inc: snap.high_inc || 0,
        volume_gb: snap.volume_gb || 0
      };
    }
  });

  return riskMap;
}

// ======================================================
// EXPORT
// ======================================================

export default {

  // Lista tenants admin
  async listarTenantsAdmin(user: any) {
    try {
      const tenants = await getTenantsAdmin(user);

      return tenants.map((t) => ({
        tenantId: t.id,
        organizacao: t.organizacao,
        role: "admin",
      }));

    } catch (err) {
      strapi.log.error("❌ Erro ao listar tenants admin:", err);
      throw err;
    }
  },

  // Summary MultiTenant (Ativos + Risk Snapshot)
  async summary(user: any) {
    try {
      const tenants = await getTenantsAdmin(user);
  
      if (tenants.length === 0) return [];
  
      const tenantIds = tenants.map((t) => t.id);
      const tenantDocumentIds = tenants.map((t) => t.documentId);
  
      const ativosPorTenant = await getAtivosPorTenant(tenantIds);
      const riskMap = await getRiskSnapshotPorTenants(tenantDocumentIds);
  
      const resultado = tenants.map((tenant) => {
  
        const snap = riskMap[tenant.documentId] ?? {
          risk: 0,
          critical_inc: 0,
          high_inc: 0,
          volume_gb: 0,
        };
  
        return {
          tenantId: tenant.id,
          organizacao: tenant.organizacao,
          summary: {
            ativos: ativosPorTenant[tenant.id] || 0,
            risk: snap.risk,
            critical_inc: snap.critical_inc,
            high_inc: snap.high_inc,
            volume_gb: snap.volume_gb,
          },
        };
      });
  
      return resultado;
  
    } catch (err) {
      strapi.log.error("❌ Erro no summary:", err);
      throw err;
    }
  }
  
};
