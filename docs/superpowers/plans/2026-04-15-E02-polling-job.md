# E02 — Background Job de Polling FortiGATE — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Hangfire-based incremental polling jobs in SecurityOne.Alerts, triggered by domain events from SecurityOne.Customers when Sources are created/updated/deleted/toggled, with bidirectional status notification.

**Architecture:** Domain events in Customers emit notifications via HTTP to Alerts. Alerts manages Hangfire RecurringJobs per Source. After each polling cycle, Alerts notifies Customers about Source status (Connected/Disconnected). The collector interface (`IIncrementalCollector`) is extensible — FortiGATE is a placeholder in this MVP.

**Tech Stack:** .NET 10, Hangfire, PostgreSQL, MediatR, EF Core, HttpClient (typed), FluentValidation

**Spec:** `docs/superpowers/specs/2026-04-15-E02-polling-job-design.md`

---

## File Structure

### SecurityOne.Customers (emits events, receives status)

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/Domain/Events/SourceCreatedEvent.cs` | Domain event for Source creation |
| Create | `src/Domain/Events/SourceUpdatedEvent.cs` | Domain event for Source update |
| Create | `src/Domain/Events/SourceDeletedEvent.cs` | Domain event for Source deletion |
| Create | `src/Domain/Events/SourceToggledEvent.cs` | Domain event for Source toggle |
| Create | `src/Application/Common/Interfaces/IAlertsClient.cs` | Interface for HTTP calls to Alerts |
| Create | `src/Application/Common/Options/AlertsClientOptions.cs` | Options for Alerts HTTP client |
| Create | `src/Application/Sources/EventHandlers/SourceCreatedEventHandler.cs` | Notifies Alerts on Source created |
| Create | `src/Application/Sources/EventHandlers/SourceUpdatedEventHandler.cs` | Notifies Alerts on Source updated |
| Create | `src/Application/Sources/EventHandlers/SourceDeletedEventHandler.cs` | Notifies Alerts on Source deleted |
| Create | `src/Application/Sources/EventHandlers/SourceToggledEventHandler.cs` | Notifies Alerts on Source toggled |
| Create | `src/Application/Sources/Commands/UpdateSourceStatus/UpdateSourceStatusCommand.cs` | Command to update Source status from Alerts callback |
| Create | `src/Infrastructure/Services/AlertsClient.cs` | HTTP client implementation for Alerts |
| Modify | `src/Infrastructure/DependencyInjection.cs` | Register IAlertsClient + HttpClient |
| Modify | `src/Application/Sources/Commands/CreateSource/CreateSourceCommand.cs` | Add domain event emission |
| Modify | `src/Application/Sources/Commands/UpdateSource/UpdateSourceCommand.cs` | Add domain event emission |
| Modify | `src/Application/Sources/Commands/DeleteSource/DeleteSourceCommand.cs` | Add domain event emission |
| Modify | `src/Application/Sources/Commands/ToggleSource/ToggleSourceCommand.cs` | Add domain event emission |
| Modify | `src/Web/Endpoints/Sources.cs` | Add POST notify endpoint |

### SecurityOne.Alerts (receives notifications, runs jobs, notifies status back)

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/Domain/Entities/PollingCursor.cs` | Entity for cursor persistence |
| Create | `src/Infrastructure/Data/Configurations/PollingCursorConfiguration.cs` | EF Core config for PollingCursor |
| Create | `src/Application/Common/Interfaces/ICustomersClient.cs` | Interface for HTTP calls back to Customers |
| Create | `src/Application/Common/Options/CustomersClientOptions.cs` | Options for Customers HTTP client |
| Create | `src/Application/Polling/Contracts/IIncrementalCollector.cs` | Collector interface + records |
| Create | `src/Application/Polling/Contracts/ICollectorRegistry.cs` | Registry interface |
| Create | `src/Application/Polling/Contracts/IPollingJobService.cs` | Job management interface |
| Create | `src/Application/Polling/Commands/SourceNotifyCommand.cs` | Command for receiving Source notifications |
| Create | `src/Infrastructure/Polling/FortiGateCollector.cs` | Placeholder collector |
| Create | `src/Infrastructure/Polling/CollectorRegistry.cs` | Registry implementation |
| Create | `src/Infrastructure/Polling/PollingJobService.cs` | Hangfire job management |
| Create | `src/Infrastructure/Polling/PollingJobExecutor.cs` | Job cycle execution |
| Create | `src/Infrastructure/Services/CustomersClient.cs` | HTTP client to Customers |
| Create | `src/Web/Endpoints/SourceNotify.cs` | POST /api/alerts/sources/notify endpoint |
| Modify | `src/Application/Common/Interfaces/IApplicationDbContext.cs` | Add PollingCursors DbSet |
| Modify | `src/Infrastructure/Data/ApplicationDbContext.cs` | Add PollingCursors DbSet |
| Modify | `src/Infrastructure/DependencyInjection.cs` | Register all polling services |

All paths are relative to `src/SecurityOne.Customers/src/` or `src/SecurityOne.Alerts/src/` respectively within the Hackone repo root.

---

## Task 1: Domain Events in Customers

**Files:**
- Create: `src/SecurityOne.Customers/src/Domain/Events/SourceCreatedEvent.cs`
- Create: `src/SecurityOne.Customers/src/Domain/Events/SourceUpdatedEvent.cs`
- Create: `src/SecurityOne.Customers/src/Domain/Events/SourceDeletedEvent.cs`
- Create: `src/SecurityOne.Customers/src/Domain/Events/SourceToggledEvent.cs`

- [ ] **Step 1: Create SourceCreatedEvent**

```csharp
// src/SecurityOne.Customers/src/Domain/Events/SourceCreatedEvent.cs
namespace SecurityOne.Customers.Domain.Events;

public class SourceCreatedEvent : BaseEvent
{
    public SourceCreatedEvent(Source source)
    {
        Source = source;
    }

    public Source Source { get; }
}
```

- [ ] **Step 2: Create SourceUpdatedEvent**

```csharp
// src/SecurityOne.Customers/src/Domain/Events/SourceUpdatedEvent.cs
namespace SecurityOne.Customers.Domain.Events;

public class SourceUpdatedEvent : BaseEvent
{
    public SourceUpdatedEvent(Source source)
    {
        Source = source;
    }

    public Source Source { get; }
}
```

- [ ] **Step 3: Create SourceDeletedEvent**

```csharp
// src/SecurityOne.Customers/src/Domain/Events/SourceDeletedEvent.cs
namespace SecurityOne.Customers.Domain.Events;

public class SourceDeletedEvent : BaseEvent
{
    public SourceDeletedEvent(Source source)
    {
        Source = source;
    }

    public Source Source { get; }
}
```

- [ ] **Step 4: Create SourceToggledEvent**

```csharp
// src/SecurityOne.Customers/src/Domain/Events/SourceToggledEvent.cs
namespace SecurityOne.Customers.Domain.Events;

public class SourceToggledEvent : BaseEvent
{
    public SourceToggledEvent(Source source)
    {
        Source = source;
    }

    public Source Source { get; }
}
```

