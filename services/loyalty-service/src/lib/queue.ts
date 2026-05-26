import { Redis } from 'ioredis';
import { config } from '../config.js';

export const workerConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});
