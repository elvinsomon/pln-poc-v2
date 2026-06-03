# Frontend: build de Vite servido por nginx, que además hace de proxy /api -> backend
# (mismo origen => sin problemas de CORS).

# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# La app llama al API en mismo origen: /api/... (nginx lo reenvía al backend).
ENV VITE_API_BASE=/api
RUN npm run build

# --- serve ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
