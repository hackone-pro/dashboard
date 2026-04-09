# Deploy Backend (Strapi) no Azure App Service com Container

Guia passo a passo para criacao e publicacao do backend no Azure App Service usando ACR (Azure Container Registry).

---

## Pre-requisitos

- Azure CLI instalado (`az --version`)
- Docker Desktop instalado (opcional — ha fluxo alternativo sem Docker Desktop)
- Estar logado no Azure (`az login`)

---

## Passo 1 — Criar Resource Group

```bash
az group create --name hackone --location brazilsouth
```

## Passo 2 — Criar Azure Container Registry (ACR)

```bash
az acr create --resource-group hackone --name hackoneregistry --sku Basic --admin-enabled true
```

---

## Passo 3 e 4 — Build e Push da Imagem Docker

### Opcao A: Com Docker Desktop

```bash
# Login no ACR
az acr login --name hackoneregistry

# Na pasta backend/
docker build -t hackoneregistry.azurecr.io/hackone-backend:latest .
docker push hackoneregistry.azurecr.io/hackone-backend:latest
```

### Opcao B: Sem Docker Desktop (build remoto no ACR)

```bash
# Login e obter token
az acr login -n hackoneregistry --expose-token

# Build direto no ACR (executar na pasta backend/)
az acr build --registry hackoneregistry --image hackone-backend:latest .
```

> **Nota:** A opcao B faz o build diretamente no Azure, sem necessidade de Docker local.

---

## Passo 5 — Criar App Service Plan (Linux/Container)

```bash
az appservice plan create \
  --name hackone-linux-serviceplan \
  --resource-group hackone \
  --is-linux \
  --sku B2
```

## Passo 6 — Criar Web App com Container

```powershell
# Obter credenciais do ACR (PowerShell)
$ACR_PASSWORD = az acr credential show --name hackoneregistry --query "passwords[0].value" -o tsv

# Criar o Web App
az webapp create \
  --resource-group hackone \
  --plan hackone-linux-serviceplan \
  --name api-hackone-strapi \
  --container-image-name hackoneregistry.azurecr.io/hackone-backend:latest \
  --container-registry-url https://hackoneregistry.azurecr.io \
  --container-registry-user hackoneregistry \
  --container-registry-password $ACR_PASSWORD
```

Caso precise reconfigurar o container:

```bash
az webapp config container set \
  --name api-hackone-strapi \
  --resource-group hackone \
  --container-image-name hackoneregistry.azurecr.io/hackone-backend:latest \
  --container-registry-url https://hackoneregistry.azurecr.io \
  --container-registry-user hackoneregistry \
  --container-registry-password $(az acr credential show --name hackoneregistry --query "passwords[0].value" -o tsv)
```

## Passo 7 — Configurar Variaveis de Ambiente

```bash
az webapp config appsettings set \
  --name api-hackone-strapi \
  --resource-group hackone \
  --settings \
    NODE_ENV=production \
    WEBSITES_PORT=1337 \
    HOST=0.0.0.0 \
    PORT=1337 \
    APP_KEYS="<APP_KEYS>" \
    API_TOKEN_SALT="<API_TOKEN_SALT>" \
    ADMIN_JWT_SECRET="<ADMIN_JWT_SECRET>" \
    TRANSFER_TOKEN_SALT="<TRANSFER_TOKEN_SALT>" \
    ENCRYPTION_KEY="<ENCRYPTION_KEY>" \
    JWT_SECRET="<JWT_SECRET>" \
    DATABASE_CLIENT=mysql \
    DATABASE_HOST="<DATABASE_HOST>" \
    DATABASE_PORT=3306 \
    DATABASE_NAME=hackone_strapi_dev \
    DATABASE_USERNAME="<DATABASE_USERNAME>" \
    DATABASE_PASSWORD="<DATABASE_PASSWORD>" \
    DATABASE_SSL=true \
    DATABASE_SSL_REJECT_UNAUTHORIZED=false \
    SMTP_USER="<SMTP_USER>" \
    SMTP_PASS="<SMTP_PASS>" \
    AC_API_KEY="<AC_API_KEY>" \
    AC_API_URL="<AC_API_URL>" \
    AC_TEMPLATE_ID=989 \
    AC_RESET_FIELD_ID=973 \
    N8N_URL="<N8N_URL>" \
    N8N_USERNAME="<N8N_USERNAME>" \
    N8N_PASSWORD="<N8N_PASSWORD>" \
    CLOUDFLARE_TURNSTILE_SECRET="<TURNSTILE_SECRET>" \
    ENABLE_TURNSTILE=false \
    ENABLE_LOGIN_ATTEMPT_LIMIT=false \
    ENABLE_MFA=false
```

