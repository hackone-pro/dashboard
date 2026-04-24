# Baseline via API de Alerts — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistir e buscar o baseline do Risk Level na API de Alerts (.NET), criando um histórico real que sobrevive a restarts do Strapi e alimenta o cron com referência autoritativa.

**Architecture:** A API de Alerts recebe uma nova entidade `RiskLevelBaseline` com endpoints `POST /api/risk-level-baselines` (salvar) e `GET /api/risk-level-baselines` (buscar). O cron do Strapi tenta buscar o baseline remoto antes de usar o local (fallback), e salva o baseline calculado na API após cada execução. Paralelamente, o bug de janela calendar-day no IRIS é corrigido para rolling 24h.

**Tech Stack:** .NET 9, EF Core + PostgreSQL, Clean Architecture/CQRS (MediatR), xUnit + Moq + Shouldly | TypeScript/Strapi 5, axios, date-fns

---

## Pré-condição: token de auth Strapi → API Alerts

Os novos endpoints exigem role `app-strapi`. Gere um JWT **uma vez** antes de executar os Tasks 6 e 7, usando o mesmo `Jwt:Key` configurado na API de Alerts:

```js
// generate-alerts-token.mjs  (rodar com: node generate-alerts-token.mjs)
import jwt from "jsonwebtoken";

const key = "COLE_AQUI_O_JWT_KEY_DA_API_ALERTS"; // appsettings.Development.json → Jwt:Key
const token = jwt.sign(
  { sub: "strapi-cron", role: "app-strapi" },
  key.padEnd(32, "\0").slice(0, 32),
  { algorithm: "HS256", expiresIn: "10y" }
);
console.log(token);
```

Cole o token gerado em `backend/.env` como `ALERTS_API_TOKEN`.

---

## Mapa de arquivos

### SecurityOne.Alerts (.NET) — `Hackone/src/SecurityOne.Alerts/`
| Ação | Arquivo |
|------|---------|
| Criar | `src/Domain/Entities/RiskLevelBaseline.cs` |
| Criar | `src/Infrastructure/Data/Configurations/RiskLevelBaselineConfiguration.cs` |
| Modificar | `src/Infrastructure/Data/ApplicationDbContext.cs` |
| Modificar | `src/Application/Common/Interfaces/IApplicationDbContext.cs` |
| Modificar | `src/Domain/Constants/Roles.cs` |
| Criar | `src/Application/RiskLevel/Commands/SaveBaselineCommand.cs` |
| Criar | `src/Application/RiskLevel/Queries/GetBaselineQuery.cs` |
| Criar | `src/Web/Endpoints/RiskLevelBaselines.cs` |
| Gerar | Migration via `dotnet ef migrations add` |
| Criar | `tests/Application.UnitTests/RiskLevel/SaveBaselineCommandHandlerTests.cs` |
| Criar | `tests/Application.UnitTests/RiskLevel/GetBaselineQueryHandlerTests.cs` |

### Strapi — `Security one/backend/`
| Ação | Arquivo |
|------|---------|
| Modificar | `src/api/acesso-iris/services/acesso-iris.ts` |
| Criar | `src/api/acesso-wazuh/services/risklevel-alerts-client.ts` |
| Modificar | `src/api/acesso-wazuh/services/risklevel.service.ts` |
| Modificar | `.env` e `.env.example` |

---

## Task 1: Entidade RiskLevelBaseline + EF config + migração (.NET)

**Arquivos:**
- Criar: `src/Domain/Entities/RiskLevelBaseline.cs`
- Criar: `src/Infrastructure/Data/Configurations/RiskLevelBaselineConfiguration.cs`
- Modificar: `src/Infrastructure/Data/ApplicationDbContext.cs`
- Modificar: `src/Application/Common/Interfaces/IApplicationDbContext.cs`

- [ ] **Step 1: Criar entidade**

`src/Domain/Entities/RiskLevelBaseline.cs`:
```csharp
namespace SecurityOne.Alerts.Domain.Entities;

public class RiskLevelBaseline
{
    public int Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public DateTime WindowFrom { get; set; }
    public DateTime WindowTo { get; set; }
    public int WindowHours { get; set; }
    public double TopHosts { get; set; }
    public double Cis { get; set; }
    public double Firewall { get; set; }
    public double Incidents { get; set; }
    public DateTime CalculatedAt { get; set; }
}
```

- [ ] **Step 2: Criar EF configuration**

