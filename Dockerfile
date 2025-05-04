FROM node:23-alpine AS builder

COPY . /opt/pong

WORKDIR /opt/pong/backend

RUN npm i && npm run build:ts

WORKDIR /opt/pong/frontend

RUN npm i && npm run build

FROM node:23-alpine AS final

WORKDIR /app/pong

COPY ./backend/package.json .
RUN npm i --production

COPY --from=builder /opt/pong/backend/dist ./dist

RUN apk add openssl && openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out ./pong.crt -keyout ./pong.key -subj "/C=SG/ST=Singapore/L=Singapore/O=42 School/OU=fsPong/CN=fsPong/"

EXPOSE 3000
CMD [ "node", "./dist/server.js" ]

# docker build --no-cache -t pongimg:1.0 -f ./Dockerfile .
# docker run --rm -p 3000:3000 --name pongct pongimg:1.0 
# openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out ./pong.crt -keyout ./pong.key -subj "/C=SG/ST=Singapore/L=Singapore/O=42 School/OU=fsPong/CN=fsPong/"