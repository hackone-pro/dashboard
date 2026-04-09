# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Strapi 5 (TypeScript) multi-tenant security dashboard backend. Integrates with Wazuh, IRIS, and Zabbix security platforms. Uses JWT auth with custom MFA, login tracking, and password reset flows.

## Commands

```bash
npm run dev        # Start dev server with auto-reload (port 1337)
npm run build      # Build Strapi admin panel
npm start          # Production start
npm run strapi     # Strapi CLI access
```

No test or lint scripts are configured.

## Architecture

**Framework**: Strapi 5.19 with TypeScript, targeting CommonJS/ES2019. Database defaults to SQLite (`.tmp/data.db`), supports MySQL/PostgreSQL via env vars.

**API Module Pattern**: Each feature under `src/api/<module>/` follows:
- `routes/<name>.ts` — endpoint definitions (method, path, handler, auth policy)
- `controllers/<name>.ts` — request handlers using Strapi `ctx`
- `services/<name>.ts` — business logic
- `content-types/<name>/schema.json` — data model definition
- `content-types/<name>/lifecycles.ts` — pre/post hooks (optional)

**Key modules** (`src/api/`):
- `acesso-wazuh/` — Wazuh security platform proxy (agents, events, vulnerabilities)
- `acesso-iris/` — IRIS platform integration
- `zabbix*/` — Zabbix monitoring endpoints
- `tenant/`, `admin-multitenant/` — Multi-tenant core and admin features
- `mfa/` — Email-based multi-factor authentication
- `login-attempts/` — Login tracking with IP geolocation
- `reset-password/` — Password reset and user invitation flows
- `reports/` — Report generation
- `custom-dashboard/` — Per-tenant dashboard customization
- `tenant-summary/` — Tenant metrics/risk snapshots

**Multi-tenancy**: Users belong to a tenant (many-to-one). User schema is extended in `src/extensions/users-permissions/` with custom fields (tenant, user_role, mfa, etc.).

**Cron tasks** (`config/cron-tasks.ts`): Runs risk score calculation every 5 minutes, pulling Wazuh incident data and storing snapshots in tenant-summary.

**Utilities** (`src/utils/`): IP geolocation (`geo.ts`), country resolution (`countryResolver.ts`).

**Proxy** (`proxy/`): Separate Express app that proxies requests to external services.

## Configuration

- `config/database.ts` — DB connection (SQLite/MySQL/PostgreSQL via env)
- `config/middlewares.ts` — CORS origins, security headers, body parsing
- `config/plugins.ts` — Email provider (nodemailer/Gmail SMTP)
- `config/server.ts` — Host, port, cron task registration
- `config/api.ts` — REST API defaults

Environment variables control database credentials, JWT secrets, SMTP settings, and external service URLs. See `.env.example` for the template.

## Auth Flow

Authentication uses `@strapi/plugin-users-permissions` (JWT Bearer tokens) with custom extensions:
- Login with geo-tracking via `/auth/login-attempts`
- Email-based MFA (`/mfa/send`, `/mfa/verify`)
- Password reset with 30-min token expiry
- User invitations reuse reset token mechanism with 48-hour expiry
- Password hashing with bcryptjs

Public (unauthenticated) routes are marked with `auth: false` in route configs.
