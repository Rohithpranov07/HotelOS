import sgMail from '@sendgrid/mail';
import { config, hasSendgrid } from '../config.js';

let initialised = false;
function ensureInit(): void {
  if (initialised) return;
  if (!hasSendgrid) return;
  sgMail.setApiKey(config.sendgrid.apiKey!);
  initialised = true;
}

export interface InvoiceEmailParams {
  toEmail: string;
  toName: string;
  hotelName: string;
  pdf: Buffer;
  invoiceNumber: string;
  loyaltyPointsEarned: number;
  loyaltyBalance: number;
  loyaltyTier: string;
}

export async function sendInvoiceEmail(params: InvoiceEmailParams): Promise<{ sent: boolean }> {
  ensureInit();
  if (!hasSendgrid) {
    return { sent: false };
  }
  await sgMail.send({
    to: { email: params.toEmail, name: params.toName },
    from: { email: config.sendgrid.fromEmail, name: params.hotelName },
    subject: `Your invoice from ${params.hotelName}`,
    text:
      `Hi ${params.toName},\n\n` +
      `Thank you for staying with us. Your invoice (${params.invoiceNumber}) is attached.\n\n` +
      `You earned ${params.loyaltyPointsEarned} loyalty points on this stay. ` +
      `Your new balance is ${params.loyaltyBalance} points (${params.loyaltyTier} tier).\n\n` +
      `We look forward to welcoming you again.\n`,
    attachments: [
      {
        filename: `${params.invoiceNumber}.pdf`,
        content: params.pdf.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });
  return { sent: true };
}
