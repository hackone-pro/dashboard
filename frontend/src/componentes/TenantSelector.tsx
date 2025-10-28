import { useTenant } from "../context/TenantContext";
import { GoArrowSwitch } from "react-icons/go";

export default function TenantSelector() {
  const { tenants, tenantAtivo, trocarTenant, loading } = useTenant();

  if (loading) return null;
  if (!tenants || tenants.length <= 1) return null;

  return (
    <div className="relative flex items-center gap-3 bg-[#1A1628] border border-[#2D2642] rounded-lg px-4 py-2 shadow-sm transition-all duration-300">
      {/* @ts-ignore */}
      <GoArrowSwitch className="text-purple-400 text-lg" />

      {/* Label */}
      <span className="text-sm text-gray-400">Selecione um tenant:</span>

      {/* Select estilizado */}
      <div className="relative">
        <select
          value={tenantAtivo?.id || ""}
          onChange={(e) => trocarTenant(Number(e.target.value))}
          className="
            appearance-none
            bg-[#1A1628]
            text-gray-200
            text-sm
            pl-3 pr-8 py-1.5
            rounded-md
            border border-[#3A3154]
            focus:outline-none focus:border-purple-500
            transition-all
            cursor-pointer
          "
        >
          {tenants.map((t) => (
            <option
              key={t.id}
              value={t.id}
              className="bg-[#1D1929] text-gray-200"
            >
              {t.cliente_name}
            </option>
          ))}
        </select>

        {/* Setinha customizada */}
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
