# 1) Etapa de build
FROM node:18 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration=production

# 2) Etapa de runtime (Nginx)
FROM nginx:stable-alpine
# copia o build do angular
COPY --from=build /app/dist/* /usr/share/nginx/html
# SPA: redireciona rotas pro index
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
