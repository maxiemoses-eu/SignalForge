FROM node:22-alpine3.21 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:22-alpine3.21
WORKDIR /app
# Patch OS vulnerabilities for Trivy
RUN apk update && apk upgrade --no-cache
COPY --from=builder /app .
EXPOSE 3001
# Non-root user for security
USER node
CMD ["npm", "start"]