-- Add a JSON preferences blob on guests so booking-service pre-checkin can
-- persist room temperature, pillow, floor, and special-notes prefs across stays.
ALTER TABLE "guests" ADD COLUMN "preferences" JSONB NOT NULL DEFAULT '{}';
