-- Persist the rendered-invoice pointer on the reservation so payments-service
-- (T-08) can stamp it after upload, and downstream tools can deep-link.
ALTER TABLE "reservations" ADD COLUMN "invoiceUrl" VARCHAR(500);
ALTER TABLE "reservations" ADD COLUMN "invoiceNumber" VARCHAR(50);
ALTER TABLE "reservations" ADD COLUMN "invoiceGeneratedAt" TIMESTAMPTZ;
