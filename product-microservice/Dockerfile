# Stage 1: Build
FROM node:22-alpine3.21 AS builder
WORKDIR /app
COPY package*.json ./
# Clean install including dev deps for testing
RUN npm ci 
COPY . .

# Stage 2: Production (Hardened)
FROM node:22-alpine3.21
WORKDIR /app
# Fix for common Alpine/Busybox CVEs
RUN apk update && apk upgrade --no-cache
COPY --from=builder /app .
EXPOSE 3001
# Run as non-root user for Trivy 'Misconfiguration' pass
USER node
CMD ["npm", "start"]