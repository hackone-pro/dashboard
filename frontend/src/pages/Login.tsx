import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toastSuccess, toastError } from "../utils/toast";
import { login } from "../utils/auth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(false);
    const [tentativas, setTentativas] = useState(0);
    const [bloqueado, setBloqueado] = useState(false);
    const [tempoRestante, setTempoRestante] = useState(0);

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    // Verifica se já existe bloqueio salvo
    useEffect(() => {
        const blockUntil = localStorage.getItem("login_block_until");
        if (blockUntil) {
            const restante = Math.floor((+blockUntil - Date.now()) / 1000);
            if (restante > 0) {
                setBloqueado(true);
                setTempoRestante(restante);
                iniciarTimer(restante);
            } else {
                localStorage.removeItem("login_block_until");
            }
        }
    }, []);

    const iniciarTimer = (segundos: number) => {
        let restante = segundos;
        const interval = setInterval(() => {
            restante--;
            setTempoRestante(restante);
            if (restante <= 0) {
                clearInterval(interval);
                setBloqueado(false);
                setTentativas(0);
                localStorage.removeItem("login_block_until");
            }
        }, 1000);
    };

    const bloquearLogin = () => {
        const bloqueioSegundos = 15 * 60; // 15 minutos
        const blockUntil = Date.now() + bloqueioSegundos * 1000;

        localStorage.setItem("login_block_until", String(blockUntil));
        setBloqueado(true);
        setTempoRestante(bloqueioSegundos);
        iniciarTimer(bloqueioSegundos);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (bloqueado) {
            toastError(
                `Login bloqueado. Aguarde ${Math.floor(tempoRestante / 60)}:${String(
                    tempoRestante % 60
                ).padStart(2, "0")}`
            );
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/auth/local`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    identifier: email,
                    password: senha,
                }),
            });

            const data = await res.json();

            if (res.ok && data.jwt) {
                // resetar contador ao logar
                setTentativas(0);
                localStorage.removeItem("login_block_until");
                login(data.jwt);
                localStorage.setItem("user", JSON.stringify(data.user));
                if (remember) localStorage.setItem("remember_email", email);
                toastSuccess("Login realizado com sucesso!");
                navigate("/dashboard");
            } else {
                // incrementa tentativas falhas
                const novasTentativas = tentativas + 1;
                setTentativas(novasTentativas);

                if (novasTentativas >= 3) {
                    bloquearLogin();
                }

                toastError(
                    data?.error?.message ||
                        data?.error?.name ||
                        "Credenciais inválidas. Tente novamente."
                );
            }
        } catch (err) {
            toastError("Erro de conexão com o servidor.");
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
                                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPass ? (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M3 3l18 18"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                            />
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
                            disabled={bloqueado}
                            className={`w-full rounded-xl py-3 font-medium text-white shadow-lg shadow-violet-700/30 transition-transform ${
                                bloqueado
                                    ? "bg-gray-500 cursor-not-allowed"
                                    : "hover:-translate-y-0.5 focus:outline-none"
                            }`}
                            style={{
                                background: bloqueado
                                    ? ""
                                    : "linear-gradient(90deg, #6C2CF5 0%, #7C4DFF 40%, #7B61FF 100%)",
                            }}
                        >
                            {bloqueado
                                ? `Bloqueado (${Math.floor(tempoRestante / 60)}:${String(
                                      tempoRestante % 60
                                  ).padStart(2, "0")})`
                                : "Login"}
                        </button>

                        {/* rodapé de links */}
                        <div className="text-xs text-gray-400 text-center">
                            Não tem uma conta?{" "}
                            <a
                                href="https://hackone.com.br/consultoria-aberturachamado"
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
