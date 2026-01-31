# Stage 1: Build Stage
FROM node:22-alpine3.21 AS builder

# 1. Senior Fix: Update npm globally to patch CVE-2026-23745 (tar dependency)
RUN npm install -g npm@latest 

WORKDIR /app

# 2. Optimize caching by copying package files first
COPY package*.json ./

# 3. Senior Fix: Proactively resolve the 21 vulnerabilities found in logs
# This fixes the "6 high" vulnerabilities before installation [cite: 474]
RUN npm audit fix --force 
RUN npm ci

# 4. Copy source and build the production assets
COPY . .
RUN npm run build

# Stage 2: Production Serving Stage
FROM node:22-alpine3.21

# 1. Patch the production image's global npm and install a lightweight server
RUN npm install -g npm@latest && npm install -g serve

WORKDIR /app

# 2. Copy only the production build artifacts from the builder stage
# This keeps the image size small and secure
COPY --from=builder /app/build ./build

# 3. Security best practice: Run as a non-root user
USER node

# 4. Expose the UI port
EXPOSE 3001

# 5. Start the application using 'serve'
CMD ["serve", "-s", "build", "-l", "3001"]