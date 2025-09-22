/**
 * reset-passwords service
 */
import axios from "axios";
import https from "https";

export default {
  async sendResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      // 1) Garante que o contato existe (cria ou atualiza)
      const syncRes = await axios.post(
        `${process.env.AC_API_URL}/api/3/contact/sync`,
        {
          contact: {
            email,
            // Se você tiver criado um campo custom no ActiveCampaign para armazenar o link
            fieldValues: process.env.AC_RESET_FIELD_ID
              ? [
                {
                  field: process.env.AC_RESET_FIELD_ID,
                  value: resetUrl,
                },
              ]
              : [],
          },
        },
        {
          headers: {
            "Api-Token": process.env.AC_API_KEY,
            "Content-Type": "application/json",
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        }
      );

      const contactId = syncRes.data.contact.id;

      // 2) Adiciona o contato na automação (ID da automação no .env)
      await axios.post(
        `${process.env.AC_API_URL}/api/3/contactAutomations`,
        {
          contactAutomation: {
            contact: contactId,
            automation: process.env.AC_TEMPLATE_ID, // Ex: 989
          },
        },
        {
          headers: {
            "Api-Token": process.env.AC_API_KEY,
            "Content-Type": "application/json",
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        }
      );

      return { ok: true, resetUrl };
    } catch (err: any) {
      strapi.log.error(
        `Erro ao enviar e-mail de reset para ${email} pelo ActiveCampaign`,
        err?.response?.data || err.message || err
      );
      throw new Error("Falha ao enviar e-mail de reset");
    }
  },
  
};
