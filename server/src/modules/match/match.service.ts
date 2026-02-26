import { prisma } from "../../config/prisma.js";

export async function createMatch(player1Id: string, player2Id: string) {
  return prisma.match.create({
    data: {
      player1Id,
      player2Id,
    },
  });
}

export async function findActiveMatchByPlayer(playerId: string) {
  return prisma.match.findFirst({
    where: {
      status: "ongoing",
      OR: [{ player1Id: playerId }, { player2Id: playerId }],
    },
  });
}

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
// complete match due to both players leaving (no winner)
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
