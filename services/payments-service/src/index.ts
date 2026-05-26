import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

import { config, hasRazorpay, hasSendgrid, hasS3 } from './config.js';
import { paymentRoutes } from './routes/payment.routes.js';
import {
  startBookingEventsWorker,
  startInvoiceDeliveryWorker,
} from './workers/post-checkout.worker.js';

const SERVICE_NAME = 'payments-service';

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
    providers: {
      razorpay: hasRazorpay,
      sendgrid: hasSendgrid,
      s3: hasS3,
    },
  }));

  await app.register(paymentRoutes, { prefix: '/api/v1/payments' });

  return app;
}

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    if (config.workerEnabled) {
      startBookingEventsWorker();
      startInvoiceDeliveryWorker();
      app.log.info('payments workers started');
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
