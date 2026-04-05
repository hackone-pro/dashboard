// src/componentes/chat/MessageBubble.tsx

import { ChatMessageLocal } from "../../hooks/useChat";

type Props = {
    message: ChatMessageLocal;
};

export default function MessageBubble({ message }: Props) {
    const isUser = message.role === "user";

    // ─── Bolha de "digitando..." ──────────────────────────────────────────────
    if (message.isLoading) {
        return (
            <div className="flex items-end gap-2">
                {/* Avatar assistant */}
                <div className="w-7 h-7 rounded-full bg-[#4B06DD]/20 border border-[#4B06DD]/40 flex items-center justify-center shrink-0">
                    <span className="text-[10px]">✦</span>
                </div>

                {/* Bolha com dots animados */}
                <div className="bg-[#1a1330] border border-[#2a2040] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ─── Mensagem do usuário ──────────────────────────────────────────────────
    if (isUser) {
        return (
            <div className="flex items-end gap-2 justify-end">
                <div className="max-w-[75%]">
                    <div className="bg-[#4B06DD] text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 leading-relaxed">
                        {message.content}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1 text-right pr-1">
                        {formatTime(message.timestamp)}
                    </p>
                </div>

                {/* Avatar usuário */}
                <div className="w-7 h-7 rounded-full bg-[#2a2040] border border-[#3a3050] flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-gray-400">U</span>
                </div>
            </div>
        );
    }

    // ─── Mensagem do assistant ────────────────────────────────────────────────
    return (
        <div className="flex items-end gap-2">
            {/* Avatar assistant */}
            <div className="w-7 h-7 rounded-full bg-[#4B06DD]/20 border border-[#4B06DD]/40 flex items-center justify-center shrink-0">
                <span className="text-[10px]">✦</span>
            </div>

            <div className="max-w-[75%]">
                <div className="bg-[#1a1330] border border-[#2a2040] text-gray-200 text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                </div>
                <p className="text-[10px] text-gray-600 mt-1 pl-1">
                    {formatTime(message.timestamp)}
                </p>
            </div>
        </div>
    );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}