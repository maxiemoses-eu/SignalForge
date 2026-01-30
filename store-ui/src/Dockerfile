# ... (use previous stages)
FROM node:20-alpine
RUN addgroup -S signalforge && adduser -S forgeuser -G signalforge
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json .

RUN chown -R forgeuser:signalforge /app
USER forgeuser

# MATCH THE NEW PORT
EXPOSE 9999

CMD ["node", "src/index.js"]