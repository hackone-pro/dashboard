# E02 — Job de Polling Incremental (Hangfire)

**Data:** 2026-04-15
**Tipo:** Back-end
**Dependencias:** E01 (Source config), E03 (alert pipeline), G01 (adapter FortiGATE)
**Servicos afetados:** SecurityOne.Alerts (job) + SecurityOne.Customers (domain events + notificacao)

---

## 1. Arquitetura Geral

O job de polling vive no servico **SecurityOne.Alerts** (que ja possui Hangfire configurado). O servico **SecurityOne.Customers** notifica o Alerts via HTTP quando uma Source e criada, atualizada, deletada ou toggled. O Alerts reage criando, atualizando ou cancelando o RecurringJob correspondente.

Apos cada ciclo de polling bem-sucedido (ou falho), o Alerts notifica o Customers de volta via HTTP para atualizar o status da Source (Connected/Disconnected).

```
[Customers]                              [Alerts]
    |                                        |
    |  Source criada/editada/deletada/toggled |
    |  --> Domain Event no handler           |
    |      --> EventHandler faz HTTP ------->| POST /api/alerts/sources/notify
    |                                        |   { sourceId, event, payload }
    |                                        |
    |                                        |  Alerts cria/atualiza/cancela
    |                                        |  Hangfire RecurringJob
    |                                        |
    |                                        |  Job executa ciclo de polling:
    |                                        |    1. Busca config (payload recebido)
    |                                        |    2. Seleciona IIncrementalCollector
    |                                        |    3. fetchIncremental(config, cursor)
    |                                        |    4. Despacha eventos via MediatR
    |                                        |    5. Persiste cursor
    |                                        |
    |  POST /api/customers/sources/notify <--| 6. Notifica Customers sobre status
    |  { sourceId, event: "status_changed",  |    (Connected/Disconnected)
    |    payload: { status: "Connected" } }  |
```

**Futuro:** A comunicacao HTTP sera substituida por RabbitMQ.

---

## 2. Contrato HTTP entre Servicos

### 2.1 Endpoint no Alerts (recebe notificacoes do Customers)

```
POST /api/alerts/sources/notify
Authorization: service-to-service

Body:
{
  "sourceId": "guid",
  "event": "created" | "updated" | "deleted" | "toggled",
  "payload": {
    "tenantId": "string",
    "product": "string",
    "vendor": "string",
    "fetchType": "Pull" | "Push",
    "active": true,
    "apiUrl": "string?",
    "apiToken": "string?",
    "pollingIntervalMinutes": 10
  }
}
```

**Comportamento por evento:**

| Evento | Condicao | Acao |
|--------|----------|------|
| `created` | fetchType=Pull, active=true | Cria RecurringJob |
| `created` | fetchType=Push ou active=false | Ignora (sem job) |
| `updated` | job existe | Atualiza job (novo intervalo, credenciais). Cria se agora e Pull+active |
| `toggled` | active=true | Cria/reativa job |
| `toggled` | active=false | Cancela job |
| `deleted` | — | Cancela job + limpa cursor |

### 2.2 Endpoint no Customers (recebe status de volta do Alerts)

```
POST /api/customers/sources/notify
Authorization: service-to-service

Body:
{
  "sourceId": "guid",
  "event": "status_changed",
  "payload": {
    "status": "Connected" | "Disconnected",
    "lastPolledAt": "datetime",
    "eventsCollected": 0,
    "errorMessage": "string?"
  }
}
```

### 2.3 Naming do job Hangfire

- Padrao: `polling_{product}_{vendor}_{tenantId}_{sourceId}`
- Exemplo: `polling_fortigate_fortinet_tenant123_source456`

---

## 3. Componentes no SecurityOne.Alerts

### 3.1 Interface IIncrementalCollector

```csharp
public interface IIncrementalCollector
{
    bool SupportsPolling(string product, string vendor);
    Task<CollectionResult> FetchIncrementalAsync(
        PollingSourceConfig config,
        string? lastCursor,
        CancellationToken ct);
}

public record CollectionResult(
    List<JsonElement> Events,
    string? NewCursor,
    int EventCount);

public record PollingSourceConfig(
    Guid SourceId,
    string TenantId,
    string Product,
    string Vendor,
    string ApiUrl,
    string ApiToken);
```

### 3.2 FortiGateCollector (placeholder no MVP)

- Implementa `IIncrementalCollector`
- `SupportsPolling("fortigate", "fortinet")` retorna true
- `FetchIncrementalAsync` lanca `NotImplementedException("FortiGATE collector not yet implemented")`

### 3.3 CollectorRegistry

- Recebe todos os `IIncrementalCollector` via DI (`IEnumerable<IIncrementalCollector>`)
- Metodo `GetCollector(product, vendor)` retorna o collector correto ou lanca excecao

### 3.4 PollingJobService (gerencia Hangfire)

- `EnsureJob(sourceId, payload)` — cria/atualiza via `RecurringJob.AddOrUpdate`
- `CancelJob(sourceId)` — cancela via `RecurringJob.RemoveIfExists`
- `CleanupJob(sourceId)` — cancela job + deleta cursor da tabela

### 3.5 PollingJobExecutor (executado pelo Hangfire)

Executado a cada ciclo pelo Hangfire:

