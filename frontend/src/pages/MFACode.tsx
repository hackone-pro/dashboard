import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toastError, toastSuccess } from "../utils/toast";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function VerifyCode() {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const navigate = useNavigate();
  const { login, token } = useAuth();

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const mfaToken = sessionStorage.getItem("mfa_token");

  /* ==========================
     PROTEÇÃO: se já estiver logado
  ========================== */
  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  /* ==========================
     PROTEÇÃO: se não houver sessão MFA
  ========================== */
  useEffect(() => {
    if (!mfaToken) {
      navigate("/login", { replace: true });
    }
  }, [mfaToken, navigate]);

  /* ==========================
     CONTADOR (visual apenas)
  ========================== */
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  /* ==========================
     INPUT HANDLERS
  ========================== */
  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (paste.length === 6) {
      setCode(paste.split(""));
      inputsRef.current[5]?.focus();
    }
  };

  /* ==========================
     SUBMIT MFA
  ========================== */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.some((d) => d === "")) {
      toastError("Digite o código completo");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/mfa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mfaToken,
          code: code.join(""),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Código inválido");
      }

      /* 🔓 LOGIN DEFINITIVO */
      login(data.jwt);
      localStorage.setItem("user", JSON.stringify(data.user));

      sessionStorage.removeItem("mfa_token");
      sessionStorage.removeItem("mfa_email");

      toastSuccess("Login confirmado com sucesso!");

      // 🔥 Redirecionamento direto
      if (data.user?.user_role?.slug === "admin") {
        navigate("/multitenant-manager", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (err: any) {
      toastError(err.message || "Falha ao validar código");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0e0b1b]">
      {/* COLUNA ESQUERDA */}
      <div className="relative flex items-center">
        <div className="absolute inset-0 bg-[#151026]" />

        <div className="relative w-full max-w-lg mx-auto px-6 py-10">
          <div className="mb-8">
            <img
              src="/assets/img/Logo-Security-One-Positivo.png"
              alt="SecurityOne"
              className="h-10"
            />
          </div>

          <h1 className="text-4xl font-semibold text-white text-center">
            Verificação de acesso
          </h1>

          <p className="mt-4 text-sm text-gray-400 text-center">
            Digite o código de 6 dígitos enviado para seu e-mail.
          </p>

          <form
            onSubmit={handleVerify}
            className="mt-10 space-y-8"
            onPaste={handlePaste}
          >
            {/* INPUTS MFA */}
            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleChange(e.target.value, index)
                  }
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-center text-xl rounded-xl
                    bg-[#383838] border border-[#2c2450]
                    text-gray-100 outline-none
                    focus:border-violet-400
                    focus:ring-2 focus:ring-violet-400/30"
                  required
                />
              ))}
            </div>

            {/* BOTÃO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-medium text-white
                bg-gradient-to-r from-violet-600 to-indigo-500
                hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Confirmar código"}
            </button>

            <div className="text-xs text-gray-400 text-center">
              <Link
                to="/login"
                className="text-violet-300 hover:text-violet-200"
              >
                Voltar para o Login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* COLUNA DIREITA */}
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