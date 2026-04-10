# Mapa de Funcionalidades - Hackone Dashboard Backend

> Strapi 5 (TypeScript) | Multi-tenant Security Dashboard

---

## Visao Macro - Dominios do Sistema

```
+-----------------------------------------------------------------------+
|                        HACKONE DASHBOARD                              |
+-----------------------------------------------------------------------+
|                                                                       |
|  +------------------+  +------------------+  +---------------------+  |
|  |  AUTENTICACAO &  |  |  MULTI-TENANCY   |  |   INTEGRACAO COM    |  |
|  |   SEGURANCA      |  |  & USUARIOS      |  |   PLATAFORMAS       |  |
|  +------------------+  +------------------+  +---------------------+  |
|                                                                       |
|  +------------------+  +------------------+  +---------------------+  |
|  |  MONITORAMENTO   |  |   RELATORIOS &   |  |   INFRAESTRUTURA    |  |
|  |  & RISCO         |  |   DASHBOARDS     |  |   & CONFIGURACAO    |  |
|  +------------------+  +------------------+  +---------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 1. Autenticacao e Seguranca

### 1.1 Login com Rastreamento (`login-attempts`)
- **POST** `/auth/login-attempts` (publico)
- Rastreamento de tentativas de login com geolocalizacao IP
- Bloqueio de conta apos tentativas excessivas
- Registro de IP, localizacao, timestamp

### 1.2 MFA - Autenticacao Multi-Fator (`mfa`)
- **POST** `/mfa/send` (publico) — Envia codigo MFA por email
- **POST** `/mfa/verify` (publico) — Verifica codigo e retorna JWT

**Fluxo completo:**
```
Login (email/senha) -> MFA Send (codigo por email) -> MFA Verify -> JWT + Usuario
```

### 1.3 Reset de Senha e Convites (`reset-password`)
- **POST** `/auth/forgot-password` (publico) — Inicia reset com token (30 min)
- **POST** `/auth/reset-password` (publico) — Completa reset/ativacao

**Funcionalidades:**
- Token UUID com expiracao de 30 minutos (reset) ou 48 horas (convite)
- Hash de senha com bcryptjs
- Reutilizado para ativacao de novos usuarios

---

## 2. Multi-Tenancy e Gestao de Usuarios

### 2.1 Tenant - Nucleo Multi-Tenant (`tenant`)
- CRUD padrao Strapi (find, findOne, create, update, delete)

**Campos do tenant:**
| Campo | Descricao |
|-------|-----------|
| `uid` | Identificador unico |
| `cliente_name` | Nome do cliente |
| `organizacao` | Organizacao |
| `ativa` | Status ativo/inativo |
| `wazuh_url/username/password` | Credenciais Wazuh |
| `wazuh_client_name` | Nome do cliente no Wazuh |
| `iris_url/iris_apikey` | Credenciais IRIS |

### 2.2 Acesso Multi-Tenant do Usuario (`user-multi-tenant`)
- **GET** `/acesso/user/tenants` — Lista tenants acessiveis ao usuario
- **PATCH** `/acesso/user/tenant/:id` — Troca tenant ativo

**Campos:**
- `role` (enum: admin), `ativo`, relacao com tenant e usuario

### 2.3 Criacao de Usuario / Convite (`user-create`)
- **POST** `/acesso/user/create` — Cria usuario com convite por email
- Requer usuario admin autenticado
- Validacao de email unico
- Token de convite com 48h de validade
- Envio automatico de email

### 2.4 Gestao de Usuarios (`user-list`)
- **GET** `/acesso/user/list` — Lista usuarios do tenant
- **PUT** `/acesso/user/:id` — Atualiza usuario
- **DELETE** `/acesso/user/:id` — Remove usuario (impede auto-delecao)
- **POST** `/acesso/user/resend/:id` — Reenvia convite

### 2.5 Papeis de Usuario (`user-role`)
- CRUD padrao Strapi
- Campos: `name`, `slug`
- Relacao um-para-muitos com usuarios

### 2.6 Admin Multi-Tenant (`admin-multitenant`)
- **GET** `/admin/multitenant/summary` — Dashboard resumo de todos os tenants
- Contagem de firewalls offline por tenant
- Ativos ativos por tenant
- Calculo de risco agregado

### 2.7 Extensao do Schema de Usuario (`users-permissions`)
Campos adicionados ao usuario padrao do Strapi:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `nome` | string | Nome completo |
| `tenant` | relacao | Tenant primario |
| `user_role` | relacao | Papel customizado |
| `owner_name_iris` | string | Identificador no IRIS |
| `reset_token` | string | Token de reset |
| `reset_expire` | datetime | Expiracao do token |
| `login_attempts` | integer | Tentativas falhas |
| `blocked_time` | datetime | Bloqueio da conta |
| `mfa_code` | string | Codigo MFA |
| `mfa_token` | string | Token de verificacao MFA |
| `mfa_expire` | datetime | Expiracao do codigo MFA |

---

## 3. Integracoes com Plataformas de Seguranca

### 3.1 Wazuh - Plataforma de Seguranca (`acesso-wazuh`)

#### 3.1.1 Severidade e Eventos
| Endpoint | Descricao |
|----------|-----------|
| **GET** `/acesso/wazuh/severidade` | Distribuicao de severidade (padrao: 24h) |
| **GET** `/acesso/wazuh/overtime` | Timeline de eventos |
| **GET** `/acesso/wazuh/eventos-summary` | Estatisticas resumidas |
| **GET** `/acesso/wazuh/rule-distribution` | Distribuicao de regras de alerta |
| **GET** `/acesso/wazuh/risklevel` | Calculo de indice de risco operacional |

#### 3.1.2 Agentes e Monitoramento
| Endpoint | Descricao |
|----------|-----------|
| **GET** `/acesso/wazuh/firewalls` | Lista firewalls com status |
| **GET** `/acesso/wazuh/servidores` | Servidores monitorados |
| **GET** `/acesso/wazuh/edr` | Dados de Endpoint Detection & Response |
| **GET** `/acesso/wazuh/top-agentes` | Top agentes por volume de alertas |
| **GET** `/acesso/wazuh/top-agentes-cis` | Top agentes por conformidade CIS |
| **GET** `/acesso/wazuh/top-agentes-syscheck` | Top agentes por integridade de arquivos |
| **GET** `/acesso/wazuh/top-geradores` | Principais geradores de logs |
| **GET** `/acesso/wazuh/top-users` | Usuarios que mais geram alertas |

#### 3.1.3 Geolocalização e Origens
| Endpoint | Descricao |
|----------|-----------|
| **GET** `/acesso/wazuh/top-paises` | Top paises de origem de ataques |
| **GET** `/acesso/wazuh/top-paises-geo` | Top paises com coordenadas (GeoJSON) |

#### 3.1.4 Vulnerabilidades
| Endpoint | Descricao |
|----------|-----------|
| **GET** `/acesso/wazuh/vulnerabilidades/severidade` | Distribuicao por severidade |
| **GET** `/acesso/wazuh/vulnerabilidades/top` | Vulnerabilidades mais frequentes |
| **GET** `/acesso/wazuh/vulnerabilidades/top-os` | Vulnerabilidades por sistema operacional |
| **GET** `/acesso/wazuh/vulnerabilidades/top-agentes` | Agentes mais vulneraveis |
| **GET** `/acesso/wazuh/vulnerabilidades/top-packages` | Pacotes vulneraveis |
| **GET** `/acesso/wazuh/vulnerabilidades/top-scores` | Maiores scores CVE |
| **GET** `/acesso/wazuh/vulnerabilidades/por-ano` | Evolucao temporal |

#### 3.1.5 MITRE ATT&CK
| Endpoint | Descricao |
|----------|-----------|
| **GET** `/acesso/wazuh/mitre-techniques` | Tecnicas MITRE ATT&CK detectadas |

### 3.2 IRIS - Gestao de Casos/Incidentes (`acesso-iris`)
- **GET** `/acesso/iris/manage/cases/list` — Lista casos com filtro de data
- **GET** `/acesso/iris/manage/cases/recent` — Casos recentes (1d, 7d, 30d)
- **POST** `/acesso/iris/manage/cases/update` — Atualiza caso (status, severidade, responsavel, notas)

**Mapeamentos:**
- Status: open=3, closed=9
- Outcome: positivo=5, falso_positivo=1
- Atribuicao de usuario a partir da lista IRIS

### 3.3 Zabbix - Monitoramento de Infraestrutura (`zabbix`)

| Endpoint | Descricao |
|----------|-----------|
| **GET** `/acesso/zabbix/firewalls` | Firewalls monitorados |
| **GET** `/acesso/zabbix/top-hosts-cpu` | Top hosts por CPU (1-10, padrao: 3) |
| **GET** `/acesso/zabbix/severidade` | Distribuicao de severidade de alertas |
| **GET** `/acesso/zabbix/top-switches-cpu` | Top switches por CPU (padrao: 5) |
| **GET** `/acesso/zabbuh/alertas` | Alertas recentes (padrao: 10) |
| **GET** `/acesso/zabbix/switches/status` | Status de conexao de switches |
| **GET** `/acesso/zabbix/ativos` | Contagem de dispositivos ativos |
| **GET** `/acesso/zabbix/vpn` | Status de conexoes VPN |
| **GET** `/acesso/zabbix/routers` | Top roteadores por CPU (padrao: 5) |
| **GET** `/acesso/zabbix/links-wan` | Status de links WAN |

### 3.4 Configuracao Zabbix (`zabbix-config`)
- **GET** `/acesso/zabbix-config/ativo` — Verifica se Zabbix esta habilitado para o tenant
- CRUD padrao (find, create, update, delete)

**Campos:** `zabbix_url`, `zabbix_token` (privado), `enabled`, relacao com tenant

---

## 4. Monitoramento e Risco

### 4.1 Tenant Summary - Snapshots de Risco (`tenant-summary`)
- CRUD padrao Strapi

**Campos:**
| Campo | Descricao |
|-------|-----------|
| `risk` | Score de risco (decimal) |
| `critical_inc` | Incidentes criticos |
| `high_inc` | Incidentes de alta severidade |
| `volume_gb` | Volume de logs |
| `logs_offline` | Firewalls offline |
| `ativos` | Ativos monitorados |
| `snapshot_at` | Timestamp do snapshot |
| `period` | Periodo de referencia |

### 4.2 Cron Job - Calculo de Risco (a cada 5 minutos)
- **Tarefa:** `snapshotRiskDebug`
- **Frequencia:** `0 */5 * * * *`

**Processo:**
1. Consulta todos os tenants ativos
2. Calcula indice de risco operacional
3. Verifica status de firewalls offline
4. Captura metricas de armazenamento
5. Conta incidentes criticos/altos
6. Cria/atualiza registro em `tenant-summary`

### 4.3 Storage - Volume de Logs (`storage`)
- **GET** `/storage/state` — Estado normalizado de armazenamento
- **GET** `/storage/internal` — Detalhes internos
- **GET** `/storage/timeline` — Timeline de uso ao longo do tempo

---

## 5. Relatorios e Dashboards

### 5.1 Dashboard Customizavel (`custom-dashboard`)
- **GET** `/custom-dashboards/me` — Layout do usuario (cria padrao se nao existe)
- **PUT** `/custom-dashboards/me` — Salva layout customizado
- **PUT** `/custom-dashboards/reset-me` — Reseta para layout padrao

**Layout padrao (grid):**
| Widget | Posicao | Tamanho |
|--------|---------|---------|
| `grafico_risco` | (0,0) | 3x9 |
| `geo_map` | (3,0) | 6x13 |
| `top_paises` | (9,0) | 3x13 |
| `top_incidentes` | (0,10) | 3x18 |
| `ia_humans` | (3,12) | 6x14 |
| `top_firewalls` | (9,12) | 3x14 |

### 5.2 Relatorios via n8n (`reports`, `n-eight-n`)
- **POST** `/acesso/report` — Dispara geracao de relatorio no n8n
- **GET** `/acesso/report/data/:cliente` — Busca dados do relatorio
- **POST** `/n8n/gerar` — Aciona workflow n8n
- **GET** `/n8n/data` — Busca dados gerados

### 5.3 Entradas de Relatorio (`report-entry`)
- **POST** `/report-entry/generate` — Gera relatorio customizado
- **GET** `/report-entries/search` — Busca por nome
- **GET** `/report-entries` — Lista paginada (5/pagina)
- **GET** `/report-entries/:id` — Relatorio individual
- **POST** `/report-entries` — Cria entrada
- **PUT** `/report-entries/:id` — Atualiza
- **DELETE** `/report-entries/:id` — Remove

**Campos:** `nome`, `tenant`, `period`, `sections` (JSON), `progress` (aguardando/gerando/finalizado/falhou), `snapshot` (JSON)

---

## 6. Infraestrutura e Configuracao

### 6.1 Contratos (`contract`)
- CRUD padrao Strapi

**Campos de contrato:**
| Campo | Descricao |
|-------|-----------|
| `name` | Nome do contrato |
| `firewalls` | Qtd contratada de firewalls |
| `edr` | Qtd de endpoints |
| `servers` | Qtd de servidores |
| `storage_gb` | Cota de armazenamento |
| `active` | Status do contrato |
| `tenant` | Relacao 1:1 com tenant |

### 6.2 Proxy Reverso (`proxy/`)
- Servico Express separado na porta **3001**
- **GET** `/api/fortisiem/incidents` — Proxy para API FortiSIEM
- Parametros: username, password, status, timeFrom, timeTo, size
- SSL/TLS sem verificacao (ambiente de teste)

### 6.3 Utilitarios (`src/utils/`)
- **geo.ts** — Resolve IP para geolocalizacao via geoip-lite (filtra IPs privados)
- **countryResolver.ts** — Resolve coordenadas de paises por nome (aliases: Russia, USA, UK, etc.)

### 6.4 Configuracoes do Sistema (`config/`)
| Arquivo | Descricao |
|---------|-----------|
| `database.ts` | SQLite (dev) / MySQL / PostgreSQL via env vars |
| `middlewares.ts` | CORS, security headers, body parsing |
| `plugins.ts` | Email (nodemailer/Gmail SMTP) |
| `server.ts` | Host, porta, registro de cron tasks |
| `api.ts` | Defaults da REST API |
| `cron-tasks.ts` | Tarefas agendadas (risk snapshot) |

---

## Resumo Quantitativo

| Metrica | Quantidade |
|---------|------------|
| Modulos de API | 20 |
| Endpoints customizados | ~50+ |
| Content Types | 8 |
| Arquivos de servico | 23+ |
| Arquivos de controller | 20+ |
| Rotas publicas | 5 (login, mfa, reset) |
| Integracoes externas | 5 (Wazuh, IRIS, Zabbix, n8n, FortiSIEM) |
| Cron jobs | 1 (risk snapshot, a cada 5min) |

---

## Mapa de Integrações Externas

```
                    +------------------+
                    |  HACKONE BACKEND |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |         |         |         |         |
    +----+---+ +---+----+ +--+---+ +--+---+ +---+------+
    | WAZUH  | |  IRIS  | | ZABBIX| | n8n  | | FortiSIEM|
    | (SIEM) | | (Cases)| | (Infra)| |(Auto)| | (Proxy)  |
    +--------+ +--------+ +------+ +------+ +----------+
    - Agentes    - Casos     - CPU     - Reports  - Incidentes
    - Alertas    - Status    - VPN     - Webhooks
    - Vulns      - Owners    - Switches
    - MITRE      - Outcome   - Links WAN
    - EDR                    - Alertas
    - Firewalls
```

---

## Fluxos de Autenticacao

```
=== Login Padrao com MFA ===

POST /auth/login-attempts  -->  POST /mfa/send  -->  POST /mfa/verify  -->  JWT
     (email, senha)              (userId)              (mfaToken, code)

=== Convite de Usuario ===

POST /acesso/user/create  -->  Email com token  -->  POST /auth/reset-password  -->  Conta ativa
     (admin autenticado)       (48h validade)         (token, nova senha)

=== Reset de Senha ===

POST /auth/forgot-password  -->  Email com token  -->  POST /auth/reset-password  -->  Senha atualizada
     (email)                     (30min validade)       (token, nova senha)
```
