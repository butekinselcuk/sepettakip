-- SepetTakip Staging Veritabanı Migrasyon Scripti
-- Bu script, Prisma şemasındaki tüm tabloları ve ilişkileri oluşturur.

-- PostgreSQL tipi uzantıları aktif et
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum tipleri
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationtype') THEN
        CREATE TYPE "NotificationType" AS ENUM (
            'ORDER_PLACED', 'ORDER_ACCEPTED', 'ORDER_READY', 'ORDER_DELIVERED',
            'ORDER_CANCELLED', 'COURIER_ASSIGNED', 'PAYMENT_PROCESSED',
            'REVIEW_REQUESTED', 'SYSTEM_NOTIFICATION'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationchannel') THEN
        CREATE TYPE "NotificationChannel" AS ENUM (
            'EMAIL', 'PUSH', 'SMS'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationfrequency') THEN
        CREATE TYPE "NotificationFrequency" AS ENUM (
            'INSTANT', 'DAILY', 'WEEKLY', 'MONTHLY'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE "Role" AS ENUM (
            'ADMIN', 'BUSINESS', 'COURIER', 'CUSTOMER'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
        CREATE TYPE "Status" AS ENUM (
            'PENDING', 'PROCESSING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED',
            'CANCELLED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'RETURNED', 'REFUNDED',
            'PARTIALLY_REFUNDED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reporttype') THEN
        CREATE TYPE "ReportType" AS ENUM (
            'DAILY_PERFORMANCE', 'WEEKLY_SUMMARY', 'MONTHLY_ANALYTICS',
            'CUSTOM', 'COURIER_PERFORMANCE', 'BUSINESS_PERFORMANCE'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reportformat') THEN
        CREATE TYPE "ReportFormat" AS ENUM (
            'PDF', 'CSV', 'EXCEL', 'HTML'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'courieravailabilitystatus') THEN
        CREATE TYPE "CourierAvailabilityStatus" AS ENUM (
            'AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deliverypriority') THEN
        CREATE TYPE "DeliveryPriority" AS ENUM (
            'LOW', 'MEDIUM', 'HIGH', 'URGENT'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentmethod') THEN
        CREATE TYPE "PaymentMethod" AS ENUM (
            'CREDIT_CARD', 'CASH', 'TRANSFER', 'MOBILE_PAYMENT'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM (
            'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'courierstatus') THEN
        CREATE TYPE "CourierStatus" AS ENUM (
            'ACTIVE', 'BUSY', 'INACTIVE', 'OFFLINE'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform') THEN
        CREATE TYPE "Platform" AS ENUM (
            'WEB', 'YEMEKSEPETI', 'GETIR', 'TRENDYOL'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refundrequeststatus') THEN
        CREATE TYPE "RefundRequestStatus" AS ENUM (
            'PENDING', 'APPROVED', 'PARTIAL_APPROVED', 'REJECTED', 'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cancellationrequeststatus') THEN
        CREATE TYPE "CancellationRequestStatus" AS ENUM (
            'PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPROVED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refundreason') THEN
        CREATE TYPE "RefundReason" AS ENUM (
            'DAMAGED_PRODUCT', 'WRONG_PRODUCT', 'PRODUCT_NOT_AS_DESCRIBED',
            'MISSING_ITEMS', 'LATE_DELIVERY', 'QUALITY_ISSUES', 'OTHER'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cancellationreason') THEN
        CREATE TYPE "CancellationReason" AS ENUM (
            'CUSTOMER_CHANGED_MIND', 'DUPLICATE_ORDER', 'DELIVERY_TOO_LONG',
            'PRICE_ISSUES', 'RESTAURANT_CLOSED', 'OUT_OF_STOCK', 'OTHER'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriptionstatus') THEN
        CREATE TYPE "SubscriptionStatus" AS ENUM (
            'ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED', 'TRIAL', 'EXPIRED', 'PENDING'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscriptioninterval') THEN
        CREATE TYPE "SubscriptionInterval" AS ENUM (
            'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cardbrand') THEN
        CREATE TYPE "CardBrand" AS ENUM (
            'VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'TROY', 'OTHER'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentprovider') THEN
        CREATE TYPE "PaymentProvider" AS ENUM (
            'STRIPE', 'IYZICO', 'PAYPAL', 'MANUAL'
        );
    END IF;
END $$;

-- Tablo Oluşturma İşlemleri

-- Kullanıcılar Tablosu
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Admin Tablosu
CREATE TABLE IF NOT EXISTS "admins" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL,
    "department" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "permissions" TEXT[] DEFAULT '{}',
    "title" TEXT,
    "phone" TEXT,
    "profileImage" TEXT,
    "lastLogin" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "ipRestrictions" TEXT[] DEFAULT '{}',
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Kurye Tablosu
CREATE TABLE IF NOT EXISTS "couriers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "vehicleType" TEXT,
    "phone" TEXT,
    "zoneId" UUID,
    "ratings" DOUBLE PRECISION DEFAULT 0,
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "backgroundChecked" BOOLEAN NOT NULL DEFAULT false,
    "maxDeliveriesPerDay" INTEGER NOT NULL DEFAULT 15,
    "maxDistance" DOUBLE PRECISION,
    "averageSpeed" DOUBLE PRECISION,
    "courierFee" DOUBLE PRECISION,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Müşteri Tablosu
CREATE TABLE IF NOT EXISTS "customers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Bölge Tablosu
CREATE TABLE IF NOT EXISTS "zones" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coordinates" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "averageDeliveryTime" INTEGER,
    "orderVolume" INTEGER,
    "activeBusinesses" INTEGER
);

-- İşletme Tablosu
CREATE TABLE IF NOT EXISTS "businesses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "zoneId" UUID,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "rating" DOUBLE PRECISION,
    "tax_id" TEXT,
    "bank_iban" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "openingTime" TEXT,
    "closingTime" TEXT,
    "deliveryRadius" DOUBLE PRECISION,
    "deliveryFee" DOUBLE PRECISION,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "type" TEXT,
    "tags" TEXT[] DEFAULT '{}',
    "features" TEXT[] DEFAULT '{}',
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("zoneId") REFERENCES "zones"("id")
);

-- Sipariş Tablosu
CREATE TABLE IF NOT EXISTS "orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    "customerId" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "courierId" UUID,
    "priority" "DeliveryPriority" NOT NULL DEFAULT 'MEDIUM',
    "timeWindowId" UUID,
    "estimatedDuration" INTEGER,
    "estimatedDistance" DOUBLE PRECISION,
    "sequenceNumber" INTEGER,
    "refundStatus" TEXT,
    "cancellationStatus" TEXT,
    FOREIGN KEY ("customerId") REFERENCES "customers"("id"),
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id"),
    FOREIGN KEY ("courierId") REFERENCES "couriers"("id")
);

-- İade ve İptal İşlemleri

CREATE TABLE IF NOT EXISTS "refund_policies" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "businessId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "autoApproveTimeline" INTEGER,
    "timeLimit" INTEGER,
    "orderStatusRules" JSONB,
    "productRules" JSONB,
    "cancellationFees" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
);

CREATE TABLE IF NOT EXISTS "refund_requests" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "status" "RefundRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "RefundReason" NOT NULL,
    "otherReason" TEXT,
    "requestedItems" JSONB,
    "refundAmount" DOUBLE PRECISION,
    "approvedAmount" DOUBLE PRECISION,
    "evidenceUrls" TEXT[] DEFAULT '{}',
    "adminNotes" TEXT,
    "customerNotes" TEXT,
    "businessNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "refundedAt" TIMESTAMP(3),
    FOREIGN KEY ("orderId") REFERENCES "orders"("id"),
    FOREIGN KEY ("customerId") REFERENCES "customers"("id"),
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
);

CREATE TABLE IF NOT EXISTS "cancellation_requests" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "status" "CancellationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" "CancellationReason" NOT NULL,
    "otherReason" TEXT,
    "cancellationFee" DOUBLE PRECISION,
    "autoProcessed" BOOLEAN NOT NULL DEFAULT false,
    "customerNotes" TEXT,
    "businessNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "cancelledAt" TIMESTAMP(3),
    FOREIGN KEY ("orderId") REFERENCES "orders"("id"),
    FOREIGN KEY ("customerId") REFERENCES "customers"("id"),
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
);

-- Abonelik ve Ödeme İşlemleri

CREATE TABLE IF NOT EXISTS "subscription_plans" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "interval" "SubscriptionInterval" NOT NULL DEFAULT 'MONTHLY',
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "trialPeriodDays" INTEGER,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "businessId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
);

CREATE TABLE IF NOT EXISTS "saved_payment_methods" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "customerId" UUID NOT NULL,
    "cardBrand" "CardBrand",
    "last4" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "cardholderName" TEXT,
    "token" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "nickname" TEXT,
    "billingAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("customerId") REFERENCES "customers"("id")
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "customerId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "trialEndDate" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "resumeAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "nextBillingDate" TIMESTAMP(3),
    "savedPaymentMethodId" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "externalId" TEXT,
    "businessId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("customerId") REFERENCES "customers"("id"),
    FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id"),
    FOREIGN KEY ("savedPaymentMethodId") REFERENCES "saved_payment_methods"("id"),
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
);

CREATE TABLE IF NOT EXISTS "recurring_payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subscriptionId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "savedPaymentMethodId" UUID,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "processedDate" TIMESTAMP(3),
    "failedDate" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryDate" TIMESTAMP(3),
    "externalId" TEXT,
    "receipt" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id"),
    FOREIGN KEY ("savedPaymentMethodId") REFERENCES "saved_payment_methods"("id")
);

-- İndeksler
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "businesses_status_idx" ON "businesses"("status");
CREATE INDEX IF NOT EXISTS "businesses_name_idx" ON "businesses"("name");
CREATE INDEX IF NOT EXISTS "businesses_location_idx" ON "businesses"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "customers_location_idx" ON "customers"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_customer_idx" ON "orders"("customerId");
CREATE INDEX IF NOT EXISTS "orders_business_idx" ON "orders"("businessId");
CREATE INDEX IF NOT EXISTS "orders_courier_idx" ON "orders"("courierId");
CREATE INDEX IF NOT EXISTS "orders_location_idx" ON "orders"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "orders_created_idx" ON "orders"("createdAt");
CREATE INDEX IF NOT EXISTS "refund_requests_status_idx" ON "refund_requests"("status");
CREATE INDEX IF NOT EXISTS "cancellation_requests_status_idx" ON "cancellation_requests"("status");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX IF NOT EXISTS "recurring_payments_status_idx" ON "recurring_payments"("status"); 