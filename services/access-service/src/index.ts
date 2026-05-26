import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config.js';
import { keyRoutes } from './routes/key.routes.js';
import { startBookingEventsWorker } from './workers/booking-events.worker.js';

const SERVICE_NAME = 'access-service';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        config.nodeEnv === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            },
    },
  });

  await app.register(cors, { origin: true });
  await app.register(helmet);

  app.get('/health', async () => ({
    status: 'ok',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  }));

  await app.register(keyRoutes, { prefix: '/api/v1' });

  return app;
}

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    if (config.workerEnabled) {
      startBookingEventsWorker();
      app.log.info('booking-events worker started');
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
