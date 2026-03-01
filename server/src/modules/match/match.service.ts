import { prisma } from "../../config/prisma.js";

/**
 * creates a new match in the database with the given player IDs .
 * @param player1Id
 * @param player2Id
 * @returns created match object from the database
 */
export async function createMatch(player1Id: string, player2Id: string) {
  return prisma.match.create({
    data: {
      player1Id,
      player2Id,
    },
  });
}

/**
 *
 * @param playerId
 * @returns The active match object for the given player ID, or null if not found.
 */
export async function findActiveMatchByPlayer(playerId: string) {
  return prisma.match.findFirst({
    where: {
      status: "ongoing",
      OR: [{ player1Id: playerId }, { player2Id: playerId }],
    },
  });
}

/**
 * updates the match in the database to mark it as completed due to a forfeit, setting the winner and final scores.
 * @param params 
 * 
 */
export async function completeMatchForfeitInDb(params: {
  matchId: string;
  winnerId: string;
  score1: number;
  score2: number;
}) {
  const { matchId, winnerId, score1, score2 } = params;
  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "completed",
      winnerId,
      score1,
      score2,
    },
  });
}

/**
 * updates the match in the database to mark it as completed due to abandonment (no winner).
 * @param params 
 */
export async function completeMatchAbandonedInDb(params: {
  matchId: string;
  score1: number;
  score2: number;
}) {
  const { matchId, score1, score2 } = params;
  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "completed",
      winnerId: null,
      score1,
      score2,
    },
  });
}
