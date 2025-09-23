// src/api/reset-passwords/services/reset-passwords.ts
export default {
    async sendResetEmail(email: string, token: string) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        const html = `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            
            <!-- Cabeçalho -->
            <div style="background: linear-gradient(90deg,#1d0f3a,#23094f); text-align: center;">
                <img src="${process.env.FRONTEND_URL}/assets/img/banner-securityone.jpg" alt="SecurityOne" width="100%"/>
            </div>
    
            <!-- Conteúdo -->
            <div style="padding: 30px; color: #333;">
                <p>Olá,</p>
                <p>Recebemos um pedido para redefinir a sua senha de acesso ao <b>SecurityOne</b>. Para continuar, clique no botão abaixo e cadastre uma nova senha.</p>
                <p><b>O link expira em 30 minutos.</b></p>
                
                <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #5b21b6; color: #fff; padding: 14px 28px; border-radius: 25px; font-size: 16px; text-decoration: none; display: inline-block;">
                    Redefinir senha
                </a>
                </div>
            </div>
            </div>
        </div>
      `;

        try {
            await strapi.plugin("email").service("email").send({
                to: email,
                from: process.env.SMTP_USER,
                subject: "Redefinição de senha - SecurityOne",
                html,
            });

            return { ok: true, resetUrl };
        } catch (err: any) {
            strapi.log.error("Erro ao enviar e-mail de reset", err.message || err);
            throw new Error("Falha ao enviar e-mail de reset");
        }
    },
};