- [ ] **Step 5: Verify build**

Run: `dotnet build src/SecurityOne.Customers/src/Domain/`
Expected: Build succeeded

- [ ] **Step 6: Commit**

```bash
git add src/SecurityOne.Customers/src/Domain/Events/Source*Event.cs
git commit -m "feat(customers): add Source domain events for polling notification"
```

---

## Task 2: Emit Domain Events in Existing Source Handlers

**Files:**
- Modify: `src/SecurityOne.Customers/src/Application/Sources/Commands/CreateSource/CreateSourceCommand.cs`
- Modify: `src/SecurityOne.Customers/src/Application/Sources/Commands/UpdateSource/UpdateSourceCommand.cs`
- Modify: `src/SecurityOne.Customers/src/Application/Sources/Commands/DeleteSource/DeleteSourceCommand.cs`
- Modify: `src/SecurityOne.Customers/src/Application/Sources/Commands/ToggleSource/ToggleSourceCommand.cs`

- [ ] **Step 1: Add domain event to CreateSourceCommandHandler**

In `CreateSourceCommandHandler.Handle`, add before `await context.SaveChangesAsync`:

```csharp
entity.AddDomainEvent(new SourceCreatedEvent(entity));
```

Add using: `using SecurityOne.Customers.Domain.Events;`

The full handler `Handle` method becomes:

```csharp
public async Task<Guid> Handle(CreateSourceCommand request, CancellationToken cancellationToken)
{
    var tenantId = user.TenantId ?? throw new UnauthorizedAccessException("User must have a tenant");
    var userId = user.Id ?? throw new UnauthorizedAccessException("User must be authenticated");

    var entity = new Source
    {
        Id = Guid.NewGuid(),
        TenantId = tenantId,
        Product = request.Product,
        Vendor = request.Vendor,
        FetchType = request.FetchType,
        Description = request.Description,
        Active = request.Active,
        Status = SourceStatus.Pending
    };

    if (request.FetchType == FetchType.Pull)
    {
        entity.ApiUrl = request.ApiUrl;
        entity.ApiToken = request.ApiToken;
    }
    else
    {
        entity.PushEndpoint = configuration["Alerts:PushUrl"]
            ?? throw new InvalidOperationException("Alerts:PushUrl is not configured.");
        entity.PushToken = tokenGeneratorService.GenerateToken(
            userId, tenantId, entity.Id, $"{request.Product}|{request.Vendor}", expirationInMinutes: 525600);
        entity.PushTokenExpiration = DateTimeOffset.UtcNow.AddMinutes(525600);
    }

    entity.AddDomainEvent(new SourceCreatedEvent(entity));

    context.Sources.Add(entity);
    await context.SaveChangesAsync(cancellationToken);

    return entity.Id;
}
```

- [ ] **Step 2: Add domain event to UpdateSourceCommandHandler**

In `UpdateSourceCommandHandler.Handle`, add before `await context.SaveChangesAsync`:

```csharp
entity.AddDomainEvent(new SourceUpdatedEvent(entity));
```

Add using: `using SecurityOne.Customers.Domain.Events;`

- [ ] **Step 3: Add domain event to DeleteSourceCommandHandler**

In `DeleteSourceCommandHandler.Handle`, add before `context.Sources.Remove(entity)`:

```csharp
entity.AddDomainEvent(new SourceDeletedEvent(entity));
```

Add using: `using SecurityOne.Customers.Domain.Events;`

Note: The event must be added before Remove so the interceptor can find it in ChangeTracker.

- [ ] **Step 4: Add domain event to ToggleSourceCommandHandler**

In `ToggleSourceCommandHandler.Handle`, add before `await context.SaveChangesAsync`:

```csharp
entity.AddDomainEvent(new SourceToggledEvent(entity));
```

Add using: `using SecurityOne.Customers.Domain.Events;`

- [ ] **Step 5: Verify build**

Run: `dotnet build src/SecurityOne.Customers/src/Application/`
Expected: Build succeeded

- [ ] **Step 6: Commit**

```bash
git add src/SecurityOne.Customers/src/Application/Sources/Commands/
git commit -m "feat(customers): emit domain events in Source command handlers"
```

---

## Task 3: IAlertsClient Interface and Options in Customers

**Files:**
- Create: `src/SecurityOne.Customers/src/Application/Common/Interfaces/IAlertsClient.cs`
- Create: `src/SecurityOne.Customers/src/Application/Common/Options/AlertsClientOptions.cs`

- [ ] **Step 1: Create AlertsClientOptions**

```csharp
// src/SecurityOne.Customers/src/Application/Common/Options/AlertsClientOptions.cs
namespace SecurityOne.Customers.Application.Common.Options;

public class AlertsClientOptions
{
    public const string SectionName = "Alerts";

    public string BaseUrl { get; set; } = string.Empty;
}
```

Note: The `Alerts` section already exists in config (used for `Alerts:PushUrl`). We add `BaseUrl` alongside it.

- [ ] **Step 2: Create IAlertsClient interface**

```csharp
// src/SecurityOne.Customers/src/Application/Common/Interfaces/IAlertsClient.cs
namespace SecurityOne.Customers.Application.Common.Interfaces;

public interface IAlertsClient
{
    Task NotifySourceChangedAsync(
        Guid sourceId,
        string eventType,
        SourceNotifyPayload payload,
        CancellationToken cancellationToken = default);
}

public record SourceNotifyPayload(
    string TenantId,
    string Product,
    string Vendor,
    string FetchType,
    bool Active,
    string? ApiUrl,
    string? ApiToken,
    int PollingIntervalMinutes = 10);
```

- [ ] **Step 3: Verify build**

Run: `dotnet build src/SecurityOne.Customers/src/Application/`
Expected: Build succeeded

- [ ] **Step 4: Commit**

```bash
git add src/SecurityOne.Customers/src/Application/Common/Interfaces/IAlertsClient.cs
git add src/SecurityOne.Customers/src/Application/Common/Options/AlertsClientOptions.cs
git commit -m "feat(customers): add IAlertsClient interface and AlertsClientOptions"
```

---

## Task 4: AlertsClient Implementation in Customers

**Files:**
- Create: `src/SecurityOne.Customers/src/Infrastructure/Services/AlertsClient.cs`
- Modify: `src/SecurityOne.Customers/src/Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Create AlertsClient**

```csharp
// src/SecurityOne.Customers/src/Infrastructure/Services/AlertsClient.cs
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SecurityOne.Customers.Application.Common.Interfaces;
using SecurityOne.Customers.Application.Common.Options;

namespace SecurityOne.Customers.Infrastructure.Services;

