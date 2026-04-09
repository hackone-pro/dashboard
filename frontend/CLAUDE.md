# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React 19 + TypeScript SOC (Security Operations Center) dashboard frontend. Multi-tenant security platform that integrates with Wazuh, IRIS, and Zabbix via a Strapi 5 backend. Displays incidents, vulnerabilities, threat maps, risk levels, reports, and monitoring views.

## Commands

```bash
npm run dev        # Start Vite dev server (port 5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint
```

No test framework is configured.

## Architecture

**Stack**: React 19, TypeScript, Vite 7, Tailwind CSS 4, ApexCharts, Leaflet, React Router 7.

**Directory structure** (`src/`):
- `pages/` — Full page components (Login, Dashboard, RiskLevel, Incidentes, SOCAnalytics, etc.)
- `componentes/` — Reusable UI components organized by domain:
  - `graficos/` — Chart components (ApexCharts wrappers: Donut, Gauge, Area, Bar, Line, etc.)
  - `iris/` — IRIS incident management components
  - `dashboard/` — Widget system components (WidgetConfig, WidgetMap, WidgetMenu)
  - `wazuh/` — Wazuh-specific components
  - `zabbix/` — Zabbix-specific components
- `services/` — API service modules organized by domain (auth, wazuh, iris, zabbix, tenant, etc.)
- `context/` — React contexts (AuthContext, TenantContext, AttackStreamProvider)
- `hooks/` — Custom hooks (useIncidentes, useZabbixAtivo)
- `router/` — Route definitions with PrivateRoute, PublicRoute, AdminRoute guards
- `types/` — TypeScript type definitions
- `utils/` — Utilities (api.ts for fetch wrapper, auth, toast, etc.)

**Routing**: React Router v7 with BrowserRouter. Public routes (login, forgot-password, reset-password, MFA verify). Private routes wrapped in `<PrivateRoute>`. Admin routes additionally wrapped in `<AdminRoute>`.

**State management**: React Context API — AuthContext for JWT auth, TenantContext for multi-tenant selection, AttackStreamProvider for real-time attack data.

**API communication**: Custom `apiFetch()` wrapper in `utils/api.ts` using native fetch with JWT Bearer token from localStorage. Backend URL configured via `VITE_API_URL` env var. Some services also use Axios directly.

**Styling**: Tailwind CSS with Inter font family. Custom styles in `assets/styles/custom.css`.

## Key Patterns

- Components and pages are written in Portuguese-influenced naming (e.g., `Incidentes`, `componentes`, `graficos`, `Contador`)
- Chart components wrap ApexCharts via `react-apexcharts`
- Maps use both Leaflet (`react-leaflet`) and custom vector maps (`@south-paw/react-vector-maps`)
- PDF export via `jspdf` + `jspdf-autotable`
- Drag-and-drop dashboard layout via `react-grid-layout` and `@hello-pangea/dnd`
- Feature flags via env vars (e.g., `VITE_ENABLE_INTEGRATIONS`)

## Environment Variables

- `VITE_API_URL` — Backend API base URL (required)
- `VITE_ENABLE_INTEGRATIONS` — Toggle integrations page ("true"/"false")

## Docker

Builds with multi-stage Dockerfile: Node build stage → Nginx serving stage. Nginx config in `nginx.conf`.
