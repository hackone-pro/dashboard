export default {
  routes: [
    {
      method: "GET",
      path: "/storage/state",
      handler: "storage.state",
      config: { policies: [] },
    },
  ],
};