> **IMPORTANTE:** Substitua os valores entre `< >` pelas credenciais reais. Nunca commite credenciais em repositorios.

## Passo 8 — Ajustar URLs de Producao

```bash
az webapp config appsettings set \
  --name api-hackone-strapi \
  --resource-group hackone \
  --settings \
    API_URL="https://api-hackone-strapi.azurewebsites.net" \
    FRONTEND_URL="https://securityon.azurewebsites.net"
```

## Passo 9 — Habilitar Logs do Container

```bash
az webapp log config \
  --name api-hackone-strapi \
  --resource-group hackone \
  --docker-container-logging filesystem
```

## Passo 10 — Verificar se Esta Rodando

```bash
az webapp log tail --name api-hackone-strapi --resource-group hackone
```

Voce deve ver o Strapi compilando o admin panel e depois iniciando na porta 1337.

**URL de producao:** https://api-hackone-strapi.azurewebsites.net

---

## Redeploy Rapido (apos alteracoes no codigo)

### Apenas redeploy

```bash
az acr build --registry hackoneregistry --image hackone-backend:latest .
az webapp restart --name api-hackone-strapi --resource-group hackone
```

### Redeploy + acompanhar logs

```bash
az acr build --registry hackoneregistry --image hackone-backend:latest .
az webapp restart --name api-hackone-strapi --resource-group hackone
az webapp log tail --name api-hackone-strapi --resource-group hackone
```

### Script completo (PowerShell)

```powershell
az acr build --registry hackoneregistry --image hackone-backend:latest .
az webapp restart --name api-hackone-strapi --resource-group hackone
Write-Host "Deploy concluido! https://api-hackone-strapi.azurewebsites.net"
```

---

## Troubleshooting

### Container nao inicia / erro 503

1. **Verificar logs:**
   ```bash
   az webapp log tail --name api-hackone-strapi --resource-group hackone
   ```

2. **Verificar se a porta esta correta:**
   - `WEBSITES_PORT` deve ser `1337` (porta do Strapi)
   - `HOST` deve ser `0.0.0.0` (aceitar conexoes externas)

3. **Verificar se a imagem existe no ACR:**
   ```bash
   az acr repository show-tags --name hackoneregistry --repository hackone-backend
   ```

### Erro de autenticacao no ACR

1. **Re-login:**
   ```bash
   az acr login --name hackoneregistry
   ```

2. **Verificar se admin esta habilitado:**
   ```bash
   az acr update --name hackoneregistry --admin-enabled true
   ```

3. **Obter credenciais manualmente:**
   ```bash
   az acr credential show --name hackoneregistry
   ```

### Erro de conexao com banco de dados

1. Verificar se o `DATABASE_HOST` esta acessivel a partir do App Service
2. Verificar se o firewall do MySQL permite conexoes do Azure:
   ```bash
   az mysql flexible-server firewall-rule create \
     --resource-group hackone \
     --name <servidor-mysql> \
     --rule-name AllowAzure \
     --start-ip-address 0.0.0.0 \
     --end-ip-address 0.0.0.0
   ```
3. Confirmar que `DATABASE_SSL=true` esta configurado (obrigatorio para Azure MySQL)

### Build falha no ACR

1. **Verificar Dockerfile:** Garantir que o `Dockerfile` esta na raiz da pasta onde o comando e executado
2. **Ver logs do build:**
   ```bash
   az acr task logs --registry hackoneregistry
   ```
3. **Verificar espaco no ACR:**
   ```bash
   az acr show-usage --name hackoneregistry
   ```

### Strapi demora muito para iniciar

- O primeiro start compila o admin panel, podendo levar **5-10 minutos**
- O App Service tem timeout padrao de 230s. Se necessario, aumentar:
  ```bash
  az webapp config appsettings set \
    --name api-hackone-strapi \
    --resource-group hackone \
    --settings WEBSITES_CONTAINER_START_TIME_LIMIT=600
  ```

### Variaveis de ambiente nao aplicadas

1. **Listar variaveis atuais:**
   ```bash
   az webapp config appsettings list --name api-hackone-strapi --resource-group hackone
   ```
2. **Reiniciar apos alterar:**
   ```bash
   az webapp restart --name api-hackone-strapi --resource-group hackone
   ```

### Imagem desatualizada apos push

O App Service pode cachear a imagem. Para forcar pull:

```bash
az webapp config container set \
  --name api-hackone-strapi \
  --resource-group hackone \
  --container-image-name hackoneregistry.azurecr.io/hackone-backend:latest

az webapp restart --name api-hackone-strapi --resource-group hackone
```

Ou habilitar Continuous Deployment:

```bash
az webapp deployment container config \
  --name api-hackone-strapi \
  --resource-group hackone \
  --enable-cd true
```
