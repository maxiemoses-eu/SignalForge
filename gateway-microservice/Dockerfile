# Use a specific, small, and patched version of Node
FROM node:22-alpine3.21 AS builder
WORKDIR /app
COPY package*.json ./
# npm ci is more secure and faster for Jenkins
RUN npm ci 
COPY . .

FROM node:22-alpine3.21
WORKDIR /app
# Patch OS-level vulnerabilities discovered by Trivy
RUN apk update && apk upgrade --no-cache
COPY --from=builder /app .
EXPOSE 8080
# Run as non-root user (Standard security requirement)
USER node
CMD ["npm", "start"]