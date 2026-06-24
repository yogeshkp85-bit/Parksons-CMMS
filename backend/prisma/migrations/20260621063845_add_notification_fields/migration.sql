/*
  Warnings:

  - You are about to drop the column `isRead` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_email` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "isRead",
DROP COLUMN "userId",
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "machine" TEXT,
ADD COLUMN     "ref_id" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "tenant_id" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "user_email" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_user_email_is_read_idx" ON "notifications"("user_email", "is_read");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");
