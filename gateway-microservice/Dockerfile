FROM node:22.14.0-alpine3.21 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:22.14.0-alpine3.21
WORKDIR /app
COPY --from=build /app /app
# npm is not needed at runtime; removing it removes its bundled tar
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
# Patch base image to reduce Trivy findings
RUN apk update && apk upgrade --no-cache
USER node
CMD ["node", "index.js"]