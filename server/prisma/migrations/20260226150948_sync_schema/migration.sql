/*
  Warnings:

  - A unique constraint covering the columns `[matchId,roundNumber]` on the table `Round` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `maskedWord` to the `Round` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "winnerId" TEXT;

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "maskedWord" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Round_matchId_idx" ON "Round"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_matchId_roundNumber_key" ON "Round"("matchId", "roundNumber");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
