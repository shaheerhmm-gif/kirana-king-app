-- ROBUST FIX SCRIPT
-- This script checks if things exist before trying to change them.

-- 1. Fix UserRole
DO $$ BEGIN
    -- If 'Role' exists, rename it to 'UserRole'
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        ALTER TYPE "Role" RENAME TO "UserRole";
    -- If 'UserRole' does not exist (and Role didn't either), create it
    ELSIF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('OWNER', 'HELPER');
    END IF;
END $$;

-- 2. Fix LooseLevel
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LooseLevel') THEN
        CREATE TYPE "LooseLevel" AS ENUM ('FULL', 'THREE_QUARTER', 'HALF', 'LOW', 'EMPTY');
    END IF;
END $$;

-- 3. Fix BillFormat
DO $$ BEGIN
    -- Drop the column first to release the type dependency
    ALTER TABLE "BillTemplate" DROP COLUMN IF EXISTS "format";
    -- Drop the old type if it exists
    DROP TYPE IF EXISTS "BillFormat";
    -- Create the new type
    CREATE TYPE "BillFormat" AS ENUM ('THERMAL_58MM', 'THERMAL_80MM', 'A4_SIMPLE', 'A4_DETAILED');
    -- Add the column back
    ALTER TABLE "BillTemplate" ADD COLUMN "format" "BillFormat" NOT NULL DEFAULT 'THERMAL_58MM';
END $$;

-- 4. Fix AnomalyType
DO $$ BEGIN
    ALTER TABLE "AnomalyLog" DROP COLUMN IF EXISTS "type";
    DROP TYPE IF EXISTS "AnomalyType";
    CREATE TYPE "AnomalyType" AS ENUM ('HIGH_VOID_RATE', 'EXCESSIVE_DISCOUNTS', 'CASH_SHORTAGE');
    ALTER TABLE "AnomalyLog" ADD COLUMN "type" "AnomalyType" NOT NULL DEFAULT 'CASH_SHORTAGE';
END $$;

-- 5. Fix AnomalySeverity
DO $$ BEGIN
    ALTER TABLE "AnomalyLog" DROP COLUMN IF EXISTS "severity";
    DROP TYPE IF EXISTS "AnomalySeverity";
    CREATE TYPE "AnomalySeverity" AS ENUM ('WARNING', 'CRITICAL');
    ALTER TABLE "AnomalyLog" ADD COLUMN "severity" "AnomalySeverity" NOT NULL DEFAULT 'WARNING';
END $$;

-- 6. Fix AssetType (Remove extra category column)
ALTER TABLE "AssetType" DROP COLUMN IF EXISTS "category";
DROP TYPE IF EXISTS "AssetCategory";

-- 7. Fix ONDCOrderStatus
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ONDCOrderStatus') THEN
        CREATE TYPE "ONDCOrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');
    END IF;
END $$;

-- 8. Fix CampaignType
DO $$ BEGIN
    ALTER TABLE "Campaign" DROP COLUMN IF EXISTS "type";
    DROP TYPE IF EXISTS "CampaignType";
    CREATE TYPE "CampaignType" AS ENUM ('INACTIVE', 'BIRTHDAY', 'FESTIVAL', 'CUSTOM');
    ALTER TABLE "Campaign" ADD COLUMN "type" "CampaignType" NOT NULL DEFAULT 'CUSTOM';
END $$;

-- 9. Fix CampaignStatus
DO $$ BEGIN
    ALTER TABLE "Campaign" DROP COLUMN IF EXISTS "status";
    ALTER TABLE "CampaignLog" DROP COLUMN IF EXISTS "status";
    DROP TYPE IF EXISTS "CampaignStatus";
    CREATE TYPE "CampaignStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
    ALTER TABLE "Campaign" ADD COLUMN "status" "CampaignStatus" NOT NULL DEFAULT 'PENDING';
    ALTER TABLE "CampaignLog" ADD COLUMN "status" "CampaignStatus" NOT NULL DEFAULT 'PENDING';
END $$;

-- 10. Ensure Store.location exists (Just in case)
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "location" TEXT;
