import { useEffect, useState } from "react";
import { getZabbixAtivo } from "../services/zabbix/zabbix-config";
import { useTenant } from "../context/TenantContext";

export function useZabbixAtivo() {
  const { tenantAtivo } = useTenant();
  const [ativo, setAtivo] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantAtivo) return;

    async function load() {
      try {
        setLoading(true);
        const res = await getZabbixAtivo();
        setAtivo(Boolean(res.enabled));
      } catch {
        setAtivo(false);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tenantAtivo]);

  return { ativo, loading };
}