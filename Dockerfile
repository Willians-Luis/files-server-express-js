FROM node:alpine
#FROM arm64v8/node:alpine

WORKDIR /api

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npx prisma generate

EXPOSE 3333

CMD ["npm", "start"]