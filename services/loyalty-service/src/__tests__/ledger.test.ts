import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerService } from '../services/ledger.service.js';
import { calculateTier } from '../lib/loyalty.js';

type GuestRow = {
  id: string;
  loyaltyPoints: number;
  lifetimePoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
};

type TxnRow = {
  id: string;
  guestId: string;
  propertyId: string;
  reservationId?: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus' | 'referral';
  points: number;
  balanceAfter: number;
  reason: string;
  referenceId?: string;
  expiresAt?: Date | null;
  isExpired: boolean;
  createdAt: Date;
};

function makePrismaStub(initialGuest: GuestRow) {
  const guests = new Map<string, GuestRow>([[initialGuest.id, { ...initialGuest }]]);
  const txns: TxnRow[] = [];
  let txnSeq = 0;

  function newTxn(data: Partial<TxnRow>): TxnRow {
    const row: TxnRow = {
      id: `txn-${++txnSeq}`,
      guestId: data.guestId!,
      propertyId: data.propertyId!,
      reservationId: data.reservationId,
      type: data.type!,
      points: data.points!,
      balanceAfter: data.balanceAfter!,
      reason: data.reason!,
      referenceId: data.referenceId,
      expiresAt: data.expiresAt ?? null,
      isExpired: false,
      createdAt: new Date(),
    };
    txns.push(row);
    return row;
  }

  const client = {
    guest: {
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        const g = guests.get(where.id);
        if (!g) throw new Error('guest not found');
        return g;
      },
      findUnique: async ({ where }: { where: { id: string } }) => guests.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Partial<GuestRow> }) => {
        const g = guests.get(where.id);
        if (!g) throw new Error('guest not found');
        Object.assign(g, data);
        return g;
      },
    },
    loyaltyTransaction: {
      findFirst: async ({ where }: { where: Partial<TxnRow> }) =>
        txns.find(
          (t) =>
            (where.guestId === undefined || t.guestId === where.guestId) &&
            (where.type === undefined || t.type === where.type) &&
            (where.referenceId === undefined || t.referenceId === where.referenceId),
        ) ?? null,
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        return txns
          .filter((t) => {
            if (where.isExpired === false && t.isExpired) return false;
            if (where.points && (where.points as { gt?: number }).gt !== undefined) {
              if (t.points <= (where.points as { gt: number }).gt) return false;
            }
            if (where.expiresAt) {
              const w = where.expiresAt as { lte?: Date; not?: null };
              if (w.not === null && t.expiresAt === null) return false;
              if (w.lte && (!t.expiresAt || t.expiresAt > w.lte)) return false;
            }
            return true;
          })
          .map((t) => ({ id: t.id, guestId: t.guestId, propertyId: t.propertyId, points: t.points }));
      },
      create: async ({ data }: { data: Partial<TxnRow> }) => newTxn(data),
      updateMany: async ({ where, data }: { where: { id: { in: string[] } }; data: Partial<TxnRow> }) => {
        let count = 0;
        for (const t of txns) {
          if (where.id.in.includes(t.id)) {
            Object.assign(t, data);
            count++;
          }
        }
        return { count };
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => fn(client),
  };

  return { client, guests, txns };
}

const GUEST_ID = '11111111-1111-1111-1111-111111111111';
const PROPERTY_ID = '22222222-2222-2222-2222-222222222222';
const RESERVATION_ID = '33333333-3333-3333-3333-333333333333';

beforeEach(() => {
  // no shared state across tests
});

describe('LedgerService.creditPoints', () => {
  it('writes an immutable transaction and updates the guest balance + lifetime', async () => {
    const { client, guests, txns } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 0,
      lifetimePoints: 0,
      loyaltyTier: 'bronze',
    });
    const ledger = new LedgerService(client as never);

    const r = await ledger.creditPoints({
      guestId: GUEST_ID,
      propertyId: PROPERTY_ID,
      reservationId: RESERVATION_ID,
      points: 250,
      type: 'earn',
      reason: 'Stay earnings',
      referenceId: RESERVATION_ID,
    });

    expect(r.credited).toBe(true);
    expect(r.balanceAfter).toBe(250);
    expect(guests.get(GUEST_ID)!.loyaltyPoints).toBe(250);
    expect(guests.get(GUEST_ID)!.lifetimePoints).toBe(250);
    expect(txns).toHaveLength(1);
    expect(txns[0]!.type).toBe('earn');
    expect(txns[0]!.points).toBe(250);
  });

  it('promotes the tier when lifetime crosses a threshold', async () => {
    const { client, guests } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 950,
      lifetimePoints: 950,
      loyaltyTier: 'bronze',
    });
    const ledger = new LedgerService(client as never);
    await ledger.creditPoints({
      guestId: GUEST_ID,
      propertyId: PROPERTY_ID,
      points: 100,
      type: 'earn',
      reason: 'tier-cross',
    });
    expect(guests.get(GUEST_ID)!.loyaltyTier).toBe('silver');
    expect(calculateTier(1050)).toBe('silver');
  });

  it('is idempotent on (guestId, type, referenceId) — re-delivery is a no-op', async () => {
    const { client, guests, txns } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 0,
      lifetimePoints: 0,
      loyaltyTier: 'bronze',
    });
    const ledger = new LedgerService(client as never);
    const first = await ledger.creditPoints({
      guestId: GUEST_ID,
      propertyId: PROPERTY_ID,
      points: 100,
      type: 'earn',
      reason: 'stay',
      referenceId: 'res-1',
    });
    const second = await ledger.creditPoints({
      guestId: GUEST_ID,
      propertyId: PROPERTY_ID,
      points: 100,
      type: 'earn',
      reason: 'stay',
      referenceId: 'res-1',
    });
    expect(first.credited).toBe(true);
    expect(second.credited).toBe(false);
    expect(guests.get(GUEST_ID)!.loyaltyPoints).toBe(100);
    expect(txns).toHaveLength(1);
  });

  it('skips zero/negative credits without touching the ledger', async () => {
    const { client, txns } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 50,
      lifetimePoints: 50,
      loyaltyTier: 'bronze',
    });
    const ledger = new LedgerService(client as never);
    const r = await ledger.creditPoints({
      guestId: GUEST_ID,
      propertyId: PROPERTY_ID,
      points: 0,
      type: 'earn',
      reason: 'noop',
    });
    expect(r.credited).toBe(false);
    expect(r.balanceAfter).toBe(50);
    expect(txns).toHaveLength(0);
  });
});

