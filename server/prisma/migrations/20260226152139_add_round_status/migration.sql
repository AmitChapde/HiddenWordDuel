-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('active', 'completed');

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "status" "RoundStatus" NOT NULL DEFAULT 'active';
