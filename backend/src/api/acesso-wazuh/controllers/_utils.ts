export async function getTenantAtivo(ctx) {
    const userId = ctx.state.user?.id;
    if (!userId) return null;

    const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
            users_permissions_users: { id: userId },
            ativa: true,
        },
        populate: ["users_permissions_users"],
    });

    return tenant?.[0] || null;
}
