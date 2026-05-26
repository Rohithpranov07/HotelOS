import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from './config.js';
import { createSocketServer, type AppIO } from './lib/socket.js';
import { menuRoutes } from './routes/menu.routes.js';
import { orderRoutes } from './routes/order.routes.js';
import { housekeepingRoutes } from './routes/housekeeping.routes.js';
import { startSlaWorker } from './workers/sla.worker.js';

const SERVICE_NAME = 'orders-service';

export interface BuildOptions {
  /** Inject a pre-built Socket.io server (used by tests). */
  io?: AppIO;
}

export async function buildApp(options: BuildOptions = {}) {
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

  app.decorate('io', options.io ?? createSocketServer(app.server));

  app.get('/health', async () => ({
    status: 'ok',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  }));

  await app.register(menuRoutes, { prefix: '/api/v1/menu' });
  await app.register(orderRoutes, { prefix: '/api/v1/orders' });
  await app.register(housekeepingRoutes, { prefix: '/api/v1/housekeeping' });

  app.addHook('onClose', async () => {
    // Only close the Socket.io server we created. Injected ones are owned by the caller.
    if (!options.io) app.io.close();
  });

  return app;
}

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    startSlaWorker(app.io);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
