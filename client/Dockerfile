# Stage 1: build the React app
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json ./
COPY shared/ ./shared/
COPY client/package.json ./client/

RUN npm install

COPY client/ ./client/

WORKDIR /app/client

RUN ../node_modules/.bin/vite build

# Stage 2: serve with nginx
FROM nginx:1.27-alpine

COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
