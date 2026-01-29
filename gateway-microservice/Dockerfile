# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Use 'npm ci' for clean, reproducible builds in Jenkins
RUN npm ci --only=production

# Stage 2: Production
FROM node:20-alpine
# Create non-privileged user for Security-as-Code compliance
RUN addgroup -S streamline && adduser -S payuser -G streamline
WORKDIR /app

# Copy only production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json .

# Set ownership to the non-root user
RUN chown -R payuser:streamline /app
USER payuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "src/index.js"]