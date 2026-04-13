// src/componentes/integrations/LLMConfigPanel.tsx

import { useState } from "react";
import { FiX, FiLoader, FiCheck, FiAlertCircle } from "react-icons/fi";
import {
    PROVIDERS,
    ProviderType,
    LLMPurpose,
    LLM_PURPOSE_MAP,
    validateApiKey,
    getAvailableModels,
    saveLLMConfig,
    updateLLMConfig,
} from "../../services/azure-api/llm.service";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = {
    providerInicial: ProviderType;
    purpose: LLMPurpose;
    configId?: string | null;
    onClose: () => void;
    onSaved?: () => void;
};

type Status = "idle" | "validating" | "loading-models" | "saving" | "success" | "error";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LLMConfigPanel({
    providerInicial,
    purpose,
    configId,
    onClose,
    onSaved,
}: Props) {
    const [apiKey, setApiKey] = useState("");
    const [modelo, setModelo] = useState("");
    const [modelos, setModelos] = useState<string[]>([]);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const providerLabel = PROVIDERS.find((p) => p.value === providerInicial)?.label ?? "";
    const purposeLabel = purpose === "chat" ? "Chat com IA" : "Analítico";

    // ─── Ao sair do campo apiKey: valida e busca modelos ───────────────────────
    async function handleApiKeyBlur() {
        if (!apiKey.trim()) return;

        setStatus("validating");
        setModelos([]);
        setModelo("");
        setErrorMsg("");

        try {
            const valida = await validateApiKey(
                providerInicial,
                apiKey.trim()
            );

            if (!valida) {
                setErrorMsg("Chave de API inválida para o provedor selecionado.");
                setStatus("error");
                return;
            }

            setStatus("loading-models");

            const lista = await getAvailableModels(
                providerInicial,
                apiKey.trim()
            );

            if (!lista || lista.length === 0) {
                setErrorMsg("Nenhum modelo encontrado. Verifique o provedor e a chave de API.");
                setStatus("error");
                return;
            }

            setModelos(lista);
            setModelo(lista[0]);
            setStatus("idle");

        } catch {
            setErrorMsg("Erro ao validar chave. Verifique o provedor e tente novamente.");
            setStatus("error");
        }
    }

    // ─── Salva configuração ─────────────────────────────────────────────────────
    async function handleSave() {
        if (!apiKey.trim() || !modelo) return;

        setStatus("saving");
        setErrorMsg("");

        try {
            if (configId) {
                await updateLLMConfig(configId, {
                    llmProvider: providerInicial,
                    purpose: LLM_PURPOSE_MAP[purpose],
                    model: modelo,
                    apiKey: apiKey.trim(),
                    endpoint: null,
                    systemPrompt: null,
                });
            } else {
                await saveLLMConfig({
                    purpose: LLM_PURPOSE_MAP[purpose],
                    providerType: providerInicial,
                    model: modelo,
                    apiKey: apiKey.trim(),
                    endpoint: null,
                    systemPrompt: null,
                });
            }
            setStatus("success");
            onSaved?.();
        } catch {
            setErrorMsg("Erro ao salvar configuração. Tente novamente.");
            setStatus("error");
        }
    }

    const isValidating = status === "validating";
    const isLoadingModels = status === "loading-models";
    const isSaving = status === "saving";
    const isSuccess = status === "success";
    const isBusy = isValidating || isLoadingModels || isSaving;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/40 z-40"
                onClick={onClose}
            />

            {/* Painel */}
            <div className="fixed top-0 right-0 h-full w-[420px] bg-[#0f0a1e] border-l border-[#2a2040] z-50 flex flex-col shadow-2xl">

                {/* Cabeçalho */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2040]">
                    <div>
                        <p className="text-white font-medium">Configurar LLM — {purposeLabel}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                            Provedor: <span className="text-purple-400">{providerLabel}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition"
                    >
                        {/* @ts-ignore */}
                        <FiX size={16} />
                    </button>
                </div>

                {/* Formulário */}
                <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

                    {/* Chave de API */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-gray-400">Chave de API</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            onBlur={handleApiKeyBlur}
                            disabled={isBusy}
                            placeholder="Cole sua chave aqui..."
                            className="bg-[#1a1330] border border-[#2a2040] text-gray-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-[#4B06DD]/60 transition placeholder-gray-600 disabled:opacity-50"
                        />
                        <p className="text-[11px] text-gray-600">
                            A chave será validada automaticamente ao sair deste campo.
                        </p>
                    </div>

                    {/* Modelo */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-gray-400">Modelo</label>

                        {isValidating && (
                            <div className="flex items-center gap-2 bg-[#1a1330] border border-[#2a2040] rounded-lg px-3 py-2.5">
                                {/* @ts-ignore */}
                                <FiLoader size={14} className="text-purple-400 animate-spin" />
                                <span className="text-gray-500 text-sm">Validando chave...</span>
                            </div>
                        )}

                        {isLoadingModels && (
                            <div className="flex items-center gap-2 bg-[#1a1330] border border-[#2a2040] rounded-lg px-3 py-2.5">
                                {/* @ts-ignore */}
                                <FiLoader size={14} className="text-purple-400 animate-spin" />
                                <span className="text-gray-500 text-sm">Carregando modelos...</span>
                            </div>
                        )}

                        {!isValidating && !isLoadingModels && modelos.length > 0 && (
                            <select
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                disabled={isBusy}
                                className="bg-[#1a1330] border border-[#2a2040] text-gray-200 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-[#4B06DD]/60 transition disabled:opacity-50"
                            >
                                {modelos.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        )}

                        {!isValidating && !isLoadingModels && modelos.length === 0 && status !== "error" && (
                            <div className="bg-[#1a1330] border border-dashed border-[#2a2040] rounded-lg px-3 py-2.5">
                                <span className="text-gray-600 text-sm">
                                    Informe a chave de API para carregar os modelos.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Erro */}
                    {status === "error" && errorMsg && (
                        <div className="flex items-start gap-2 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2.5">
                            {/* @ts-ignore */}
                            <FiAlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                            <p className="text-red-400 text-xs">{errorMsg}</p>
                        </div>
                    )}

                    {/* Sucesso */}
                    {isSuccess && (
                        <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/50 rounded-lg px-3 py-3">
                            {/* @ts-ignore */}
                            <FiCheck size={14} className="text-emerald-400 shrink-0" />
                            <p className="text-emerald-400 text-xs font-medium">
                                Configuracao salva com sucesso!
                            </p>
                        </div>
                    )}

                </div>

                {/* Rodapé */}
                <div className="px-6 py-4 border-t border-[#2a2040]">
                    <button
                        onClick={handleSave}
                        disabled={isBusy || !apiKey.trim() || !modelo || isSuccess}
                        className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#4B06DD] hover:bg-[#5c1aee] text-white transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                {/* @ts-ignore */}
                                <FiLoader size={14} className="animate-spin" />
                                Salvando...
                            </>
                        ) : isSuccess ? (
                            <>
                                {/* @ts-ignore */}
                                <FiCheck size={14} />
                                Salvo!
                            </>
                        ) : (
                            "Salvar configuração"
                        )}
                    </button>
                </div>

            </div>
        </>
    );
}