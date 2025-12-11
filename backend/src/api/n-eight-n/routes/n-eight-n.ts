export default {
  routes: [
    {
      method: "POST",
      path: "/n8n/gerar",
      handler: "n-eight-n.gerar",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/n8n/data",
      handler: "n-eight-n.data",
      config: {
        policies: [],
      },
    },
  ],
};
