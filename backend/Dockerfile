# Etapa 1 – Build com TypeScript
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY . .
RUN npm run build

# Etapa 2 – Execução leve
FROM node:18
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]