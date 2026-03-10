// src/componentes/LayoutModel.tsx
import { ReactNode, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Sidebar from "./SideBar";
import TenantSelector from "./TenantSelector";
import { toastSuccess } from "../utils/toast";
import { FiLogOut } from "react-icons/fi";
import { AiFillSun, AiFillQuestionCircle } from "react-icons/ai";
import { FaWhatsapp, FaMoon, FaUserCog } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { PiNetwork } from "react-icons/pi";

import { CiSettings } from "react-icons/ci";

import { useAuth } from "../context/AuthContext";

interface LayoutModelProps {
  children: ReactNode;
  titulo?: string;
}

const whatsappSupport = import.meta.env.VITE_WHATSAPP_SUPPORT || "#";

export default function LayoutModel({ children, titulo }: LayoutModelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [temaClaro, setTemaClaro] = useState<boolean | undefined>(undefined);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const perfilRef = useRef<HTMLDivElement>(null);

  const isServicePage = location.pathname.startsWith("/service/");
  const { logout, user } = useAuth();

  const isAdmin = user?.user_role?.slug === "admin";

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

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!perfilOpen) return;
  
    function handleClickOutside(event: MouseEvent) {
      if (
        perfilRef.current &&
        !perfilRef.current.contains(event.target as Node)
      ) {
        setPerfilOpen(false);
      }
    }
  
    document.addEventListener("click", handleClickOutside);
  
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [perfilOpen]);

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
    navigate("/login", { replace: true });
  };

  if (temaClaro === undefined) return null;

  const breadcrumbPaths = location.pathname
    .split("/")
    .filter(Boolean);

  function formatBreadcrumb(label: string) {
    return label
      .replace(/-/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  function getBreadcrumbLabel(path: string, index: number) {
    const isLast = index === breadcrumbPaths.length - 1;

    // Último item → usa o título da página
    if (isLast && titulo) {
      return titulo;
    }

    // Demais níveis → nome da rota
    return path
      .replace(/-/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <div className="flex min-w-0">
      <Sidebar />

      <div className="flex-1 min-w-0 px-6 py-4 fundo-dashboard texto-dashboard transition-colors duration-300 overflow-x-hidden">
        {/* Header */}
        <header className="flex items-center px-6 rounded-xl justify-between mb-4 no-print">
          {/* 🔹 Esquerda - Título */}
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl">{titulo}</h1>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-400 ml-5">
              {/* Dashboard */}
              <Link to="/dashboard" className="hover:text-white transition">
                Dashboard
              </Link>

              {/* 🔹 CASO ESPECIAL: SERVICES */}
              {isServicePage ? (
                <>
                  {/* @ts-ignore */}
                  <IoIosArrowForward />
                  <Link
                    to="/services-catalog"
                    className="hover:text-white transition"
                  >
                    Serviços
                  </Link>
                  {/* @ts-ignore */}
                  <IoIosArrowForward />
                  <span className="text-gray-300">
                    {titulo}
                  </span>
                </>
              ) : (
                /* 🔹 PADRÃO: outras rotas (ex: relatórios) */
                breadcrumbPaths.map((path, index) => {
                  const isLast = index === breadcrumbPaths.length - 1;
                  const to = "/" + breadcrumbPaths.slice(0, index + 1).join("/");

                  return (
                    <span key={to} className="flex items-center gap-2">
                      {/* @ts-ignore */}
                      <IoIosArrowForward />

                      {isLast ? (
                        <span className="text-gray-300">
                          {titulo ?? formatBreadcrumb(path)}
                        </span>
                      ) : (
                        <Link to={to} className="hover:text-white transition">
                          {formatBreadcrumb(path)}
                        </Link>
                      )}
                    </span>
                  );
                })
              )}
            </nav>
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
              href={whatsappSupport}
              target="_blank"
              rel="noopener noreferrer"
              className="flex header items-center gap-2 text-gray-400 border hover:text-white border-[#1D1929] px-4 py-2 rounded-md text-sm transition"
            >
              {/* @ts-ignore */}
              <FaWhatsapp className="text-gray-300 text-1xl" />
              Suporte
            </a>

            {/* Perfil / Sair */}
            {isAdmin ? (
              <div className="relative" ref={perfilRef}>
                <button
                  onClick={() => setPerfilOpen(!perfilOpen)}
                  className="flex items-center header gap-2 text-gray-400 border border-none hover:text-white px-4 py-2 rounded-md text-sm transition"
                >
                  {/* @ts-ignore */}
                  <FaUserCog className="text-gray-300 text-[22px]" />
                  {/* {user?.username || "Perfil"} */}
                </button>

                {perfilOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1e1735] backdrop-blur-sm border border-[#4B06DD]/30 shadow-xl z-50 overflow-hidden">
                    <Link
                      to="/multitenant-manager"
                      className="block px-4 py-3 text-sm text-gray-400 hover:bg-[#4B06DD]/20 hover:text-purple-300 duration-300 transition"
                      onClick={() => setPerfilOpen(false)}
                    >
                      {/* @ts-ignore */}
                      <PiNetwork className="inline mr-2 text-lg" />
                      Gestão Multi-Tenant
                    </Link>
                    <Link
                      to="/config"
                      className="block px-4 py-3 text-sm text-gray-400 hover:bg-[#4B06DD]/20 hover:text-purple-300 duration-300 transition"
                      onClick={() => setPerfilOpen(false)}
                    >
                      {/* @ts-ignore */}
                      <CiSettings className="inline mr-2 text-lg" />
                      Configurações
                    </Link>
                    <div className="border-t border-[#1D1929]" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-gray-400 hover:bg-[#4B06DD]/20 hover:text-purple-300 duration-300 transition logout"
                    >
                      {/* @ts-ignore */}
                      <FiLogOut className="inline mr-2" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center header gap-2 text-gray-300 login bg-none border border-[#1D1929] hover:bg-[#4B06DD]/20 hover:text-purple-300 duration-300 transition logout"
              >
                {/* @ts-ignore */}
                <FiLogOut className="text-gray-300" />
                Sair
              </button>
            )}

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
          Versão 1.8.4.2
        </footer>
      </div>
    </div>
  );
}