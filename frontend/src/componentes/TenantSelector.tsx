import { useTenant } from "../context/TenantContext";

export default function TenantSelector() {
  const { tenants, tenantAtivo, trocarTenant, loading } = useTenant();

  if (loading) return null;
  if (!tenantAtivo) return null;

  const isMultiTenant = tenants && tenants.length > 1;

  // 🔹 Função para formatar o nome visualmente
  const formatarNome = (nome: string) => {
    if (!nome) return "";
    return nome
      .replace(/[-_]/g, " ") // remove hífens e underlines
      .toLowerCase()
      .replace(/\b\w/g, (letra) => letra.toUpperCase()); // capitalize cada palavra
  };

  return (
    <div className="relative flex items-center gap-3 rounded-lg py-2 transition-all duration-300">
      <span className="text-sm text-gray-400">Organização:</span>

      {isMultiTenant ? (
        // ✅ Usuário com múltiplos tenants → mostra select
        <div className="relative">
          <select
            value={tenantAtivo.id}
            onChange={(e) => trocarTenant(Number(e.target.value))}
            className="
              appearance-none
              text-gray-400 text-sm
              pl-3 pr-8 py-2 rounded-md
              border border-[#1D1929]
              focus:outline-none focus:ring-2 focus:ring-purple-600
              hover:border-purple-500 transition-all cursor-pointer
            "
          >
            {tenants.map((t) => (
              <option
                key={t.id}
                value={t.id}
                className="bg-[#1D1929] text-gray-200"
              >
                {formatarNome(t.cliente_name)}
              </option>
            ))}
          </select>

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
      ) : (
        // ✅ Usuário com 1 tenant → mostra nome fixo
        <div
          className="
          appearance-none
          text-gray-400 text-sm
          pl-3 pr-8 py-2 rounded-md
          border border-[#1D1929]
          focus:outline-none focus:ring-2 focus:ring-purple-600
          hover:border-purple-500 transition-all
          "
        >
          {formatarNome(tenantAtivo.cliente_name)}
        </div>
      )}
    </div>
  );
}