`src/Infrastructure/Data/Configurations/RiskLevelBaselineConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SecurityOne.Alerts.Domain.Entities;

namespace SecurityOne.Alerts.Infrastructure.Data.Configurations;

public class RiskLevelBaselineConfiguration : IEntityTypeConfiguration<RiskLevelBaseline>
{
    public void Configure(EntityTypeBuilder<RiskLevelBaseline> builder)
    {
        builder.ToTable("RiskLevelBaselines", "alert");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TenantId)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.WindowFrom).IsRequired();
        builder.Property(e => e.WindowTo).IsRequired();
        builder.Property(e => e.WindowHours).IsRequired();
        builder.Property(e => e.CalculatedAt).IsRequired();

        // Índice composto para lookup eficiente por tenant + janela + data
        builder.HasIndex(e => new { e.TenantId, e.WindowHours, e.CalculatedAt })
            .HasDatabaseName("IX_RiskLevelBaselines_TenantId_WindowHours_CalculatedAt");
    }
}
```

- [ ] **Step 3: Registrar DbSet na interface e no contexto**

Em `src/Application/Common/Interfaces/IApplicationDbContext.cs`, adicionar:
```csharp
DbSet<RiskLevelBaseline> RiskLevelBaselines { get; }
```

Em `src/Infrastructure/Data/ApplicationDbContext.cs`, adicionar:
```csharp
public DbSet<RiskLevelBaseline> RiskLevelBaselines => Set<RiskLevelBaseline>();
```

- [ ] **Step 4: Gerar e verificar migração**

```bash
cd Hackone/src/SecurityOne.Alerts
dotnet ef migrations add AddRiskLevelBaseline \
  --project src/Infrastructure \
  --startup-project src/Web
```

Saída esperada: `Build succeeded. Done.` + arquivo de migração criado em `src/Infrastructure/Migrations/`.

Verificar que o arquivo de migração contém `CreateTable` para `RiskLevelBaselines` com schema `alert` e o índice composto.

- [ ] **Step 5: Commit**

```bash
git add src/Domain/Entities/RiskLevelBaseline.cs \
        src/Infrastructure/Data/Configurations/RiskLevelBaselineConfiguration.cs \
        src/Infrastructure/Data/ApplicationDbContext.cs \
        src/Application/Common/Interfaces/IApplicationDbContext.cs \
        src/Infrastructure/Migrations/
git commit -m "feat(risk-level): add RiskLevelBaseline entity and migration"
```

---

## Task 2: SaveBaselineCommand + handler + testes (.NET)

**Arquivos:**
- Criar: `src/Application/RiskLevel/Commands/SaveBaselineCommand.cs`
- Criar: `tests/Application.UnitTests/RiskLevel/SaveBaselineCommandHandlerTests.cs`

- [ ] **Step 1: Escrever teste que falha**

`tests/Application.UnitTests/RiskLevel/SaveBaselineCommandHandlerTests.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Moq;
using SecurityOne.Alerts.Application.Common.Interfaces;
using SecurityOne.Alerts.Application.RiskLevel.Commands;
using SecurityOne.Alerts.Domain.Entities;
using Shouldly;
using Xunit;

namespace SecurityOne.Alerts.Application.UnitTests.RiskLevel;

public class SaveBaselineCommandHandlerTests
{
    private readonly Mock<IApplicationDbContext> _dbContext;
    private readonly Mock<DbSet<RiskLevelBaseline>> _dbSet;
    private readonly SaveBaselineCommandHandler _handler;

    public SaveBaselineCommandHandlerTests()
    {
        _dbSet = new Mock<DbSet<RiskLevelBaseline>>();
        _dbContext = new Mock<IApplicationDbContext>();
        _dbContext.Setup(x => x.RiskLevelBaselines).Returns(_dbSet.Object);
        _dbContext.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        _handler = new SaveBaselineCommandHandler(_dbContext.Object);
    }

    [Fact(DisplayName = "Salva novo registro com WindowHours calculado corretamente")]
    public async Task Handle_ValidCommand_SavesBaselineWithCorrectWindowHours()
    {
        var windowFrom = new DateTime(2026, 4, 23, 10, 0, 0, DateTimeKind.Utc);
        var windowTo   = new DateTime(2026, 4, 24, 10, 0, 0, DateTimeKind.Utc); // exatamente 24h

        var command = new SaveBaselineCommand
        {
            TenantId  = "tenant-1",
            WindowFrom = windowFrom,
            WindowTo   = windowTo,
            TopHosts   = 120.5,
            Cis        = 35.0,
            Firewall   = 200.0,
            Incidents  = 15.0,
        };

        await _handler.Handle(command, CancellationToken.None);

        _dbSet.Verify(x => x.Add(It.Is<RiskLevelBaseline>(b =>
            b.TenantId   == "tenant-1" &&
            b.WindowHours == 24 &&
            b.TopHosts   == 120.5 &&
            b.Cis        == 35.0 &&
            b.Firewall   == 200.0 &&
            b.Incidents  == 15.0
        )), Times.Once);

        _dbContext.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact(DisplayName = "Cada chamada cria uma nova linha — histórico acumula")]
    public async Task Handle_CalledTwice_AddsTwoRows()
    {
        var command = new SaveBaselineCommand
        {
            TenantId   = "t1",
            WindowFrom = DateTime.UtcNow.AddHours(-24),
            WindowTo   = DateTime.UtcNow,
        };

        await _handler.Handle(command, CancellationToken.None);
        await _handler.Handle(command, CancellationToken.None);

        _dbSet.Verify(x => x.Add(It.IsAny<RiskLevelBaseline>()), Times.Exactly(2));
    }
}
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
cd Hackone/src/SecurityOne.Alerts
dotnet test tests/Application.UnitTests --filter "FullyQualifiedName~SaveBaseline"
```

