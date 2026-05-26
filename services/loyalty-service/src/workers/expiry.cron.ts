import cron, { type ScheduledTask } from 'node-cron';
import { config } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { LedgerService } from '../services/ledger.service.js';

// Structural subset of a Pino-like logger so FastifyBaseLogger satisfies us too.
export interface CronLogger {
  info: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
}

/**
 * Schedule the nightly points-expiry sweep. Runs at config.expiryCron in
 * config.expiryTimezone (default 00:05 Asia/Kolkata).
 */
export function startExpiryCron(log: CronLogger): ScheduledTask {
  const ledger = new LedgerService(prisma);
  log.info({ schedule: config.expiryCron, tz: config.expiryTimezone }, 'expiry cron scheduled');
  return cron.schedule(
    config.expiryCron,
    async () => {
      try {
        const result = await ledger.runExpiry();
        log.info({ ...result }, 'expiry sweep complete');
      } catch (err) {
        log.error({ err }, 'expiry sweep failed');
      }
    },
    { timezone: config.expiryTimezone },
  );
}
