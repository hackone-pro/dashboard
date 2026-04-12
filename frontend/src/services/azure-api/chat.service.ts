// src/services/azure-api/chat.service.ts

import axios from "axios";
import { serviceHeaders } from "./headers";

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
    screenContext?: ScreenContextDto | null;
    purpose?: number;
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

// ─── Funções ─────────────────────────────────────────────────────────────────

export async function sendChatMessage(
    payload: SendMessagePayload
): Promise<SendMessageResponse> {
    const { data } = await axios.post<SendMessageResponse>(
        `${API_URL}/api/chat`,
        payload,
        { headers: serviceHeaders() }
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
            headers: serviceHeaders(),
        }
    );
    return data;
}