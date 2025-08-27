# Etapa 1: build
FROM node:20 AS builder

WORKDIR /app

COPY . .

RUN npm install && npm run build

# Etapa 2: servir com serve
FROM node:20

WORKDIR /app

# Copia o .env.production como .env (usado no build do Vite)
COPY .env.production .env

# Copia apenas o build
COPY --from=builder /app/dist /app/dist

# Instala o `serve`
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "--listen", "tcp://0.0.0.0:3000", "--no-clipboard"]