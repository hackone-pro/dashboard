import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toastSuccess, toastError } from "../utils/toast";
import { loginAttempt } from "../services/auth/loginAttemps.service";
import { useAuth } from "../context/AuthContext";
import { getRedirectPath } from "../utils/redirect";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const ENABLE_TURNSTILE =
  import.meta.env.VITE_ENABLE_TURNSTILE === "true";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  /* ==========================
     TURNSTILE (somente se habilitado)
  ========================== */
  useEffect(() => {
    if (!ENABLE_TURNSTILE) return;
    if (!TURNSTILE_SITE_KEY) return;
    if (!(window as any).turnstile) return;

    const el = document.getElementById("turnstile-container");
    if (!el) return;

    el.innerHTML = "";

    (window as any).turnstile.render(el, {
      sitekey: TURNSTILE_SITE_KEY!,
      theme: "dark",
      callback: (token: string) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(null),
      "error-callback": () => setCaptchaToken(null),
    });
  }, [ENABLE_TURNSTILE]);

  /* ==========================
     LOGIN
  ========================== */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const emailNorm = email.trim().toLowerCase();

    if (ENABLE_TURNSTILE && !captchaToken) {
      toastError("Confirme que você não é um robô.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginAttempt(
        emailNorm,
        senha,
        ENABLE_TURNSTILE && captchaToken
          ? captchaToken
          : undefined
      );

      /* ==========================
         MFA (type guard correto)
      ========================== */
      if ("mfaRequired" in data) {
        sessionStorage.setItem("mfa_token", data.mfaToken);
        sessionStorage.setItem("mfa_email", emailNorm);
        navigate("/verify-code");
        return;
      }

      /* ==========================
         LOGIN DIRETO
      ========================== */
      login(data.jwt);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (remember) {
        localStorage.setItem("remember_email", emailNorm);
      }

      toastSuccess("Login realizado com sucesso!");
      navigate(getRedirectPath(data.user));

    } catch (err: any) {
      setCaptchaToken(null);
      toastError(err.message || "Erro ao tentar login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0e0b1b]">
      {/* Coluna ESQUERDA */}
      <div className="relative flex items-center">
        <div className="absolute inset-0 bg-[#151026]" />
        <div
          className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, #6d4bf0 0%, rgba(109,75,240,0) 70%)",
          }}
        />
        <div className="relative w-full max-w-lg mx-auto px-6 py-10 lg:px-12 lg:py-0">
          <div className="mb-8">
            <a href="https://securityone.ai" target="_blank" rel="noopener noreferrer">
              <img
                src="/assets/img/Logo-Security-One-Positivo.png"
                alt="SecurityOne"
                className="h-10"
              />
            </a>
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
            Bem-vindo ao<br /> SecurityOne
          </h1>

          <p className="mt-4 text-sm text-gray-400 max-w-md">
            Acesse o painel de segurança e visualize em tempo real
            os níveis de risco, incidentes e ameaças que impactam
            seu ambiente.
          </p>

          <form onSubmit={handleLogin} className="mt-10 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email"
                className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 placeholder:text-gray-500 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                required
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 placeholder:text-gray-500 px-4 py-3 pr-12 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  👁
                </button>
              </div>
            </div>

            {/* Turnstile */}
            {ENABLE_TURNSTILE && (
              <div
                id="turnstile-container"
                className="flex justify-center"
              />
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Coluna DIREITA */}
      <div className="relative hidden lg:block">
        <img
          src="/assets/img/mockup-alta.webp"
          alt="Dashboard preview"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}