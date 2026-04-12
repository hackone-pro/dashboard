// src/componentes/chat/ChatWidget.tsx

import { useState } from "react";
import { FiMessageSquare, FiX } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import ChatWindow from "./ChatWindow";

// ─── Rotas onde o chat NÃO deve aparecer ─────────────────────────────────────
const PUBLIC_ROUTES = [
  "/login",
  "/verify-code",
  "/forgot-password",
  "/reset-password",
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Esconde o widget em rotas públicas
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  );

  if (isPublicRoute) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Janela do chat ───────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="
            animate-in fade-in slide-in-from-bottom-4
            duration-200
          "
        >
          <ChatWindow
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}

      {/* ── Botão flutuante ──────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? "Fechar assistente" : "Abrir assistente"}
        className="
          w-13 h-13 rounded-full
          bg-[#4B06DD] hover:bg-[#5c1aee]
          border border-[#6B26FF]/50
          shadow-lg shadow-[#4B06DD]/30
          flex items-center justify-center
          transition-all duration-200
          hover:scale-105 active:scale-95
        "
      >
        {isOpen ? (
          // @ts-ignore
          <FiX size={20} className="text-white" />
        ) : (
          // @ts-ignore
          <FiMessageSquare size={20} className="text-white" />
        )}
      </button>

    </div>
  );
}