import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config.js';
import { reservationRoutes } from './routes/reservation.routes.js';
import { contentRoutes } from './routes/content.routes.js';
import { webhookRoutes } from './routes/webhook.routes.js';
import { schedulePmsSync } from './workers/pms-sync.worker.js';

const SERVICE_NAME = 'booking-service';

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

  await app.register(reservationRoutes, { prefix: '/api/v1/reservations' });
  await app.register(contentRoutes, { prefix: '/api/v1/content' });
  await app.register(webhookRoutes, { prefix: '/webhooks' });

  return app;
}

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    if (config.pmsSync.enabled) {
      await schedulePmsSync();
      app.log.info('PMS sync scheduled');
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