public class AlertsClient(
    HttpClient httpClient,
    IOptions<AlertsClientOptions> options,
    ILogger<AlertsClient> logger) : IAlertsClient
{
    private readonly AlertsClientOptions _options = options.Value;

    public async Task NotifySourceChangedAsync(
        Guid sourceId,
        string eventType,
        SourceNotifyPayload payload,
        CancellationToken cancellationToken = default)
    {
        var request = new
        {
            sourceId,
            @event = eventType,
            payload
        };

        try
        {
            logger.LogInformation(
                "Notifying Alerts service about source {SourceId} event {Event}",
                sourceId, eventType);

            var response = await httpClient.PostAsJsonAsync(
                $"{_options.BaseUrl}/api/alerts/sources/notify",
                request,
                cancellationToken);

            response.EnsureSuccessStatusCode();

            logger.LogInformation(
                "Successfully notified Alerts service about source {SourceId} event {Event}",
                sourceId, eventType);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to notify Alerts service about source {SourceId} event {Event}",
                sourceId, eventType);
        }
    }
}
```

- [ ] **Step 2: Register IAlertsClient in DI**

In `src/SecurityOne.Customers/src/Infrastructure/DependencyInjection.cs`, add at the end of `AddInfrastructureServices`, before the closing brace, after the ChatsClient registration block:

```csharp
// Configure HttpClient for Alerts Client
builder.Services.Configure<AlertsClientOptions>(
    builder.Configuration.GetSection(AlertsClientOptions.SectionName));

builder.Services.AddHttpClient<IAlertsClient, AlertsClient>((serviceProvider, client) =>
{
    var alertsOptions = serviceProvider.GetRequiredService<IOptions<AlertsClientOptions>>().Value;
    client.BaseAddress = new Uri(alertsOptions.BaseUrl);
});
```

Add usings at top of DI file:

```csharp
using SecurityOne.Customers.Application.Common.Options;
```

Note: `IOptions<AlertsClientOptions>` import is resolved by the existing `using Microsoft.Extensions.Options;`.

- [ ] **Step 3: Add Alerts:BaseUrl to appsettings**

Check the existing appsettings files for `Alerts` section and add `BaseUrl` if missing. The `Alerts` section already has `PushUrl`. Add:

```json
"Alerts": {
    "PushUrl": "...",
    "BaseUrl": "http://localhost:7035"
}
```

The port should match the Alerts service port. Check `src/SecurityOne.Alerts/src/Web/Properties/launchSettings.json` for the correct port.

- [ ] **Step 4: Verify build**

Run: `dotnet build src/SecurityOne.Customers/src/Infrastructure/`
Expected: Build succeeded

- [ ] **Step 5: Commit**

```bash
git add src/SecurityOne.Customers/src/Infrastructure/Services/AlertsClient.cs
git add src/SecurityOne.Customers/src/Infrastructure/DependencyInjection.cs
git commit -m "feat(customers): implement AlertsClient HTTP service for Alerts notification"
```

---

## Task 5: Source Event Handlers in Customers

**Files:**
- Create: `src/SecurityOne.Customers/src/Application/Sources/EventHandlers/SourceCreatedEventHandler.cs`
- Create: `src/SecurityOne.Customers/src/Application/Sources/EventHandlers/SourceUpdatedEventHandler.cs`
- Create: `src/SecurityOne.Customers/src/Application/Sources/EventHandlers/SourceDeletedEventHandler.cs`
- Create: `src/SecurityOne.Customers/src/Application/Sources/EventHandlers/SourceToggledEventHandler.cs`

- [ ] **Step 1: Create SourceCreatedEventHandler**

```csharp
// src/SecurityOne.Customers/src/Application/Sources/EventHandlers/SourceCreatedEventHandler.cs
using Microsoft.Extensions.Logging;
using SecurityOne.Customers.Application.Common.Interfaces;
using SecurityOne.Customers.Domain.Events;

namespace SecurityOne.Customers.Application.Sources.EventHandlers;

public class SourceCreatedEventHandler(
    IAlertsClient alertsClient,
    ILogger<SourceCreatedEventHandler> logger) : INotificationHandler<SourceCreatedEvent>
{
    public async Task Handle(SourceCreatedEvent notification, CancellationToken cancellationToken)
    {
        var source = notification.Source;

        logger.LogInformation(
            "Source created: {SourceId}, Product={Product}, FetchType={FetchType}",
            source.Id, source.Product, source.FetchType);

        await alertsClient.NotifySourceChangedAsync(
            source.Id,
            "created",
            new SourceNotifyPayload(
                TenantId: source.TenantId,
                Product: source.Product,
                Vendor: source.Vendor,
                FetchType: source.FetchType.ToString(),
                Active: source.Active,
                ApiUrl: source.ApiUrl,
                ApiToken: source.ApiToken),
            cancellationToken);
    }
}
```

- [ ] **Step 2: Create SourceUpdatedEventHandler**

```csharp
// src/SecurityOne.Customers/src/Application/Sources/EventHandlers/SourceUpdatedEventHandler.cs
using Microsoft.Extensions.Logging;
using SecurityOne.Customers.Application.Common.Interfaces;
using SecurityOne.Customers.Domain.Events;

namespace SecurityOne.Customers.Application.Sources.EventHandlers;

public class SourceUpdatedEventHandler(
    IAlertsClient alertsClient,
    ILogger<SourceUpdatedEventHandler> logger) : INotificationHandler<SourceUpdatedEvent>
{
    public async Task Handle(SourceUpdatedEvent notification, CancellationToken cancellationToken)
    {
        var source = notification.Source;

        logger.LogInformation(
            "Source updated: {SourceId}, Product={Product}, Active={Active}",
            source.Id, source.Product, source.Active);

        await alertsClient.NotifySourceChangedAsync(
            source.Id,
            "updated",
            new SourceNotifyPayload(
                TenantId: source.TenantId,
                Product: source.Product,
                Vendor: source.Vendor,
                FetchType: source.FetchType.ToString(),
                Active: source.Active,
                ApiUrl: source.ApiUrl,
                ApiToken: source.ApiToken),
            cancellationToken);
    }
}
```

- [ ] **Step 3: Create SourceDeletedEventHandler**

```csharp
// src/SecurityOne.Customers/src/Application/Sources/EventHandlers/SourceDeletedEventHandler.cs
using Microsoft.Extensions.Logging;
using SecurityOne.Customers.Application.Common.Interfaces;
using SecurityOne.Customers.Domain.Events;

namespace SecurityOne.Customers.Application.Sources.EventHandlers;

public class SourceDeletedEventHandler(
    IAlertsClient alertsClient,
    ILogger<SourceDeletedEventHandler> logger) : INotificationHandler<SourceDeletedEvent>
{
    public async Task Handle(SourceDeletedEvent notification, CancellationToken cancellationToken)
    {
        var source = notification.Source;

        logger.LogInformation("Source deleted: {SourceId}", source.Id);

        await alertsClient.NotifySourceChangedAsync(
            source.Id,
            "deleted",
            new SourceNotifyPayload(
                TenantId: source.TenantId,
                Product: source.Product,
                Vendor: source.Vendor,
                FetchType: source.FetchType.ToString(),
                Active: source.Active,
                ApiUrl: source.ApiUrl,
                ApiToken: source.ApiToken),
            cancellationToken);
    }
}
```

- [ ] **Step 4: Create SourceToggledEventHandler**

```csharp
// src/SecurityOne.Customers/src/Application/Sources/EventHandlers/SourceToggledEventHandler.cs
using Microsoft.Extensions.Logging;
using SecurityOne.Customers.Application.Common.Interfaces;
using SecurityOne.Customers.Domain.Events;

