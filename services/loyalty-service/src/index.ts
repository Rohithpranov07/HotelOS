import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

import { config } from './config.js';
import { loyaltyRoutes } from './routes/loyalty.routes.js';
import { startBookingEventsWorker } from './workers/booking-events.worker.js';
import { startExpiryCron } from './workers/expiry.cron.js';

const SERVICE_NAME = 'loyalty-service';

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

  await app.register(loyaltyRoutes, { prefix: '/api/v1/loyalty' });

  return app;
}

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    if (config.workerEnabled) {
      startBookingEventsWorker();
      startExpiryCron(app.log);
      app.log.info('loyalty workers + expiry cron started');
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
