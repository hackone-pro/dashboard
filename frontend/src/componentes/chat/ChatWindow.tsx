// src/componentes/chat/ChatWindow.tsx

import { useEffect, useRef } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import { useChat } from "../../hooks/useChat";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

type Props = {
    onClose: () => void;
    currentPage?: string;
};

export default function ChatWindow({ onClose, currentPage }: Props) {
    const { messages, isLoading, error, sendMessage, clearChat } = useChat();
    const bottomRef = useRef<HTMLDivElement>(null);

    // ─── Scroll automático ao receber nova mensagem ───────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ─── Envia mensagem passando a página atual como contexto ─────────────────
    function handleSend(content: string) {
        sendMessage(content, currentPage);
    }

    return (
        <div
            className="
        flex flex-col w-[360px] h-[520px]
        bg-[#0f0a1e] border border-[#2a2040]
        rounded-2xl shadow-2xl shadow-black/60
        overflow-hidden
      "
        >
            {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2040] bg-[#0f0a1e] shrink-0">
                <div className="flex items-center gap-2.5">
                    {/* Ícone com glow */}
                    <div className="w-8 h-8 rounded-full bg-[#4B06DD]/20 border border-[#4B06DD]/50 flex items-center justify-center">
                        <span className="text-sm">✦</span>
                    </div>
                    <div>
                        <p className="text-white text-sm font-medium leading-tight">
                            Assistente IA
                        </p>
                        <p className="text-[10px] text-emerald-400 leading-tight">
                            {isLoading ? "digitando..." : "online"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Botão limpar conversa */}
                    <button
                        onClick={clearChat}
                        title="Nova conversa"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition"
                    >
                        {/* @ts-ignore */}
                        <FiTrash2 size={13} />
                    </button>

                    {/* Botão fechar */}
                    <button
                        onClick={onClose}
                        title="Fechar"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition"
                    >
                        {/* @ts-ignore */}
                        <FiX size={15} />
                    </button>
                </div>
            </div>

            {/* ── Lista de mensagens ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 scrollbar-hide">

                {/* Estado vazio */}
                {messages.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-[#4B06DD]/10 border border-[#4B06DD]/30 flex items-center justify-center">
                            <span className="text-xl">✦</span>
                        </div>
                        <div>
                            <p className="text-gray-300 text-sm font-medium">
                                Como posso ajudar?
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                                Pergunte sobre alertas, métricas ou qualquer dado da plataforma.
                            </p>
                        </div>
                    </div>
                )}

                {/* Mensagens */}
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Erro */}
                {error && (
                    <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2 text-center">
                        {error}
                    </div>
                )}

                {/* Âncora para scroll automático */}
                <div ref={bottomRef} />
            </div>

            {/* ── Input ──────────────────────────────────────────────────────────── */}
            <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
    );
}