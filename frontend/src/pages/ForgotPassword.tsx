import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toastSuccess, toastError } from "../utils/toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        toastSuccess("Enviamos um link de redefinição para seu e-mail!");
        setEmail("");
      } else if (res.status === 404) {
        toastError("E-mail não cadastrado.");
      } else {
        toastError(data?.error || "Erro ao solicitar redefinição.");
      }
    } catch (err) {
      toastError("Falha na conexão com o servidor.");
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
            Esqueceu sua senha?
          </h1>

          <p className="mt-4 text-sm text-gray-400 max-w-md">
            Digite seu e-mail e enviaremos um link para redefinição da senha.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
              />
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-medium text-white shadow-lg shadow-violet-700/30 bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 disabled:bg-gray-600"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>

            {/* rodapé de links */}
            <div className="text-xs text-gray-400 text-center">
              Já lembrou sua senha?{" "}
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
