# Deploy Frontend (React + Vite + Nginx) no Azure App Service com Container

Guia passo a passo para criacao e publicacao do frontend no Azure App Service usando ACR (Azure Container Registry).

---

## Pre-requisitos

- Azure CLI instalado (`az --version`)
- Docker Desktop instalado (opcional — ha fluxo alternativo sem Docker Desktop)
- Estar logado no Azure (`az login`)
- Resource Group `hackone` ja criado (ver `backend/DEPLOY_AZURE.md`)
- ACR `hackoneregistry` ja criado (ver `backend/DEPLOY_AZURE.md`)

---

## Passo 1 — Build e Push da Imagem Docker

### Opcao A: Com Docker Desktop

```bash
# Login no ACR
az acr login --name hackoneregistry

# Na pasta frontend/
docker build \
  --build-arg VITE_API_URL="https://api-hackone-strapi.azurewebsites.net" \
  --build-arg VITE_API_BASE_URL="https://api-hackone-tickets.azurewebsites.net" \
  --build-arg VITE_CHAT_API_URL="https://api-hackone-chat.azurewebsites.net" \
  --build-arg VITE_CUSTOMERS_API_URL="https://api-hackone-customers.azurewebsites.net" \
  --build-arg VITE_TURNSTILE_SITE_KEY="0x4AAAAAACHOP94FOudbm5cN" \
  --build-arg VITE_ENABLE_TURNSTILE="false" \
  --build-arg VITE_ENABLE_INTEGRATIONS="true" \
  --build-arg VITE_ENABLE_CONFIG="true" \
  --build-arg VITE_WHATSAPP_SUPPORT="https://hackone.com.br/h1ca" \
  -t hackoneregistry.azurecr.io/hackone-frontend:latest .

docker push hackoneregistry.azurecr.io/hackone-frontend:latest
```

### Opcao B: Sem Docker Desktop (build remoto no ACR)

```bash
# Login e obter token
az acr login -n hackoneregistry --expose-token

# Build direto no ACR (executar na pasta frontend/)
az acr build --registry hackoneregistry --image hackone-frontend:latest --build-arg VITE_API_URL="https://api-hackone-strapi.azurewebsites.net" --build-arg VITE_API_BASE_URL="https://api-hackone-tickets.azurewebsites.net" --build-arg VITE_CHAT_API_URL="https://api-hackone-chat.azurewebsites.net" --build-arg VITE_CUSTOMERS_API_URL="https://api-hackone-customers.azurewebsites.net" --build-arg VITE_TURNSTILE_SITE_KEY="0x4AAAAAACHOP94FOudbm5cN" --build-arg VITE_ENABLE_TURNSTILE="false" --build-arg VITE_ENABLE_INTEGRATIONS="true" --build-arg VITE_ENABLE_CONFIG="true" --build-arg VITE_WHATSAPP_SUPPORT="https://hackone.com.br/h1ca" .
```

> **IMPORTANTE:** As variaveis `VITE_*` sao incorporadas no build pelo Vite (substituicao estatica). Elas **devem** ser passadas como `--build-arg` no momento do build, nao como variaveis de ambiente do App Service.

---

## Passo 2 — Criar App Service Plan (se necessario)

Se ja existe o plan `hackone-linux-serviceplan` criado para o backend, pode reutiliza-lo. Caso contrario:

```bash
az appservice plan create \
  --name hackone-linux-serviceplan \
  --resource-group hackone \
  --is-linux \
  --sku B2
```

## Passo 3 — Criar Web App com Container

```powershell
# Obter credenciais do ACR (PowerShell)
$ACR_PASSWORD = az acr credential show --name hackoneregistry --query "passwords[0].value" -o tsv

# Criar o Web App
az webapp create \
  --resource-group hackone \
  --plan hackone-linux-serviceplan \
  --name securityone \
  --container-image-name hackoneregistry.azurecr.io/hackone-frontend:latest \
  --container-registry-url https://hackoneregistry.azurecr.io \
  --container-registry-user hackoneregistry \
  --container-registry-password $ACR_PASSWORD
```

Caso precise reconfigurar o container:

