// src/componentes/chat/ChatInput.tsx

import { useState, useRef, KeyboardEvent } from "react";
import { FiSend } from "react-icons/fi";

type Props = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export default function ChatInput({ onSend, disabled = false }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Envio ────────────────────────────────────────────────────────────────
  function handleSend() {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
    // Reseta altura do textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  // ─── Enter envia, Shift+Enter quebra linha ────────────────────────────────
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ─── Auto-resize do textarea ──────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Cresce até 120px, depois rola
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t border-[#2a2040] bg-[#0f0a1e]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Digite sua mensagem..."
        rows={1}
        className="
          flex-1 resize-none bg-[#1a1330] border border-[#2a2040]
          text-gray-200 text-sm placeholder-gray-600
          rounded-xl px-3 py-2.5 outline-none leading-relaxed
          focus:border-[#4B06DD]/60 transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed
          scrollbar-hide
        "
      />

      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="
          w-9 h-9 rounded-xl flex items-center justify-center shrink-0
          bg-[#4B06DD] hover:bg-[#5c1aee] transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed
        "
      >
        {/* @ts-ignore */}
        <FiSend size={15} className="text-white" />
      </button>
    </div>
  );
}