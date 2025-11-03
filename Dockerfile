# ===== 1) Build da aplicação Angular =====
FROM node:20-alpine AS build
WORKDIR /app

# Dependências (reprodutível)
COPY package*.json ./
RUN npm ci

# Código e build de produção
COPY . .
RUN npm run build -- --configuration=production
# ⚠️ Se o seu outputPath NÃO for dist/pegar, ajuste o COPY abaixo.

# ===== 2) Runtime com Nginx =====
FROM nginx:1.27-alpine

# Copia o build do Angular
COPY --from=build /app/dist/pegar/ /usr/share/nginx/html

# Config do Nginx (SPA + cache + porta 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run usa 8080
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
