FROM node:latest

WORKDIR /api

COPY . .

RUN rm -rf node_modules

RUN npm install

EXPOSE 3333

CMD ["npm", "start"]