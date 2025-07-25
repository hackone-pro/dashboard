# Etapa 1 – Compila TypeScript
FROM node:18 AS build
WORKDIR /app

# Copia config e instala dependências
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copia o restante e compila
COPY . .
RUN npm run build

# Etapa 2 – Executa o servidor
FROM node:18
WORKDIR /app

# Instala apenas o necessário
COPY package*.json ./
RUN npm install --omit=dev

# Copia código compilado
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]