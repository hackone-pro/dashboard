// src/componentes/OptionGroup.tsx
//
// Grupo de seleção com dropdown — abre/fecha ao clicar no botão.


import { useState, useRef, useEffect } from "react";

/* =========================================
 * OPTION BUTTON
 * ======================================= */
interface OptionButtonProps {
  label: string;
  ativo: boolean;
  onClick: () => void;
}

export function OptionButton({ label, ativo, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full flex items-center gap-3 p-3 rounded-md text-left
        transition-colors
        ${ativo
          ? `bg-[#250E5D] text-white
             before:absolute before:top-0 before:left-0 before:w-full before:h-[1px]
             before:bg-gradient-to-r before:from-[#3A0F80] before:via-[#AE29CA] before:to-[#3A0F80]
             after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px]
             after:bg-gradient-to-r after:from-[#3A0F80] after:via-[#AE29CA] after:to-[#3A0F80]`
          : "text-gray-400 hover:bg-[#1B1037]"
        }
      `}
    >
      <span className={`w-6 h-6 flex items-center justify-center flex-shrink-0 border rounded-full transition-colors ${ativo ? "border-[#554b74]" : "border-[#271E3F]"}`}>
        <svg
          className={`w-4 h-4 transition-all ${ativo ? "opacity-100 scale-100 text-[#939393]" : "opacity-0 scale-75"}`}
          fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

/* =========================================
 * OPTION GROUP
 * ======================================= */
interface OptionGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  maxHeight?: string;
}

export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  maxHeight = "220px",
}: OptionGroupProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const labelAtivo = options.find(o => o.value === value)?.label ?? "Selecionar";

  return (
    <div ref={containerRef} className="relative">
      <p className="text-sm text-gray-300 mb-2">{label}</p>

      {/* Botão trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="
          w-full flex items-center justify-between gap-2
          bg-[#0A0617] border border-white/10 text-white
          rounded-xl px-4 py-2.5 cursor-pointer
          hover:border-purple-500 transition-colors
        "
      >
        <span className="text-sm text-gray-200 truncate">{labelAtivo}</span>
        <span className={`text-gray-400 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute z-50 top-full left-0 right-0 mt-1
          bg-[#161125] border border-white/10
          rounded-xl shadow-xl overflow-hidden
        ">
          <div className="p-1 lista-secoes" style={{ maxHeight, overflowY: "auto" }}>
            {options.map((opt) => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                ativo={value === opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}