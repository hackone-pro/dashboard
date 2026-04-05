// src/services/azure-api/chat.service.ts

import axios from "axios";
import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_CHAT_API_URL;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ScreenContextDto = {
    page: string;
    entity: string | null;
    metadata: string | null;
};

export type SendMessagePayload = {
    message: string;
    sessionId?: number | null;
    clientId?: string | null;
    screenContext?: ScreenContextDto | null;
};

export type SendMessageResponse = {
    sessionId: number;
    response: string;
    timestamp: string;
};

export type ChatMessage = {
    id: number;
    role: string;       // "user" | "assistant"
    content: string;
    timestamp: string;
};

export type ChatHistoryResponse = {
    items: ChatMessage[];
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Funções ─────────────────────────────────────────────────────────────────

export async function sendChatMessage(
    payload: SendMessagePayload
): Promise<SendMessageResponse> {
    const { data } = await axios.post<SendMessageResponse>(
        `${API_URL}/api/chat`,
        payload,
        { headers: { ...authHeaders() } }
    );
    return data;
}

export async function getChatHistory(
    sessionId: number,
    pageNumber = 1,
    pageSize = 50
): Promise<ChatHistoryResponse> {
    const { data } = await axios.get<ChatHistoryResponse>(
        `${API_URL}/api/chat/sessions/${sessionId}/history`,
        {
            params: { pageNumber, pageSize },
            headers: { ...authHeaders() },
        }
    );
    return data;
}