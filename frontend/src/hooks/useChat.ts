// src/hooks/useChat.ts

import { useState, useCallback, useRef } from "react";
import {
    sendChatMessage,
    getChatHistory,
    ChatMessage,
} from "../services/azure-api/chat.service";
import { useScreenContext } from "../context/ScreenContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ChatMessageLocal = {
    id: string;           // id local (pode ser o id real ou um temporário)
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    isLoading?: boolean;  // bolha de "digitando..." do assistant
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat() {
    const [messages, setMessages] = useState<ChatMessageLocal[]>([]);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sessionIdRef = useRef<number | null>(null); // evita closure stale
    const { screenData } = useScreenContext();

    // ─── Normaliza mensagens vindas do histórico ────────────────────────────────
    function normalizeHistory(items: ChatMessage[]): ChatMessageLocal[] {
        return items.map((m) => ({
            id: String(m.id),
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.timestamp,
        }));
    }

    // ─── Carrega histórico de uma sessão existente ──────────────────────────────
    const loadHistory = useCallback(async (sid: number) => {
        try {
            const history = await getChatHistory(sid);
            setMessages(normalizeHistory(history.items));
            setSessionId(sid);
            sessionIdRef.current = sid;
        } catch {
            // sessão inválida — começa do zero
            setMessages([]);
        }
    }, []);

    // ─── Envia mensagem ─────────────────────────────────────────────────────────
    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return;

            setError(null);

            // 1. Adiciona mensagem do usuário imediatamente (optimistic)
            const userMsg: ChatMessageLocal = {
                id: `user-${Date.now()}`,
                role: "user",
                content: content.trim(),
                timestamp: new Date().toISOString(),
            };

            // 2. Adiciona bolha de loading do assistant
            const loadingMsg: ChatMessageLocal = {
                id: "assistant-loading",
                role: "assistant",
                content: "",
                timestamp: new Date().toISOString(),
                isLoading: true,
            };

            setMessages((prev) => [...prev, userMsg, loadingMsg]);
            setIsLoading(true);

            try {
                const response = await sendChatMessage({
                    message: content.trim(),
                    sessionId: sessionIdRef.current,
                    purpose: 0,
                    screenContext: {
                        page: screenData.page,
                        entity: screenData.entity,
                        metadata: screenData.metadata,
                    },
                });

                // 3. Salva sessionId se for a primeira mensagem
                if (!sessionIdRef.current) {
                    setSessionId(response.sessionId);
                    sessionIdRef.current = response.sessionId;
                }

                // 4. Substitui bolha de loading pela resposta real
                const assistantMsg: ChatMessageLocal = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: response.response,
                    timestamp: response.timestamp,
                };

                setMessages((prev) =>
                    prev
                        .filter((m) => m.id !== "assistant-loading")
                        .concat(assistantMsg)
                );
            } catch {
                setError("Erro ao enviar mensagem. Tente novamente.");
                // Remove bolha de loading e a mensagem do usuário em caso de erro
                setMessages((prev) =>
                    prev.filter(
                        (m) => m.id !== "assistant-loading" && m.id !== userMsg.id
                    )
                );
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading]
    );

    // ─── Limpa a conversa (nova sessão) ────────────────────────────────────────
    const clearChat = useCallback(() => {
        setMessages([]);
        setSessionId(null);
        sessionIdRef.current = null;
        setError(null);
    }, []);

    return {
        messages,
        sessionId,
        isLoading,
        error,
        sendMessage,
        loadHistory,
        clearChat,
    };
}