```bash
az webapp config container set \
  --name securityone \
  --resource-group hackone \
  --container-image-name hackoneregistry.azurecr.io/hackone-frontend:latest \
  --container-registry-url https://hackoneregistry.azurecr.io \
  --container-registry-user hackoneregistry \
  --container-registry-password $(az acr credential show --name hackoneregistry --query "passwords[0].value" -o tsv)
```

## Passo 4 — Configurar Variaveis de Ambiente

```bash
az webapp config appsettings set \
  --name securityone \
  --resource-group hackone \
  --settings \
    WEBSITES_PORT=80
```

> **Nota:** A porta 80 e a porta exposta pelo Nginx no container. As variaveis `VITE_*` nao precisam ser configuradas aqui — elas sao embutidas no build estatico.

## Passo 5 — Habilitar Logs do Container

```bash
az webapp log config \
  --name securityone \
  --resource-group hackone \
  --docker-container-logging filesystem
```

## Passo 6 — Verificar se Esta Rodando

```bash
az webapp log tail --name securityone --resource-group hackone
```

Voce deve ver o Nginx iniciando e servindo na porta 80.

**URL de producao:** https://securityone.azurewebsites.net

---

## Variaveis de Build (VITE_*)

Estas variaveis sao incorporadas no build estatico e devem ser passadas via `--build-arg` no momento do `docker build` / `az acr build`:

| Variavel | Descricao | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL base do backend Strapi (obrigatorio) | `https://api-hackone-strapi.azurewebsites.net` |
| `VITE_API_BASE_URL` | URL base alternativa da API | `https://api-hackone-strapi.azurewebsites.net` |
| `VITE_CHAT_API_URL` | URL do servico de chat | `https://<chat-service>.azurewebsites.net` |
| `VITE_CUSTOMERS_API_URL` | URL da API de clientes | `https://<customers-api>.azurewebsites.net` |
| `VITE_ENABLE_CONFIG` | Habilitar pagina de configuracao | `true` / `false` |
| `VITE_ENABLE_INTEGRATIONS` | Habilitar pagina de integracoes | `true` / `false` |
| `VITE_ENABLE_TURNSTILE` | Habilitar Cloudflare Turnstile no login | `true` / `false` |
| `VITE_TURNSTILE_SITE_KEY` | Site key do Cloudflare Turnstile | `0x...` |
| `VITE_WHATSAPP_SUPPORT` | Numero WhatsApp de suporte | `+5511...` |

Todas as variaveis ja possuem `ARG` e `ENV` correspondentes no Dockerfile.

---

## Redeploy Rapido (apos alteracoes no codigo)

### Apenas redeploy

```bash
az acr build --registry hackoneregistry --image hackone-frontend:latest --build-arg VITE_API_URL="https://api-hackone-strapi.azurewebsites.net" --build-arg VITE_API_BASE_URL="https://api-hackone-tickets.azurewebsites.net" --build-arg VITE_CHAT_API_URL="https://api-hackone-chat.azurewebsites.net" --build-arg VITE_CUSTOMERS_API_URL="https://api-hackone-customers.azurewebsites.net" --build-arg VITE_TURNSTILE_SITE_KEY="0x4AAAAAACHOP94FOudbm5cN" --build-arg VITE_ENABLE_TURNSTILE="false" --build-arg VITE_ENABLE_INTEGRATIONS="true" --build-arg VITE_ENABLE_CONFIG="true" --build-arg VITE_WHATSAPP_SUPPORT="https://hackone.com.br/h1ca" .

az webapp restart --name securityone --resource-group hackone
```

### Redeploy + acompanhar logs

```bash
az acr build \
  --registry hackoneregistry \
  --image hackone-frontend:latest \
  --build-arg VITE_API_URL="https://api-hackone-strapi.azurewebsites.net" \
  --build-arg VITE_API_BASE_URL="https://api-hackone-tickets.azurewebsites.net" \
  --build-arg VITE_CHAT_API_URL="https://api-hackone-chat.azurewebsites.net" \
  --build-arg VITE_CUSTOMERS_API_URL="https://api-hackone-customers.azurewebsites.net" \
  --build-arg VITE_TURNSTILE_SITE_KEY="0x4AAAAAACHOP94FOudbm5cN" \
  --build-arg VITE_ENABLE_TURNSTILE="false" \
  --build-arg VITE_ENABLE_INTEGRATIONS="true" \
  --build-arg VITE_ENABLE_CONFIG="true" \
  --build-arg VITE_WHATSAPP_SUPPORT="https://hackone.com.br/h1ca" \
  .

az webapp restart --name securityone --resource-group hackone
az webapp log tail --name securityone --resource-group hackone
```