Saída esperada: `FAILED` com erro de tipo não encontrado.

- [ ] **Step 3: Implementar command + handler**

`src/Application/RiskLevel/Commands/SaveBaselineCommand.cs`:
```csharp
using SecurityOne.Alerts.Application.Common.Interfaces;
using SecurityOne.Alerts.Domain.Entities;

namespace SecurityOne.Alerts.Application.RiskLevel.Commands;

public record SaveBaselineCommand : IRequest<int>
{
    public string TenantId  { get; init; } = string.Empty;
    public DateTime WindowFrom { get; init; }
    public DateTime WindowTo   { get; init; }
    public double TopHosts   { get; init; }
    public double Cis        { get; init; }
    public double Firewall   { get; init; }
    public double Incidents  { get; init; }
}

public class SaveBaselineCommandHandler(IApplicationDbContext dbContext)
    : IRequestHandler<SaveBaselineCommand, int>
{
    public async Task<int> Handle(SaveBaselineCommand request, CancellationToken cancellationToken)
    {
        var windowHours = (int)Math.Round((request.WindowTo - request.WindowFrom).TotalHours);

        var baseline = new RiskLevelBaseline
        {
            TenantId      = request.TenantId,
            WindowFrom    = request.WindowFrom,
            WindowTo      = request.WindowTo,
            WindowHours   = windowHours,
            TopHosts      = request.TopHosts,
            Cis           = request.Cis,
            Firewall      = request.Firewall,
            Incidents     = request.Incidents,
            CalculatedAt  = DateTime.UtcNow,
        };

        dbContext.RiskLevelBaselines.Add(baseline);
        await dbContext.SaveChangesAsync(cancellationToken);

        return baseline.Id;
    }
}
```

- [ ] **Step 4: Rodar testes para confirmar verde**

```bash
dotnet test tests/Application.UnitTests --filter "FullyQualifiedName~SaveBaseline"
```

Saída esperada: `Passed: 2`.

- [ ] **Step 5: Commit**

```bash
git add src/Application/RiskLevel/Commands/SaveBaselineCommand.cs \
        tests/Application.UnitTests/RiskLevel/SaveBaselineCommandHandlerTests.cs
git commit -m "feat(risk-level): add SaveBaselineCommand with handler and tests"
```

---

## Task 3: GetBaselineQuery + handler + testes (.NET)

**Arquivos:**
- Criar: `src/Application/RiskLevel/Queries/GetBaselineQuery.cs`
- Criar: `tests/Application.UnitTests/RiskLevel/GetBaselineQueryHandlerTests.cs`

- [ ] **Step 1: Escrever testes que falham**

