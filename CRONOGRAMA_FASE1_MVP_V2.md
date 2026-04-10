# Cronograma — Fase 1 (MVP Funcional) — V2

> Escopo: Pipeline ponta a ponta FortiGATE → ALERT → TICKET → IRIS, sem SIEM.
> Apenas FortiGATE como fonte. IA da Hackone como fallback padrao.
> V2: inclui SOC Analytics (metricas + redesign) e Copiloto IA contextual.

---

## Escopo Confirmado

| Incluido | Excluido |
|----------|----------|
| E01-E07, C01-C02, R01-R04, T01 (todo o rascunho) | G05 (merge multi-fonte) |
| G01 (adapter — so FortiGATE) | G07 (janela correlacao configuravel) |
| G02 (severidade — so FortiGATE) | G08 (templates titulo) |
| G03 (deduplicacao) | G09 (display gaps UI) |
| G04 (Incident Engine) | G12 (observabilidade/health) |
| G06 (taxonomia categorias) | G13 (painel integracoes UX) |
| G10 (Risk Level cards dinamicos) | G14 (audit trail) |
| G11 (Monitoria Ingestao) | G18 (cobrancas/licenciamento) |
| G15 (crown jewel) | G19 (webhook) |
| G16 (fallback IA — Hackone) | G20 (adapter EDR) |
| G17 (severidade final incidente) | G22 (adapter Wazuh normalizado) |
| SA01 (campos instrumentacao incidente) | |
| SA02 (backend metricas SOC Analytics) | |
| SA03 (frontend SOC Analytics redesign) | |
| CP01 (Copiloto IA contextual) | |
| CP02 (prompts sugeridos + resposta estruturada) | |
| CP03 (artefatos de comunicacao) | |

**Total: 30 tarefas**

---

## Visao de Blocos e Dependencias

```
BLOCO 1 — Fundacao                   BLOCO 2 — Pipeline + Multi-Tenant
(sem dependencias, inicio paralelo)  (depende do Bloco 1)
                                     
  [E06] campo plano ──────────────────► [E07] feature flags (front)
  [E05] JWT tenants ──────────────────► [E04] propagar tenant_id
  [E03] NormalizedEvent no ALERT ─────► [G01] adapter FortiGATE
                                    ├─► [G03] dedup no ALERT
  [G06] taxonomia categorias ─────────►      │
  [T01] validar schema ticket              (para Bloco 4)
  [SA01] campos instrumentacao ────────►     (para Bloco 5)
  [R01] documentar Risk Level ────────► [R02] auditar Risk Level
  [C01] separar config LLM ──────────► [C02] LLM padrao H1


BLOCO 3 — Coleta FortiGATE           BLOCO 4 — Incident Engine
(depende dos Blocos 1-2)             (depende dos Blocos 1-2)

  [G01]──► [G02] severidade FG         [E03]+[G01]+[G03]+[G06]
  [E06]──► [E01] tela config FG ┐          │
  [E01]+[E03]+[G01]             │      ┌───▼────┐
           ──► [E02] polling FG │      │  [G04] │ motor correlacao
  [R02]──► [R03] corrigir Risk  │      └───┬────┘
                Level           │          │
                                │      [G17] severidade final
                                │      [G15] crown jewel
                                │      [G16] fallback IA (Hackone)
                                │      [R03]──► [R04] testes Risk Level


BLOCO 5 — Analytics + Copiloto       BLOCO 6 — Frontend Final
(depende dos Blocos 2-4)             (depende dos Blocos 2-5)

  [SA01]+[G04]──► [SA02] backend      [SA02]+[E07]──► [SA03] frontend
                   metricas analytics                   SOC Analytics
  [E07]──────────► [CP01] copiloto    [CP01]─────────► [CP02] prompts
                   painel lateral     [CP02]─────────► [CP03] artefatos
  [R03]+[E07]────► [G10] Risk Level
  [E07]──────────► [G11] Monitoria
```

---

## Cronograma Sequencial

| Ordem | ID | Tarefa | Tipo | Bloco | Depende de | Entrega | Esforco |
|-------|----|--------|------|-------|-----------|---------|---------|
| 1 | E06 | Adicionar campo `plan` no tenant | Back-end | 1 | — | | |
| 2 | E05 | Incluir tenants no token JWT | Full Stack | 1 | — | | |
| 3 | E03 | NormalizedEvent + normalizacao no ALERT | Back-end | 1 | — | | |
| 4 | G06 | Definir taxonomia de categorias v1 | Back-end | 1 | — | | |
| 5 | T01 | Validar schema do incidente no ticket | Back-end | 1 | — | | |
| 6 | SA01 | Campos de instrumentacao no incidente (SOC Analytics) | Back-end | 1 | T01 | | |
| 7 | R01 | Documentar regras do Risk Level | Documentacao | 1 | — | | |
| 8 | C01 | Separar config LLM (Chat vs Motor) | Full Stack | 1 | — | | |
| 9 | E04 | Propagar tenant_id nos microservicos | Back-end | 2 | E05 | | |
| 10 | G01 | Adapter pattern FortiGATE (Collector + Normalizer) | Back-end | 2 | E03 | | |
| 11 | G03 | Deduplicacao de eventos no ALERT | Back-end | 2 | E03 | | |
| 12 | E07 | Feature flags por plano do tenant | Front-end | 2 | E06 | | |
| 13 | R02 | Auditar Risk Level atual vs especificacao | Back-end | 2 | R01 | | |
| 14 | C02 | Configurar LLM padrao Hackone como fallback | Back-end | 2 | C01 | | |
| 15 | G02 | Mapeamento de severidade FortiGATE | Back-end | 3 | G01 | | |
| 16 | E01 | Tela de configuracao de fontes FortiGATE | Front-end | 3 | E06 | | |
| 17 | E02 | Background job de polling FortiGATE | Back-end | 3 | E01, E03, G01 | | |
| 18 | R03 | Corrigir Risk Level (degradacao graciosa) | Back-end | 3 | R02 | | |
| 19 | G04 | Motor de correlacao (Incident Engine) | Back-end | 4 | E03, G01, G03, G06 | | |
| 20 | G17 | Calculo de severidade final do incidente | Back-end | 4 | G04 | | |
| 21 | G15 | Classificacao de ativos criticos (crown jewel) | Full Stack | 4 | G04 | | |
| 22 | G16 | Fallback de IA (Hackone como padrao) | Back-end | 4 | C01, G04 | | |
| 23 | R04 | Testes Risk Level (3 cenarios) | Back-end | 4 | R03 | | |
| 24 | SA02 | Backend metricas SOC Analytics (MTTD/MTTA/MTTR + deltas + agregacoes) | Back-end | 5 | SA01, G04 | | |
| 25 | CP01 | Evoluir chat para Copiloto IA contextual (painel lateral) | Front-end | 5 | E07 | | |
| 26 | G10 | Risk Level com cards dinamicos (front) | Front-end | 5 | R03, E07 | | |
| 27 | G11 | Monitoria de Ingestao no Essentials | Front-end | 5 | E07 | | |
| 28 | SA03 | Frontend SOC Analytics redesign (Figma) | Front-end | 6 | SA02, E07 | | |
| 29 | CP02 | Prompts sugeridos por tela + resposta estruturada | Full Stack | 6 | CP01, C01 | | |
| 30 | CP03 | Geracao de artefatos de comunicacao | Full Stack | 6 | CP02 | | |

---

## Trilhas Paralelas (sugestao de alocacao)

```
                Bloco 1          Bloco 2          Bloco 3          Bloco 4          Bloco 5       Bloco 6
               ─────────        ─────────        ─────────        ─────────        ──────────    ──────────

Back-end 1:    E03 ──────────► G01 ──────────► G02 ──► E02 ───► G04 ──► G17 ────► SA02          
               (ALERT core)    (adapter FG)    (sev)   (job)    (correlation)      (analytics)

Back-end 2:    E06 ► E05 ────► E04              R03 ──────────► G15 ──► G16
               (tenant/JWT)    (tenant_id)      (risk fix)       (crown)  (fallback)

Back-end 3:    G06 ► T01 ► SA01 ► G03 ────────► R02 (audit) ───► R04 (testes)
               (taxonomia)  (campos) (dedup)

Full Stack:    C01 ──────────► C02 ──────────────────────────────────────────────► CP02 ──► CP03
               (LLM config)    (LLM default)                                       (prompts) (artefatos)

Front-end:                     E07 ──► E01 ──────────────────► CP01 ──► G10 ► G11 ► SA03
                               (flags)  (tela FG)              (copiloto) (risk)(monit)(analytics)
```

