# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund && npm cache clean --force

COPY . .

# Build production bundle (API calls go to /api, proxied by nginx)
ENV REACT_APP_API_URL=/api
RUN npm run build

# ---- Stage 2: Serve via nginx ----
FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

# nginx on alpine runs as nginx user (uid 101) by default in the master
# worker processes run as the user directive specifies
# We ensure the cache/tmp dirs are writable
RUN chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
