-- Optional job/department label shown in analyst chat header.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "job" TEXT;