---

## Detalhamento das Tarefas (para cadastro no DevOps)

---

### BLOCO 1 — Fundacao

---

#### E06 — Adicionar campo `plan` ao schema do tenant

**Titulo:** Incluir campo de plano (Essentials/Full) no cadastro de tenant

**Descricao:**
Adicionar um novo campo `plan` ao content-type `tenant` no Strapi. Este campo define qual plano a organizacao contratou e sera a base para todo o sistema de feature flags e controle de funcionalidades.

**O que fazer:**
- Adicionar campo `plan` do tipo `enumeration` no schema do tenant (`src/api/tenant/content-types/tenant/schema.json`)
- Valores permitidos: `essentials`, `full`
- Valor padrao: `full` (para nao impactar clientes existentes)
- Expor o campo na API REST (find, findOne)
- Garantir que o campo seja editavel no painel admin do Strapi

**Criterios de aceite:**
- [ ] Campo `plan` existe no schema do tenant com valores `essentials` e `full`
- [ ] Valor padrao e `full`
- [ ] Tenants existentes nao sao impactados (migram como `full`)
- [ ] Campo retornado nas APIs GET de tenant
- [ ] Campo editavel pelo admin

**Tipo:** Back-end
**Servico afetado:** Strapi — `src/api/tenant/`

---

#### E05 — Incluir tenants do usuario no token JWT

**Titulo:** Refatorar autenticacao para incluir lista de tenants acessiveis no JWT

**Descricao:**
Atualmente o token JWT nao carrega informacao sobre quais tenants o usuario pode acessar. Refatorar o fluxo de autenticacao (Strapi) e o frontend (AuthContext) para que o token inclua a lista de tenants com seus respectivos planos.

**O que fazer:**
- **Back-end (Strapi):**
  - No momento da geracao do JWT (apos MFA verify), consultar `user-multi-tenant` para obter todos os tenants do usuario
  - Incluir no payload do JWT: `tenants: [{ id, uid, name, plan }]`
  - Manter retrocompatibilidade com o campo `tenant` existente
- **Front-end:**
  - Atualizar `AuthContext` para ler a lista de tenants do JWT
  - Atualizar `TenantContext` para consumir a lista do JWT em vez de fazer chamada separada
  - Garantir que a troca de tenant continua funcionando

**Criterios de aceite:**
- [ ] JWT contem array `tenants` com id, uid, name e plan de cada tenant acessivel
- [ ] AuthContext no frontend le os tenants do token
- [ ] TenantSelector continua funcional
- [ ] Troca de tenant atualiza o contexto corretamente
- [ ] Login/MFA flow nao quebra

**Tipo:** Full Stack
**Servicos afetados:** Strapi — `src/api/mfa/`, `src/extensions/users-permissions/` | Frontend — `context/AuthContext.tsx`, `context/TenantContext.tsx`

---

#### E03 — Implementar NormalizedEvent e camada de normalizacao no ALERT

**Titulo:** Criar modelo NormalizedEvent e pipeline de normalizacao dentro do microservico ALERT

**Descricao:**
O microservico ALERT deve se tornar o hub inteligente do pipeline. Ele recebera eventos brutos de qualquer fonte (polling jobs, SIEM, futuras integracoes), identificara o vendor/source_type, aplicara o normalizador correto e persistira o evento no formato padrao `NormalizedEvent`.

**O que fazer:**
- Definir o model/schema `NormalizedEvent` com os campos:
  ```
  event_id        (UUID, gerado internamente)
  tenant_id       (string, obrigatorio)
  source_type     (enum: firewall | edr | siem)
  vendor          (string: fortinet, wazuh, etc.)
  product         (string: fortigate, wazuh, etc.)
  event_time      (datetime UTC, timestamp original do evento)
  ingest_time     (datetime UTC, momento da ingestao no ALERT)
  severity        (enum: baixo | medio | alto | critico — ja mapeado)
  category        (string, conforme taxonomia G06)
  action          (string: blocked | allowed | detected | quarantined, etc.)
  asset           (objeto: { host_name?, ip?, user? })
  ioc             (objeto: { src_ip?, dst_ip?, domain?, url?, hash? })
  raw_payload     (JSON, evento original sem transformacao)
  dedup_key       (string, hash calculado — ver G03)
  ```
- Criar endpoint de ingestao de eventos brutos: `POST /api/events/ingest`
  - Recebe: `{ tenant_id, source_type, vendor, raw_payload }`
  - Internamente: seleciona normalizador → normaliza → persiste → encaminha para TICKET
- Criar interface base `IVendorNormalizer` com metodos:
  - `canHandle(sourceType, vendor): boolean`
  - `normalize(rawPayload): NormalizedEvent`
  - `mapSeverity(vendorSeverity): string`
- Criar registro de normalizadores (pattern registry) para lookup automatico por source_type + vendor
- Manter o fluxo atual do SIEM (Wazuh) inalterado — o que ja entra normalizado continua passando direto

**Criterios de aceite:**
- [ ] Model `NormalizedEvent` definido e persistido
- [ ] Endpoint `POST /api/events/ingest` funcional
- [ ] Interface `IVendorNormalizer` criada
- [ ] Registry de normalizadores funcional (registrar e buscar por vendor)
- [ ] Evento bruto recebido e transformado em NormalizedEvent
- [ ] Evento normalizado encaminhado para TICKET
- [ ] Fluxo SIEM existente (Wazuh) nao impactado

**Tipo:** Back-end
**Servico afetado:** Microservico ALERT

---

#### G06 — Definir taxonomia de categorias de evento v1

**Titulo:** Implementar taxonomia padrao de categorias de evento para normalizacao

**Descricao:**
Definir o conjunto minimo de categorias que todo evento normalizado deve usar. Essas categorias serao usadas pelo motor de correlacao (G04) para agrupar eventos em incidentes.

**O que fazer:**
- Criar enum/constante com as 8 categorias v1:
  ```
  NETWORK_INTRUSION   — IPS, exploit, signature
  NETWORK_RECON       — scan, enumeracao, varredura
  AUTH_ANOMALY        — brute force, login anomalo, falha de autenticacao
  MALWARE_EXECUTION   — deteccao de malware, execucao suspeita
  ENDPOINT_BEHAVIOR   — processo suspeito, persistence, lateral movement
  DATA_EXFIL          — exfiltracao, upload anomalo
  POLICY_VIOLATION    — bloqueio por politica, acesso proibido
  OTHER               — fallback para eventos nao classificados
  ```
- Documentar o mapeamento entre categorias FortiGATE e essa taxonomia (para uso no adapter G01)
- Criar tabela/documento de referencia: "evento X do FortiGATE → categoria Y"

**Criterios de aceite:**
- [ ] Enum de categorias disponivel como constante no ALERT
- [ ] Documento de mapeamento FortiGATE → categorias criado
- [ ] Categoria `OTHER` usada como fallback quando nenhuma regra casa

**Tipo:** Back-end
**Servico afetado:** Microservico ALERT (constantes/tipos)

---

#### T01 — Validar schema do incidente no microservico TICKET

**Titulo:** Auditar e ajustar campos do incidente no microservico TICKET conforme especificacao

**Descricao:**
Verificar se o microservico TICKET persiste todos os campos obrigatorios de um incidente conforme a especificacao. Adicionar campos faltantes.

**O que fazer:**
- Consultar o schema/model atual de incidente no microservico TICKET
- Comparar com os campos obrigatorios da especificacao:
  ```
  incident_id         (UUID)
  org_id / tenant_id  (string)
  created_at          (datetime)
  status              (enum: OPEN, TRIAGE, IN_PROGRESS, RESOLVED)
  severity            (enum: baixo, medio, alto, critico)
  title               (string)
  description         (text)
  primary_asset       (string — hostname ou IP principal)
  event_count         (integer)
  sources_involved    (array: firewall, edr, siem)
  first_seen_at       (datetime — primeiro evento do incidente)
  last_seen_at        (datetime — ultimo evento do incidente)
  ai_summary          (text, nullable)
  ```
