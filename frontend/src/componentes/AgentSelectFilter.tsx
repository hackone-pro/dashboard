import { useEffect, useRef, useState } from "react";
import { FaFilter } from "react-icons/fa";

interface Props {
  agents: string[];
  value?: string | null;
  onApply: (agent: string | null) => void;
}

export default function AgentSelectFilter({
  agents,
  value,
  onApply,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* ============================
     SINCRONIZA COM O PAI
  ============================ */
  useEffect(() => {
    setSelected(value ?? null);
  }, [value]);

  /* ============================
     CLICK FORA
  ============================ */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* BOTÃO */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[14px] text-purple-400 hover:text-purple-200"
      >
        {/* @ts-ignore */}
        <FaFilter className="w-4 h-4" />
        Agentes
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute right-0 mt-3 z-50
            bg-[#0A0617] border border-[#1D1929]
            rounded-xl p-4 shadow-lg
            min-w-[260px]
          "
        >
          <select
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
            className="
              w-full bg-[#0A0617] border border-[#1D1929]
              text-sm text-gray-200 rounded-md px-3 py-2
            "
          >
            <option value="">Todos os agentes</option>

            {agents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                onApply(selected);
                setOpen(false);
              }}
              className="
                bg-purple-600 hover:bg-purple-700
                text-white px-4 py-2 rounded-md text-sm
              "
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
