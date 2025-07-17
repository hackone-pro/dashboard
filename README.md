# 📊 Dashboard SOC

Projeto de dashboard web desenvolvido com **React 19**, **Vite 7**, **Tailwind CSS** e **ApexCharts**, utilizando Docker para ambiente de produção e compatível com desenvolvimento local via Node.js.

---

## ✅ Ambientes

### 🔧 Ambiente de Desenvolvimento (Local)

Requisitos:

- Node.js: **20.19.0** ou superior
- npm: **10.8.2** ou superior

Rodando localmente (sem Docker):

```bash
cd frontend
npm install
npm run dev
```

Acesse no navegador:  
📍 http://localhost:5173

---

### 🐳 Ambiente de Produção (Docker)

Requisitos:

- Docker: **>= 24.0**
- Docker Compose: **>= v2.20**

Rodando com Docker Compose:

```bash
docker-compose up --build -d
```

Acesse no navegador:  
📍 http://localhost:3000

---

## 📦 Bibliotecas e Ferramentas

### ➕ Dependências (`dependencies`)

| Pacote           | Versão     | Descrição                            |
|------------------|------------|--------------------------------------|
| react            | ^19.1.0    | Biblioteca principal de UI           |
| react-dom        | ^19.1.0    | Renderização do React                |
| apexcharts       | ^5.2.0     | Gráficos interativos                 |
| react-apexcharts | ^1.7.0     | Wrapper React para ApexCharts        |

### 🔧 Dependências de Desenvolvimento (`devDependencies`)

| Pacote                      | Versão     | Descrição                                |
|-----------------------------|------------|------------------------------------------|
| vite                        | ^7.0.4     | Bundler moderno                          |
| @vitejs/plugin-react        | ^4.6.0     | Suporte a React no Vite                  |
| tailwindcss                 | ^4.1.11    | Framework utilitário de CSS              |
| postcss                     | ^8.5.6     | Processador de CSS                       |
| autoprefixer                | ^10.4.21   | Vendor prefixes automáticos              |
| eslint                      | ^9.30.1    | Linter para JavaScript/TypeScript        |
| @eslint/js                  | ^9.30.1    | ESLint config para JS puro               |
| eslint-plugin-react-hooks   | ^5.2.0     | Lint para hooks do React                 |
| eslint-plugin-react-refresh | ^0.4.20    | Suporte a HMR com React                  |
| globals                     | ^16.3.0    | Lista de variáveis globais               |
| @types/react                | ^19.1.8    | Tipagens do React                        |
| @types/react-dom            | ^19.1.6    | Tipagens do ReactDOM                     |

---

## 🐳 Ambiente Docker

### ➕ Imagens utilizadas:

| Componente   | Imagem             | Observações                        |
|--------------|--------------------|------------------------------------|
| Builder      | `node:20`          | Build com Vite                     |
| Produção     | `node:20-alpine`   | Executa `serve` com o build gerado |
| Servidor     | `serve` (global)   | Versão mais recente (`npm i -g`)   |

---

## 📂 Estrutura de Pastas

```
dashboard-soc/
├── docker-compose.yml
├── docker-compose.dev.yml       # (opcional)
└── frontend/
    ├── Dockerfile
    ├── Dockerfile.dev           # (opcional)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── src/
    │   └── App.jsx
    └── public/
```

---


## ⚙️ Scripts disponíveis

| Script             | Descrição                                  |
|--------------------|---------------------------------------------|
| `npm run dev`      | Inicia o Vite no modo desenvolvimento       |
| `npm run build`    | Gera os arquivos de produção (dist)         |
| `npm run preview`  | Visualiza o build localmente                |
| `npm run lint`     | Roda o ESLint para análise de código        |

---

## 📦 Executando com Docker Compose

### Produção:

```bash
docker-compose up --build -d
```

Acesse em:  
📍 http://10.0.77.1:3000

### Desenvolvimento (com Docker):

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Acesse em:  
📍 http://localhost:3000

---

## 📋 Versões Resumidas

| Tecnologia     | Versão         |
|----------------|----------------|
| Node.js        | >= 20.19.0     |
| npm            | >= 10.8.2      |
| React          | ^19.1.0        |
| Vite           | ^7.0.4         |
| Tailwind CSS   | ^4.1.11        |
| ApexCharts     | ^5.2.0         |
| Docker         | >= 24.0        |
| Docker Compose | >= v2.20       |

---

## 📝 Licença

Este projeto está sob a licença MIT.