- Para cada campo faltante: adicionar ao schema e ao processo de criacao de incidente
- Garantir que os campos novos sao nullable para nao quebrar incidentes existentes

**Criterios de aceite:**
- [ ] Todos os 13 campos obrigatorios existem no schema
- [ ] Campos novos sao nullable (retrocompatibilidade)
- [ ] Incidentes existentes continuam acessiveis
- [ ] Campos novos sao preenchidos na criacao de novos incidentes

**Tipo:** Back-end
**Servico afetado:** Microservico TICKET

---

#### SA01 — Adicionar campos de instrumentacao no incidente para SOC Analytics

**Titulo:** Incluir timestamps e classificadores necessarios para calculo de MTTD/MTTA/MTTR e metricas de IA

**Descricao:**
O SOC Analytics exige campos adicionais no incidente que nao constam no schema atual. Sem esses campos, as metricas de tempo (MTTD, MTTA, MTTR) e as metricas de performance da IA ficam imprecisas ou indisponiveis.

**O que fazer:**
- Adicionar ao schema do incidente no microservico TICKET (complementa T01):
  ```
  detected_at       (datetime — quando o incidente foi criado/detectado no SecurityOne)
  acknowledged_at   (datetime — primeira mudanca de status para "Em triagem"/"Assumido"/"Em andamento", ou primeira atribuicao de responsavel)
  resolved_at       (datetime — quando o incidente foi fechado/resolvido)
  triaged_by        (enum: "ia" | "humano" — quem fez a triagem inicial)
  ai_first_result_at (datetime, opcional — quando a IA produziu o primeiro output para o incidente)
  escalated         (boolean — se o incidente foi escalado)
  escalated_at      (datetime, nullable — quando foi escalado)
  ```
- Garantir que o TICKET preenche esses campos automaticamente:
  - `detected_at` = `created_at` do incidente (momento da deteccao)
  - `acknowledged_at` = timestamp da primeira atribuicao ou mudanca de status
  - `resolved_at` = timestamp do fechamento
  - `triaged_by` = "ia" se a triagem foi feita pela IA, "humano" se foi manual
  - `ai_first_result_at` = timestamp do primeiro resultado da LLM para o incidente
- Campos novos devem ser nullable (incidentes historicos nao terao dados)
- Considerar migration para popular `detected_at` = `created_at` em incidentes existentes

**Criterios de aceite:**
- [ ] Todos os 7 campos novos existem no schema do incidente
- [ ] Campos preenchidos automaticamente no fluxo de criacao/atualizacao
- [ ] `triaged_by` corretamente classificado (ia vs humano)
- [ ] Incidentes historicos nao quebram (campos nullable)
- [ ] Campos expostos na API de consulta de incidentes

**Tipo:** Back-end
**Servico afetado:** Microservico TICKET

---

#### R01 — Documentar regras de calculo do Risk Level

**Titulo:** Mapear e documentar as regras atuais de calculo do Risk Level

**Descricao:**
Antes de auditar ou corrigir, e necessario entender exatamente como o Risk Level e calculado hoje. Documentar o algoritmo atual, os inputs, os pesos e as fontes de dados.

**O que fazer:**
- Ler o codigo do cron job `snapshotRiskDebug` no Strapi (`config/cron-tasks.ts`)
- Ler o servico que calcula o risk level (`acesso-wazuh` — endpoint `/risklevel`)
- Documentar:
  - Quais dados sao consumidos (Wazuh, IRIS, etc.)
  - Como o score 0-100 e calculado
  - Quais pesos sao usados para cada card (alertas por host, firewalls, incidentes, CIS)
  - Como a severidade dos alertas impacta o score
  - O que acontece quando um dado nao esta disponivel
- Registrar o resultado em um documento de referencia

**Criterios de aceite:**
- [ ] Documento descrevendo o algoritmo atual do Risk Level
- [ ] Pesos e formulas documentados
- [ ] Fontes de dados mapeadas
- [ ] Comportamento quando dado falta identificado

**Tipo:** Documentacao / Analise
**Servicos afetados:** Strapi — `config/cron-tasks.ts`, `src/api/acesso-wazuh/` (endpoint risklevel)

---

#### C01 — Separar configuracao de LLM por finalidade (Chat vs Motor de Analises)

**Titulo:** Permitir configuracao independente de LLM para Chat e para Motor de Analises de alertas

**Descricao:**
Atualmente existe uma unica configuracao de LLM por tenant. A especificacao exige duas configuracoes independentes: uma para o Chat e outra para o Motor de Analises (que processa alertas no TICKET). O cliente pode usar a mesma LLM para ambos ou LLMs diferentes.

**O que fazer:**
- **Back-end (Customers API):**
  - Evoluir o endpoint `POST /api/customers/llm-config` para suportar campo `purpose` (enum: `chat`, `analysis`)
  - Armazenar duas configuracoes por tenant: uma para chat e outra para analysis
  - Criar endpoint `GET /api/customers/llm-config?purpose=chat|analysis` para consultar config por finalidade
- **Front-end:**
  - Evoluir `LLMConfigPanel` para exibir duas secoes/abas: "Chat" e "Motor de Analises"
  - Cada secao tem seus proprios campos: provedor, chave, modelo
  - Botao de validacao independente por secao
  - Permitir "usar mesma config para ambos" como atalho
- **Microservico TICKET:**
  - Ao processar alerta, consultar config LLM com `purpose=analysis` (nao mais a config unica)
- **Chat API:**
  - Ao enviar mensagem, consultar config LLM com `purpose=chat`

**Criterios de aceite:**
- [ ] Duas configuracoes LLM independentes por tenant (chat e analysis)
- [ ] Frontend exibe as duas configuracoes separadas
- [ ] Validacao funciona para cada configuracao
- [ ] TICKET usa config `analysis`
- [ ] Chat usa config `chat`
- [ ] Tenants existentes migram config atual para ambas as finalidades

**Tipo:** Full Stack
**Servicos afetados:** Customers API, Frontend — `LLMConfigPanel`, Microservico TICKET, Chat API

---

### BLOCO 2 — Pipeline + Multi-Tenant

---

#### E04 — Propagar tenant_id via header nos microservicos

**Titulo:** Padronizar envio e validacao de tenant_id em todos os microservicos

**Descricao:**
Todos os microservicos (ALERT, TICKET, e demais) devem receber o `tenant_id` do usuario logado via header HTTP e validar que corresponde ao tenant do JWT. Isso garante isolamento de dados entre organizacoes.

**O que fazer:**
- Definir header padrao: `X-Tenant-Id`
- **Front-end:**
  - Incluir `X-Tenant-Id` do tenant ativo em todas as chamadas via `apiFetch()` e axios
- **Cada microservico (ALERT, TICKET, Chat, Customers):**
  - Criar middleware que extrai `X-Tenant-Id` do header
  - Validar que o valor corresponde a um tenant presente no JWT do usuario
  - Se nao bater: retornar `403 Forbidden`
  - Se header ausente: retornar `400 Bad Request`
- **Strapi:**
  - Incluir `X-Tenant-Id` ao fazer chamadas para os microservicos downstream
- Garantir retrocompatibilidade: se o header nao vier E o request for de um servico interno (SIEM/Wazuh), aceitar o tenant_id do body

**Criterios de aceite:**
- [ ] Header `X-Tenant-Id` enviado pelo frontend em todas as requisicoes autenticadas
- [ ] Cada microservico valida o header contra o JWT
- [ ] Requests sem header retornam 400
- [ ] Requests com tenant_id divergente retornam 403
- [ ] Fluxo SIEM existente nao quebra (retrocompatibilidade)

**Tipo:** Back-end (maioria) + Front-end (apiFetch)
**Servicos afetados:** Frontend — `utils/api.ts` | ALERT, TICKET, Chat API, Customers API, Strapi

---

#### G01 — Implementar Adapter FortiGATE (Collector + Normalizer)

**Titulo:** Criar Collector de coleta e Normalizer FortiGATE no padrao adapter

**Descricao:**
Implementar o adapter para FortiGATE em duas partes: o Collector (que roda no polling job e faz a coleta bruta) e o Normalizer (que roda dentro do ALERT e transforma o evento bruto em NormalizedEvent).

