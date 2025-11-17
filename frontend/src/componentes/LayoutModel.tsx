// src/componentes/LayoutModel.tsx
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./SideBar";
import TenantSelector from "./TenantSelector";
import { logout } from "../utils/auth";
import { toastSuccess } from "../utils/toast";
import { FiLogOut } from "react-icons/fi";
import { AiFillSun, AiFillQuestionCircle } from "react-icons/ai";
import { FaWhatsapp, FaMoon } from "react-icons/fa";

interface LayoutModelProps {
  children: ReactNode;
  titulo?: string;
}

export default function LayoutModel({ children, titulo }: LayoutModelProps) {
  const navigate = useNavigate();
  const [temaClaro, setTemaClaro] = useState<boolean | undefined>(undefined);

  // Verificar tema salvo
  useEffect(() => {
    const temaSalvo = localStorage.getItem("tema") === "claro";
    setTemaClaro(temaSalvo);
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(temaSalvo ? "tema-claro" : "tema-escuro");
  }, []);

  // Atualizar o título da aba do navegador
  useEffect(() => {
    if (titulo) {
      document.title = `${titulo}`;
    } else {
      document.title = "Dashboard";
    }
  }, [titulo]);


  // Alternar tema
  const alternarTema = () => {
    const novoTemaClaro = !temaClaro;
    setTemaClaro(novoTemaClaro);
    localStorage.setItem("tema", novoTemaClaro ? "claro" : "escuro");
    document.body.classList.remove("tema-claro", "tema-escuro");
    document.body.classList.add(novoTemaClaro ? "tema-claro" : "tema-escuro");
  };

  const handleLogout = () => {
    logout();
    toastSuccess("Logout realizado com sucesso!");
    navigate("/login");
  };

  if (temaClaro === undefined) return null;

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 px-6 py-4 fundo-dashboard texto-dashboard transition-colors duration-300">
        {/* Header */}
        <header className="flex items-center px-6 rounded-xl justify-between mb-4">
          {/* 🔹 Esquerda - Título */}
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl">{titulo}</h1>
          </div>

          {/* 🔹 Centro - TenantSelector centralizado */}
          {/* <div className="flex-1 flex justify-center">
            <TenantSelector />
          </div> */}

          {/* 🔹 Direita - Botões */}
          <div className="flex items-center gap-3">
            <TenantSelector />
            {/* WhatsApp */}
            <a
              href="https://hackone.com.br/consultoria-aberturachamado"
              target="_blank"
              rel="noopener noreferrer"
              className="flex header items-center gap-2 text-gray-400 border hover:text-white border-[#1D1929] px-4 py-2 rounded-md text-sm transition"
            >
              {/* @ts-ignore */}
              <FaWhatsapp className="text-gray-300 text-1xl" />
              Suporte
            </a>

            {/* Sair */}
            <button
              onClick={handleLogout}
              className="flex items-center header gap-2 text-gray-400 login border border-[#1D1929] hover:text-white px-4 py-2 rounded-md text-sm transition"
            >
              {/* @ts-ignore */}
              <FiLogOut className="text-gray-300" />
              Sair
            </button>

            {/* Toggle Tema */}
            {/* <button
              onClick={alternarTema}
              className={`w-15 h-9 toggle rounded-full border border-[#1D1929] cursor-pointer px-1 transition-all duration-300 ${temaClaro ? "bg-[#3b2a7054]" : "bg-[#161125]"
                } flex items-center`}
            >
              <div
                className={`w-8 h-8 box-icon rounded-full bg-white text-black toggle text-xs flex items-center justify-center shadow-md transition-all duration-300 transform ${temaClaro ? "translate-x-0" : "translate-x-5"
                  }`}
              >
                {temaClaro ? <AiFillSun /> : <FaMoon />}
              </div>
            </button> */}
          </div>
        </header>


        {/* Conteúdo da página */}
        {children}

        {/* Rodapé */}
        <footer className="text-right text-gray-500 text-xs mt-4">
          Versão 1.5.1.3
        </footer>

      </div>
    </div>
  );
}