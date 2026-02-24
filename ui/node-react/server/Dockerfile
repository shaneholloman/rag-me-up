FROM node:20-alpine

RUN apk add --no-cache dumb-init wget

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Remove any local .env so compose env takes precedence
RUN rm -f .env .env.template

# Non-root user (node user ships with the node image, uid 1000)
USER node

EXPOSE 3001

CMD ["dumb-init", "node", "index.js"]
