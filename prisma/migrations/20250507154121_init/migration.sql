/*
  Warnings:

  - The values [COMPLETED,FAILED] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `averageRating` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `totalOrders` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `DeliveryLog` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `DeliveryLog` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `DeliveryLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `DeliveryLog` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `error` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ScheduledReport` table. All the data in the column will be lost.
  - You are about to drop the column `lastRunAt` on the `ScheduledReport` table. All the data in the column will be lost.
  - You are about to drop the column `nextRunAt` on the `ScheduledReport` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `ScheduledReport` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `couriers` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `couriers` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `zones` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `zones` table. All the data in the column will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `message` to the `DeliveryLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `DeliveryLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parameters` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Report` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `format` on the `Report` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `format` to the `ScheduledReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextRunDate` to the `ScheduledReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ScheduledReport` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SALES', 'INVENTORY', 'CUSTOMER', 'COURIER', 'BUSINESS');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('CSV', 'PDF', 'EXCEL');

-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'ACTIVE', 'INACTIVE');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "couriers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "couriers" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TABLE "businesses" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "couriers" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- First create test users if they don't exist
INSERT INTO "users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
SELECT 
  'test-admin-id', 'admin@test.com', 'Test Admin', '$2b$10$DP6a/3DJkPz5cY9HEpzPbOl/y/z7Kj9cDnah2fV4tR7FYhtJ8Vn1u', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'admin@test.com');

INSERT INTO "users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
SELECT 
  'test-business-id', 'business@test.com', 'Test Business', '$2b$10$DP6a/3DJkPz5cY9HEpzPbOl/y/z7Kj9cDnah2fV4tR7FYhtJ8Vn1u', 'BUSINESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'business@test.com');

INSERT INTO "users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
SELECT 
  'test-courier-id', 'courier@test.com', 'Test Courier', '$2b$10$DP6a/3DJkPz5cY9HEpzPbOl/y/z7Kj9cDnah2fV4tR7FYhtJ8Vn1u', 'COURIER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'courier@test.com');

INSERT INTO "users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
SELECT 
  'test-customer-id', 'customer@test.com', 'Test Customer', '$2b$10$DP6a/3DJkPz5cY9HEpzPbOl/y/z7Kj9cDnah2fV4tR7FYhtJ8Vn1u', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'customer@test.com');

-- DropForeignKey
ALTER TABLE "couriers" DROP CONSTRAINT "couriers_userId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_orderId_fkey";

-- DropIndex
DROP INDEX "Customer_createdAt_idx";

-- DropIndex
DROP INDEX "Customer_email_idx";

-- DropIndex
DROP INDEX "Customer_phone_idx";

-- DropIndex
DROP INDEX "DeliveryLog_status_idx";

-- DropIndex
DROP INDEX "Report_createdAt_idx";

-- DropIndex
DROP INDEX "Report_status_idx";

-- DropIndex
DROP INDEX "Report_type_idx";

-- DropIndex
DROP INDEX "Report_userId_idx";

-- DropIndex
DROP INDEX "ScheduledReport_isActive_idx";

-- DropIndex
DROP INDEX "ScheduledReport_nextRunAt_idx";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "averageRating",
DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "totalOrders",
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "userId" TEXT DEFAULT 'test-customer-id',  -- Default for existing rows
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL;

-- Set actual userId for existing data
-- This assumes you have linked users and customer data
-- Update the userId after adding it with default
UPDATE "Customer" SET "userId" = (
  SELECT "id" FROM "users" WHERE "role" = 'CUSTOMER' LIMIT 1
) WHERE "userId" = 'test-customer-id';

-- Now make the column required
ALTER TABLE "Customer" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "DeliveryLog" DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "notes",
DROP COLUMN "status",
ADD COLUMN     "message" TEXT DEFAULT 'Teslimat güncellemesi',  -- Default for existing data
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" TEXT DEFAULT 'UPDATE';  -- Default for existing data

-- Now make the columns required
ALTER TABLE "DeliveryLog" ALTER COLUMN "message" SET NOT NULL;
ALTER TABLE "DeliveryLog" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "description",
DROP COLUMN "error",
DROP COLUMN "fileUrl",
DROP COLUMN "options",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "isScheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT DEFAULT 'Rapor',  -- Default for existing data
ADD COLUMN     "parameters" JSONB DEFAULT '{}',  -- Default for existing data
ADD COLUMN     "resultUrl" TEXT,
ADD COLUMN     "scheduleId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "ReportType" NOT NULL DEFAULT 'SALES',  -- Default enum value
DROP COLUMN "format",
ADD COLUMN     "format" "ReportFormat" NOT NULL DEFAULT 'PDF',  -- Default enum value
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ScheduledReport" DROP COLUMN "description",
DROP COLUMN "lastRunAt",
DROP COLUMN "nextRunAt",
DROP COLUMN "options",
ADD COLUMN     "format" TEXT DEFAULT 'PDF',  -- Default for existing data
ADD COLUMN     "lastRunDate" TIMESTAMP(3),
ADD COLUMN     "nextRunDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 day',  -- Default as tomorrow
ADD COLUMN     "type" TEXT DEFAULT 'SALES';  -- Default for existing data

-- Now make the columns required
ALTER TABLE "ScheduledReport" ALTER COLUMN "format" SET NOT NULL;
ALTER TABLE "ScheduledReport" ALTER COLUMN "nextRunDate" SET NOT NULL;
ALTER TABLE "ScheduledReport" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "couriers" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "availableFrom" TIMESTAMP(3),
ADD COLUMN     "availableTo" TIMESTAMP(3),
ADD COLUMN     "backgroundChecked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentLatitude" DOUBLE PRECISION,
ADD COLUMN     "currentLongitude" DOUBLE PRECISION,
ADD COLUMN     "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "ratings" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "vehicleType" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;

-- AlterTable
ALTER TABLE "zones" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "boundaries" JSONB;

-- DropTable
DROP TABLE "orders";

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "department" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "items" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "customerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "courierId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "zoneId" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "tax_id" TEXT,
    "bank_iban" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- Create test role records
INSERT INTO "Admin" ("id", "userId", "department", "level")
SELECT 'test-admin-record', 'test-admin-id', 'IT', 1
WHERE NOT EXISTS (SELECT 1 FROM "Admin" WHERE "userId" = 'test-admin-id');

INSERT INTO "businesses" ("id", "userId", "name", "status", "createdAt", "updatedAt")
SELECT 'test-business-record', 'test-business-id', 'Test Business', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "businesses" WHERE "userId" = 'test-business-id');

INSERT INTO "couriers" ("id", "userId", "status")
SELECT 'test-courier-record', 'test-courier-id', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM "couriers" WHERE "userId" = 'test-courier-id');

INSERT INTO "Customer" ("id", "userId", "createdAt", "updatedAt")
SELECT 'test-customer-record', 'test-customer-id', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Customer" WHERE "userId" = 'test-customer-id');

-- Remaining migration statements...
