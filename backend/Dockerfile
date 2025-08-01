# Dockerfile.prod
FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app ./
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 1337

CMD ["npm", "start"]