**O que fazer:**
- **Collector FortiGATE (usado pelo polling job E02):**
  - Implementar interface `IVendorCollector`:
    - `authenticate(config)` — autentica na API do FortiGATE usando URL e credenciais configuradas
    - `fetchIncremental(cursor)` — faz GET nos endpoints de alertas/logs do FortiGATE usando `since_timestamp` como cursor
    - `emitRaw(rawEvents)` — envia os eventos brutos para `POST /api/events/ingest` do ALERT
  - Usar como base o script Python existente de integracao FortiGATE
  - Tratar paginacao da API FortiGATE
  - Armazenar ultimo cursor com sucesso para retomar na proxima execucao

- **Normalizer FortiGATE (registrado dentro do ALERT):**
  - Implementar interface `IVendorNormalizer`:
    - `canHandle("firewall", "fortinet")` → true
    - `normalize(rawPayload)` → NormalizedEvent com campos mapeados:
      - `source_type` = "firewall"
      - `vendor` = "fortinet"
      - `product` = "fortigate"
      - `event_time` = timestamp do log FortiGATE
      - `category` = mapeamento para taxonomia G06 (ex: IPS event → NETWORK_INTRUSION)
      - `action` = mapeamento (ex: "deny" → "blocked", "pass" → "allowed")
      - `asset` = extrair IP/hostname do log
      - `ioc` = extrair src_ip, dst_ip, domain quando presentes
    - `mapSeverity(vendorSeverity)` → mapeamento FortiGATE para 4 buckets (ver G02)
  - Registrar no registry de normalizadores do ALERT

**Criterios de aceite:**
- [ ] Collector autentica na API FortiGATE com sucesso
- [ ] Collector coleta logs incrementalmente (nao repete logs ja coletados)
- [ ] Collector envia payload bruto para ALERT
- [ ] Normalizer registrado no ALERT e descoberto automaticamente para source_type="firewall", vendor="fortinet"
- [ ] Eventos FortiGATE corretamente mapeados para NormalizedEvent
- [ ] Categorias mapeadas conforme taxonomia G06
- [ ] Campos nulos tratados quando log nao contem a informacao

**Tipo:** Back-end
**Servicos afetados:** Microservico ALERT (normalizer), Polling Job (collector)

---

#### G03 — Implementar deduplicacao de eventos no ALERT

**Titulo:** Criar sistema de deduplicacao de eventos dentro do pipeline do ALERT

**Descricao:**
Apos normalizar um evento, o ALERT deve verificar se o mesmo evento ja foi processado (evitar duplicatas causadas por reprocessamento, polling sobreposto, etc.). A deduplicacao ocorre entre a normalizacao e a persistencia.

**O que fazer:**
- Calcular `dedup_key` como hash dos campos que identificam unicidade:
  ```
  dedup_key = hash(tenant_id + source_type + vendor + vendor_event_id + event_time + asset_ip + category)
  ```
  Se `vendor_event_id` nao existir, usar formula alternativa:
  ```
  dedup_key = hash(tenant_id + source_type + vendor + event_time_bucket(10s) + asset_ip + src_ip + dst_ip + dst_port + signature_id + category)
  ```
- Antes de persistir o NormalizedEvent:
  - Consultar se `dedup_key` ja existe no intervalo recente (ex: ultimos 5 minutos)
  - Se ja existe: incrementar contador do evento existente, descartar o novo
  - Se nao existe: persistir normalmente
- Armazenar `dedup_key` como campo indexado na tabela de eventos
- Incluir contador `dedup_count` no NormalizedEvent para saber quantas vezes foi visto

**Criterios de aceite:**
- [ ] `dedup_key` calculado para todo evento normalizado
- [ ] Eventos duplicados nao sao persistidos novamente
- [ ] Contador de duplicatas incrementado
- [ ] Indice no campo `dedup_key` para consulta rapida
- [ ] Reprocessar a mesma janela nao cria duplicatas

**Tipo:** Back-end
**Servico afetado:** Microservico ALERT

---

#### E07 — Implementar feature flags por plano do tenant

**Titulo:** Controlar visibilidade de paginas e componentes conforme plano do tenant

**Descricao:**
Com base no campo `plan` do tenant (E06), controlar quais paginas e funcionalidades estao disponiveis para o usuario no frontend. Tenants `essentials` veem um subconjunto; tenants `full` veem tudo.

**O que fazer:**
- Criar um mapa de features por plano:
  ```
  essentials:
    - Incidents: habilitado
    - Risk Level: habilitado
    - SOC Analytics: habilitado (com limitacoes)
    - Monitoria NG-SOC: habilitado (como Monitoria de Ingestao)
    - Threat Map: habilitado
    - Relatorios: habilitado
    - Home/Dashboard: habilitado
    - Vulnerabilidades: desabilitado
    - Integridade de Arquivos: desabilitado
    - Monitoria CSC (Zabbix): desabilitado

  full:
    - Tudo habilitado
  ```
- Criar hook `usePlanFeatures()` que retorna as features habilitadas com base no `plan` do tenant ativo (lido do JWT/TenantContext)
- Aplicar nos componentes de rota (`PrivateRoute`) — redirecionar para pagina de upgrade ou ocultar no menu
- Aplicar no `SideBar` — ocultar itens de menu de features desabilitadas
- Garantir que rotas desabilitadas retornam 404 ou redirect (nao apenas ocultar no menu)

**Criterios de aceite:**
- [ ] Hook `usePlanFeatures()` funcional
- [ ] Menu lateral oculta paginas nao disponiveis para o plano
- [ ] Rotas desabilitadas redirecionam (nao so escondem)
- [ ] Tenant `full` ve tudo
- [ ] Tenant `essentials` ve apenas o subconjunto definido
- [ ] Troca de tenant atualiza as features imediatamente

**Tipo:** Front-end
**Servicos afetados:** Frontend — `router/`, `componentes/SideBar`, novo hook `usePlanFeatures`

---

#### R02 — Auditar implementacao atual do Risk Level

**Titulo:** Comparar implementacao atual do Risk Level com a documentacao produzida em R01

**Descricao:**
Com base na documentacao de R01, verificar se o codigo atual implementa corretamente as regras. Identificar divergencias, bugs ou comportamentos inesperados.

**O que fazer:**
- Comparar o documento de R01 com o codigo de:
  - Cron job `snapshotRiskDebug` (`config/cron-tasks.ts`)
  - Endpoint `/acesso/wazuh/risklevel` (servico Wazuh)
  - Frontend `RiskLevel.tsx` e componentes (`GraficoGauge`, `SeveridadeCard`, etc.)
- Para cada ponto do algoritmo:
  - O codigo faz o que a documentacao diz?
  - Ha edge cases nao tratados?
  - O que acontece quando Wazuh esta indisponivel?
  - O que acontece quando CIS nao retorna dados?
- Produzir lista de divergencias/bugs encontrados (input para R03)

**Criterios de aceite:**
- [ ] Cada regra do documento R01 verificada no codigo
- [ ] Lista de divergencias produzida
- [ ] Edge cases documentados
- [ ] Bugs identificados priorizados por impacto

**Tipo:** Back-end / Analise
**Servicos afetados:** Strapi, Frontend — `pages/RiskLevel.tsx`

---

#### C02 — Configurar LLM padrao Hackone como fallback

**Titulo:** Todo tenant novo deve ter a LLM da Hackone como configuracao padrao para Chat e Motor de Analises

**Descricao:**
Quando um novo tenant e criado, ele deve automaticamente receber a configuracao da LLM da Hackone para ambas as finalidades (chat e analysis). O cliente pode depois trocar para uma LLM propria.

**O que fazer:**
- No lifecycle de criacao de tenant (Strapi), apos criar o tenant:
  - Chamar `POST /api/customers/llm-config` com `purpose=chat` e credenciais da LLM Hackone
  - Chamar `POST /api/customers/llm-config` com `purpose=analysis` e credenciais da LLM Hackone
- Definir as credenciais padrao da Hackone como variavel de ambiente (nao hardcoded)
- Para tenants existentes que nao tem config LLM: criar migration/script que popula com o padrao

**Criterios de aceite:**
- [ ] Tenant novo automaticamente recebe config LLM para chat e analysis
- [ ] Credenciais da LLM Hackone vem de variavel de ambiente
- [ ] Tenants existentes sem config recebem o padrao via migration
- [ ] Cliente consegue substituir a config padrao pela sua propria

