# Estágio de construção
FROM node:alpine AS builder
#FROM arm64v8/node:alpine

WORKDIR /api

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npx prisma generate

# Estágio final
FROM node:alpine

WORKDIR /api

# Copie apenas os arquivos necessários do estágio de construção
COPY --from=builder /api/node_modules ./node_modules
COPY --from=builder /api/package*.json ./
COPY --from=builder /api/. .

EXPOSE 3333

CMD ["npm", "start"]