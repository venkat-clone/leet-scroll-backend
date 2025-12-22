-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN     "intrestedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