**Tipo:** Back-end
**Servicos afetados:** Strapi — lifecycle do tenant | Customers API

---

### BLOCO 3 — Coleta FortiGATE + Risk Level

---

#### G02 — Implementar mapeamento de severidade FortiGATE

**Titulo:** Criar mapeamento de severidades do FortiGATE para os 4 buckets padrao

**Descricao:**
O FortiGATE tem severidades proprias nos seus logs. Essas severidades precisam ser traduzidas para os 4 buckets padrao do SecurityOne (Critico, Alto, Medio, Baixo). Este mapeamento e executado dentro do Normalizer FortiGATE no ALERT.

**O que fazer:**
- Mapear os niveis de severidade do FortiGATE:
  ```
  FortiGATE IPS:
    critical  → Critico
    high      → Alto
    medium    → Medio
    low       → Baixo
    info      → Baixo

  FortiGATE Log:
    emergency → Critico
    alert     → Critico
    critical  → Critico
    error     → Alto
    warning   → Medio
    notice    → Baixo
    info      → Baixo
    debug     → Baixo
  ```
- Implementar o metodo `mapSeverity()` no Normalizer FortiGATE (G01)
- Armazenar o mapeamento como configuracao (tabela ou JSON), nao hardcoded, para permitir customizacao futura por integracao

**Criterios de aceite:**
- [ ] Todas as severidades do FortiGATE mapeadas para os 4 buckets
- [ ] Mapeamento armazenado como configuracao editavel
- [ ] Metodo `mapSeverity()` integrado ao Normalizer FortiGATE
- [ ] Eventos normalizados saem com severidade correta

**Tipo:** Back-end
**Servico afetado:** Microservico ALERT (Normalizer FortiGATE)

---

#### E01 — Criar tela de configuracao de fontes FortiGATE

**Titulo:** Implementar tela para o usuario cadastrar instancias de FortiGATE para coleta de alertas

**Descricao:**
O usuario deve poder cadastrar uma ou mais instancias de FortiGATE no sistema. Cada instancia configurada representara uma fonte de dados que sera coletada pelo polling job (E02).

**O que fazer:**
- Criar pagina acessivel via menu de integracoes ou config (definir rota)
- Formulario de cadastro com campos:
  - **Fonte**: fixo "FortiGATE" (product=fortigate, vendor=fortinet) — em futuras versoes sera dropdown
  - **Descricao**: texto livre para identificar o firewall (ex: "Firewall Matriz SP")
  - **URL da API**: URL base da API REST do FortiGATE
  - **API Key ou credenciais**: campo de autenticacao (API token do FortiGATE)
  - **Intervalo de coleta**: dropdown (5 min, 10 min, 15 min) — padrao 5 min
  - **Ativo**: toggle on/off
- Lista de instancias ja cadastradas com acoes: editar, desativar, excluir
- Ao salvar nova config: chamar endpoint backend que persiste e dispara criacao do job
- Botao "Testar Conexao" que valida URL + credenciais contra a API do FortiGATE

**Criterios de aceite:**
- [ ] Formulario de cadastro funcional com todos os campos
- [ ] Multiplas instancias podem ser cadastradas
- [ ] Listagem de instancias com status
- [ ] Edicao e exclusao funcionais
- [ ] Botao "Testar Conexao" valida contra API real
- [ ] Ao salvar, backend e notificado para criar/atualizar o polling job
- [ ] Somente acessivel por admin

**Tipo:** Front-end (+ endpoint backend para persistir)
**Servicos afetados:** Frontend — nova pagina | Strapi ou Customers API — novo endpoint de config

---

#### E02 — Implementar background job de polling FortiGATE

**Titulo:** Criar job de coleta incremental que busca alertas no FortiGATE e envia para o ALERT

**Descricao:**
Para cada instancia de FortiGATE configurada (E01), um job independente deve rodar periodicamente, coletar os alertas mais recentes via API e enviar como eventos brutos para o microservico ALERT.

**O que fazer:**
- Usar como base o script Python existente de integracao FortiGATE
- Para cada instancia configurada e ativa:
  - Instanciar o Collector FortiGATE (G01)
  - Executar `authenticate()` com URL e credenciais da config
  - Executar `fetchIncremental(lastCursor)` — buscar alertas desde o ultimo timestamp processado
  - Executar `emitRaw(rawEvents)` — enviar para `POST /api/events/ingest` do ALERT com:
    - `tenant_id` da configuracao
    - `source_type` = "firewall"
    - `vendor` = "fortinet"
    - Array de `raw_payload`
  - Atualizar `lastCursor` com o timestamp do ultimo evento coletado
- Gerenciamento do job:
  - Intervalo conforme configuracao (5-15 min)
  - Cada instancia = 1 job independente
  - Jobs devem sobreviver a restart do servico (persistir estado)
  - Se a API FortiGATE estiver indisponivel: logar erro, tentar novamente no proximo ciclo
  - Se exceder timeout: abortar e tentar no proximo ciclo

**Criterios de aceite:**
- [ ] Job roda no intervalo configurado
- [ ] Coleta e incremental (nao repete eventos)
- [ ] Eventos brutos enviados para ALERT via endpoint de ingestao
- [ ] Estado do cursor persistido (sobrevive a restart)
- [ ] Multiplas instancias rodam em paralelo sem interferencia
- [ ] Falha na API FortiGATE nao derruba o job (retry no proximo ciclo)
- [ ] Log de execucao com: timestamp, eventos coletados, erros

**Tipo:** Back-end
**Servico afetado:** Novo servico/worker de polling (ou cron no Strapi — definir)

---

#### R03 — Corrigir Risk Level para funcionar sem CIS

**Titulo:** Implementar degradacao graciosa do Risk Level e corrigir divergencias identificadas em R02

**Descricao:**
O Risk Level atualmente assume 4 cards fixos (alertas por host, firewalls, incidentes, CIS). No contexto Essentials, CIS nao existe. O algoritmo deve funcionar com qualquer subconjunto de cards, recalculando pesos proporcionalmente.

**O que fazer:**
- Corrigir todos os bugs/divergencias listados em R02
- Refatorar o algoritmo de calculo:
  - Nao depender de 4 cards fixos
  - Aceitar N cards disponiveis (de 1 a 4)
  - Se um card nao tem dados: excluir do calculo (nao penalizar com zero)
  - Redistribuir os pesos proporcionalmente entre os cards que existem
  - Exemplo: se so tem 2 cards (alertas firewall + incidentes), cada um pesa 50%
- Garantir que o score 0-100 continua coerente independente da quantidade de cards
- Atualizar o cron job `snapshotRiskDebug` com a nova logica
- No contexto Essentials:
  - Cards disponiveis: alertas de firewall, incidentes abertos
  - Cards indisponiveis: CIS compliance, top hosts EDR (se nao tiver EDR)

**Criterios de aceite:**
- [ ] Risk Level calcula corretamente com 1, 2, 3 ou 4 cards
- [ ] Ausencia de CIS nao penaliza o score
- [ ] Pesos redistribuidos proporcionalmente
- [ ] Score 0-100 coerente em todos os cenarios
- [ ] Cron job atualizado
- [ ] Clientes `full` (com CIS) nao impactados

**Tipo:** Back-end
**Servicos afetados:** Strapi — `config/cron-tasks.ts`, endpoint `/acesso/wazuh/risklevel`

---

### BLOCO 4 — Incident Engine + Complementos

---

#### G04 — Implementar motor de correlacao (Incident Engine)

**Titulo:** Criar microservico CORRELATION com agrupamento deterministico de eventos em incidentes

**Descricao:**
Implementar o motor de correlacao que recebe eventos normalizados do ALERT e os agrupa em candidatos a incidente usando regras deterministicas (sem IA). Os candidatos sao entao enviados ao TICKET para processamento.