### Script completo (PowerShell)

```powershell
az acr build `
  --registry hackoneregistry `
  --image hackone-frontend:latest `
  --build-arg VITE_API_URL="https://api-hackone-strapi.azurewebsites.net" `
  --build-arg VITE_API_BASE_URL="https://api-hackone-tickets.azurewebsites.net" `
  --build-arg VITE_CHAT_API_URL="https://api-hackone-chat.azurewebsites.net" `
  --build-arg VITE_CUSTOMERS_API_URL="https://api-hackone-customers.azurewebsites.net" `
  --build-arg VITE_TURNSTILE_SITE_KEY="0x4AAAAAACHOP94FOudbm5cN" `
  --build-arg VITE_ENABLE_TURNSTILE="false" `
  --build-arg VITE_ENABLE_INTEGRATIONS="true" `
  --build-arg VITE_ENABLE_CONFIG="true" `
  --build-arg VITE_WHATSAPP_SUPPORT="https://hackone.com.br/h1ca" `
  .

az webapp restart --name securityone --resource-group hackone
Write-Host "Deploy concluido! https://securityone.azurewebsites.net"
```

---

## Troubleshooting

### Container nao inicia / erro 503

1. **Verificar logs:**
   ```bash
   az webapp log tail --name securityone --resource-group hackone
   ```

2. **Verificar se a porta esta correta:**
   - `WEBSITES_PORT` deve ser `80` (porta do Nginx)

3. **Verificar se a imagem existe no ACR:**
   ```bash
   az acr repository show-tags --name hackoneregistry --repository hackone-frontend
   ```

### Pagina em branco ou erro 404 nas rotas

O frontend usa React Router com `BrowserRouter` (client-side routing). O `nginx.conf` ja esta configurado com `try_files $uri $uri/ /index.html` para redirecionar todas as rotas ao `index.html`. Se o problema persistir:

1. **Verificar se o nginx.conf foi copiado corretamente:**
   ```bash
   # Acessar o container via SSH no portal Azure ou:
   az webapp ssh --name securityone --resource-group hackone
   cat /etc/nginx/conf.d/default.conf
   ```

2. **Verificar se o build gerou os arquivos:**
   ```bash
   az webapp ssh --name securityone --resource-group hackone
   ls /usr/share/nginx/html/
   ```

### API nao responde (erro CORS ou network)

1. Verificar se `VITE_API_URL` foi passado corretamente no build
2. Verificar se o backend (`api-hackone-strapi`) esta rodando
3. Verificar se o CORS do backend inclui `https://securityone.azurewebsites.net` em `config/middlewares.ts`

### Build falha no ACR

1. **Verificar Dockerfile:** Garantir que o `Dockerfile` esta na raiz da pasta `frontend/`
2. **Ver logs do build:**
   ```bash
   az acr task logs --registry hackoneregistry
   ```
3. **Erro de memoria no build:** O build do Vite pode consumir muita memoria. Se falhar, considere aumentar o SKU do ACR ou usar Docker Desktop local

### Variaveis VITE_* nao aplicadas

As variaveis `VITE_*` sao substituidas **em tempo de build**, nao em runtime. Se uma variavel nao esta funcionando:

1. Confirmar que foi passada como `--build-arg` no build
2. Confirmar que ha um `ARG VITE_<nome>` correspondente no Dockerfile
3. Fazer rebuild e redeploy — nao basta reiniciar o container

### Imagem desatualizada apos push

O App Service pode cachear a imagem. Para forcar pull:

```bash
az webapp config container set \
  --name securityone \
  --resource-group hackone \
  --container-image-name hackoneregistry.azurecr.io/hackone-frontend:latest

az webapp restart --name securityone --resource-group hackone
```

Ou habilitar Continuous Deployment:

```bash
az webapp deployment container config \
  --name securityone \
  --resource-group hackone \
  --enable-cd true
```
