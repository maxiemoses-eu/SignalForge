import { createApp } from './app.js';

const PORT = Number.parseInt(process.env.PORT ?? '3002', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error(JSON.stringify({ level: 'fatal', msg: 'invalid PORT' }));
  process.exit(1);
}

const log = (level, msg, extra = {}) => console.log(JSON.stringify({ level, msg, ...extra }));

const server = createApp().listen(PORT, HOST, () => {
  log('info', 'user-service listening', { host: HOST, port: PORT });
});

server.requestTimeout = 30_000;
server.headersTimeout = 15_000;
server.keepAliveTimeout = 5_000;

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('info', 'shutdown requested', { signal });

  const timer = setTimeout(() => {
    log('error', 'forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
  timer.unref();

  server.close((err) => {
    if (err) {
      log('error', 'error during shutdown');
      process.exit(1);
    }
    log('info', 'shutdown complete');
    process.exit(0);
  });
  server.closeIdleConnections();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', () => {
  log('fatal', 'unhandled promise rejection');
  process.exit(1);
});