1. Busca cursor do banco (`PollingCursors`)
2. Seleciona collector via `CollectorRegistry`
3. Executa `FetchIncrementalAsync(config, lastCursor)`
4. Despacha eventos via MediatR (`ProcessPolledEventsCommand`)
5. Atualiza cursor no banco
6. Notifica Customers sobre status (Connected/Disconnected)

### 3.6 Tabela PollingCursors (schema alert)

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| Id | Guid | PK |
| SourceId | Guid | FK logico, unique index |
| LastCursor | string? | Cursor incremental |
| LastRunAt | DateTimeOffset? | Ultimo ciclo |
| EventsCollected | int | Total do ultimo ciclo |
| ErrorMessage | string? | Ultimo erro, null se sucesso |

### 3.7 Endpoint de notificacao

- `POST /api/alerts/sources/notify`
- Sem autenticacao de usuario — service-to-service
- Handler: `SourceNotifyCommand` via MediatR
- Decide acao baseado no campo `event` e nas condicoes da tabela da secao 2.1

---

## 4. Componentes no SecurityOne.Customers

### 4.1 Domain Events (novos)

```csharp
public class SourceCreatedEvent : BaseEvent { public Source Source { get; } }
public class SourceUpdatedEvent : BaseEvent { public Source Source { get; } }
public class SourceDeletedEvent : BaseEvent { public Source Source { get; } }
public class SourceToggledEvent : BaseEvent { public Source Source { get; } }
public class SourceStatusChangedEvent : BaseEvent
{
    public Guid SourceId { get; }
    public SourceStatus NewStatus { get; }
}
```

### 4.2 Emissao nos handlers existentes

- `CreateSourceCommandHandler` → `AddDomainEvent(new SourceCreatedEvent(source))`
- `UpdateSourceCommandHandler` → `AddDomainEvent(new SourceUpdatedEvent(source))`
- `DeleteSourceCommandHandler` → `AddDomainEvent(new SourceDeletedEvent(source))`
- `ToggleSourceCommandHandler` → `AddDomainEvent(new SourceToggledEvent(source))`

### 4.3 Event Handlers (novos)

- `SourceCreatedEventHandler` → chama `POST /api/alerts/sources/notify` com event `"created"`
- `SourceUpdatedEventHandler` → chama com event `"updated"`
- `SourceDeletedEventHandler` → chama com event `"deleted"`
- `SourceToggledEventHandler` → chama com event `"toggled"`

Todos seguem o padrao do `LlmCreatedEventHandler` existente.

### 4.4 IAlertsServiceClient (novo)

- Interface em `Application/Common/Interfaces/`
- Implementacao em `Infrastructure/Services/`
- Metodo: `NotifySourceChangedAsync(sourceId, event, payload)`
- Usa `HttpClient` configurado via DI (base URL do Alerts via configuracao)

### 4.5 Endpoint para receber status de volta

- `POST /api/customers/sources/notify`
- Handler: recebe `status_changed`, atualiza `Source.Status` no banco

---

## 5. Resiliencia e Logging

### 5.1 Resiliencia do job de polling

- **Falha no FetchIncrementalAsync** (API externa down): loga erro, persiste `ErrorMessage` no cursor, notifica Customers com status `Disconnected`. Hangfire reexecuta no proximo ciclo normalmente.
- **Falha na notificacao HTTP** (Alerts -> Customers status): loga warning, nao impede o ciclo. Status sera atualizado no proximo ciclo.
- **Collector nao encontrado** no registry: loga erro, cancela o ciclo (nao faz sentido retentar).

### 5.2 Resiliencia da notificacao Customers -> Alerts

- Domain Event handler falha na chamada HTTP: loga erro via `ILogger`, nao propaga excecao (nao impacta a operacao principal do usuario). Source e salva normalmente.
- Sem retry automatico no MVP. Se o Alerts estiver fora, o job fica dessincronizado ate a proxima operacao na Source.

### 5.3 Logging por ciclo do job

| Nivel | Mensagem |
|-------|----------|
| Info | `Polling cycle started for {jobName}, sourceId={sourceId}` |
| Info | `Polling cycle completed: {eventCount} events collected, cursor={newCursor}` |
| Warning | `No collector found for product={product}, vendor={vendor}` |
| Error | `Polling failed for sourceId={sourceId}: {errorMessage}` |
| Warning | `Failed to notify Customers about status change for sourceId={sourceId}` |

### 5.4 Intervalo de polling

- Default: 10 minutos
- Range permitido: 5-15 minutos
- Configuravel por Source via campo `pollingIntervalMinutes` no payload de notificacao

---

## 6. Criterios de Aceite

- [ ] Job nomeado no padrao `polling_{product}_{vendor}_{tenantId}_{sourceId}`
- [ ] Job criado/cancelado automaticamente via domain events + notificacao HTTP
- [ ] `IIncrementalCollector` implementado com `FortiGateCollector` como placeholder
- [ ] Novo vendor pode ser adicionado implementando `IIncrementalCollector` sem alterar infraestrutura
- [ ] Coleta incremental com cursor persistido na tabela `PollingCursors`
- [ ] Command interna despachada via MediatR com `tenant_id`, `product` e `raw_payload`
- [ ] Status da Source atualizado no Customers apos cada ciclo (Connected/Disconnected)
- [ ] Falha na API externa nao derruba o job — loga e retenta no proximo ciclo
- [ ] Domain events emitidos nos handlers existentes de Source (Create, Update, Delete, Toggle)
