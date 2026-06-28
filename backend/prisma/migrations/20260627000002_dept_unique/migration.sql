-- Add unique constraint to department table (prevents duplicate dept+plant combos)
-- Run this if migration deploy doesn't auto-apply
ALTER TABLE "departments"
  ADD CONSTRAINT IF NOT EXISTS "departments_plant_id_code_key" UNIQUE ("plant_id", "code");
