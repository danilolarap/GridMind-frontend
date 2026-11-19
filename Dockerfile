# Node 22.23.5 / npm 10.9.9; coincide con .nvmrc y packageManager.
FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Las variables VITE_ se incorporan al build y son públicas: no pongas secretos aquí.
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