**O que fazer:**
- Criar microservico `CORRELATION` (ou modulo dentro de servico existente — decidir)
- Receber eventos normalizados do ALERT (via HTTP ou fila)
- Para cada evento, calcular `correlation_key` conforme a categoria:
  ```
  AUTH_ANOMALY:
    corr_key = hash(tenant_id + category + user + src_ip)
  NETWORK_RECON:
    corr_key = hash(tenant_id + category + src_ip + dst_ip)
  NETWORK_INTRUSION:
    corr_key = hash(tenant_id + category + signature_id + src_ip + dst_ip + dst_port)
  POLICY_VIOLATION:
    corr_key = hash(tenant_id + category + rule_id + src_ip + dst_ip)
  MALWARE_EXECUTION / ENDPOINT_BEHAVIOR:
    corr_key = hash(tenant_id + category + asset_host + process_name)
  OTHER:
    corr_key = hash(tenant_id + category + asset_ip + src_ip)
  ```
- Buscar se existe `IncidentCandidate` aberto com mesma `corr_key` e dentro da janela de tempo (usar janela fixa de 60 min neste MVP — G07 fica para depois):
  - Se existir: atualizar `last_seen_at`, `event_count`, `severity_max`, adicionar evento
  - Se nao existir: criar novo `IncidentCandidate` com status OPEN
- Quando candidato for criado ou atualizado, encaminhar para TICKET
- TICKET decide (com IA) se abre incidente no IRIS

**Criterios de aceite:**
- [ ] Eventos com mesma corr_key e dentro da janela agrupados no mesmo candidato
- [ ] Eventos fora da janela criam novo candidato
- [ ] Candidatos encaminhados para TICKET
- [ ] 1000 eventos similares em 1h geram 1-3 incidentes (nao 1000)
- [ ] Reprocessar mesma janela nao cria candidatos duplicados (idempotencia)
- [ ] Cada candidato registra event_count e severity_max

**Tipo:** Back-end
**Servico afetado:** Novo microservico CORRELATION (ou modulo novo)

---

#### G17 — Implementar calculo de severidade final do incidente

**Titulo:** Calcular severidade do incidente com base nos eventos agrupados + regras de escalation

**Descricao:**
A severidade do incidente nao e apenas a copia da severidade do alerta. Deve considerar o maximo entre os eventos, o volume e a recorrencia.

**O que fazer:**
- No CORRELATION (G04), ao criar/atualizar um IncidentCandidate:
  1. `severity_final` = max(severity de todos os eventos no candidato)
  2. Se `event_count >= 100` dentro da janela: subir 1 nivel (ate Critico)
  3. Se mesma `corr_key` reaparece em 3 janelas no mesmo dia: subir 1 nivel
- Hierarquia: Baixo → Medio → Alto → Critico (teto)
- Enviar `severity_final` ao TICKET junto com o candidato

**Criterios de aceite:**
- [ ] Severidade final = max dos eventos por padrao
- [ ] Volume alto (>=100 eventos) escala severidade em 1 nivel
- [ ] Recorrencia (3 janelas/dia) escala severidade em 1 nivel
- [ ] Escalation nao ultrapassa Critico
- [ ] Severidade final registrada no candidato e enviada ao TICKET

**Tipo:** Back-end
**Servico afetado:** CORRELATION

---

#### G15 — Implementar classificacao de ativos criticos (crown jewel)

**Titulo:** Permitir marcar ativos como criticos e ajustar severidade de incidentes que os envolvem

**Descricao:**
O administrador deve poder marcar servidores ou hosts como "ativos criticos" (crown jewels). Incidentes que envolvem esses ativos recebem escalation de +1 nivel de severidade.

**O que fazer:**
- **Back-end:**
  - Criar entidade `CriticalAsset` (ou campo em entidade existente) com:
    - `tenant_id`
    - `identifier` (hostname ou IP)
    - `type` (server, workstation, etc.)
    - `description`
  - CRUD de ativos criticos (admin only)
  - No CORRELATION (G04), ao calcular severidade final (G17):
    - Verificar se `primary_asset` do candidato esta na lista de critical assets do tenant
    - Se sim: adicionar +1 nivel de severidade (ate Critico)
- **Front-end:**
  - Tela de cadastro de ativos criticos (pode ser dentro de Config)
  - Lista com acoes: adicionar, editar, remover
  - Campos: identificador (hostname/IP), tipo, descricao

**Criterios de aceite:**
- [ ] Admin consegue cadastrar ativos criticos por tenant
- [ ] CORRELATION consulta lista de ativos criticos ao calcular severidade
- [ ] Incidente em ativo critico recebe +1 severidade
- [ ] Escalation nao ultrapassa Critico

**Tipo:** Full Stack
**Servicos afetados:** CORRELATION, Strapi/Customers API (CRUD), Frontend (tela de config)

---

#### G16 — Configurar IA da Hackone como fallback padrao

**Titulo:** Garantir que incidentes continuam sendo criados quando IA falha, usando LLM da Hackone como padrao

**Descricao:**
A IA (LLM) e usada pelo TICKET para sumarizar incidentes e sugerir acoes. Se a LLM do cliente falhar ou nao estiver configurada, o sistema deve usar a LLM da Hackone como fallback. Se ate o fallback falhar, incidentes continuam sendo criados com template, sem IA.

**O que fazer:**
- **No microservico TICKET:**
  - Ao processar um candidato a incidente:
    1. Tentar usar a LLM configurada pelo cliente (`purpose=analysis`)
    2. Se falhar (timeout, erro, nao configurada): tentar LLM da Hackone (fallback)
    3. Se fallback tambem falhar: criar incidente com campos de IA vazios
  - Campos afetados quando IA indisponivel:
    - `ai_summary` = null
    - `hypotheses` = null
    - `recommended_actions` = null
  - Registrar no incidente: `ai_status` = "success" | "fallback" | "unavailable"
- **No front-end (detalhe do incidente):**
  - Se `ai_status` = "unavailable": exibir banner "IA nao disponivel no momento — incidente criado com informacoes automaticas"
  - Campos de IA nulos: exibir "Analise de IA indisponivel" no lugar do conteudo

**Criterios de aceite:**
- [ ] LLM do cliente e tentada primeiro
- [ ] Fallback para LLM Hackone se LLM do cliente falhar
- [ ] Se ambas falharem, incidente criado sem IA (nao bloqueia)
- [ ] Campo `ai_status` registrado no incidente
- [ ] Frontend exibe mensagem adequada quando IA indisponivel
- [ ] Dashboards e listagens de incidentes funcionam normalmente sem IA

**Tipo:** Back-end (+ ajuste front)
**Servicos afetados:** Microservico TICKET, Frontend — detalhe do incidente

---

#### R04 — Testes do Risk Level com 3 cenarios

**Titulo:** Criar e executar suite de testes para validar o Risk Level em diferentes contextos

**Descricao:**
Validar que o Risk Level funciona corretamente em cenarios representativos dos planos Essentials e Full.

**O que fazer:**
- Definir 3 cenarios minimos:
  1. **So Firewall (Essentials basico):** Apenas dados de firewall FortiGATE. Sem EDR, sem CIS. Risk Level deve calcular com 2 cards (alertas firewall + incidentes).
  2. **Firewall + Incidentes variados:** Dados de firewall com mix de severidades. Incidentes abertos e fechados. Validar que o score reflete a realidade.
  3. **Completo com CIS (Full):** Todos os 4 cards presentes (alertas, firewalls, incidentes, CIS). Validar que o comportamento original nao regrediu.
- Para cada cenario:
  - Preparar dados de teste (mock ou seed)
  - Executar o calculo do Risk Level
  - Verificar score, pesos e cards
  - Documentar resultado esperado vs obtido
- Se possivel, automatizar como testes que possam ser reexecutados

**Criterios de aceite:**
- [ ] 3 cenarios definidos e documentados
- [ ] Cada cenario executado com resultado documentado
- [ ] Cenario 1 (so firewall) nao penaliza por falta de CIS
- [ ] Cenario 3 (full) nao regride o comportamento atual
- [ ] Bugs encontrados reportados como issues

**Tipo:** Back-end / QA
**Servicos afetados:** Strapi — cron job, endpoint risklevel

---

### BLOCO 5 — Analytics + Copiloto

---

#### SA02 — Implementar backend de metricas SOC Analytics

**Titulo:** Criar endpoint de metricas agregadas com MTTD/MTTA/MTTR, deltas e performance de IA

**Descricao:**
A tela SOC Analytics precisa de um endpoint que retorne todas as metricas de forma agregada e performatica. Calcular em tempo real sobre muitos incidentes e caro — usar agregacoes pre-calculadas.

