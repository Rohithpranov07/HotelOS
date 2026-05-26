import { describe, it, expect } from 'vitest';
import { generateInvoicePdf } from '../lib/invoice.js';

const baseInvoice = {
  invoiceNumber: 'INV-20260601-ABCDEF12',
  hotelName: 'Test Hotel',
  hotelAddress: '123 Test Street, Test City',
  guestName: 'Ada Lovelace',
  guestEmail: 'ada@example.com',
  roomNumber: '301',
  checkIn: '2026-06-01',
  checkOut: '2026-06-03',
  subtotals: { room: 9000, fnb: 1200, other: 400 },
  totalAmount: 10600,
  paidAmount: 10600,
  balanceDue: 0,
  generatedAt: '2026-06-03T11:00:00.000Z',
};

describe('generateInvoicePdf', () => {
  it('renders a PDF buffer that starts with the %PDF magic header', async () => {
    const buf = await generateInvoicePdf({
      ...baseInvoice,
      lineItems: [
        { description: 'Room charge — 2 nights', quantity: 2, amount: 9000, date: '2026-06-01' },
        { description: 'food order', quantity: 1, amount: 600, date: '2026-06-01' },
      ],
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('handles 5+ line items without erroring (acceptance criterion)', async () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      description: `Item #${i + 1}`,
      quantity: 1,
      amount: 100 + i * 25,
      date: '2026-06-02',
    }));
    const buf = await generateInvoicePdf({ ...baseInvoice, lineItems: items });
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('renders valid PDFs for both balance-due and paid-in-full variants', async () => {
    // PDFKit compresses content streams (FlateDecode) so we can't grep for
    // the visible text directly. Verify both code paths produce valid PDFs.
    const paid = await generateInvoicePdf({
      ...baseInvoice,
      lineItems: [
        { description: 'Room charge — 2 nights', quantity: 2, amount: 9000, date: '2026-06-01' },
      ],
    });
    const owing = await generateInvoicePdf({
      ...baseInvoice,
      paidAmount: 5000,
      balanceDue: 5600,
      lineItems: [
        { description: 'Room charge — 2 nights', quantity: 2, amount: 9000, date: '2026-06-01' },
      ],
    });
    expect(paid.subarray(0, 4).toString()).toBe('%PDF');
    expect(owing.subarray(0, 4).toString()).toBe('%PDF');
    expect(paid.length).toBeGreaterThan(1000);
    expect(owing.length).toBeGreaterThan(1000);
  });
});
