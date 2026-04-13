// frontend/src/componentes/integrations/SourceConfigModal.tsx

import { useEffect, useState, useCallback } from "react";
import Modal from "../Modal";
import type { SourceInstance, FetchType } from "../../types/source.types";
import {
  getSourceInstances,
  createSourceInstance,
  updateSourceInstance,
  deleteSourceInstance,
  toggleSourceInstance,
  regeneratePushToken,
} from "../../services/integrations/source.service";
import { toastSuccess, toastError } from "../../utils/toast";

/* ====== Props ====== */
interface SourceConfigModalProps {
  open: boolean;
  onClose: () => void;
  product: string;
  vendor: string;
  allowedFetchTypes?: FetchType[];
}

/* ====== Helpers ====== */

function maskToken(token: string): string {
  if (token.length <= 4) return "••••";
  return "••••••" + token.slice(-4);
}

function StatusDot({ status }: { status: SourceInstance["status"] }) {
  const color =
    status === "connected"
      ? "bg-green-500"
      : status === "pending"
        ? "bg-yellow-500"
        : "bg-red-500";
  const label =
    status === "connected"
      ? "Conectado"
      : status === "pending"
        ? "Pendente"
        : "Sem conexão";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toastSuccess("Copiado!");
    } catch {
      toastError("Falha ao copiar");
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-white transition-colors ml-1"
      title="Copiar"
    >
      📋
    </button>
  );
}

/* ====== Empty form is built inside the component (depends on allowedFetchTypes) ====== */