describe('LedgerService.redeemPoints', () => {
  it('throws when below the minimum', async () => {
    const { client } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 1_000,
      lifetimePoints: 1_000,
      loyaltyTier: 'silver',
    });
    const ledger = new LedgerService(client as never);
    await expect(
      ledger.redeemPoints(
        {
          guestId: GUEST_ID,
          propertyId: PROPERTY_ID,
          reservationId: RESERVATION_ID,
          points: 100,
          reason: 'too-low',
        },
        500,
      ),
    ).rejects.toThrow(/Minimum redemption/);
  });

  it('debits the guest and writes a negative transaction', async () => {
    const { client, guests, txns } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 1_000,
      lifetimePoints: 1_000,
      loyaltyTier: 'silver',
    });
    const ledger = new LedgerService(client as never);
    const r = await ledger.redeemPoints(
      {
        guestId: GUEST_ID,
        propertyId: PROPERTY_ID,
        reservationId: RESERVATION_ID,
        points: 500,
        reason: 'fnb',
      },
      500,
    );
    expect(r.success).toBe(true);
    expect(r.newBalance).toBe(500);
    expect(r.rupeesValue).toBe(50);
    expect(guests.get(GUEST_ID)!.loyaltyPoints).toBe(500);
    expect(txns[0]!.type).toBe('redeem');
    expect(txns[0]!.points).toBe(-500);
  });

  it('returns INSUFFICIENT_BALANCE when the guest is short', async () => {
    const { client } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 300,
      lifetimePoints: 300,
      loyaltyTier: 'bronze',
    });
    const ledger = new LedgerService(client as never);
    const r = await ledger.redeemPoints(
      {
        guestId: GUEST_ID,
        propertyId: PROPERTY_ID,
        reservationId: RESERVATION_ID,
        points: 500,
        reason: 'fnb',
      },
      500,
    );
    expect(r.success).toBe(false);
    expect(r.reason).toBe('INSUFFICIENT_BALANCE');
    expect(r.newBalance).toBe(300);
  });

  it('lifetime points are NOT reduced on redeem (tier is sticky downward)', async () => {
    const { client, guests } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 5_500,
      lifetimePoints: 5_500,
      loyaltyTier: 'gold',
    });
    const ledger = new LedgerService(client as never);
    await ledger.redeemPoints(
      {
        guestId: GUEST_ID,
        propertyId: PROPERTY_ID,
        reservationId: RESERVATION_ID,
        points: 5_000,
        reason: 'big-redeem',
      },
      500,
    );
    expect(guests.get(GUEST_ID)!.loyaltyPoints).toBe(500);
    expect(guests.get(GUEST_ID)!.lifetimePoints).toBe(5_500);
    expect(guests.get(GUEST_ID)!.loyaltyTier).toBe('gold');
  });
});

describe('LedgerService.runExpiry', () => {
  it('aggregates expired batches into one negative transaction per guest', async () => {
    const { client, guests, txns } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 600,
      lifetimePoints: 600,
      loyaltyTier: 'bronze',
    });
    // Pre-seed two expired earn batches.
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await client.loyaltyTransaction.create({
      data: {
        guestId: GUEST_ID,
        propertyId: PROPERTY_ID,
        type: 'earn',
        points: 200,
        balanceAfter: 200,
        reason: 'old earn 1',
        expiresAt: past,
      },
    });
    await client.loyaltyTransaction.create({
      data: {
        guestId: GUEST_ID,
        propertyId: PROPERTY_ID,
        type: 'earn',
        points: 300,
        balanceAfter: 500,
        reason: 'old earn 2',
        expiresAt: past,
      },
    });

    const ledger = new LedgerService(client as never);
    const r = await ledger.runExpiry(new Date());

    expect(r.guestsAffected).toBe(1);
    expect(r.pointsExpired).toBe(500);
    expect(r.transactions).toBe(1);
    expect(guests.get(GUEST_ID)!.loyaltyPoints).toBe(100);
    // The two original earn rows should now be flagged isExpired.
    const expiredCount = txns.filter((t) => t.isExpired).length;
    expect(expiredCount).toBe(2);
    // And one new negative "expire" transaction should exist.
    const expireTxn = txns.find((t) => t.type === 'expire');
    expect(expireTxn).toBeDefined();
    expect(expireTxn!.points).toBe(-500);
  });

  it('returns zeros when nothing is due', async () => {
    const { client } = makePrismaStub({
      id: GUEST_ID,
      loyaltyPoints: 0,
      lifetimePoints: 0,
      loyaltyTier: 'bronze',
    });
    const ledger = new LedgerService(client as never);
    const r = await ledger.runExpiry(new Date());
    expect(r.guestsAffected).toBe(0);
    expect(r.pointsExpired).toBe(0);
    expect(r.transactions).toBe(0);
  });
});