namespace SecurityOne.Customers.Application.Sources.EventHandlers;

public class SourceToggledEventHandler(
    IAlertsClient alertsClient,
    ILogger<SourceToggledEventHandler> logger) : INotificationHandler<SourceToggledEvent>
{
    public async Task Handle(SourceToggledEvent notification, CancellationToken cancellationToken)
    {
        var source = notification.Source;

        logger.LogInformation(
            "Source toggled: {SourceId}, Active={Active}",
            source.Id, source.Active);

        await alertsClient.NotifySourceChangedAsync(
            source.Id,
            "toggled",
            new SourceNotifyPayload(
                TenantId: source.TenantId,
                Product: source.Product,
                Vendor: source.Vendor,
                FetchType: source.FetchType.ToString(),
                Active: source.Active,
                ApiUrl: source.ApiUrl,
                ApiToken: source.ApiToken),
            cancellationToken);
    }
}
```

- [ ] **Step 5: Verify build**

Run: `dotnet build src/SecurityOne.Customers/src/Application/`
Expected: Build succeeded

- [ ] **Step 6: Commit**

```bash
git add src/SecurityOne.Customers/src/Application/Sources/EventHandlers/
git commit -m "feat(customers): add Source event handlers to notify Alerts service"
```

---

## Task 6: Source Status Notify Endpoint in Customers (receives status from Alerts)

**Files:**
- Create: `src/SecurityOne.Customers/src/Application/Sources/Commands/UpdateSourceStatus/UpdateSourceStatusCommand.cs`
- Modify: `src/SecurityOne.Customers/src/Web/Endpoints/Sources.cs`

- [ ] **Step 1: Create UpdateSourceStatusCommand and handler**

```csharp
// src/SecurityOne.Customers/src/Application/Sources/Commands/UpdateSourceStatus/UpdateSourceStatusCommand.cs
using SecurityOne.Customers.Application.Common.Interfaces;
using SecurityOne.Customers.Domain.Enums;

namespace SecurityOne.Customers.Application.Sources.Commands.UpdateSourceStatus;

public record UpdateSourceStatusCommand : IRequest
{
    public Guid SourceId { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTimeOffset? LastPolledAt { get; init; }
    public int EventsCollected { get; init; }
    public string? ErrorMessage { get; init; }
}

public class UpdateSourceStatusCommandHandler(
    IApplicationDbContext context) : IRequestHandler<UpdateSourceStatusCommand>
{
    public async Task Handle(UpdateSourceStatusCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.Sources
            .FirstOrDefaultAsync(x => x.Id == request.SourceId, cancellationToken);

        if (entity == null)
            return; // Source may have been deleted — ignore silently

        entity.Status = Enum.Parse<SourceStatus>(request.Status, ignoreCase: true);
        await context.SaveChangesAsync(cancellationToken);
    }
}
```

- [ ] **Step 2: Create request model for notify endpoint**

Add to the same file or a separate request model. For consistency with the existing pattern, add the request record in the endpoint file.

- [ ] **Step 3: Add notify endpoint to Sources.cs**

In `src/SecurityOne.Customers/src/Web/Endpoints/Sources.cs`, add:

1. A new route mapping in `Map()`:

```csharp
groupBuilder.MapPost(NotifySourceStatus, "notify")
    .WithMetadata(new SkipTenantValidationAttribute());
```

Note: This endpoint needs `SkipTenantValidationAttribute` because it's called service-to-service (no tenant header). Check if this attribute exists in the Customers project. If not, the Alerts project has it at `SecurityOne.Alerts.Web.Infrastructure.SkipTenantValidationAttribute` — replicate the same pattern.

2. The endpoint method:

```csharp
[EndpointSummary("Notify Source Status")]
[EndpointDescription("Receives status notifications from Alerts service about polling sources. Service-to-service only.")]
public static async Task<NoContent> NotifySourceStatus(ISender sender, SourceStatusNotifyRequest request)
{
    await sender.Send(new UpdateSourceStatusCommand
    {
        SourceId = request.SourceId,
        Status = request.Payload.Status,
        LastPolledAt = request.Payload.LastPolledAt,
        EventsCollected = request.Payload.EventsCollected,
        ErrorMessage = request.Payload.ErrorMessage
    });
    return TypedResults.NoContent();
}
```

3. Request model (add at the bottom of Sources.cs or in a separate file):

```csharp
public record SourceStatusNotifyRequest
{
    public Guid SourceId { get; init; }
    public string Event { get; init; } = string.Empty;
    public SourceStatusPayload Payload { get; init; } = null!;
}

public record SourceStatusPayload
{
    public string Status { get; init; } = string.Empty;
    public DateTimeOffset? LastPolledAt { get; init; }
    public int EventsCollected { get; init; }
    public string? ErrorMessage { get; init; }
}
```

Add using: `using SecurityOne.Customers.Application.Sources.Commands.UpdateSourceStatus;`

Note: Check if `SkipTenantValidationAttribute` exists in Customers. If not, create it following the same pattern as in Alerts (`SecurityOne.Alerts.Web.Infrastructure.SkipTenantValidationAttribute`). It should be a simple `[AttributeUsage(AttributeTargets.Method)] public class SkipTenantValidationAttribute : Attribute { }` and the TenantMiddleware in Customers should check for it.

- [ ] **Step 4: Verify build**

Run: `dotnet build src/SecurityOne.Customers/`
Expected: Build succeeded

- [ ] **Step 5: Commit**

```bash
git add src/SecurityOne.Customers/src/Application/Sources/Commands/UpdateSourceStatus/
git add src/SecurityOne.Customers/src/Web/Endpoints/Sources.cs
git commit -m "feat(customers): add source status notify endpoint for Alerts callbacks"
```

---

## Task 7: PollingCursor Entity and DB Configuration in Alerts

**Files:**
- Create: `src/SecurityOne.Alerts/src/Domain/Entities/PollingCursor.cs`
- Create: `src/SecurityOne.Alerts/src/Infrastructure/Data/Configurations/PollingCursorConfiguration.cs`
- Modify: `src/SecurityOne.Alerts/src/Application/Common/Interfaces/IApplicationDbContext.cs`
- Modify: `src/SecurityOne.Alerts/src/Infrastructure/Data/ApplicationDbContext.cs`

- [ ] **Step 1: Create PollingCursor entity**

First, check if Alerts has a `Domain/Entities/` folder or a `Domain/Common/BaseEntity.cs`. If not, create a simple entity without base class.

```csharp
// src/SecurityOne.Alerts/src/Domain/Entities/PollingCursor.cs
namespace SecurityOne.Alerts.Domain.Entities;

public class PollingCursor
{
    public Guid Id { get; set; }
    public Guid SourceId { get; set; }
    public string? LastCursor { get; set; }
    public DateTimeOffset? LastRunAt { get; set; }
    public int EventsCollected { get; set; }
    public string? ErrorMessage { get; set; }
}
```

- [ ] **Step 2: Create PollingCursorConfiguration**

```csharp
// src/SecurityOne.Alerts/src/Infrastructure/Data/Configurations/PollingCursorConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SecurityOne.Alerts.Domain.Entities;

namespace SecurityOne.Alerts.Infrastructure.Data.Configurations;

public class PollingCursorConfiguration : IEntityTypeConfiguration<PollingCursor>
{
    public void Configure(EntityTypeBuilder<PollingCursor> builder)
    {
        builder.ToTable("PollingCursors", "alert");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.SourceId)
            .IsRequired();

