export default () => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      settings: {
        defaultFrom: 'suporte@hackone.com.br',
        defaultReplyTo: 'suporte@hackone.com.br',
      },
    },
  },
});