`tests/Application.UnitTests/RiskLevel/GetBaselineQueryHandlerTests.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Moq;
using SecurityOne.Alerts.Application.Common.Interfaces;
using SecurityOne.Alerts.Application.RiskLevel.Queries;
using SecurityOne.Alerts.Domain.Entities;
using Shouldly;
using Xunit;

namespace SecurityOne.Alerts.Application.UnitTests.RiskLevel;

public class GetBaselineQueryHandlerTests
{
    private static RiskLevelBaseline MakeBaseline(
        string tenantId, int windowHours, DateTime calculatedAt,
        double topHosts = 100, double cis = 20, double firewall = 150, double incidents = 10) =>
        new()
        {
            TenantId     = tenantId,
            WindowFrom   = calculatedAt.AddHours(-windowHours),
            WindowTo     = calculatedAt,
            WindowHours  = windowHours,
            TopHosts     = topHosts,
            Cis          = cis,
            Firewall     = firewall,
            Incidents    = incidents,
            CalculatedAt = calculatedAt,
        };

    private static GetBaselineQueryHandler BuildHandler(IEnumerable<RiskLevelBaseline> data)
    {
        var list = data.AsQueryable();
        var mockSet = new Mock<DbSet<RiskLevelBaseline>>();
        mockSet.As<IAsyncEnumerable<RiskLevelBaseline>>()
            .Setup(x => x.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<RiskLevelBaseline>(list.GetEnumerator()));
        mockSet.As<IQueryable<RiskLevelBaseline>>().Setup(x => x.Provider)
            .Returns(new TestAsyncQueryProvider<RiskLevelBaseline>(list.Provider));
        mockSet.As<IQueryable<RiskLevelBaseline>>().Setup(x => x.Expression).Returns(list.Expression);
        mockSet.As<IQueryable<RiskLevelBaseline>>().Setup(x => x.ElementType).Returns(list.ElementType);
        mockSet.As<IQueryable<RiskLevelBaseline>>().Setup(x => x.GetEnumerator()).Returns(list.GetEnumerator());

        var dbContext = new Mock<IApplicationDbContext>();
        dbContext.Setup(x => x.RiskLevelBaselines).Returns(mockSet.Object);
        return new GetBaselineQueryHandler(dbContext.Object);
    }

    [Fact(DisplayName = "Retorna baseline com match exato de WindowHours")]
    public async Task Handle_ExactMatch_ReturnsIt()
    {
        var baseline = MakeBaseline("t1", 24, new DateTime(2026, 4, 23, 10, 0, 0, DateTimeKind.Utc));
        var handler = BuildHandler([baseline]);

        var result = await handler.Handle(new GetBaselineQuery { TenantId = "t1", WindowHours = 24 }, default);

        result.ShouldNotBeNull();
        result!.WindowHours.ShouldBe(24);
        result.TopHosts.ShouldBe(100);
    }

    [Fact(DisplayName = "Sem match exato: retorna o menor WindowHours >= solicitado")]
    public async Task Handle_NoExactMatch_ReturnsClosestAbove()
    {
        var b7  = MakeBaseline("t1", 168, new DateTime(2026, 4, 23, 9, 0, 0, DateTimeKind.Utc));  // 7d
        var b30 = MakeBaseline("t1", 720, new DateTime(2026, 4, 23, 9, 0, 0, DateTimeKind.Utc));  // 30d
        var handler = BuildHandler([b7, b30]);

        var result = await handler.Handle(new GetBaselineQuery { TenantId = "t1", WindowHours = 24 }, default);

        result.ShouldNotBeNull();
        result!.WindowHours.ShouldBe(168); // menor >= 24
    }

    [Fact(DisplayName = "Sem nenhum baseline: retorna null")]
    public async Task Handle_NoneFound_ReturnsNull()
    {
        var handler = BuildHandler([]);

        var result = await handler.Handle(new GetBaselineQuery { TenantId = "t1", WindowHours = 24 }, default);

        result.ShouldBeNull();
    }

    [Fact(DisplayName = "Com múltiplos registros de mesmo WindowHours: retorna o mais recente")]
    public async Task Handle_MultipleExactMatches_ReturnsMostRecent()
    {
        var older = MakeBaseline("t1", 24, new DateTime(2026, 4, 22, 10, 0, 0, DateTimeKind.Utc), topHosts: 50);
        var newer = MakeBaseline("t1", 24, new DateTime(2026, 4, 23, 10, 0, 0, DateTimeKind.Utc), topHosts: 120);
        var handler = BuildHandler([older, newer]);

        var result = await handler.Handle(new GetBaselineQuery { TenantId = "t1", WindowHours = 24 }, default);

        result!.TopHosts.ShouldBe(120);
    }

    [Fact(DisplayName = "Não retorna baselines de outro tenant")]
    public async Task Handle_DifferentTenant_ReturnsNull()
    {
        var b = MakeBaseline("outro-tenant", 24, DateTime.UtcNow);
        var handler = BuildHandler([b]);

        var result = await handler.Handle(new GetBaselineQuery { TenantId = "meu-tenant", WindowHours = 24 }, default);

        result.ShouldBeNull();
    }
}
```

