import { prisma } from "../../config/prisma.js";
import { getActiveMatch } from "../match/activeMatch.store.js";
import { getRound } from "./round.store.js";
import { RoundState } from "../../types/types.js";

export async function initRoundInDb(matchId: string, roundState: RoundState) {
  const match = getActiveMatch(matchId);
  if (!match) {
    console.warn(`[initRoundInDb] Match not found: ${matchId}`);
    return;
  }

  const roundNumber = match.roundNumber;

  try {
    await prisma.round.upsert({
      where: {
        matchId_roundNumber: { matchId, roundNumber },
      },
      update: {
        word: roundState.word,
        maskedWord: roundState.maskedWord.join(""),
        revealedTiles: roundState.maskedWord.map((c) => c !== "_"),
        status: "active",
        endedAt: null,
        winnerId: null,
      },
      create: {
         id: roundState.id,
        matchId,
        roundNumber,
        word: roundState.word,
        maskedWord: roundState.maskedWord.join(""),
        revealedTiles: roundState.maskedWord.map((c) => c !== "_"),
        status: "active",
      },
    });
    console.log(
      `[initRoundInDb] Round (match=${matchId}, r=${roundNumber}) upserted`,
    );
  } catch (err) {
    console.error(
      `[initRoundInDb] Failed to upsert round for match=${matchId} r=${roundNumber}:`,
      err,
    );
    throw err;
  }
}

export async function completeRoundInDb(matchId: string) {
  const match = getActiveMatch(matchId);
  const round = getRound(matchId);

  if (!match) {
    console.warn(`[completeRoundInDb] No active match found for ${matchId}`);
    return;
  }
  if (!round) {
    console.warn(`[completeRoundInDb] No round found for ${matchId}`);
    return;
  }

  await prisma.round.update({
    where: {
      matchId_roundNumber: {
        matchId,
        roundNumber: match.roundNumber,
      },
    },
    data: {
      revealedTiles: round.maskedWord.map((c) => c !== "_"),
      winnerId: round.winnerId ?? null,
      endedAt: new Date(),
      status: "completed",
    },
  });
  const score1 = match.scores[match.player1Id] ?? 0;
  const score2 = match.scores[match.player2Id] ?? 0;

  await prisma.match.update({
    where: { id: matchId },
    data: { score1, score2 },
  });

  const maxWins = 3;
  const isMatchOver = score1 >= maxWins || score2 >= maxWins;

  if (isMatchOver) {
    const winnerId = score1 > score2 ? match.player1Id : match.player2Id;

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "completed",
        winner: { connect: { id: winnerId } },
      },
    });

    console.log(
      `[completeRoundInDb] Match ${matchId} completed. Winner: ${winnerId}`,
    );
  }
}