        builder.Property(e => e.LastCursor)
            .HasMaxLength(1000);

        builder.Property(e => e.ErrorMessage)
            .HasMaxLength(2000);

        builder.HasIndex(e => e.SourceId)
            .IsUnique()
            .HasDatabaseName("IX_PollingCursors_SourceId");
    }
}
```

- [ ] **Step 3: Add PollingCursors to IApplicationDbContext**

In `src/SecurityOne.Alerts/src/Application/Common/Interfaces/IApplicationDbContext.cs`, add:

```csharp
using SecurityOne.Alerts.Domain.Entities;

namespace SecurityOne.Alerts.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<PollingCursor> PollingCursors { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
```

- [ ] **Step 4: Add PollingCursors to ApplicationDbContext**

In `src/SecurityOne.Alerts/src/Infrastructure/Data/ApplicationDbContext.cs`, add:

```csharp
using System.Reflection;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SecurityOne.Alerts.Application.Common.Interfaces;
using SecurityOne.Alerts.Domain.Entities;
using SecurityOne.Alerts.Infrastructure.Identity;

namespace SecurityOne.Alerts.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<PollingCursor> PollingCursors => Set<PollingCursor>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
```

- [ ] **Step 5: Create EF migration**

Run from the Hackone repo root:

```bash
dotnet ef migrations add AddPollingCursors \
  --project src/SecurityOne.Alerts/src/Infrastructure/ \
  --startup-project src/SecurityOne.Alerts/src/Web/ \
  --output-dir Data/Migrations
```

Verify the migration creates the `PollingCursors` table in the `alert` schema.

- [ ] **Step 6: Verify build**

Run: `dotnet build src/SecurityOne.Alerts/`
Expected: Build succeeded

- [ ] **Step 7: Commit**

```bash
git add src/SecurityOne.Alerts/src/Domain/Entities/PollingCursor.cs
git add src/SecurityOne.Alerts/src/Infrastructure/Data/Configurations/PollingCursorConfiguration.cs
git add src/SecurityOne.Alerts/src/Application/Common/Interfaces/IApplicationDbContext.cs
git add src/SecurityOne.Alerts/src/Infrastructure/Data/ApplicationDbContext.cs
git add src/SecurityOne.Alerts/src/Infrastructure/Data/Migrations/
git commit -m "feat(alerts): add PollingCursor entity with EF migration"
```

---

## Task 8: Polling Contracts and Interfaces in Alerts

**Files:**
- Create: `src/SecurityOne.Alerts/src/Application/Polling/Contracts/IIncrementalCollector.cs`
- Create: `src/SecurityOne.Alerts/src/Application/Polling/Contracts/ICollectorRegistry.cs`
- Create: `src/SecurityOne.Alerts/src/Application/Polling/Contracts/IPollingJobService.cs`

- [ ] **Step 1: Create IIncrementalCollector with records**

```csharp
// src/SecurityOne.Alerts/src/Application/Polling/Contracts/IIncrementalCollector.cs
using System.Text.Json;

namespace SecurityOne.Alerts.Application.Polling.Contracts;

public interface IIncrementalCollector
{
    bool SupportsPolling(string product, string vendor);

