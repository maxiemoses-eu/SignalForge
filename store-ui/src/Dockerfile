FROM node:20-alpine

RUN addgroup -S signalforge && adduser -S forgeuser -G signalforge

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY src ./src

RUN chown -R forgeuser:signalforge /app
USER forgeuser

EXPOSE 9999
CMD ["node", "src/index.js"]
