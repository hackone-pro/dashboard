import { useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { toastSuccess, toastError } from "../utils/toast";
import { changePassword } from "../services/auth/changePassword.service";

type Aba = "senha" | "perfil" | "notificacoes" | "preferencias";

export default function Configuracoes() {
  const [aba, setAba] = useState<Aba>("senha");

  // Estados para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (novaSenha !== confirmarSenha) {
      toastError("A confirmação da senha não confere com a nova senha.");
      return;
    }
  
    try {
      setLoading(true);
      await changePassword(senhaAtual, novaSenha, confirmarSenha);
      toastSuccess("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err: any) {
      let mensagem = err.message || "Erro ao alterar senha.";
  
      // 🔹 Traduções específicas
      if (mensagem.includes("The provided current password is invalid")) {
        mensagem = "A senha atual está incorreta.";
      } else if (mensagem.includes("Passwords do not match")) {
        mensagem = "A nova senha e a confirmação não conferem.";
      }
  
      toastError(mensagem);
    } finally {
      setLoading(false);
    }
  };  

  // Função para renderizar o botão de mostrar/ocultar senha
  const EyeButton = ({
    visible,
    toggle,
  }: {
    visible: boolean;
    toggle: () => void;
  }) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
      aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
    >
      {visible ? (
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
  );

  return (
    <LayoutModel titulo="Configurações">
      <section className="cards p-6 rounded-2xl shadow-lg flex gap-8">
        {/* Sidebar de abas */}
        <aside className="w-48 border-r border-[#2c2450] pr-4">
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <button
                onClick={() => setAba("senha")}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  aba === "senha"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-[#1d1830] hover:text-white"
                }`}
              >
                Alterar Senha
              </button>
            </li>
            {/* <li>
              <button
                onClick={() => setAba("perfil")}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  aba === "perfil"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-[#1d1830] hover:text-white"
                }`}
              >
                Perfil
              </button>
            </li>
            <li>
              <button
                onClick={() => setAba("notificacoes")}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  aba === "notificacoes"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-[#1d1830] hover:text-white"
                }`}
              >
                Notificações
              </button>
            </li>
            <li>
              <button
                onClick={() => setAba("preferencias")}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  aba === "preferencias"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-[#1d1830] hover:text-white"
                }`}
              >
                Preferências
              </button>
            </li> */}
          </ul>
        </aside>

        {/* Conteúdo da aba */}
        <div className="flex-1">
          {aba === "senha" && (
            <div className="max-w-lg">
              <h2 className="text-white text-xl font-semibold mb-6">
                Alterar Senha
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Senha atual */}
                <div>
                  <label className="block text-xs text-gray-300 mb-2">
                    Senha atual
                  </label>
                  <div className="relative">
                    <input
                      type={showSenhaAtual ? "text" : "password"}
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                      required
                    />
                    <EyeButton
                      visible={showSenhaAtual}
                      toggle={() => setShowSenhaAtual((s) => !s)}
                    />
                  </div>
                </div>

                {/* Nova senha */}
                <div>
                  <label className="block text-xs text-gray-300 mb-2">
                    Nova senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNovaSenha ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                      required
                    />
                    <EyeButton
                      visible={showNovaSenha}
                      toggle={() => setShowNovaSenha((s) => !s)}
                    />
                  </div>
                </div>

                {/* Confirmar nova senha */}
                <div>
                  <label className="block text-xs text-gray-300 mb-2">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmarSenha ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Confirme a nova senha"
                      className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                      required
                    />
                    <EyeButton
                      visible={showConfirmarSenha}
                      toggle={() => setShowConfirmarSenha((s) => !s)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 disabled:bg-gray-600"
                >
                  {loading ? "Salvando..." : "Alterar Senha"}
                </button>
              </form>
            </div>
          )}

          {aba === "perfil" && (
            <div className="text-gray-400">
              <h2 className="text-white text-xl font-semibold mb-6">Perfil</h2>
              <p>Configurações de perfil virão aqui futuramente.</p>
            </div>
          )}

          {aba === "notificacoes" && (
            <div className="text-gray-400">
              <h2 className="text-white text-xl font-semibold mb-6">
                Notificações
              </h2>
              <p>Gerencie suas notificações aqui no futuro.</p>
            </div>
          )}

          {aba === "preferencias" && (
            <div className="text-gray-400">
              <h2 className="text-white text-xl font-semibold mb-6">
                Preferências
              </h2>
              <p>Preferências do sistema aparecerão aqui futuramente.</p>
            </div>
          )}
        </div>
      </section>
    </LayoutModel>
  );
}
