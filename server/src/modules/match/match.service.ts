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