/* ====== Main Component ====== */
export default function SourceConfigModal({
  open,
  onClose,
  product,
  vendor,
  allowedFetchTypes = ["Pull", "Push"],
}: SourceConfigModalProps) {
  const showFetchTypeToggle = allowedFetchTypes.length > 1;
  const defaultFetchType = allowedFetchTypes[0];
  const emptyForm = {
    fetchType: defaultFetchType,
    description: "",
    apiUrl: "",
    apiToken: "",
    active: true,
  };
  const [instances, setInstances] = useState<SourceInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ---- Load instances ----
  const loadInstances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSourceInstances(product);
      setInstances(data);
    } catch {
      toastError("Erro ao carregar instâncias");
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (open) loadInstances();
  }, [open, loadInstances]);

  // ---- Form handlers ----
  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(inst: SourceInstance) {
    setEditingId(inst.id);
    setForm({
      fetchType: inst.fetchType,
      description: inst.description,
      apiUrl: inst.apiUrl ?? "",
      apiToken: inst.apiToken ?? "",
      active: inst.active,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.description.trim()) {
      toastError("Descrição é obrigatória");
      return;
    }
    if (form.fetchType === "Pull" && !form.apiUrl.trim()) {
      toastError("URL da API é obrigatória para coleta Pull");
      return;
    }
    if (form.fetchType === "Pull" && !form.apiToken.trim()) {
      toastError("API Token é obrigatório para coleta Pull");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateSourceInstance(editingId, {
          description: form.description,
          active: form.active,
          apiUrl: form.fetchType === "Pull" ? form.apiUrl : undefined,
          apiToken: form.fetchType === "Pull" ? form.apiToken : undefined,
        });
        toastSuccess("Instância atualizada");
      } else {
        await createSourceInstance({
          product,
          vendor,
          fetchType: form.fetchType,
          description: form.description,
          active: form.active,
          apiUrl: form.fetchType === "Pull" ? form.apiUrl : undefined,
          apiToken: form.fetchType === "Pull" ? form.apiToken : undefined,
        });
        toastSuccess("Instância criada");
      }
      cancelForm();
      await loadInstances();
    } catch {
      toastError("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // ---- Grid actions ----
  async function handleToggle(id: string, active: boolean) {
    try {
      await toggleSourceInstance(id, active);
      await loadInstances();
    } catch {
      toastError("Erro ao atualizar status");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSourceInstance(id);
      setConfirmDeleteId(null);
      toastSuccess("Instância excluída");
      await loadInstances();
    } catch {
      toastError("Erro ao excluir");
    }
  }

  async function handleRegenerateToken(id: string) {
    try {
      await regeneratePushToken(id);
      toastSuccess("Token regenerado");
      await loadInstances();
    } catch {
      toastError("Erro ao regenerar token");
    }
  }

  // ---- Derived data ----
  const pullInstances = allowedFetchTypes.includes("Pull")
    ? instances.filter((i) => i.fetchType === "Pull")
    : [];
  const pushInstances = allowedFetchTypes.includes("Push")
    ? instances.filter((i) => i.fetchType === "Push")
    : [];

  // ---- Render ----
  return (
    <Modal open={open} onClose={onClose} titulo={product} maxWidth="max-w-5xl">
      <div className="flex flex-col gap-6">
        {/* ===== Header button ===== */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {instances.length} instância(s) configurada(s)
          </span>
          {!showForm && (
            <button
              onClick={openNewForm}
              className="px-4 py-2 rounded-lg text-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              + Nova instância
            </button>
          )}
        </div>

        {/* ===== Form ===== */}
        {showForm && (
          <div className="border border-[#2d2d44] rounded-xl p-5 bg-[#0F0B1C]">
            <h4 className="text-white text-sm font-semibold mb-4">
              {editingId ? "Editar instância" : "Nova instância"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* fetchType toggle — only on create */}
              {!editingId && showFetchTypeToggle && (
                <div className="col-span-full">
                  <label className="text-gray-400 text-xs mb-1 block">
                    Tipo de coleta
                  </label>
                  <div className="flex gap-2">
                    {allowedFetchTypes.map((ft) => (
                      <button
                        key={ft}
                        onClick={() => setForm((p) => ({ ...p, fetchType: ft }))}
                        className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                          form.fetchType === ft
                            ? "bg-purple-600 text-white"
                            : "bg-[#1B1037] text-gray-400 hover:bg-[#261550]"
                        }`}
                      >
                        {ft}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* description */}
              <div className="col-span-full">
                <label className="text-gray-400 text-xs mb-1 block">
                  Descrição
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Ex: Firewall Matriz SP"
                  className="w-full bg-[#1B1037] border border-[#2d2d44] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Pull-only fields */}
              {form.fetchType === "Pull" && (
                <>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">
                      URL da API
                    </label>
                    <input
                      type="text"
                      value={form.apiUrl}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, apiUrl: e.target.value }))
                      }
                      placeholder="https://fortigate.example.com/api/v2"
                      className="w-full bg-[#1B1037] border border-[#2d2d44] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">
                      API Token
                    </label>
                    <input
                      type="password"
                      value={form.apiToken}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, apiToken: e.target.value }))
                      }
                      placeholder="Token de autenticação"
                      className="w-full bg-[#1B1037] border border-[#2d2d44] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </>
              )}

              {/* active toggle */}
              <div className="col-span-full flex items-center gap-3">
                <label className="text-gray-400 text-xs">Ativo</label>
                <button
                  onClick={() =>
                    setForm((p) => ({ ...p, active: !p.active }))
                  }
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    form.active ? "bg-purple-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      form.active ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* form actions */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={cancelForm}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 bg-[#1B1037] hover:bg-[#261550] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}

        {/* ===== Loading ===== */}
        {loading && (
          <p className="text-gray-400 text-sm text-center py-4">Carregando...</p>
        )}

        {/* ===== Grid Pull ===== */}
        {pullInstances.length > 0 && (
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">
              Instâncias Pull
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-400 border-b border-[#2d2d44]">
                    <th className="py-2 px-3 font-medium">Descrição</th>
                    <th className="py-2 px-3 font-medium">URL da API</th>
                    <th className="py-2 px-3 font-medium">API Token</th>
                    <th className="py-2 px-3 font-medium">Ativo</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 px-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pullInstances.map((inst) => (
                    <tr
                      key={inst.id}
                      className="border-b border-[#1D1929] text-white"
                    >
                      <td className="py-2 px-3">{inst.description}</td>
                      <td className="py-2 px-3 text-gray-300 text-xs max-w-[200px] truncate">
                        {inst.apiUrl}
                      </td>
                      <td className="py-2 px-3 text-gray-300 text-xs">
                        {maskToken(inst.apiToken ?? "")}
                        <CopyButton text={inst.apiToken ?? ""} />
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => handleToggle(inst.id, !inst.active)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            inst.active ? "bg-purple-600" : "bg-gray-600"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              inst.active ? "translate-x-5" : ""
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot status={inst.status} />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(inst)}
                            className="text-purple-400 hover:text-purple-300 text-xs"
                          >
                            Editar
                          </button>
                          {confirmDeleteId === inst.id ? (
                            <span className="flex gap-1">
                              <button
                                onClick={() => handleDelete(inst.id)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-gray-400 hover:text-gray-300 text-xs"
                              >
                                Não
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(inst.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== Grid Push ===== */}
        {pushInstances.length > 0 && (
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">
              Instâncias Push
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-400 border-b border-[#2d2d44]">
                    <th className="py-2 px-3 font-medium">Descrição</th>
                    <th className="py-2 px-3 font-medium">Endpoint</th>
                    <th className="py-2 px-3 font-medium">Token</th>
                    <th className="py-2 px-3 font-medium">Ativo</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 px-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pushInstances.map((inst) => (
                    <tr
                      key={inst.id}
                      className="border-b border-[#1D1929] text-white"
                    >
                      <td className="py-2 px-3">{inst.description}</td>
                      <td className="py-2 px-3 text-gray-300 text-xs max-w-[200px] truncate">
                        {inst.pushEndpoint}
                        <CopyButton text={inst.pushEndpoint ?? ""} />
                      </td>
                      <td className="py-2 px-3 text-gray-300 text-xs">
                        {maskToken(inst.pushToken ?? "")}
                        <CopyButton text={inst.pushToken ?? ""} />
                        <button
                          onClick={() => handleRegenerateToken(inst.id)}
                          className="text-purple-400 hover:text-purple-300 text-xs ml-2"
                          title="Regenerar token"
                        >
                          🔄
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => handleToggle(inst.id, !inst.active)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            inst.active ? "bg-purple-600" : "bg-gray-600"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              inst.active ? "translate-x-5" : ""
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-2 px-3">
                        <StatusDot status={inst.status} />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(inst)}
                            className="text-purple-400 hover:text-purple-300 text-xs"
                          >
                            Editar
                          </button>
                          {confirmDeleteId === inst.id ? (
                            <span className="flex gap-1">
                              <button
                                onClick={() => handleDelete(inst.id)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-gray-400 hover:text-gray-300 text-xs"
                              >
                                Não
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(inst.id)}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== Empty state ===== */}
        {!loading && instances.length === 0 && !showForm && (
          <p className="text-gray-500 text-sm text-center py-8">
            Nenhuma instância configurada. Clique em "Nova instância" para começar.
          </p>
        )}
      </div>
    </Modal>
  );
}
