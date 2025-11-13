import { useState, useEffect, useRef } from "react";
import { EllipsisVertical, Trash2 } from "lucide-react";

interface WidgetMenuProps {
  onRemove: () => void | Promise<void>;
}

export default function WidgetMenu({ onRemove }: WidgetMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 🔹 Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left z-50" ref={ref}>
      {/* Botão de 3 pontinhos */}
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-gray-400 hover:text-white transition rounded-md hover:bg-[#2a2540]"
        title="Opções do widget"
      >
        <EllipsisVertical size={18} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-1 w-44 origin-top-right bg-[#2a2540] border border-[#3b3360] rounded-lg shadow-lg ring-1 ring-black/5 focus:outline-none animate-fadeIn"
          style={{ zIndex: 9999 }}
        >
          <button
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#3b3360] transition-all rounded-md"
          >
            <Trash2 size={16} className="text-red-400" />
            Remover widget
          </button>
        </div>
      )}
    </div>
  );
}
