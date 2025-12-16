// src/utils/dashboardLayout.utils.ts

import { WidgetLayout } from "../services/dashboard/dashboardLayout.service";
import { widgetsConfig } from "../componentes/dashboard/WidgetConfig";

/**
 * Aplica regras de UI (minW / minH) no layout
 * Essas regras NÃO devem ser persistidas no backend
 */
export function normalizarLayout(
  layout: WidgetLayout[]
): WidgetLayout[] {
  return layout.map((item) => {
    const config = widgetsConfig.find((w) => w.id === item.i);

    return {
      ...item,

      // Regras de UI (somente frontend)
      ...(config?.minW !== undefined && { minW: config.minW }),
      ...(config?.minH !== undefined && { minH: config.minH }),
    };
  });
}

/**
 * Remove propriedades de UI antes de salvar no backend
 * (mantém o banco sempre limpo)
 */
export function limparLayoutParaSalvar(
  layout: WidgetLayout[]
): WidgetLayout[] {
  return layout.map(({ minW, minH, ...rest }) => rest);
}