> **Nota:** Os helpers `TestAsyncEnumerator` e `TestAsyncQueryProvider` já existem no projeto se outro teste de handler usa EF queries assíncronas. Se não existirem, crie `tests/Application.UnitTests/Infrastructure/TestAsync.cs` com as implementações padrão de mock para EF Core async (padrão encontrado em qualquer projeto Clean Architecture com xUnit + EF).

- [ ] **Step 2: Rodar para confirmar falha**

```bash
dotnet test tests/Application.UnitTests --filter "FullyQualifiedName~GetBaseline"
```

Saída esperada: `FAILED` com erro de tipo não encontrado.

- [ ] **Step 3: Implementar query + handler**

`src/Application/RiskLevel/Queries/GetBaselineQuery.cs`:
```csharp
using SecurityOne.Alerts.Application.Common.Interfaces;
using SecurityOne.Alerts.Domain.Entities;

namespace SecurityOne.Alerts.Application.RiskLevel.Queries;

public record GetBaselineQuery : IRequest<BaselineDto?>
{
    public string TenantId  { get; init; } = string.Empty;
    public int WindowHours  { get; init; } = 24;
}

public record BaselineDto(
    double TopHosts,
    double Cis,
    double Firewall,
    double Incidents,
    int WindowHours,
    DateTime CalculatedAt
);

public class GetBaselineQueryHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetBaselineQuery, BaselineDto?>
{
    public async Task<BaselineDto?> Handle(GetBaselineQuery request, CancellationToken cancellationToken)
    {
        // 1. Match exato de janela
        var exact = await dbContext.RiskLevelBaselines
            .Where(b => b.TenantId == request.TenantId && b.WindowHours == request.WindowHours)
            .OrderByDescending(b => b.CalculatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (exact is not null)
            return ToDto(exact);

        // 2. Janela mais próxima >= solicitada
        var closest = await dbContext.RiskLevelBaselines
            .Where(b => b.TenantId == request.TenantId && b.WindowHours >= request.WindowHours)
            .OrderBy(b => b.WindowHours)
            .ThenByDescending(b => b.CalculatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return closest is null ? null : ToDto(closest);
    }

    private static BaselineDto ToDto(RiskLevelBaseline b) =>
        new(b.TopHosts, b.Cis, b.Firewall, b.Incidents, b.WindowHours, b.CalculatedAt);
}
```

- [ ] **Step 4: Rodar testes para confirmar verde**

```bash
dotnet test tests/Application.UnitTests --filter "FullyQualifiedName~GetBaseline"
```

Saída esperada: `Passed: 5`.

- [ ] **Step 5: Commit**

```bash
git add src/Application/RiskLevel/Queries/GetBaselineQuery.cs \
        tests/Application.UnitTests/RiskLevel/GetBaselineQueryHandlerTests.cs
git commit -m "feat(risk-level): add GetBaselineQuery with handler and tests"
```

---

## Task 4: Endpoint RiskLevelBaselines + role AppStrapi (.NET)

**Arquivos:**
- Modificar: `src/Domain/Constants/Roles.cs`
- Criar: `src/Web/Endpoints/RiskLevelBaselines.cs`

- [ ] **Step 1: Adicionar role AppStrapi**

Em `src/Domain/Constants/Roles.cs`:
```csharp
public abstract class Roles
{
    public const string Administrator = nameof(Administrator);
    public const string AppAlert  = "app-alert";
    public const string AppStrapi = "app-strapi";  // ← adicionar
}
```

- [ ] **Step 2: Criar endpoint group**

`src/Web/Endpoints/RiskLevelBaselines.cs`:
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using SecurityOne.Alerts.Application.RiskLevel.Commands;
using SecurityOne.Alerts.Application.RiskLevel.Queries;
using SecurityOne.Alerts.Domain.Constants;

namespace SecurityOne.Alerts.Web.Endpoints;

public class RiskLevelBaselines : IEndpointGroup
{
    public static string? RoutePrefix => "/api/risk-level-baselines";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.RequireAuthorization();

        groupBuilder.MapPost("/", Save)
            .WithMetadata(new SkipTenantValidationAttribute());

