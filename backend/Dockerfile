# Dockerfile.prod
FROM node:20 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app ./
RUN npm install --production

RUN mkdir -p /app/public/uploads

ENV NODE_ENV=production
EXPOSE 1337

CMD ["npm", "start"]