**O que fazer:**
- Criar cron job de agregacao diaria (similar ao `snapshotRiskDebug`):
  - Para cada tenant ativo, calcular e persistir por dia:
    - `incident_counts_by_severity` (baixo, medio, alto, critico)
    - `avg_mttd` = media(detected_at - first_seen_at) dos incidentes do dia
    - `avg_mtta` = media(acknowledged_at - created_at)
    - `avg_mttr` = media(resolved_at - created_at) — so incidentes fechados
    - `open_incidents_count` (snapshot)
    - `triage_auto_rate` = incidentes_abertos_IA / total
    - `avg_ai_time` = media(ai_first_result_at - created_at)
    - `escalation_rate` = incidentes_escalados / total
  - Persistir em tabela `soc_analytics_daily`

- Criar endpoint `GET /api/analytics/soc`:
  - Parametros: `tenant_id`, `period` (week|month|quarter|year|custom), `start_date`, `end_date`
  - Retorno:
    ```json
    {
      "current": { "mttd_minutes", "mtta_minutes", "mttr_minutes", "open_incidents", "severity_distribution", "ia_performance" },
      "previous": { /* mesmos campos para periodo anterior */ },
      "deltas": { "mttd_delta_pct", "mtta_delta_pct", "mttr_delta_pct", "open_incidents_delta_pct" },
      "open_incidents_badge": "normal" | "attention" | "high_alert"
    }
    ```
  - Regra da badge:
    - "normal" se abertos <= periodo anterior
    - "attention" se abertos > periodo anterior
    - "high_alert" se abertos > "attention" OU existe pelo menos 1 incidente critico aberto
  - Se nao houver dados: retornar valores como null (frontend exibe "N/A")

**Criterios de aceite:**
- [ ] Cron job de agregacao diaria funcional
- [ ] Endpoint retorna metricas para todos os periodos
- [ ] Deltas calculados corretamente (periodo atual vs anterior equivalente)
- [ ] Badge de alerta segue regras definidas
- [ ] Performance: resposta em menos de 2 segundos
- [ ] Sem incidentes no periodo: retorna null (nao zero)
- [ ] Multi-tenant: responde apenas para o tenant autenticado

**Tipo:** Back-end
**Servico afetado:** API Tickets (`api-hackone-tickets`) ou novo servico de analytics

---

#### CP01 — Evoluir chat para Copiloto IA contextual

**Titulo:** Redesenhar ChatWidget como painel lateral contextual do Copiloto IA

**Descricao:**
O chat atual funciona como botao flutuante com janela popup. O Copiloto IA deve ser um painel lateral direito que entende o contexto da pagina atual e oferece ajuda operacional relevante.

**O que fazer:**
- **Redesign do componente:**
  - Substituir botao flutuante + popup por icone persistente que abre painel lateral direito
  - Painel com header mostrando contexto atual: "Copiloto IA | Contexto: [nome da tela] | Tenant [nome] | [periodo]"
  - Area de prompts sugeridos (3-4 botoes por tela)
  - Area de conversa (historico da sessao)
  - Input de pergunta livre
  - Responsivo (colapsa em mobile)

