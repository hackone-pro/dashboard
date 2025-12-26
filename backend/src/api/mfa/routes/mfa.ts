// src/api/mfa/routes/mfa.ts

export default {
  routes: [
    {
      method: "POST",
      path: "/mfa/send",
      handler: "mfa.send",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/mfa/verify",
      handler: "mfa.verify",
      config: {
        auth: false,
      },
    },
  ],
};