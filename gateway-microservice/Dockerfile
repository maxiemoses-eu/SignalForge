# ==========================================
# Stage 1: Build & Prune Dependencies
# ==========================================
FROM node:22-alpine3.21 AS builder

WORKDIR /app

# Copy dependency manifests first for optimal layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies if needed for build steps)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Prune development dependencies to keep the production footprint small
RUN npm prune --production

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-alpine3.21 AS runner

WORKDIR /app

# Upgrade Alpine OS packages to patch any base-image vulnerabilities
RUN apk update && apk upgrade --no-cache

# Copy pruned production node_modules and configuration from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy application source files safely
# (Adjust these based on your exact file structure, e.g., src/ or individual files)
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/app.js ./app.js
COPY --from=builder /app/index.js ./index.js

# Ensure proper permissions for the non-root 'node' user
RUN chown -R node:node /app

# Switch to non-root user for security compliance
USER node

EXPOSE 8080

CMD ["npm", "start"]