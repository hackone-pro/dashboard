// src/componentes/Modal.tsx
//
// Modal genérico e reutilizável.
// Uso:
//   <Modal open={open} onClose={onClose} titulo="Título">
//     <p>conteúdo</p>
//   </Modal>

import { useEffect } from "react";
import { createPortal } from "react-dom";

/* =========================================
 * TYPES
 * ======================================= */
interface ModalProps {
  open: boolean;
  onClose: () => void;
  titulo?: React.ReactNode;
  children: React.ReactNode;
  /** Largura máxima do painel. Default: max-w-2xl */
  maxWidth?: string;
  /** Esconde o botão X do header */
  semFechar?: boolean;
}

/* =========================================
 * COMPONENTE
 * ======================================= */
export default function Modal({
  open,
  onClose,
  titulo,
  children,
  maxWidth = "max-w-2xl",
  semFechar = false,
}: ModalProps) {
  // Bloqueia scroll do body enquanto o modal está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Fecha ao pressionar Esc
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const portalRoot = typeof window !== "undefined" ? document.body : null;
  if (!portalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`
          relative w-full ${maxWidth}
          max-h-[90vh] overflow-y-auto
          bg-[#0A0617] border border-[#3c2d6e]
          rounded-2xl shadow-xl
          flex flex-col
        `}
      >
        {/* Header */}
        {(titulo || !semFechar) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1D1929] flex-shrink-0">
            {titulo && (
              <h3 className="text-white text-base font-semibold">{titulo}</h3>
            )}
            {!semFechar && (
              <button
                onClick={onClose}
                className="ml-auto text-gray-400 hover:text-white transition-colors text-xl leading-none"
                aria-label="Fechar modal"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Conteúdo */}
        <div className="px-6 py-5 flex-1 overflow-y-auto lista-secoes">
          {children}
        </div>
      </div>
    </div>,
    portalRoot
  );
}

/* =========================================
 * SUBCOMPONENTES UTILITÁRIOS
 * Exportados para uso dentro do Modal
 * ======================================= */

/** Rodapé com botões de ação */
export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#1D1929] flex-shrink-0">
      {children}
    </div>
  );
}

/** Botão cancelar padrão */
export function ModalBotaoCancelar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-lg text-sm text-gray-400 bg-[#1B1037] hover:bg-[#261550] transition-colors"
    >
      Cancelar
    </button>
  );
}

/** Botão confirmar padrão */
export function ModalBotaoConfirmar({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
    >
      {children}
    </button>
  );
}