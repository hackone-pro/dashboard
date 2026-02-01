export default {
  routes: [
    {
      method: "GET",
      path: "/storage/state",
      handler: "storage.state",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/storage/internal",
      handler: "storage.internal",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/storage/timeline",
      handler: "storage.timeline",
      config: { policies: [] },
    },
  ],
};
