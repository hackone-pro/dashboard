import { useEffect, useState } from "react";
import LayoutModel from "../componentes/LayoutModel";

import { AiOutlineDelete } from "react-icons/ai";
import { FaRegEdit, FaRegPaperPlane } from "react-icons/fa";

import { toastSuccess, toastError } from "../utils/toast";
import Swal from "sweetalert2";

import { changePassword } from "../services/auth/changePassword.service";
import { createUser } from "../services/auth/createUser.service";
import { getUserProfile } from "../services/auth/getUserProfile.service";
import { getUserList } from "../services/auth/getUserList.service";
import { deleteUser } from "../services/auth/deleteUser.service";
import { updateUser } from "../services/auth/updateUser.service";
import { resendInvite } from "../services/auth/resendInvite.service";

type Aba = "senha" | "perfil";
type Secao = "geral" | "usuarios";
type AbaUsuarios = "lista" | "cadastro";

export default function Configuracoes() {
  const [aba, setAba] = useState<Aba>("senha");
  const [secao, setSecao] = useState<Secao>("geral");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [abaUsuarios, setAbaUsuarios] = useState<AbaUsuarios>("lista");

  // Estados para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 Estados do formulário de criação de usuário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [owner_name_iris, setOwnerNameIris] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  // 🔹 Estados da listagem de usuários
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);
  const [erroUsuarios, setErroUsuarios] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getUserProfile();
        setIsAdmin(user?.user_role?.slug === "admin");
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
        setIsAdmin(false);
      }
    }
    fetchUser();
  }, []);

  // 🔹 Busca usuários do tenant
  useEffect(() => {
    async function carregarUsuarios() {
      try {
        setCarregandoUsuarios(true);
        const data = await getUserList();
        setUsuarios(data);
      } catch (err: any) {
        setErroUsuarios(err.message || "Erro ao carregar usuários");
      } finally {
        setCarregandoUsuarios(false);
      }
    }

    if (isAdmin) carregarUsuarios();
  }, [isAdmin]);

  const recarregarUsuarios = async () => {
    try {
      setCarregandoUsuarios(true);
      const data = await getUserList();
      setUsuarios(data);
    } catch (err: any) {
      setErroUsuarios(err.message || "Erro ao carregar usuários");
    } finally {
      setCarregandoUsuarios(false);
    }
  };

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

  // 👁️‍🗨️ botão para mostrar/ocultar senha
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
      {/* 🔹 MENU HORIZONTAL */}
      <div className="flex justify-start gap-6 border-b border-[#2c2450] mt-15 mb-6 pb-2 overflow-x-auto">
        {[{ key: "geral", label: "Perfil" }, ...(isAdmin ? [{ key: "usuarios", label: "Usuários" }] : [])].map((item) => (
          <button
            key={item.key}
            onClick={() => setSecao(item.key as Secao)}
            className={`text-sm font-medium px-2 pb-2 border-b-2 transition-colors ${secao === item.key
              ? "border-violet-500 text-white"
              : "border-transparent text-gray-400 hover:text-white hover:border-violet-400/40"
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* SEÇÃO: PERFIL */}
      {secao === "geral" && (
        <section className="cards p-6 rounded-2xl shadow-lg flex gap-8">
          {/* Sidebar */}
          <aside className="w-48 border-r border-[#2c2450] pr-4">
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <button
                  onClick={() => setAba("senha")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${aba === "senha"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-[#1d1830] hover:text-white"
                    }`}
                >
                  Alterar Senha
                </button>
              </li>
            </ul>
          </aside>

          {/* Conteúdo */}
          <div className="flex-1">
            {aba === "senha" && (
              <div className="max-w-lg">
                <h2 className="text-white text-xl font-semibold mb-6">
                  Alterar Senha
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* senha atual */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Senha atual
                    </label>
                    <div className="relative">
                      <input
                        type={showSenhaAtual ? "text" : "password"}
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12 outline-none"
                        required
                      />
                      <EyeButton
                        visible={showSenhaAtual}
                        toggle={() => setShowSenhaAtual((s) => !s)}
                      />
                    </div>
                  </div>

                  {/* nova senha */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={showNovaSenha ? "text" : "password"}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12 outline-none"
                        required
                      />
                      <EyeButton
                        visible={showNovaSenha}
                        toggle={() => setShowNovaSenha((s) => !s)}
                      />
                    </div>
                  </div>

                  {/* confirmar */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmarSenha ? "text" : "password"}
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3 pr-12 outline-none"
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
          </div>
        </section>
      )}

      {/* SEÇÃO: USUÁRIOS */}
      {secao === "usuarios" && isAdmin && (
        <section className="cards p-6 rounded-2xl shadow-lg flex gap-8">
          {/* Sidebar */}
          <aside className="w-48 border-r border-[#2c2450] pr-4">
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <button
                  onClick={() => setAbaUsuarios("lista")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${abaUsuarios === "lista"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-[#1d1830] hover:text-white"
                    }`}
                >
                  Lista de Usuários
                </button>
              </li>
              <li>
                <button
                  onClick={() => setAbaUsuarios("cadastro")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${abaUsuarios === "cadastro"
                    ? "bg-violet-600 text-white"
                    : "hover:bg-[#1d1830] hover:text-white"
                    }`}
                >
                  Cadastro de Usuário
                </button>
              </li>
            </ul>
          </aside>

          {/* Conteúdo */}
          <div className="flex-1">
            {/* LISTA DE USUÁRIOS */}
            {abaUsuarios === "lista" && (
              <div className="max-w-full">
                <h2 className="text-white text-xl font-semibold mb-6">
                  Usuários Cadastrados
                </h2>

                {/* tabela */}
                <section className="cards rounded-2xl overflow-hidden">
                  {/* cabeçalho */}
                  <div className="grid grid-cols-12 px-5 py-4 bg-[#0A0617] text-sm text-gray-300 border-b border-[#1D1929]">
                    <div className="col-span-3 text-left">Nome</div>
                    <div className="col-span-4 text-left">E-mail</div>
                    <div className="col-span-2 text-center">Usuário no DFIR (IRIS)</div>
                    <div className="col-span-2 text-center">Status</div> {/* 🟣 nova coluna */}
                    <div className="col-span-1 text-center">Ações</div>
                  </div>

                  {/* corpo */}
                  {carregandoUsuarios ? (
                    <div className="p-5 text-gray-400 text-sm">Carregando usuários...</div>
                  ) : erroUsuarios ? (
                    <div className="p-5 text-red-400 text-sm">{erroUsuarios}</div>
                  ) : usuarios.length === 0 ? (
                    <div className="p-5 text-gray-400 text-sm">Nenhum usuário encontrado.</div>
                  ) : (
                    <div className="divide-y divide-[#1D1929]">
                      {usuarios.map((u) => {
                        // 🔹 Lógica correta baseada nos campos do Strapi
                        let statusTexto = "Convite em andamento";
                        let statusCor = "text-yellow-400 bg-yellow-900/30";

                        // Se estiver bloqueado manualmente
                        if (u.blocked) {
                          statusTexto = "Bloqueado";
                          statusCor = "text-red-400 bg-red-900/30";
                        }
                        // Se estiver confirmado e não bloqueado
                        else if (u.confirmed) {
                          statusTexto = "Ativo";
                          statusCor = "text-green-400 bg-green-900/30";
                        }

                        return (
                          <div
                            key={u.id}
                            className="grid grid-cols-12 px-5 py-3 items-center hover:bg-[#ffffff07] transition-colors"
                          >
                            <div className="col-span-3 text-left text-gray-200 text-sm truncate">
                              {u.nome || "—"}
                            </div>
                            <div className="col-span-4 text-left text-gray-400 text-sm truncate">
                              {u.email}
                            </div>
                            <div className="col-span-2 text-center text-gray-300 text-sm">
                              {u.owner_name_iris || "—"}
                            </div>

                            {/* 🔹 Coluna Status */}
                            <div className="col-span-2 text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${statusCor}`}
                              >
                                {statusTexto}
                              </span>
                            </div>

                            {/* 🔹 Coluna Ações */}
                            <div className="col-span-1 flex justify-center gap-3">

                              {!u.confirmed && (
                                <button
                                  onClick={async () => {
                                    const confirm = await Swal.fire({
                                      title: "Reenviar convite?",
                                      text: `Deseja reenviar o e-mail de convite para ${u.email}?`,
                                      icon: "question",
                                      showCancelButton: true,
                                      confirmButtonText: "Sim, reenviar",
                                      cancelButtonText: "Cancelar",
                                      reverseButtons: true,
                                      background: "#1a1333",
                                      color: "#fff",
                                      confirmButtonColor: "#7f22fe",
                                      cancelButtonColor: "#6e7881",
                                      customClass: {
                                        popup: "rounded-2xl shadow-lg border border-[#3c2d6e]",
                                      },
                                    });

                                    if (confirm.isConfirmed) {
                                      try {
                                        await resendInvite(u.id);
                                        toastSuccess("Convite reenviado com sucesso!");
                                      } catch (err: any) {
                                        toastError(err.message || "Erro ao reenviar convite.");
                                      }
                                    }
                                  }}
                                  className="text-violet-500 hover:text-violet-300 transition-colors"
                                  title="Reenviar convite"
                                >
                                  {/* @ts-ignore */}
                                  <FaRegPaperPlane size={18} />
                                </button>
                              )}

                              {/* ✏️ Botão editar */}
                              <button
                                onClick={async () => {
                                  const { value: formValues } = await Swal.fire({
                                    title: "Editar Usuário",
                                    html: `
                      <label class="block text-sm text-gray-300 my-2 text-left">Nome:</label>
                      <input id="swal-nome" class="w-full mb-2 rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3" placeholder="Nome" value="${u.nome || ""}">
                      <label class="block text-sm text-gray-300 my-2 text-left">Email:</label>
                      <input id="swal-email" type="email" class="w-full mb-2 rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3" placeholder="E-mail" value="${u.email || ""}">
                      <label class="block text-sm text-gray-300 my-2 text-left">Usuário no DFIR (IRIS)</label>
                      <input id="swal-owner" class="w-full rounded-xl mb-2 bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3" placeholder="Usuário no DFIR (IRIS)" value="${u.owner_name_iris || ""}">`,
                                    background: "#0A0617",
                                    color: "#fff",
                                    confirmButtonText: "Salvar Alteração",
                                    showCancelButton: true,
                                    reverseButtons: true,
                                    cancelButtonText: "Cancelar",
                                    focusConfirm: false,
                                    confirmButtonColor: "#7f22fe",
                                    cancelButtonColor: "#6e7881",
                                    preConfirm: () => {
                                      return {
                                        nome: (document.getElementById("swal-nome") as HTMLInputElement)?.value.trim(),
                                        email: (document.getElementById("swal-email") as HTMLInputElement)?.value.trim(),
                                        owner_name_iris: (document.getElementById("swal-owner") as HTMLInputElement)?.value.trim(),
                                      };
                                    },
                                    customClass: {
                                      popup: "rounded-2xl shadow-lg border border-[#3c2d6e]",
                                    },
                                  });

                                  if (formValues) {
                                    try {
                                      const atualizado = await updateUser(u.id, formValues);
                                      setUsuarios((prev) =>
                                        prev.map((usr) =>
                                          usr.id === u.id ? { ...usr, ...formValues } : usr
                                        )
                                      );
                                      toastSuccess("Usuário atualizado com sucesso!");
                                    } catch (err: any) {
                                      toastError(err.message || "Erro ao atualizar usuário.");
                                    }
                                  }
                                }}
                                className="text-violet-500 hover:text-violet-300 transition-colors"
                              >
                                {/* @ts-ignore */}
                                <FaRegEdit size={20} />
                              </button>

                              {/* 🗑️ Botão deletar */}
                              <button
                                onClick={async () => {
                                  const confirm = await Swal.fire({
                                    title: "Tem certeza?",
                                    text: `Deseja realmente excluir ${u.nome}?`,
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonText: "Sim, excluir",
                                    cancelButtonText: "Cancelar",
                                    reverseButtons: true,
                                    background: "#1a1333",
                                    color: "#fff",
                                    confirmButtonColor: "#7f22fe",
                                    cancelButtonColor: "#6e7881",
                                    customClass: {
                                      popup: "rounded-2xl shadow-lg border border-[#3c2d6e]",
                                    },
                                  });

                                  if (confirm.isConfirmed) {
                                    try {
                                      await deleteUser(u.id);
                                      setUsuarios((prev) =>
                                        prev.filter((item) => item.id !== u.id)
                                      );
                                      toastSuccess("Usuário excluído com sucesso!");
                                    } catch (err: any) {
                                      toastError(err.message || "Erro ao excluir usuário.");
                                    }
                                  }
                                }}
                                className="text-violet-500 hover:text-red-400 transition-colors"
                              >
                                {/* @ts-ignore */}
                                <AiOutlineDelete size={20} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* CADASTRO DE USUÁRIO */}
            {abaUsuarios === "cadastro" && (
              <div className="max-w-lg">
                <h2 className="text-white text-xl font-semibold mb-6">
                  Cadastro de Usuários
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      setLoadingCreate(true);

                      // 🔹 Gera username automático
                      const generatedUsername = nome
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, ".")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");

                      await createUser({
                        nome,
                        email,
                        username: generatedUsername,
                        owner_name_iris,
                      });

                      toastSuccess("Convite enviado com sucesso!");

                      // 🔹 Limpa campos
                      setNome("");
                      setEmail("");
                      setOwnerNameIris("");

                      // 🔹 Muda para aba de listagem
                      setAbaUsuarios("lista");

                      // 🔹 Recarrega manualmente a lista (sem depender do useEffect)
                      await recarregarUsuarios();
                    } catch (err: any) {
                      toastError(err.message || "Erro ao criar usuário.");
                    } finally {
                      setLoadingCreate(false);
                    }
                  }}


                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Nome</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3"
                      required
                    />
                  </div>

                  {/* 🔹 Campo username oculto (só pra controle interno, não exibido) */}
                  <input type="hidden" value={username} readOnly />

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Usuário no DFIR (IRIS)
                    </label>
                    <input
                      type="text"
                      value={owner_name_iris}
                      onChange={(e) => setOwnerNameIris(e.target.value)}
                      className="w-full rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingCreate}
                    className="w-full rounded-xl py-3 font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 disabled:bg-gray-600"
                  >
                    {loadingCreate ? "Enviando convite..." : "Enviar Convite"}
                  </button>
                </form>

              </div>
            )}
          </div>
        </section>
      )}
    </LayoutModel>
  );
}
