# Use a specific, small, and patched version of Node
FROM node:22-alpine3.21 AS builder
WORKDIR /app
COPY package*.json ./
# npm ci is more secure and faster for Jenkins
RUN npm ci
COPY . .
# Prune development dependencies
RUN npm prune --production

FROM node:22-alpine3.21
WORKDIR /app
# Patch OS-level vulnerabilities discovered by Trivy
RUN apk update && apk upgrade --no-cache
# Copy only necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/app.js ./app.js
COPY --from=builder /app/index.js ./index.js
EXPOSE 8080
# Run as non-root user (Standard security requirement)
USER node
CMD ["npm", "start"]