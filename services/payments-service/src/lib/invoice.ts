import PDFDocument from 'pdfkit';
import type { InvoiceLineItem } from './folio.js';

export interface InvoiceData {
  invoiceNumber: string;
  hotelName: string;
  hotelAddress: string;
  guestName: string;
  guestEmail?: string | null;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  lineItems: InvoiceLineItem[];
  subtotals: { room: number; fnb: number; other: number };
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  generatedAt: string;
}

function inr(n: number): string {
  return `INR ${n.toLocaleString('en-IN')}`;
}

/**
 * Render an A4 invoice PDF and return the bytes.
 *
 * pdfkit emits bytes as it draws, but `doc.end()` only flushes on the next
 * tick. We resolve the buffer via the 'end' event so callers get the full PDF.
 */
export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header — hotel name + address
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1B2A4A').text(data.hotelName, 50, 50);
    if (data.hotelAddress) {
      doc.fontSize(10).font('Helvetica').fillColor('#666666').text(data.hotelAddress, 50, 82);
    }

    // Invoice meta on the right
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1B2A4A')
      .text('TAX INVOICE', 50, 50, { align: 'right' });
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Invoice #: ${data.invoiceNumber}`, 50, 78, { align: 'right' });
    doc.text(`Date: ${data.generatedAt}`, 50, 92, { align: 'right' });

    // Divider
    doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#1B2A4A').lineWidth(2).stroke();

    // Guest details
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1B2A4A').text('GUEST DETAILS', 50, 135);
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text(`Name: ${data.guestName}`, 50, 155);
    doc.text(`Room: ${data.roomNumber}`, 50, 170);
    doc.text(`Check-in: ${data.checkIn}`, 50, 185);
    doc.text(`Check-out: ${data.checkOut}`, 50, 200);
    if (data.guestEmail) {
      doc.text(`Email: ${data.guestEmail}`, 50, 215);
    }

    // Items table header
    doc.rect(50, 240, 495, 20).fill('#1B2A4A');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
    doc.text('Description', 60, 246);
    doc.text('Date', 320, 246);
    doc.text('Amount', 460, 246, { align: 'right', width: 75 });

    // Items rows
    let y = 270;
    doc.font('Helvetica').fontSize(9);

    data.lineItems.forEach((item, i) => {
      if (i % 2 === 1) doc.rect(50, y - 3, 495, 18).fill('#F4F6FA');
      doc.fillColor('#333333').text(item.description, 60, y, { width: 250 });
      doc.text(item.date, 320, y);
      doc.text(inr(item.amount), 460, y, { align: 'right', width: 75 });
      y += 20;

      // Naive overflow guard — start a new page when we run out of room.
      if (y > 700) {
        doc.addPage();
        y = 60;
      }
    });

    // Subtotals
    y += 10;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
    y += 15;

    const subtotalRows: Array<[string, number]> = [
      ['Room Charges', data.subtotals.room],
      ['Food & Beverage', data.subtotals.fnb],
      ['Other Services', data.subtotals.other],
    ];
    doc.fillColor('#333333');
    for (const [label, amount] of subtotalRows) {
      doc.text(label, 380, y);
      doc.text(inr(amount), 460, y, { align: 'right', width: 75 });
      y += 16;
    }

    // Total
    y += 5;
    doc.rect(380, y, 165, 24).fill('#1B2A4A');
    doc.font('Helvetica-Bold').fontSize(11).fillColor('white');
    doc.text('TOTAL', 390, y + 7);
    doc.text(inr(data.totalAmount), 460, y + 7, { align: 'right', width: 75 });

    if (data.balanceDue > 0) {
      y += 30;
      doc
        .font('Helvetica-Bold')
        .fillColor('#993C1D')
        .fontSize(10)
        .text(`Balance Due: ${inr(data.balanceDue)}`, 380, y, {
          align: 'right',
          width: 165,
        });
    } else if (data.paidAmount > 0) {
      y += 30;
      doc
        .font('Helvetica-Bold')
        .fillColor('#0F6E56')
        .fontSize(10)
        .text(`Paid in full: ${inr(data.paidAmount)}`, 380, y, {
          align: 'right',
          width: 165,
        });
    }

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#999999')
      .text(
        'Thank you for staying with us. We look forward to welcoming you again.',
        50,
        750,
        { align: 'center', width: 495 },
      );

    doc.end();
  });
}
