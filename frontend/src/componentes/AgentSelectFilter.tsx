import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaFilter } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";

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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [search, setSearch] = useState("");

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const portalRoot = typeof window !== "undefined" ? document.body : null;

  const filteredAgents = agents.filter((a) =>
    a.toLowerCase().includes(search.toLowerCase())
  );

  function updatePosition() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
  }

  /* SINCRONIZA COM O PAI */
  useEffect(() => {
    setSelected(value ?? null);
  }, [value]);

  /* FOCA O INPUT AO ABRIR E LIMPA AO FECHAR */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  /* CLICK FORA */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        open &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* REPOSICIONA NO SCROLL/RESIZE */
  useEffect(() => {
    if (!open) return;
    function handleScroll() { updatePosition(); }
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const itemClass = (ativo: boolean) => `
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
  `;

  const checkIcon = (ativo: boolean) => (
    <span
      className={`w-6 h-6 flex items-center justify-center border border-[#271E3F] rounded-full ${ativo ? "border-[#554b74]" : ""}`}
    >
      <svg
        className={`w-4 h-4 transition-all ${ativo ? "opacity-100 scale-100 text-[#939393]" : "opacity-0 scale-75"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );

  return (
    <div className="relative">
      {/* BOTÃO */}
      <button
        ref={buttonRef}
        onClick={() => {
          if (!open) updatePosition();
          setOpen((v) => !v);
        }}
        className="
          bg-[#0A0617]
          border border-white/10
          text-white
          rounded-xl
          px-4 py-2
          pr-10
          flex items-center gap-2
          cursor-pointer
        "
      >
        {/* @ts-ignore */}
        <FaFilter className="w-4 h-4 text-purple-400" />
        <span className={selected ? "text-white" : "text-gray-400"}>
          {selected ?? "Todos os agentes"}
        </span>
        <span className="ml-auto text-gray-300">▼</span>
      </button>

      {/* DROPDOWN */}
      {open && portalRoot &&
        createPortal(
          <div
            ref={dropdownRef}
            className="
              fixed z-[999999]
              bg-[#161125]
              border border-white/10
              rounded-xl
              shadow-xl
              w-64
            "
            style={{ top: position.top, left: position.left }}
          >
            {/* INPUT DE BUSCA */}
            <div className="px-3 pt-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 bg-[#0A0617] border border-white/10 rounded-lg px-3 py-2">
                {/* @ts-ignore */}
                <FiSearch className="w-4 h-4 text-purple-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar agente..."
                  className="
                    w-full bg-transparent
                    text-[13px] text-white
                    placeholder-gray-500
                    outline-none
                  "
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-gray-500 hover:text-white text-xs leading-none"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* LISTA COM SCROLL */}
            <div className="max-h-[260px] overflow-y-auto p-2 lista-secoes">

              {/* OPÇÃO TODOS — esconde durante busca ativa */}
              {!search && (
                <button
                  onClick={() => {
                    setSelected(null);
                    onApply(null);
                    setOpen(false);
                  }}
                  className={itemClass(!selected)}
                >
                  {checkIcon(!selected)}
                  <span>Todos os agentes</span>
                </button>
              )}

              {/* LISTA FILTRADA */}
              {filteredAgents.length === 0 ? (
                <p className="text-center text-gray-500 text-[13px] py-4">
                  Nenhum agente encontrado
                </p>
              ) : (
                filteredAgents.map((agent) => {
                  const ativo = selected === agent;
                  return (
                    <button
                      key={agent}
                      onClick={() => {
                        setSelected(agent);
                        onApply(agent);
                        setOpen(false);
                      }}
                      className={itemClass(ativo)}
                    >
                      {checkIcon(ativo)}
                      <span>{agent}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* RODAPÉ COM CONTADOR */}
            <div className="px-4 py-2 border-t border-white/10 text-[11px] text-gray-500">
              {filteredAgents.length} de {agents.length} agentes
            </div>
          </div>,
          portalRoot
        )
      }
    </div>
  );
}