/*
  Warnings:

  - You are about to drop the column `intrestedTopics` on the `UserPreferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserPreferences" DROP COLUMN "intrestedTopics",
ADD COLUMN     "interestedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