    Task<CollectionResult> FetchIncrementalAsync(
        PollingSourceConfig config,
        string? lastCursor,
        CancellationToken cancellationToken);
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

- [ ] **Step 2: Create ICollectorRegistry**

```csharp
// src/SecurityOne.Alerts/src/Application/Polling/Contracts/ICollectorRegistry.cs
namespace SecurityOne.Alerts.Application.Polling.Contracts;

public interface ICollectorRegistry
{
    IIncrementalCollector? GetCollector(string product, string vendor);
}
```

- [ ] **Step 3: Create IPollingJobService**

```csharp
// src/SecurityOne.Alerts/src/Application/Polling/Contracts/IPollingJobService.cs
namespace SecurityOne.Alerts.Application.Polling.Contracts;

public interface IPollingJobService
{
    void EnsureJob(Guid sourceId, string tenantId, string product, string vendor,
        string apiUrl, string apiToken, int pollingIntervalMinutes);
    void CancelJob(Guid sourceId, string tenantId, string product, string vendor);
    void CleanupJob(Guid sourceId, string tenantId, string product, string vendor);
}
```

- [ ] **Step 4: Verify build**

Run: `dotnet build src/SecurityOne.Alerts/src/Application/`
Expected: Build succeeded

- [ ] **Step 5: Commit**

```bash
git add src/SecurityOne.Alerts/src/Application/Polling/
git commit -m "feat(alerts): add polling contracts (IIncrementalCollector, ICollectorRegistry, IPollingJobService)"
```

---

## Task 9: ICustomersClient in Alerts (for status callback)

**Files:**
- Create: `src/SecurityOne.Alerts/src/Application/Common/Interfaces/ICustomersClient.cs`
- Create: `src/SecurityOne.Alerts/src/Application/Common/Options/CustomersClientOptions.cs`
- Create: `src/SecurityOne.Alerts/src/Infrastructure/Services/CustomersClient.cs`

- [ ] **Step 1: Create CustomersClientOptions**

```csharp
// src/SecurityOne.Alerts/src/Application/Common/Options/CustomersClientOptions.cs
namespace SecurityOne.Alerts.Application.Common.Options;

public class CustomersClientOptions
{
    public const string SectionName = "Customers";

    public string BaseUrl { get; set; } = string.Empty;
}
```

- [ ] **Step 2: Create ICustomersClient interface**

```csharp
// src/SecurityOne.Alerts/src/Application/Common/Interfaces/ICustomersClient.cs
namespace SecurityOne.Alerts.Application.Common.Interfaces;

public interface ICustomersClient
{
    Task NotifySourceStatusAsync(
        Guid sourceId,
        string status,
        DateTimeOffset? lastPolledAt,
        int eventsCollected,
        string? errorMessage,
        CancellationToken cancellationToken = default);
}
```

- [ ] **Step 3: Create CustomersClient implementation**

```csharp
// src/SecurityOne.Alerts/src/Infrastructure/Services/CustomersClient.cs
using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SecurityOne.Alerts.Application.Common.Interfaces;
using SecurityOne.Alerts.Application.Common.Options;

namespace SecurityOne.Alerts.Infrastructure.Services;

public class CustomersClient(
    HttpClient httpClient,
    IOptions<CustomersClientOptions> options,
    ILogger<CustomersClient> logger) : ICustomersClient
{
    private readonly CustomersClientOptions _options = options.Value;

    public async Task NotifySourceStatusAsync(
        Guid sourceId,
        string status,
        DateTimeOffset? lastPolledAt,
        int eventsCollected,
        string? errorMessage,
        CancellationToken cancellationToken = default)
    {
        var request = new
        {
            sourceId,
            @event = "status_changed",
            payload = new
            {
                status,
                lastPolledAt,
                eventsCollected,
                errorMessage
            }
        };

        try
        {
            logger.LogInformation(
                "Notifying Customers about source {SourceId} status={Status}",
                sourceId, status);

            var response = await httpClient.PostAsJsonAsync(
                $"{_options.BaseUrl}/api/customers/sources/notify",
                request,
                cancellationToken);

            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "Failed to notify Customers about status change for sourceId={SourceId}",
                sourceId);
        }
    }
}
```

- [ ] **Step 4: Verify build**

Run: `dotnet build src/SecurityOne.Alerts/`
Expected: Build succeeded

- [ ] **Step 5: Commit**

```bash
git add src/SecurityOne.Alerts/src/Application/Common/Interfaces/ICustomersClient.cs
git add src/SecurityOne.Alerts/src/Application/Common/Options/CustomersClientOptions.cs
git add src/SecurityOne.Alerts/src/Infrastructure/Services/CustomersClient.cs
git commit -m "feat(alerts): add ICustomersClient for status callback to Customers"
```

---

## Task 10: FortiGateCollector Placeholder and CollectorRegistry in Alerts

**Files:**
- Create: `src/SecurityOne.Alerts/src/Infrastructure/Polling/FortiGateCollector.cs`
- Create: `src/SecurityOne.Alerts/src/Infrastructure/Polling/CollectorRegistry.cs`

- [ ] **Step 1: Create FortiGateCollector (placeholder)**

```csharp
// src/SecurityOne.Alerts/src/Infrastructure/Polling/FortiGateCollector.cs
using SecurityOne.Alerts.Application.Polling.Contracts;

namespace SecurityOne.Alerts.Infrastructure.Polling;

public class FortiGateCollector : IIncrementalCollector
{
    public bool SupportsPolling(string product, string vendor)
    {
        return string.Equals(product, "fortigate", StringComparison.OrdinalIgnoreCase)
            && string.Equals(vendor, "fortinet", StringComparison.OrdinalIgnoreCase);
    }

    public Task<CollectionResult> FetchIncrementalAsync(
        PollingSourceConfig config,
        string? lastCursor,
        CancellationToken cancellationToken)
    {
        throw new NotImplementedException(
            "FortiGATE collector not yet implemented. " +
            "This placeholder validates the polling infrastructure is working.");
    }
}
```

- [ ] **Step 2: Create CollectorRegistry**

```csharp
// src/SecurityOne.Alerts/src/Infrastructure/Polling/CollectorRegistry.cs
using SecurityOne.Alerts.Application.Polling.Contracts;

namespace SecurityOne.Alerts.Infrastructure.Polling;

public class CollectorRegistry(IEnumerable<IIncrementalCollector> collectors) : ICollectorRegistry
{
    public IIncrementalCollector? GetCollector(string product, string vendor)
    {
        return collectors.FirstOrDefault(c => c.SupportsPolling(product, vendor));
    }
}
```

- [ ] **Step 3: Verify build**

Run: `dotnet build src/SecurityOne.Alerts/`
Expected: Build succeeded

- [ ] **Step 4: Commit**

```bash
git add src/SecurityOne.Alerts/src/Infrastructure/Polling/
git commit -m "feat(alerts): add FortiGateCollector placeholder and CollectorRegistry"
```

---

## Task 11: PollingJobService (Hangfire Job Management) in Alerts

**Files:**
- Create: `src/SecurityOne.Alerts/src/Infrastructure/Polling/PollingJobService.cs`

- [ ] **Step 1: Create PollingJobService**

```csharp
// src/SecurityOne.Alerts/src/Infrastructure/Polling/PollingJobService.cs
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SecurityOne.Alerts.Application.Common.Interfaces;
using SecurityOne.Alerts.Application.Polling.Contracts;

namespace SecurityOne.Alerts.Infrastructure.Polling;

public class PollingJobService(
    ILogger<PollingJobService> logger,
    IServiceScopeFactory scopeFactory) : IPollingJobService
{
    public void EnsureJob(Guid sourceId, string tenantId, string product, string vendor,
        string apiUrl, string apiToken, int pollingIntervalMinutes)
    {
        var jobId = BuildJobId(product, vendor, tenantId, sourceId);

        var cronExpression = $"*/{pollingIntervalMinutes} * * * *";

        RecurringJob.AddOrUpdate<PollingJobExecutor>(
            jobId,
            executor => executor.ExecuteAsync(
                sourceId, tenantId, product, vendor, apiUrl, apiToken, CancellationToken.None),
            cronExpression);

        logger.LogInformation(
            "Ensured polling job {JobId} with interval {Interval}min",
            jobId, pollingIntervalMinutes);
    }

    public void CancelJob(Guid sourceId, string tenantId, string product, string vendor)
    {
        var jobId = BuildJobId(product, vendor, tenantId, sourceId);
        RecurringJob.RemoveIfExists(jobId);

        logger.LogInformation("Cancelled polling job {JobId}", jobId);
    }

    public void CleanupJob(Guid sourceId, string tenantId, string product, string vendor)
    {
        CancelJob(sourceId, tenantId, product, vendor);

        // Clean up cursor from database
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var cursor = dbContext.PollingCursors
            .FirstOrDefault(c => c.SourceId == sourceId);

        if (cursor != null)
        {
            dbContext.PollingCursors.Remove(cursor);
            dbContext.SaveChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
        }

        logger.LogInformation("Cleaned up cursor for sourceId={SourceId}", sourceId);
    }

    private static string BuildJobId(string product, string vendor, string tenantId, Guid sourceId)
    {
        return $"polling_{product.ToLowerInvariant()}_{vendor.ToLowerInvariant()}_{tenantId}_{sourceId}";
    }
}
```

- [ ] **Step 2: Verify build**

Run: `dotnet build src/SecurityOne.Alerts/`
Expected: Build succeeded

- [ ] **Step 3: Commit**

```bash
git add src/SecurityOne.Alerts/src/Infrastructure/Polling/PollingJobService.cs
git commit -m "feat(alerts): add PollingJobService for Hangfire recurring job management"
```

---

## Task 12: PollingJobExecutor (Hangfire Job Execution) in Alerts

**Files:**
- Create: `src/SecurityOne.Alerts/src/Infrastructure/Polling/PollingJobExecutor.cs`

- [ ] **Step 1: Create PollingJobExecutor**

```csharp
// src/SecurityOne.Alerts/src/Infrastructure/Polling/PollingJobExecutor.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SecurityOne.Alerts.Application.Common.Interfaces;
using SecurityOne.Alerts.Application.Polling.Contracts;
using SecurityOne.Alerts.Domain.Entities;

namespace SecurityOne.Alerts.Infrastructure.Polling;

public class PollingJobExecutor(
    ICollectorRegistry collectorRegistry,
    IApplicationDbContext dbContext,
    ICustomersClient customersClient,
    ILogger<PollingJobExecutor> logger)
{
    public async Task ExecuteAsync(
        Guid sourceId,
        string tenantId,
        string product,
        string vendor,
        string apiUrl,
        string apiToken,
        CancellationToken cancellationToken)
    {
        var jobName = $"polling_{product.ToLowerInvariant()}_{vendor.ToLowerInvariant()}_{tenantId}_{sourceId}";

        logger.LogInformation(
            "Polling cycle started for {JobName}, sourceId={SourceId}",
            jobName, sourceId);

        var collector = collectorRegistry.GetCollector(product, vendor);
        if (collector == null)
        {
            logger.LogWarning(
                "No collector found for product={Product}, vendor={Vendor}",
                product, vendor);
            return;
        }

        // Get or create cursor
        var cursor = await dbContext.PollingCursors
            .FirstOrDefaultAsync(c => c.SourceId == sourceId, cancellationToken);

        if (cursor == null)
        {
            cursor = new PollingCursor
            {
                Id = Guid.NewGuid(),
                SourceId = sourceId
            };
            dbContext.PollingCursors.Add(cursor);
        }

        try
        {
            var config = new PollingSourceConfig(
                sourceId, tenantId, product, vendor, apiUrl, apiToken);

            var result = await collector.FetchIncrementalAsync(
                config, cursor.LastCursor, cancellationToken);

            // Update cursor
            cursor.LastCursor = result.NewCursor;
            cursor.LastRunAt = DateTimeOffset.UtcNow;
            cursor.EventsCollected = result.EventCount;
            cursor.ErrorMessage = null;

            await dbContext.SaveChangesAsync(cancellationToken);

            logger.LogInformation(
                "Polling cycle completed: {EventCount} events collected, cursor={NewCursor}",
                result.EventCount, result.NewCursor);

            // Notify Customers: Connected
            await customersClient.NotifySourceStatusAsync(
                sourceId,
                "Connected",
                cursor.LastRunAt,
                result.EventCount,
                null,
                cancellationToken);
        }
        catch (NotImplementedException ex)
        {
            // Placeholder collector — log but don't mark as Disconnected
            logger.LogWarning(
                "Collector for product={Product}, vendor={Vendor} is not yet implemented: {Message}",
                product, vendor, ex.Message);

            cursor.LastRunAt = DateTimeOffset.UtcNow;
            cursor.ErrorMessage = ex.Message;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Polling failed for sourceId={SourceId}: {ErrorMessage}",
                sourceId, ex.Message);

            cursor.LastRunAt = DateTimeOffset.UtcNow;
            cursor.ErrorMessage = ex.Message;
            await dbContext.SaveChangesAsync(cancellationToken);

            // Notify Customers: Disconnected
            await customersClient.NotifySourceStatusAsync(
                sourceId,
                "Disconnected",
                cursor.LastRunAt,
                0,
                ex.Message,
                cancellationToken);
        }
    }
}
```

- [ ] **Step 2: Verify build**

Run: `dotnet build src/SecurityOne.Alerts/`
Expected: Build succeeded

- [ ] **Step 3: Commit**

```bash
git add src/SecurityOne.Alerts/src/Infrastructure/Polling/PollingJobExecutor.cs
git commit -m "feat(alerts): add PollingJobExecutor for Hangfire cycle execution"
```

---

## Task 13: SourceNotify Endpoint and Command in Alerts

**Files:**
- Create: `src/SecurityOne.Alerts/src/Application/Polling/Commands/SourceNotifyCommand.cs`
- Create: `src/SecurityOne.Alerts/src/Web/Endpoints/SourceNotify.cs`

- [ ] **Step 1: Create SourceNotifyCommand and handler**

```csharp
// src/SecurityOne.Alerts/src/Application/Polling/Commands/SourceNotifyCommand.cs
using Microsoft.Extensions.Logging;
using SecurityOne.Alerts.Application.Polling.Contracts;

namespace SecurityOne.Alerts.Application.Polling.Commands;

public record SourceNotifyCommand : IRequest
{
    public Guid SourceId { get; init; }
    public string Event { get; init; } = string.Empty;
    public SourceNotifyPayload Payload { get; init; } = null!;
}

public record SourceNotifyPayload
{
    public string TenantId { get; init; } = string.Empty;
    public string Product { get; init; } = string.Empty;
    public string Vendor { get; init; } = string.Empty;
    public string FetchType { get; init; } = string.Empty;
    public bool Active { get; init; }
    public string? ApiUrl { get; init; }
    public string? ApiToken { get; init; }
    public int PollingIntervalMinutes { get; init; } = 10;
}

public class SourceNotifyCommandHandler(
    IPollingJobService pollingJobService,
    ILogger<SourceNotifyCommandHandler> logger) : IRequestHandler<SourceNotifyCommand>
{
    public Task Handle(SourceNotifyCommand request, CancellationToken cancellationToken)
    {
        var payload = request.Payload;
        var isPull = string.Equals(payload.FetchType, "Pull", StringComparison.OrdinalIgnoreCase);

        logger.LogInformation(
            "Received source notify: sourceId={SourceId}, event={Event}, fetchType={FetchType}, active={Active}",
            request.SourceId, request.Event, payload.FetchType, payload.Active);

        switch (request.Event.ToLowerInvariant())
        {
            case "created":
                if (isPull && payload.Active && !string.IsNullOrEmpty(payload.ApiUrl) && !string.IsNullOrEmpty(payload.ApiToken))
                {
                    pollingJobService.EnsureJob(
                        request.SourceId, payload.TenantId, payload.Product, payload.Vendor,
                        payload.ApiUrl, payload.ApiToken, payload.PollingIntervalMinutes);
                }
                break;

            case "updated":
                if (isPull && payload.Active && !string.IsNullOrEmpty(payload.ApiUrl) && !string.IsNullOrEmpty(payload.ApiToken))
                {
                    pollingJobService.EnsureJob(
                        request.SourceId, payload.TenantId, payload.Product, payload.Vendor,
                        payload.ApiUrl, payload.ApiToken, payload.PollingIntervalMinutes);
                }
                else
                {
                    pollingJobService.CleanupJob(
                        request.SourceId, payload.TenantId, payload.Product, payload.Vendor);
                }
                break;

            case "toggled":
                if (payload.Active && isPull && !string.IsNullOrEmpty(payload.ApiUrl) && !string.IsNullOrEmpty(payload.ApiToken))
                {
                    pollingJobService.EnsureJob(
                        request.SourceId, payload.TenantId, payload.Product, payload.Vendor,
                        payload.ApiUrl, payload.ApiToken, payload.PollingIntervalMinutes);
                }
                else
                {
                    pollingJobService.CleanupJob(
                        request.SourceId, payload.TenantId, payload.Product, payload.Vendor);
                }
                break;

            case "deleted":
                pollingJobService.CleanupJob(
                    request.SourceId, payload.TenantId, payload.Product, payload.Vendor);
                break;

            default:
                logger.LogWarning("Unknown source notify event: {Event}", request.Event);
                break;
        }

        return Task.CompletedTask;
    }
}
```

- [ ] **Step 2: Create SourceNotify endpoint**

```csharp
// src/SecurityOne.Alerts/src/Web/Endpoints/SourceNotify.cs
using Microsoft.AspNetCore.Http.HttpResults;
using SecurityOne.Alerts.Application.Polling.Commands;
using SecurityOne.Alerts.Web.Infrastructure;

namespace SecurityOne.Alerts.Web.Endpoints;

public class SourceNotify : IEndpointGroup
{
    public static string? RoutePrefix => "/api/alerts/sources";

    public static void Map(RouteGroupBuilder groupBuilder)
    {
        groupBuilder.MapPost(Notify, "notify")
            .WithMetadata(new SkipTenantValidationAttribute());
    }

    [EndpointSummary("Notify Source Change")]
    [EndpointDescription("Receives notifications from Customers service about Source lifecycle events. Manages polling jobs accordingly.")]
    public static async Task<NoContent> Notify(ISender sender, SourceNotifyCommand command)
    {
        await sender.Send(command);
        return TypedResults.NoContent();
    }
}
```

- [ ] **Step 3: Verify build**

Run: `dotnet build src/SecurityOne.Alerts/`
Expected: Build succeeded

- [ ] **Step 4: Commit**

```bash
git add src/SecurityOne.Alerts/src/Application/Polling/Commands/SourceNotifyCommand.cs
git add src/SecurityOne.Alerts/src/Web/Endpoints/SourceNotify.cs
git commit -m "feat(alerts): add SourceNotify endpoint and command handler for polling job management"
```

---

## Task 14: DI Registration and Configuration in Alerts

**Files:**
- Modify: `src/SecurityOne.Alerts/src/Infrastructure/DependencyInjection.cs`

- [ ] **Step 1: Register all polling services in Alerts DI**

In `src/SecurityOne.Alerts/src/Infrastructure/DependencyInjection.cs`, add after the existing Hangfire registrations (`AddScoped<IAlertBackgroundService, AlertBackgroundService>()`):

```csharp
// Polling infrastructure
builder.Services.AddScoped<IIncrementalCollector, FortiGateCollector>();
builder.Services.AddScoped<ICollectorRegistry, CollectorRegistry>();
builder.Services.AddScoped<IPollingJobService, PollingJobService>();
builder.Services.AddScoped<PollingJobExecutor>();

// Configure HttpClient for Customers communication (status callbacks)
builder.Services.Configure<CustomersClientOptions>(
    builder.Configuration.GetSection(CustomersClientOptions.SectionName));

builder.Services.AddHttpClient<ICustomersClient, CustomersClient>((serviceProvider, client) =>
{
    var customersOptions = serviceProvider.GetRequiredService<IOptions<CustomersClientOptions>>().Value;
    client.BaseAddress = new Uri(customersOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});
```

Add usings at top:

```csharp
using SecurityOne.Alerts.Application.Common.Options;
using SecurityOne.Alerts.Application.Polling.Contracts;
using SecurityOne.Alerts.Infrastructure.Polling;
```

- [ ] **Step 2: Add Customers section to Alerts appsettings**

In the Alerts `appsettings.json` (or `appsettings.Development.json`), add:

```json
"Customers": {
    "BaseUrl": "http://localhost:7036"
}
```

The port should match the Customers service port. Check `src/SecurityOne.Customers/src/Web/Properties/launchSettings.json` for the correct port.

- [ ] **Step 3: Verify full solution build**

Run from Hackone root: `dotnet build`
Expected: Build succeeded for all projects

- [ ] **Step 4: Commit**

```bash
git add src/SecurityOne.Alerts/src/Infrastructure/DependencyInjection.cs
git commit -m "feat(alerts): register polling services and CustomersClient in DI"
```

---

## Task 15: Configuration Files (appsettings)

**Files:**
- Modify: Alerts `appsettings.json` or `appsettings.Development.json`
- Modify: Customers `appsettings.json` or `appsettings.Development.json`

- [ ] **Step 1: Find and update Alerts appsettings**

Locate the appsettings files:
- `src/SecurityOne.Alerts/src/Web/appsettings.json`
- `src/SecurityOne.Alerts/src/Web/appsettings.Development.json`

Add `Customers` section if not present:

```json
"Customers": {
    "BaseUrl": "http://localhost:XXXX"
}
```

Replace `XXXX` with the actual Customers service port from its `launchSettings.json`.

- [ ] **Step 2: Find and update Customers appsettings**

Locate the appsettings files:
- `src/SecurityOne.Customers/src/Web/appsettings.json`
- `src/SecurityOne.Customers/src/Web/appsettings.Development.json`

Ensure the `Alerts` section has `BaseUrl`:

```json
"Alerts": {
    "PushUrl": "...",
    "BaseUrl": "http://localhost:YYYY"
}
```

Replace `YYYY` with the actual Alerts service port from its `launchSettings.json`.

- [ ] **Step 3: Verify full solution build**

Run from Hackone root: `dotnet build`
Expected: Build succeeded

- [ ] **Step 4: Commit**

```bash
git add src/SecurityOne.Alerts/src/Web/appsettings*.json
git add src/SecurityOne.Customers/src/Web/appsettings*.json
git commit -m "feat: add cross-service BaseUrl configuration for polling notifications"
```

---

## Task 16: Final Integration Verification

- [ ] **Step 1: Full solution build**

Run from Hackone root:

```bash
dotnet build
```

Expected: Build succeeded with 0 errors.

- [ ] **Step 2: Verify EF migration applies**

If a local database is available:

```bash
dotnet ef database update \
  --project src/SecurityOne.Alerts/src/Infrastructure/ \
  --startup-project src/SecurityOne.Alerts/src/Web/
```

Expected: `PollingCursors` table created in `alert` schema.

- [ ] **Step 3: Verify Hangfire dashboard**

Start the Alerts service and navigate to `/hangfire`. No recurring jobs should exist yet (jobs are created when Sources are saved in Customers).

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(E02): integration fixes for polling job infrastructure"
```
