# React kodunu Node.js ortamında derliyoruz.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Çalışırken Node.js yerine yalnızca derlenmiş siteyi sunuyoruz.
FROM nginx:stable-alpine
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx de yönetici olmayan kullanıcıyla çalışıyor.
USER nginx
EXPOSE 8080
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