        groupBuilder.MapGet("/", Get)
            .WithMetadata(new SkipTenantValidationAttribute());
    }

    [EndpointSummary("Save Baseline")]
    [EndpointDescription("Persiste o baseline calculado pelo cron do Strapi para o tenant informado.")]
    [Authorize(Roles = Roles.AppStrapi)]
    public static async Task<Results<Created<int>, BadRequest<string>>> Save(
        ISender sender,
        SaveBaselineCommand command)
    {
        var id = await sender.Send(command);
        return TypedResults.Created($"/api/risk-level-baselines/{id}", id);
    }

    [EndpointSummary("Get Baseline")]
    [EndpointDescription("Retorna o baseline mais recente para o tenant e janela informados. 204 se não encontrado.")]
    [Authorize(Roles = Roles.AppStrapi)]
    public static async Task<Results<Ok<BaselineDto>, NoContent>> Get(
        ISender sender,
        [FromQuery] string tenantId,
        [FromQuery] int windowHours = 24)
    {
        var result = await sender.Send(new GetBaselineQuery { TenantId = tenantId, WindowHours = windowHours });
        return result is null ? TypedResults.NoContent() : TypedResults.Ok(result);
    }
}
```

- [ ] **Step 3: Subir API e verificar endpoints no Scalar**

```bash
cd Hackone/src/SecurityOne.Alerts/src/Web
dotnet run
```

Abrir `http://localhost:{porta}/scalar`. Confirmar que aparecem:
- `POST /api/risk-level-baselines`
- `GET /api/risk-level-baselines`

- [ ] **Step 4: Gerar token app-strapi (pré-condição para Strapi)**

Salvar o script `generate-alerts-token.mjs` na raiz do repo `Security one` (não commitar), rodar com Node e guardar o token gerado:

```bash
cd "Security one"
node generate-alerts-token.mjs
# Output: eyJhbGciOiJIUzI1NiIs...
```

Adicionar em `backend/.env`:
```
ALERTS_API_URL=http://localhost:{porta_da_api_alerts}
ALERTS_API_TOKEN=eyJhbGciOiJIUzI1NiIs...
```

- [ ] **Step 5: Commit**

```bash
git add src/Domain/Constants/Roles.cs \
        src/Web/Endpoints/RiskLevelBaselines.cs
git commit -m "feat(risk-level): expose POST/GET risk-level-baselines endpoints with app-strapi role"
```

---

## Task 5: Corrigir janela IRIS para rolling 24h (Strapi)

**Arquivo:** `backend/src/api/acesso-iris/services/acesso-iris.ts`

**Problema atual:** Para `dias = "1"`, a função usa `startOfDay(subDays(now, 1))` como início — ou seja, meia-noite de ontem — e `endOfDay(now)` como fim. Isso gera uma janela de até ~48h (não 24h rolling). As queries Wazuh usam `now-1d` (rolling), o IRIS deve ser consistente.

- [ ] **Step 1: Aplicar a correção**

Em `backend/src/api/acesso-iris/services/acesso-iris.ts`, localizar o bloco `else` (caminho `dias`):

```ts
// ANTES
inicio = diasNum === 0
  ? new Date(0)
  : startOfDay(subDays(new Date(), diasNum));

fim = endOfDay(new Date());
```

Substituir por:

```ts
// DEPOIS — rolling window: mesmo comportamento que now-Nd do Elasticsearch
inicio = diasNum === 0
  ? new Date(0)
  : subDays(new Date(), diasNum);

fim = new Date();
```

Remover `startOfDay` e `endOfDay` do import `date-fns` se não forem usados em mais nenhum lugar do arquivo.

- [ ] **Step 2: Verificar imports**

Checar se `startOfDay` e `endOfDay` ainda são usados no arquivo. Se não, remover do import:

```ts
// ANTES
import { parse, isAfter, isBefore, startOfDay, endOfDay, subDays } from "date-fns";

// DEPOIS (se não usados mais)
import { parse, isAfter, isBefore, subDays } from "date-fns";
```

- [ ] **Step 3: Confirmar comportamento**

Adicionar um `console.log` temporário para verificar:
```ts
strapi.log.debug(`[IRIS] janela: ${inicio.toISOString()} → ${fim.toISOString()}`);
```

Subir o Strapi em dev, triggerar uma chamada ao Risk Level com `dias = "1"` e confirmar no log que `inicio` é exatamente 24h antes de `fim`. Remover o log depois.

- [ ] **Step 4: Commit**

```bash
git add backend/src/api/acesso-iris/services/acesso-iris.ts
git commit -m "fix(iris): usar rolling window de 24h em vez de dia calendário"
```

---

## Task 6: Client HTTP Strapi → API Alerts (Strapi)

