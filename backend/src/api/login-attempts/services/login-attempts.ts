// src/api/login-attempts/services/login-attempts.ts
import bcrypt from "bcryptjs";
import axios from "axios";

async function validarTurnstile(token: string, ip?: string) {
    const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;

    if (!secret) {
        throw new Error("Turnstile secret não configurado");
    }

    const response = await axios.post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        new URLSearchParams({
            secret,
            response: token,
            ...(ip && { remoteip: ip }),
        }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout: 5000,
        }
    );

    return response.data;
}

export default {
    async login(ctx) {
        const { email, password } = ctx.request.body;

        if (!email || !password) {
            return ctx.badRequest("Email e senha são obrigatórios");
        }

        // @ts-ignore
        const user = await strapi.db
            .query("plugin::users-permissions.user")
            .findOne({ where: { email } });

        if (!user) {
            return ctx.badRequest("Credenciais inválidas.");
        }

        // @ts-ignore
        if (user.blocked_time && new Date(user.blocked_time) > new Date()) {
            const minutos = Math.ceil(
                (new Date(user.blocked_time).getTime() - Date.now()) / 60000
            );
            return ctx.forbidden(
                `Login bloqueado. Tente novamente em ${minutos} minutos.`
            );
        }

        const senhaCorreta = await bcrypt.compare(password, user.password);

        if (!senhaCorreta) {
            const novasTentativas = (user.login_attempts || 0) + 1;
            let updateData: any = { login_attempts: novasTentativas };

            // Se chegou em 3 → bloqueia 15min
            if (novasTentativas >= 3) {
                updateData = {
                    login_attempts: 0,
                    blocked_time: new Date(Date.now() + 15 * 60 * 1000),
                };
                // @ts-ignore
                await strapi.db.query("plugin::users-permissions.user").update({
                    where: { id: user.id },
                    data: updateData,
                });

                return ctx.forbidden("Login bloqueado. Tente novamente em 15 minutos.");
            }
            // @ts-ignore
            await strapi.db.query("plugin::users-permissions.user").update({
                where: { id: user.id },
                data: updateData,
            });

            return ctx.badRequest("Credenciais inválidas.");
        }

        // @ts-ignore
        await strapi.db.query("plugin::users-permissions.user").update({
            where: { id: user.id },
            data: { login_attempts: 0, blocked_time: null },
        });

        // @ts-ignore
        const jwt = strapi.plugins["users-permissions"].services.jwt.issue({
            id: user.id,
        });

        const { password: _, reset_token, reset_expire, ...safeUser } = user;

        return ctx.send({
            jwt,
            user: safeUser,
        });
    },
};
