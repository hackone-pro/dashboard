import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toastSuccess, toastError } from "../utils/toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toastError("Token inválido ou expirado.");
      return;
    }

    if (password !== confirmPassword) {
      toastError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toastSuccess("Senha redefinida com sucesso! Faça login novamente.");
        navigate("/login");
      } else {
        toastError(data?.error || "Erro ao redefinir senha.");
      }
    } catch (err) {
      toastError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
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
            <a
              href="https://securityone.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/assets/img/Logo-Security-One-Positivo.png"
                alt="SecurityOne"
                className="h-10"
              />
            </a>
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
            Redefinir senha
          </h1>

          <p className="mt-4 text-sm text-gray-400 max-w-md">
            Digite sua nova senha abaixo. O link expira em até 30 minutos.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {/* Nova senha */}
            <div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Digite a nova senha"
                  className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPass ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" />
                      <path
                        d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.83-3.74"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                      />
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7c-2.57 0-4.74-.88-6.5-2.1"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirme a nova senha"
                  className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showConfirmPass ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" />
                      <path
                        d="M10.58 10.58A3 3 0 0012 15a3 3 0 002.83-3.74"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                      />
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7c-2.57 0-4.74-.88-6.5-2.1"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-medium text-white shadow-lg shadow-violet-700/30 bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 disabled:bg-gray-600"
            >
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </button>

            {/* rodapé de links */}
            <div className="text-xs text-gray-400 text-center">
              <Link
                to="/login"
                className="text-violet-300 hover:text-violet-200"
              >
                Voltar ao login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Coluna DIREITA – imagem */}
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-[#0b0916]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,#6d4bf0_0%,transparent_35%),radial-gradient(circle_at_80%_10%,#2ec6e8_0%,transparent_30%)]" />
        <div className="relative h-full w-full flex items-center justify-center">
          <img
            src="/assets/img/mockup-alta.webp"
            alt="Dashboard preview"
            className="relative h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