**Arquivo:** `backend/src/api/acesso-wazuh/services/risklevel-alerts-client.ts`

- [ ] **Step 1: Criar o arquivo do cliente**

`backend/src/api/acesso-wazuh/services/risklevel-alerts-client.ts`:
```typescript
import axios from "axios";

// Configurados via .env
const ALERTS_API_URL   = process.env.ALERTS_API_URL;
const ALERTS_API_TOKEN = process.env.ALERTS_API_TOKEN;

export interface RemoteBaseline {
  topHosts:    number;
  cis:         number;
  firewall:    number;
  incidents:   number;
  windowHours: number;
  calculatedAt: string;
}

/**
 * Busca o baseline mais recente para o tenant na API de Alerts.
 * Retorna null se não configurado, não encontrado (204) ou erro de rede.
 */
export async function getBaselineFromAlerts(
  tenantId: string | number,
  windowHours = 24
): Promise<RemoteBaseline | null> {
  if (!ALERTS_API_URL || !ALERTS_API_TOKEN) return null;

  try {
    const response = await axios.get(`${ALERTS_API_URL}/api/risk-level-baselines`, {
      params:  { tenantId: String(tenantId), windowHours },
      headers: { Authorization: `Bearer ${ALERTS_API_TOKEN}` },
      timeout: 3000,
      validateStatus: (s) => s === 200 || s === 204,
    });

    return response.status === 204 ? null : (response.data as RemoteBaseline);
  } catch (err: any) {
    strapi.log.warn(
      `[RiskLevel] Baseline remoto indisponível para tenant ${tenantId}: ${err?.message}`
    );
    return null;
  }
}

/**
 * Persiste o baseline calculado na API de Alerts (cria nova linha — histórico).
 * Silencia erros: falha aqui não deve interromper o cron.
 */
export async function saveBaselineToAlerts(
  tenantId: string | number,
  windowFrom: Date,
  windowTo: Date,
  values: {
    topHosts:  number;
    cis:       number;
    firewall:  number;
    incidents: number;
  }
): Promise<void> {
  if (!ALERTS_API_URL || !ALERTS_API_TOKEN) return;

  try {
    await axios.post(
      `${ALERTS_API_URL}/api/risk-level-baselines`,
      {
        tenantId:  String(tenantId),
        windowFrom: windowFrom.toISOString(),
        windowTo:   windowTo.toISOString(),
        ...values,
      },
      {
        headers: { Authorization: `Bearer ${ALERTS_API_TOKEN}` },
        timeout: 3000,
      }
    );
  } catch (err: any) {
    strapi.log.warn(
      `[RiskLevel] Falha ao salvar baseline remoto para tenant ${tenantId}: ${err?.message}`
    );
  }
}
```

- [ ] **Step 2: Adicionar env vars ao `.env.example`**

Em `backend/.env.example`, adicionar:
```
# API de Alerts — baseline do Risk Level
ALERTS_API_URL=
ALERTS_API_TOKEN=
```

- [ ] **Step 3: Confirmar que .env já tem os valores (gerados no Task 4 Step 4)**

```bash
grep ALERTS_API backend/.env
# Deve mostrar URL e token preenchidos
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/api/acesso-wazuh/services/risklevel-alerts-client.ts \
        backend/.env.example
git commit -m "feat(risk-level): add HTTP client for Alerts API baseline endpoints"
```

---

## Task 7: Integrar lookup + persist no cron (Strapi)

**Arquivo:** `backend/src/api/acesso-wazuh/services/risklevel.service.ts`

Duas mudanças no fluxo de `calcularRiskOperacionalTenant`:
1. **Antes** de calcular: tenta buscar `slotAnterior` da API de Alerts (fallback para o local se não encontrar)
2. **Depois** de salvar localmente: persiste o novo baseline na API de Alerts

- [ ] **Step 1: Adicionar imports do cliente**

No topo de `risklevel.service.ts`, adicionar:
```typescript
import {
  getBaselineFromAlerts,
  saveBaselineToAlerts,
} from "./risklevel-alerts-client";
```

- [ ] **Step 2: Substituir a leitura do slotAnterior**

Localizar este bloco (em torno da linha 322):
```typescript
const todosBaselines = await lerBaseline(tenant.id);
const slotAnterior   = todosBaselines[janelaBaseline];
```

