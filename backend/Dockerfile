# Etapa 1 – Compilar o TypeScript
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2 – Executar a aplicação
FROM node:18
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Aqui está o ponto crítico: copie a pasta dist do build
COPY --from=build /app/dist /app/dist

EXPOSE 3001
CMD ["node", "dist/server.js"]