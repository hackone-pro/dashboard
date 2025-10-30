import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toastSuccess, toastError } from "../utils/toast";

import { IoLockClosedOutline } from "react-icons/io5";
import { FaRegCircleCheck } from "react-icons/fa6";


export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const token = searchParams.get("token");

  // 🔹 Avaliar força da senha
  const checkPasswordStrength = (value: string) => {
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/\d/.test(value)) strength++;
    if (/[@$!%*?&]/.test(value)) strength++;

    setPasswordStrength(strength);

    if (value.length === 0) {
      setPasswordMessage("");
    } else if (strength <= 2) {
      setPasswordMessage("Senha fraca");
    } else if (strength >= 3 && strength < 5) {
      setPasswordMessage("Senha média");
    } else if (strength === 5) {
      setPasswordMessage("Senha forte");
    }
  };

  useEffect(() => {
    checkPasswordStrength(password);
  }, [password]);

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

    if (passwordStrength < 5) {
      toastError("A senha deve atender a todos os requisitos listados.");
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
    } catch {
      toastError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Define cores de acordo com os níveis Fraca / Média / Forte
  let strengthColor = "#2c2450"; // padrão (vazio)

  if (passwordStrength <= 2) strengthColor = "#F914AD";       // Fraca (rosa)
  else if (passwordStrength >= 3 && passwordStrength < 5) strengthColor = "#A855F7"; // Média (roxo)
  else if (passwordStrength === 5) strengthColor = "#1DD69A"; // Forte (verde)

  // 🔹 Calcula a largura da barra proporcionalmente
  const strengthWidth = `${(passwordStrength / 5) * 100}%`;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0e0b1b]">
      {/* Coluna ESQUERDA – formulário */}
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
                  className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12 focus:ring-2 focus:ring-violet-500 outline-none"
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
                  className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12 focus:ring-2 focus:ring-violet-500 outline-none"
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

            {/* Indicador de força */}
            {password && (
              <div className="mt-3">
                <div className="w-full h-2 bg-[#2c2450] rounded-full overflow-hidden">
                  <div
                    className="h-2 transition-all duration-300 rounded-full"
                    style={{
                      width: strengthWidth,
                      backgroundColor: strengthColor,
                    }}
                  />
                </div>
                <p
                  className={`mt-1 text-xs transition-colors duration-300 ${passwordStrength <= 2
                      ? "text-[#F914AD]" // Fraca (rosa)
                      : passwordStrength >= 3 && passwordStrength < 5
                        ? "text-[#A855F7]" // Média (roxo)
                        : passwordStrength === 5
                          ? "text-[#1DD69A]" // Forte (verde)
                          : "text-gray-400"
                    }`}
                >
                  {passwordMessage}
                </p>
              </div>
            )}

            {/* Requisitos de senha */}
            {password && (
              <div className="mt-4 text-xs text-gray-400 space-y-1">
                {/* 🔹 Título dinâmico */}
                <p
                  className={`font-medium flex items-center gap-2 ${passwordStrength >= 5 ? "text-[#1DD69A]" : "text-gray-300"
                    }`}
                >
                  {passwordStrength >= 5 ? (
                    <>
                      {/* @ts-ignore */}
                      <FaRegCircleCheck /> Todos os requisitos atendidos!
                    </>
                  ) : (
                    <>
                      {/* @ts-ignore */}
                      <IoLockClosedOutline /> Requisitos da senha
                    </>
                  )}
                </p>

                {/* 🔹 Lista de requisitos */}
                <ul className="space-y-1 mt-2">
                  <li
                    className={`flex items-center gap-2 ${password.length >= 8 ? "text-[#1DD69A]" : "text-gray-500"
                      }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          password.length >= 8 ? "#22c55e" : "#4b5563",
                      }}
                    ></span>
                    Mínimo de 8 caracteres
                  </li>

                  <li
                    className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? "text-[#1DD69A]" : "text-gray-500"
                      }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: /[A-Z]/.test(password)
                          ? "#22c55e"
                          : "#4b5563",
                      }}
                    ></span>
                    Pelo menos uma letra maiúscula
                  </li>

                  <li
                    className={`flex items-center gap-2 ${/[a-z]/.test(password) ? "text-[#1DD69A]" : "text-gray-500"
                      }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: /[a-z]/.test(password)
                          ? "#22c55e"
                          : "#4b5563",
                      }}
                    ></span>
                    Pelo menos uma letra minúscula
                  </li>

                  <li
                    className={`flex items-center gap-2 ${/\d/.test(password) ? "text-[#1DD69A]" : "text-gray-500"
                      }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: /\d/.test(password)
                          ? "#22c55e"
                          : "#4b5563",
                      }}
                    ></span>
                    Pelo menos um número
                  </li>

                  <li
                    className={`flex items-center gap-2 ${/[@$!%*?&]/.test(password)
                      ? "text-[#1DD69A]"
                      : "text-gray-500"
                      }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: /[@$!%*?&]/.test(password)
                          ? "#22c55e"
                          : "#4b5563",
                      }}
                    ></span>
                    Um caractere especial (@, $, !, %, *, ? ou &)
                  </li>
                </ul>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-medium text-white shadow-lg shadow-violet-700/30 bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 disabled:bg-gray-600 transition-all"
            >
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </button>

            {/* Rodapé */}
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