Substituir por:
```typescript
const todosBaselines = await lerBaseline(tenant.id);
let slotAnterior = todosBaselines[janelaBaseline];

// Tenta sobrescrever com baseline remoto (mais autoritativo que o store local).
// Só para janelas canônicas — ranges customizados continuam usando o local.
if (janelaCanonica) {
  const windowHours = parseInt(janelaCanonica) * 24;
  const remoto = await getBaselineFromAlerts(tenant.id, windowHours);

  if (remoto) {
    slotAnterior = {
      top_hosts:   remoto.topHosts,
      cis:         remoto.cis,
      firewall:    remoto.firewall,
      incidents:   remoto.incidents,
      initialized: true,
    };
    strapi.log.debug(
      `[RiskLevel] tenant=${tenant.id} — usando baseline remoto ` +
      `(janela=${remoto.windowHours}h, calculado em ${remoto.calculatedAt})`
    );
  }
}
```

- [ ] **Step 3: Persistir na API de Alerts após salvar localmente**

Localizar o bloco `if (janelaCanonica)` que chama `salvarBaselineJanela` (em torno da linha 368):
```typescript
if (janelaCanonica) {
  await salvarBaselineJanela(
    tenant.id,
    janelaCanonica,
    { top_hosts: novoTopHosts, cis: novoCIS, firewall: novoFirewall, incidents: novoIncidents, initialized: true },
    todosBaselines
  );
} else { ... }
```

Adicionar a chamada remota **dentro** do mesmo bloco `if (janelaCanonica)`, após o `salvarBaselineJanela`:
```typescript
if (janelaCanonica) {
  await salvarBaselineJanela(
    tenant.id,
    janelaCanonica,
    { top_hosts: novoTopHosts, cis: novoCIS, firewall: novoFirewall, incidents: novoIncidents, initialized: true },
    todosBaselines
  );

  // Persiste na API de Alerts para histórico distribuído
  const windowHours  = parseInt(janelaCanonica) * 24;
  const windowTo     = new Date();
  const windowFrom   = new Date(windowTo.getTime() - windowHours * 60 * 60 * 1000);

  await saveBaselineToAlerts(tenant.id, windowFrom, windowTo, {
    topHosts:  novoTopHosts,
    cis:       novoCIS,
    firewall:  novoFirewall,
    incidents: novoIncidents,
  });
} else { ... }
```

- [ ] **Step 4: Verificar manualmente o fluxo end-to-end**

Com a API de Alerts rodando e o Strapi em dev:

1. Subir o Strapi: `npm run dev` em `backend/`
2. Aguardar o cron disparar (máx 5 min) ou chamar o endpoint de Risk Level via UI
3. Verificar logs do Strapi — deve aparecer uma das mensagens:
   - Primeira execução: sem log de "baseline remoto" (fallback para local)
   - Execuções seguintes: `[RiskLevel] tenant=X — usando baseline remoto`
4. Chamar diretamente a API de Alerts para confirmar que o registro foi criado:
   ```bash
   curl -H "Authorization: Bearer {ALERTS_API_TOKEN}" \
     "{ALERTS_API_URL}/api/risk-level-baselines?tenantId={ID_DO_TENANT}&windowHours=24"
   # Deve retornar 200 com os valores do baseline
   ```

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/acesso-wazuh/services/risklevel.service.ts
git commit -m "feat(risk-level): integrar lookup e persist do baseline na API de Alerts"
```

---

## Checklist de cobertura da spec

| Requisito | Task |
|-----------|------|
| Confirmar/corrigir janela rolling 24h IRIS | Task 5 |
| Buscar baseline na API de Alerts (janela >= 24h, match exato primeiro) | Tasks 3, 7 |
| Fallback para cálculo local se API não retornar | Task 7 Step 2 |
| Persistir baseline calculado na API de Alerts | Tasks 2, 7 |
| Indexar por TenantId + data do baseline | Task 1 Step 2 |
| Cada execução gera nova linha (histórico) | Tasks 2, 3 |
| Guardar janela utilizada (de/até) | Tasks 1, 2 |
| POST para salvar baseline | Tasks 2, 4 |
| GET para buscar por tenant + janela | Tasks 3, 4 |

> **Observação (fora de escopo):** Os testes existentes em `backend/tests/risklevel.test.ts` para `calcularRiscoTotal` (cenários 1, 2 e o teste de não-penalização) foram escritos esperando redistribuição de pesos, mas o código atual usa pesos fixos — esses testes provavelmente falham hoje. Isso é uma inconsistência pré-existente, não introduzida por este plano, e deve ser tratada nas tasks R03/R04 do roadmap.
