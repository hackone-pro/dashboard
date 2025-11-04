import { useState, useRef, useEffect } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

interface WidgetMenuProps {
  onRemove?: () => void;
}

export default function WidgetMenu({ onRemove }: WidgetMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão de 3 pontinhos */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((prev) => !prev)}
        className="p-3 rounded-md hover:bg-white/10 text-gray-300 hover:text-white transition"
      >
        <MoreVertical size={16} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-40 bg-[#1E1E2A] border border-white/10 rounded-md shadow-lg z-50 py-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setOpen(false);
              onRemove?.();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 w-full text-left"
          >
            <Trash2 size={14} className="text-red-400" /> Remover widget
          </button>
        </div>
      )}
    </div>
  );
}