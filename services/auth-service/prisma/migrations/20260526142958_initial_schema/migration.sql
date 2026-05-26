-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('confirmed', 'pre_checked_in', 'checked_in', 'checked_out', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('food', 'beverage', 'laundry', 'housekeeping', 'amenity', 'maintenance', 'spa');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('front_desk', 'housekeeping', 'room_service', 'maintenance', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('clean', 'occupied', 'dirty', 'inspected', 'out_of_order');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('earn', 'redeem', 'expire', 'adjust', 'bonus', 'referral');

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "country" CHAR(2) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    "pmsType" VARCHAR(50),
    "pmsApiKeyEnc" TEXT,
    "waPhoneNumberId" VARCHAR(50),
    "waAccessTokenEnc" TEXT,
    "loyaltyEarnRate" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    "pointsExpiryDays" INTEGER NOT NULL DEFAULT 365,
    "subscriptionTier" VARCHAR(20) NOT NULL DEFAULT 'starter',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "fullName" VARCHAR(200) NOT NULL,
    "nationality" CHAR(2),
    "languageCode" VARCHAR(10) NOT NULL DEFAULT 'en',
    "dateOfBirth" DATE,
    "anniversaryDate" DATE,
    "loyaltyTier" "LoyaltyTier" NOT NULL DEFAULT 'bronze',
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "totalStays" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sentimentScore" DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    "churnRisk" DECIMAL(3,2),
    "dietaryFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "waOptIn" BOOLEAN NOT NULL DEFAULT false,
    "appPushOptIn" BOOLEAN NOT NULL DEFAULT false,
    "profileMongoId" VARCHAR(24),
    "propertyId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "role" "StaffRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "totpSecret" TEXT,
    "fcmToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "roomNumber" VARCHAR(10) NOT NULL,
    "roomType" VARCHAR(50) NOT NULL,
    "floor" INTEGER NOT NULL,
    "maxOccupancy" INTEGER NOT NULL DEFAULT 2,
    "baseRate" DECIMAL(10,2) NOT NULL,
    "iotControllerId" VARCHAR(100),
    "lockDeviceId" VARCHAR(100),
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "housekeepingStatus" "RoomStatus" NOT NULL DEFAULT 'clean',
    "lastCleanedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guestId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "roomId" UUID,
    "pmsBookingRef" VARCHAR(50),
    "status" "ReservationStatus" NOT NULL,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "actualCheckIn" TIMESTAMPTZ,
    "actualCheckOut" TIMESTAMPTZ,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "ratePlan" VARCHAR(20),
    "roomRate" DECIMAL(10,2),
    "totalRoomAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalFnbAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalOtherAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "source" VARCHAR(50),
    "specialRequests" TEXT,
    "aiPreBrief" TEXT,
    "mobileKeyId" VARCHAR(100),
    "isDnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "prepTimeMinutes" INTEGER NOT NULL DEFAULT 15,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" VARCHAR(5),
    "availableTo" VARCHAR(5),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "guestId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "assignedStaffId" UUID,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "items" JSONB NOT NULL DEFAULT '[]',
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "scheduledFor" TIMESTAMPTZ,
    "slaDeadline" TIMESTAMPTZ,
    "acceptedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "guestRating" INTEGER,
    "guestFeedback" TEXT,
    "source" VARCHAR(20) NOT NULL DEFAULT 'app',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guestId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "reservationId" UUID,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" VARCHAR(200),
    "referenceId" UUID,
    "expiresAt" DATE,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservationId" UUID NOT NULL,
    "guestId" UUID NOT NULL,
    "orderId" UUID,
    "rating" INTEGER NOT NULL,
    "mood" VARCHAR(20) NOT NULL,
    "categories" JSONB NOT NULL DEFAULT '{}',
    "textNote" TEXT,
    "voiceNoteUrl" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guestId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "waContactId" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "journeyStage" VARCHAR(30),
    "botEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastMessageAt" TIMESTAMPTZ,
    "sessionSentiment" DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    "complaintFlag" BOOLEAN NOT NULL DEFAULT false,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "contextSnapshot" JSONB NOT NULL DEFAULT '[]',
    "assignedAgentId" UUID,
    "reservationId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wa_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "triggerType" VARCHAR(50) NOT NULL,
    "triggerDelayHours" INTEGER NOT NULL DEFAULT 0,
    "targetSegment" JSONB NOT NULL DEFAULT '{}',
    "messageTemplate" TEXT NOT NULL,
    "waTemplateName" VARCHAR(100),
    "abVariant" CHAR(1) NOT NULL DEFAULT 'A',
    "abSplitPct" INTEGER NOT NULL DEFAULT 50,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "repliedCount" INTEGER NOT NULL DEFAULT 0,
    "convertedCount" INTEGER NOT NULL DEFAULT 0,
    "revenueAttributed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipientId" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "payload" JSONB NOT NULL,
    "sentAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_slug_key" ON "properties"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "guests_phone_key" ON "guests"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "guests_email_key" ON "guests"("email");

-- CreateIndex
CREATE INDEX "guests_propertyId_idx" ON "guests"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "staff_propertyId_role_idx" ON "staff"("propertyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_propertyId_roomNumber_key" ON "rooms"("propertyId", "roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_pmsBookingRef_key" ON "reservations"("pmsBookingRef");

-- CreateIndex
CREATE INDEX "reservations_guestId_idx" ON "reservations"("guestId");

-- CreateIndex
CREATE INDEX "reservations_propertyId_status_idx" ON "reservations"("propertyId", "status");

-- CreateIndex
CREATE INDEX "reservations_checkInDate_checkOutDate_idx" ON "reservations"("checkInDate", "checkOutDate");

-- CreateIndex
CREATE INDEX "menu_items_propertyId_category_idx" ON "menu_items"("propertyId", "category");

-- CreateIndex
CREATE INDEX "orders_propertyId_status_idx" ON "orders"("propertyId", "status");

-- CreateIndex
CREATE INDEX "orders_reservationId_idx" ON "orders"("reservationId");

-- CreateIndex
CREATE INDEX "orders_assignedStaffId_status_idx" ON "orders"("assignedStaffId", "status");

-- CreateIndex
CREATE INDEX "loyalty_transactions_guestId_idx" ON "loyalty_transactions"("guestId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_propertyId_type_idx" ON "loyalty_transactions"("propertyId", "type");

-- CreateIndex
CREATE INDEX "loyalty_transactions_expiresAt_isExpired_idx" ON "loyalty_transactions"("expiresAt", "isExpired");

-- CreateIndex
CREATE INDEX "guest_feedback_reservationId_idx" ON "guest_feedback"("reservationId");

-- CreateIndex
CREATE INDEX "guest_feedback_guestId_idx" ON "guest_feedback"("guestId");

-- CreateIndex
CREATE INDEX "wa_conversations_propertyId_status_idx" ON "wa_conversations"("propertyId", "status");

-- CreateIndex
CREATE INDEX "wa_conversations_guestId_idx" ON "wa_conversations"("guestId");

-- CreateIndex
CREATE INDEX "notification_log_recipientId_type_idx" ON "notification_log"("recipientId", "type");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_feedback" ADD CONSTRAINT "guest_feedback_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_feedback" ADD CONSTRAINT "guest_feedback_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wa_conversations" ADD CONSTRAINT "wa_conversations_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wa_conversations" ADD CONSTRAINT "wa_conversations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wa_conversations" ADD CONSTRAINT "wa_conversations_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaigns" ADD CONSTRAINT "crm_campaigns_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

