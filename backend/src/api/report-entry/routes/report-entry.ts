export default {
  routes: [
    // ─── ROTAS CUSTOMIZADAS ───────────────────────────────────────
    {
      method: "POST",
      path: "/report-entry/generate",
      handler: "report-entry.generate",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/report-entries/search",
      handler: "report-entry.search",
      config: { policies: [] },
    },

    // ─── ROTAS PADRÃO ─────────────────────────────────────────────
    {
      method: "GET",
      path: "/report-entries",
      handler: "report-entry.find",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/report-entries/:id",
      handler: "report-entry.findOne",
      config: { policies: [] },
    },
    {
      method: "POST",
      path: "/report-entries",
      handler: "report-entry.create",
      config: { policies: [] },
    },
    {
      method: "PUT",
      path: "/report-entries/:id",
      handler: "report-entry.update",
      config: { policies: [] },
    },
    {
      method: "DELETE",
      path: "/report-entries/:id",
      handler: "report-entry.delete",
      config: { policies: [] },
    },
  ],
};