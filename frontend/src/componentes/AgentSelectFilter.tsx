import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const portalRoot = typeof window !== "undefined" ? document.body : null;

  function updatePosition() {
    if (!buttonRef.current) return;
  
    const rect = buttonRef.current.getBoundingClientRect();
  
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
  }

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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
  
    function handleScroll() {
      updatePosition();
    }
  
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
  
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);
  

  return (
    <div className="relative">
      {/* BOTÃO */}
      <button
        ref={buttonRef}
        onClick={() => {
          if (!open) {
            updatePosition();
          }
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
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {/* CONTAINER COM SCROLL */}
            <div className="max-h-[320px] overflow-y-auto p-2 lista-secoes">

              {/* OPÇÃO TODOS */}
              <button
                onClick={() => {
                  setSelected(null);
                  onApply(null);
                  setOpen(false);
                }}
                className={`
                  relative w-full flex items-center gap-3 p-3 rounded-md text-left
                  transition-colors
                  ${!selected
                    ? `
                      bg-[#250E5D] text-white
                      before:absolute before:top-0 before:left-0 before:w-full before:h-[1px]
                      before:bg-gradient-to-r before:from-[#3A0F80] before:via-[#AE29CA] before:to-[#3A0F80]
                      after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px]
                      after:bg-gradient-to-r after:from-[#3A0F80] after:via-[#AE29CA] after:to-[#3A0F80]
                    `
                    : "text-gray-400 hover:bg-[#1B1037]"
                  }
                `}
              >
                <span
                  className={`
                    w-6 h-6 flex items-center justify-center
                    border border-[#271E3F] rounded-full
                    ${!selected ? "border-[#554b74]" : ""}
                  `}
                >
                  <svg
                    className={`
                      w-4 h-4 transition-all
                      ${!selected
                              ? "opacity-100 scale-100 text-[#939393]"
                              : "opacity-0 scale-75"
                      }
              `}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>

                <span>Todos os agentes</span>
              </button>

              {/* LISTA DE AGENTES */}
              {agents.map((agent) => {
                const ativo = selected === agent;

                return (
                  <button
                    key={agent}
                    onClick={() => {
                      setSelected(agent);
                      onApply(agent);
                      setOpen(false);
                    }}
                    className={`
                      relative w-full flex items-center gap-3 p-3 rounded-md text-left
                      transition-colors
                      ${ativo
                              ? `
                          bg-[#250E5D] text-white
                          before:absolute before:top-0 before:left-0 before:w-full before:h-[1px]
                          before:bg-gradient-to-r before:from-[#3A0F80] before:via-[#AE29CA] before:to-[#3A0F80]
                          after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px]
                          after:bg-gradient-to-r after:from-[#3A0F80] after:via-[#AE29CA] after:to-[#3A0F80]
                        `
                              : "text-gray-400 hover:bg-[#1B1037]"
                            }
                    `}
                  >
                    <span
                      className={`
                        w-6 h-6 flex items-center justify-center
                        border border-[#271E3F] rounded-full
                        ${ativo ? "border-[#554b74]" : ""}
                      `}
                    >
                      <svg
                        className={`
                          w-4 h-4 transition-all
                          ${ativo
                                  ? "opacity-100 scale-100 text-[#939393]"
                                  : "opacity-0 scale-75"
                          }
                  `}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>

                    <span>{agent}</span>
                  </button>
                );
              })}

            </div>
          </div>,
          portalRoot
        )
      }

    </div>
  );
}
