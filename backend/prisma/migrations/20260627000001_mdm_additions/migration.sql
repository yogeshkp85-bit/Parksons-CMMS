-- =========================================================================
-- MDM Phase 1+2 Schema Additions
-- Date: 2026-06-27
-- Changes:
--   1. Add 4 missing columns to breakdown_logs
--   2. Create financial_years table
--   3. Create technicians table
-- =========================================================================

-- 1. Add missing columns to breakdown_logs
ALTER TABLE "breakdown_logs"
  ADD COLUMN IF NOT EXISTS "additional_team"  TEXT,
  ADD COLUMN IF NOT EXISTS "problem_reported" TEXT,
  ADD COLUMN IF NOT EXISTS "spare_consumed"   TEXT,
  ADD COLUMN IF NOT EXISTS "end_date"         TIMESTAMP(3);

-- 2. Create financial_years table
CREATE TABLE IF NOT EXISTS "financial_years" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "code"          TEXT NOT NULL,
  "label"         TEXT NOT NULL,
  "start_date"    TIMESTAMP(3) NOT NULL,
  "end_date"      TIMESTAMP(3) NOT NULL,
  "is_current"    BOOLEAN NOT NULL DEFAULT false,
  "is_active"     BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_years_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "financial_years_code_key" ON "financial_years"("code");

-- 3. Create technicians table
CREATE TABLE IF NOT EXISTS "technicians" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "code"          TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "designation"   TEXT,
  "department"    TEXT,
  "phone"         TEXT,
  "is_active"     BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at"    TIMESTAMP(3),
  CONSTRAINT "technicians_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "technicians_code_key" ON "technicians"("code");
