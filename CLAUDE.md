# Security One

SOC (Security Operations Center) multi-tenant platform. Backend: Strapi 5 (TypeScript). Frontend: React 19 + TypeScript + Vite. Integrates Wazuh, IRIS, Zabbix.

# Instruções gerais

- Responda sempre em português brasileiro (pt-BR).
- Seja breve e direto. Evite explicações longas ou redundantes. Priorize economia de tokens.
- Antes de começar, leia o arquivo `CRONOGRAMA_FASE1_MVP_V2.md`

# Ao codar

- Leia os arquivos relevantes antes de alterar qualquer coisa.
- Siga os padrões e convenções já existentes no projeto (nomenclatura, estrutura, imports).
- Não crie arquivos ou pastas novos sem perguntar antes.
- Não refatore código fora do escopo pedido.
- Priorize soluções simples. Menos código > mais código.
- Se encontrar um bug ou problema não relacionado à tarefa, me avise em vez de corrigir por conta própria.

# Ao responder

- Mostre só o trecho de código alterado, não o arquivo inteiro.
- Se precisar de contexto, pergunte antes de assumir.

## Context Routing

→ backend: backend/CLAUDE.md
→ frontend: frontend/CLAUDE.md

## Agent Memory System

### Before Working
- Read this file for global context, then read the target directory's CLAUDE.md before changes
- If this file has a ## Context Routing section, use it to find the right subdirectory CLAUDE.md
- Check .memory/decisions.md before architectural changes
- Check .memory/patterns.md before implementing common functionality
- Check if audit is due: if 14+ days or 10+ sessions since last audit in .memory/audit-log.md, suggest running one

### During Work
- Create CLAUDE.md in any new directory you create

### After Work
- Update relevant CLAUDE.md if conventions changed
- Log decisions to .memory/decisions.md (ADR format)
- Log patterns to .memory/patterns.md
- Uncertain inferences → .memory/inbox.md (never canonical files)

### Safety
- Never record secrets, API keys, or user data
- Never overwrite decisions — mark as [superseded]
- Never promote from inbox without user confirmation