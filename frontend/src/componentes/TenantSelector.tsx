import { useTenant } from "../context/TenantContext";

export default function TenantSelector() {
  const { tenants, tenantAtivo, trocarTenant, loading } = useTenant();

  if (loading) return null;

  return (
    <select
      value={tenantAtivo?.id || ""}
      onChange={(e) => trocarTenant(Number(e.target.value))}
      className="bg-[#1D1929] text-gray-300 text-sm px-3 py-2 rounded-md border border-[#2D2642] focus:outline-none focus:border-purple-500 transition-all"
    >
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.cliente_name}
        </option>
      ))}
    </select>
  );
}
