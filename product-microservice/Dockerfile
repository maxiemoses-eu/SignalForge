FROM node:20-alpine

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY package*.json .
RUN npm ci --omit=dev

COPY server.js .
USER app

CMD ["node", "server.js"]
