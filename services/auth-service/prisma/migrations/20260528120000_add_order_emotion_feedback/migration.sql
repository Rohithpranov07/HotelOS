-- Emotion-aware per-service feedback: persist the guest's mood (1-5), the
-- derived sentiment, and the quick-tags chosen, alongside the existing rating.
ALTER TABLE "orders" ADD COLUMN "guestMood" INTEGER;
ALTER TABLE "orders" ADD COLUMN "guestSentiment" VARCHAR(16);
ALTER TABLE "orders" ADD COLUMN "guestFeedbackTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
