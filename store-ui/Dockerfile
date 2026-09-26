# ---- Stage 1: install production dependencies only ----
FROM node:24.21.0-alpine3.24 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---- Stage 2: minimal runtime image ----
FROM node:24.21.0-alpine3.24 AS runtime
ENV NODE_ENV=production

# npm, corepack and yarn are not needed at runtime. npm ships its own bundled
# dependency tree, which vulnerability scanners flag, so remove them entirely.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
    /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

WORKDIR /app
COPY --from=deps --chown=1000:1000 /app/node_modules ./node_modules
COPY --chown=1000:1000 package.json ./
COPY --chown=1000:1000 src ./src

# Run as the unprivileged "node" user (uid/gid 1000) from the official image, numeric so Kubernetes runAsNonRoot can verify it
USER 1000:1000
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "src/server.js"]
