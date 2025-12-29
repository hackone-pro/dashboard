import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toastSuccess, toastError } from "../utils/toast";
import { loginAttempt } from "../services/auth/loginAttemps.service";
import { useAuth } from "../context/AuthContext";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  /* ==========================
     Turnstile (SEM impacto visual)
  ========================== */
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !(window as any).turnstile) return;

    const el = document.getElementById("turnstile-container");
    if (!el) return;

    el.innerHTML = "";

    (window as any).turnstile.render(el, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "dark",
      callback: (token: string) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(null),
      "error-callback": () => setCaptchaToken(null),
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLocalhost && !captchaToken) {
      toastError("Confirme que você não é um robô.");
      return;
    }

    try {
      const data = await loginAttempt(email, senha, captchaToken!);

      login(data.jwt);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (remember) {
        localStorage.setItem("remember_email", email);
      }

      toastSuccess("Login realizado com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      setCaptchaToken(null);
      toastError(err.message || "Erro ao tentar login");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0e0b1b]">
      {/* Coluna ESQUERDA – bloco do formulário */}
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
              <label className="block text-xs text-gray-300 mb-2">Email</label>
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
              <label className="block text-xs text-gray-300 mb-2">Senha</label>
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

            {/* 🔐 Turnstile (invisível no layout) */}
            {!isLocalhost && (
              <div id="turnstile-container" className="flex justify-center" />
            )}

            {/* Botão */}
            <button
              type="submit"
              className="w-full rounded-xl py-3 font-medium text-white shadow-lg shadow-violet-700/30 transition-transform hover:-translate-y-0.5 focus:outline-none"
              style={{
                background:
                  "linear-gradient(90deg, #6C2CF5 0%, #7C4DFF 40%, #7B61FF 100%)",
              }}
            >
              Login
            </button>

            <div className="text-xs text-gray-400 text-center">
              Não tem uma conta?{" "}
              <a
                href="https://hackone.com.br/whatsappsuporte"
                target="_blank"
                className="text-violet-300 hover:text-violet-200"
              >
                Fale com o suporte
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Coluna DIREITA – imagem */}
      <div className="relative hidden lg:block">
        <img
          src="/assets/img/mockup-alta.webp"
          alt="Dashboard preview"
          className="relative h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