- **Deteccao de contexto:**
  - Capturar automaticamente ao abrir o copiloto:
    - `page`: rota atual (home, risk-level, incidentes, incidente/:id)
    - `entity`: objeto em foco (ex: incidente #4821)
    - `tenant`: tenant ativo do contexto
    - `filters`: filtros aplicados (periodo, severidade, etc.)
    - `period`: periodo selecionado
    - `metadata`: dados visiveis relevantes (KPIs, scores, contagens)
  - Enviar contexto estruturado no `POST /api/chat` (evoluir o campo `context` ja existente)

- **Escopo de paginas MVP:**
  - Home: contexto = widgets visiveis, risk level, incidentes recentes
  - Risk Level: contexto = score, cards, distribuicao de severidade
  - Detalhe do Incidente: contexto = todos os campos do incidente, timeline, evidencias

- **Manter retrocompatibilidade:**
  - Sessoes de chat antigas continuam acessiveis
  - Historico por sessionId preservado

**Criterios de aceite:**
- [ ] Painel lateral abre e fecha sem interferir na navegacao
- [ ] Contexto da pagina detectado automaticamente e exibido no header
- [ ] Contexto enviado ao backend no payload do chat
- [ ] Funciona nas 3 paginas MVP (Home, Risk Level, Incidente)
- [ ] Troca de pagina atualiza o contexto automaticamente
- [ ] Historico de sessao preservado
- [ ] Responsivo em telas menores

**Tipo:** Front-end
**Servicos afetados:** Frontend — `componentes/chat/ChatWidget.tsx`, `ChatWindow.tsx`, novo `CopilotPanel.tsx`

---

#### G10 — Adaptar Risk Level para cards dinamicos

**Titulo:** Refatorar pagina Risk Level para exibir apenas cards disponiveis conforme plano e fontes conectadas

**Descricao:**
Atualmente a pagina Risk Level (`RiskLevel.tsx`) assume 4 cards fixos. No contexto Essentials, alguns cards nao existem (ex: CIS). A pagina deve renderizar apenas os cards que tem dados e ajustar o layout.

**O que fazer:**
- Consultar o plano do tenant (via `usePlanFeatures()` de E07) e as fontes conectadas
- Determinar quais cards estao disponiveis:
  - **Essentials:** alertas de firewall, incidentes (fluxo), gauge de risco
  - **Essentials sem CIS:** ocultar `TopAgentsCisCard`
  - **Full:** todos os cards
- Cards indisponiveis: nao renderizar (nao mostrar vazio ou com erro)
- Ajustar o layout/grid para ocupar o espaco corretamente quando cards faltam
- O gauge `GraficoGauge` deve refletir o score recalculado (R03)
- `SeveridadeCard` deve funcionar com dados vindos do Essentials (nao so Wazuh)

**Criterios de aceite:**
- [ ] Cards indisponiveis nao aparecem na tela
- [ ] Layout se ajusta sem espacos vazios
- [ ] Gauge reflete score proporcional (logica de R03)
- [ ] Tenant `full` ve todos os cards (regressao zero)
- [ ] Tenant `essentials` ve apenas cards pertinentes

**Tipo:** Front-end
**Servicos afetados:** Frontend — `pages/RiskLevel.tsx`, componentes de card

---

#### G11 — Adaptar Monitoria NG-SOC para Monitoria de Ingestao

**Titulo:** Criar visao de Monitoria de Ingestao para tenants Essentials

**Descricao:**
Para tenants Essentials, a Monitoria NG-SOC deve exibir informacoes sobre a ingestao de dados das fontes configuradas (FortiGATE), em vez dos dados de Wazuh/Storage tradicionais.

**O que fazer:**
- Quando plano = `essentials`:
  - Substituir/adaptar os componentes de `MonitoriaSOC.tsx`:
    - **Volume de eventos/dia:** grafico de linha com eventos ingeridos pelo ALERT (por dia)
    - **Ultimas sincronizacoes:** lista das ultimas execucoes do polling job (FortiGATE) com timestamp e status (sucesso/erro)
    - **Status das integracoes:** cards mostrando cada instancia FortiGATE configurada com status on/off
    - **Tabela de coletores:** lista das fontes com colunas: nome, tipo, ultimo log, status
  - Reutilizar componentes existentes onde possivel (`GraficoVolume`, badges de status, tabela)
- Quando plano = `full`: manter comportamento atual (Wazuh/Storage)
- Criar endpoints backend (ou adaptar existentes) para fornecer:
  - Total de eventos por dia por tenant (fonte: ALERT)
  - Lista de jobs de coleta com ultimo status
  - Status de cada instancia configurada

**Criterios de aceite:**
- [ ] Tenant `essentials` ve Monitoria de Ingestao (nao a versao Wazuh)
- [ ] Volume diario de eventos exibido
- [ ] Status de cada fonte configurada visivel
- [ ] Tenant `full` continua vendo a monitoria tradicional
- [ ] Dados vem de endpoints reais (nao mock)

**Tipo:** Front-end (+ endpoints backend de suporte)
**Servicos afetados:** Frontend — `pages/MonitoriaSOC.tsx` | ALERT ou Strapi — novos endpoints de metricas

---

### BLOCO 6 — Frontend Final

---

#### SA03 — Refatorar frontend SOC Analytics conforme novo design

**Titulo:** Redesenhar pagina SOC Analytics com KPIs, deltas, donut, Risk Level embedded e Performance IA

**Descricao:**
A pagina SOC Analytics atual precisa ser refatorada para seguir o novo design (Figma disponivel) com metricas mais ricas, comparacao de periodos e blocos visuais definidos.

**O que fazer:**
- **Barra de filtros:**
  - Filtro de periodo: Semana, Mes, Trimestre, Ano, Customizado (calendario)
  - Organizacao (obrigatorio se multi-tenant)
  - Default: ultimas 24h

- **KPIs do topo (4 cards):**
  - MTTD: valor em minutos/horas + delta % vs periodo anterior + seta + cor
  - MTTA: idem
  - MTTR: idem
  - Incidentes Abertos: valor absoluto + delta + badge (Normal/Attention/High Alert)
  - Regras de cor: para tempos, menor = melhor (verde se caiu, vermelho se subiu). Para abertos, maior = pior
  - Se sem dados: exibir "N/A" com tooltip

- **Bloco: Historico de Incidentes:**
  - Donut por severidade (Baixo, Medio, Alto, Critico)
  - Hover: contagem absoluta, percentual, variacao vs anterior
  - Click na fatia: filtra drill-down

- **Bloco: Risk Level embedded:**
  - Gauge 0-100 reutilizando `GraficoGauge` existente
  - Texto do nivel + lista de alertas por severidade
  - Click abre tela Risk Level

- **Bloco: Performance da IA:**
  - Taxa de triagem automatica (%)
  - Tempo medio da IA (minutos)
  - Taxa de escalacao (%)
  - Barras de progresso ou indicadores visuais

- **Drill-down:**
  - Botao "Ver incidentes" → lista filtrada
  - Click em MTTA → incidentes com maiores tempos de atribuicao
  - Click em MTTR → incidentes com maiores tempos de resolucao

- **Estados:**
  - Loading: skeleton nos cards
  - Sem dados: "N/A" com tooltip
  - Erro: banner com "Tentar novamente"

**Criterios de aceite:**
- [ ] 4 KPIs no topo com deltas e cores corretas
- [ ] Donut de historico por severidade funcional
- [ ] Risk Level embedded reflete score atual
- [ ] Performance IA exibe as 3 metricas
- [ ] Troca de periodo recalcula todos os blocos
- [ ] Drill-down navega para incidentes filtrados
- [ ] Estados loading/empty/error tratados
- [ ] Layout responsivo
- [ ] Design segue Figma

**Tipo:** Front-end
**Servicos afetados:** Frontend — `pages/SOCAnalytics.tsx` (rewrite), componentes de graficos

---

#### CP02 — Implementar prompts sugeridos e resposta estruturada

**Titulo:** Adicionar prompts contextuais por tela e formato padrao de resposta do Copiloto

**Descricao:**
Cada pagina do MVP deve oferecer prompts sugeridos relevantes ao contexto. As respostas do Copiloto devem seguir um formato estruturado para aumentar confianca e usabilidade.

**O que fazer:**
- **Prompts sugeridos por tela:**
  - Home:
    - "Resuma o cenario atual"
    - "O que merece mais atencao agora?"
    - "O que mais esta puxando o risco?"
    - "Gere um resumo executivo"
  - Risk Level:
    - "Por que o risco subiu?"
    - "Quais fatores tem maior peso agora?"
    - "O que devo atacar primeiro para reduzir o risco?"
  - Detalhe do Incidente:
    - "Resuma este incidente"
    - "Quais evidencias mais importam?"
    - "Qual deve ser o proximo passo?"
    - "Gere um resumo para cliente"
  - Prompts devem ser configurados no backend (nao hardcoded no front) para facilitar evolucao

- **Formato de resposta estruturada:**
  - Evoluir o endpoint `POST /api/chat` para retornar:
    ```json
    {
      "type": "structured",
      "summary": "texto principal",
      "why_it_matters": "por que isso importa",
      "evidence": ["fonte1", "fonte2"],
      "confidence": "alta" | "media" | "baixa",
      "next_steps": ["passo1", "passo2"],
      "continuation_prompts": ["pergunta sugerida 1", "pergunta sugerida 2"]
    }
    ```
  - System prompt especifico por tela que instrui a LLM a responder nesse formato
  - Frontend renderiza cada secao com estilo visual distinto (nao texto corrido)

- **Guardrails:**
  - Copiloto deve respeitar tenant do usuario (nao acessar dados de outros tenants)
  - Respostas devem indicar se sao fato, hipotese ou recomendacao
  - Se evidencia insuficiente: indicar explicitamente

**Criterios de aceite:**
- [ ] Cada pagina MVP exibe 3-4 prompts sugeridos
- [ ] Click no prompt envia a pergunta com contexto
- [ ] Resposta renderizada em formato estruturado (nao texto corrido)
- [ ] Evidencias consultadas listadas na resposta
- [ ] Nivel de confianca exibido
- [ ] Prompts de continuacao clicaveis
- [ ] Isolamento de tenant respeitado

**Tipo:** Full Stack
**Servicos afetados:** Chat API (`api-hackone-chat`), Frontend — `CopilotPanel.tsx`

---

#### CP03 — Implementar geracao de artefatos de comunicacao

**Titulo:** Permitir que o Copiloto gere resumos tecnicos, executivos e notas para cliente

**Descricao:**
Um dos maiores valores do Copiloto e reduzir o esforco operacional na comunicacao. O analista deve poder pedir um resumo tecnico, executivo ou nota para cliente e receber um artefato pronto para copiar/editar/salvar.

**O que fazer:**
- **Tipos de artefato:**
  - Resumo tecnico: linguagem operacional, detalhes de evidencias e IOCs
  - Resumo executivo: linguagem simples, foco em impacto e status
  - Nota para cliente: linguagem clara e nao-tecnica, foco em situacao/proximos passos

- **Acoes disponiveis no artefato gerado:**
  - Copiar texto (clipboard)
  - Editar resposta (textarea inline)
  - Gerar versao alternativa (ex: "Gere versao executiva" a partir do tecnico)
  - Salvar como nota do caso (persiste no incidente como nota/comentario)

- **Implementacao:**
  - Quando o prompt e de geracao de artefato (detectar por intencao ou por tipo de prompt):
    - LLM recebe instrucao especifica para gerar no formato solicitado
    - Resposta retornada com `type: "artifact"` em vez de `type: "structured"`
    - Frontend renderiza com acoes de copia/edicao/salvamento
  - "Salvar como nota do caso": chamar API do IRIS para adicionar nota ao incidente

**Criterios de aceite:**
- [ ] 3 tipos de artefato gerais disponiveis (tecnico, executivo, nota cliente)
- [ ] Botao "Copiar" funcional
- [ ] Edicao inline antes de copiar/salvar
- [ ] "Gerar versao executiva/tecnica" funcional
- [ ] "Salvar como nota do caso" persiste no IRIS
- [ ] Artefatos gerados com base no contexto real do incidente

**Tipo:** Full Stack
**Servicos afetados:** Chat API, Frontend — `CopilotPanel.tsx` | IRIS API (para salvar nota)

---

## Resumo Quantitativo

| Metrica | Quantidade |
|---------|------------|
| Total de tarefas | 30 |
| Tarefas Back-end | 16 |
| Tarefas Front-end | 6 |
| Tarefas Full Stack | 6 |
| Tarefas Documentacao | 1 |
| Blocos de desenvolvimento | 6 |

| Bloco | Tarefas | Pode iniciar apos |
|-------|---------|-------------------|
| 1 — Fundacao | E06, E05, E03, G06, T01, SA01, R01, C01 | Imediatamente |
| 2 — Pipeline + Multi-Tenant | E04, G01, G03, E07, R02, C02 | Bloco 1 |
| 3 — Coleta + Risk Level | G02, E01, E02, R03 | Blocos 1-2 |
| 4 — Incident Engine | G04, G17, G15, G16, R04 | Blocos 1-3 |
| 5 — Analytics + Copiloto | SA02, CP01, G10, G11 | Blocos 2-4 |
| 6 — Frontend Final | SA03, CP02, CP03 | Blocos 2-5 |
