import { Server } from "socket.io";
import { getRound } from "./round.store.js";
import { persistGuess } from "./guess.service.js";
import { getActiveMatch } from "../match/activeMatch.store.js";

/** This handler is responsible for processing player guesses during an active round.
 * @param io - The Socket.IO server instance for emitting events.
 * @param matchId - The ID of the match the guess belongs to.
 * @param playerId - The ID of the player making the guess.
 * @param guess - The player's guess as a string.
 * @returns void
 */

export async function handleGuess(
  io: Server,
  matchId: string,
  playerId: string,
  guess: string,
) {
  const round = getRound(matchId);
  // Safety check: prevent guesses if round is null or already finished
  if (!round || round.isRoundOver) return;

  const match = getActiveMatch(matchId);
  if (!match) return;

  const player = round.players[playerId];
  if (!player) return;

  const now = Date.now();

  // Time-based validation for late guesses
  if (typeof round.tickEndsAt === "number" && now > round.tickEndsAt) {
    io.to(matchId).emit("guess_rejected", {
      playerId,
      reason: "late_submission",
    });
    return;
  }

  const currentTick = round.tick;
  if (player.lastGuessTick === currentTick) return;

  const normalizedGuess = String(guess).trim().toUpperCase();
  player.lastGuessTick = currentTick;
  player.lastGuess = normalizedGuess;

  const isCorrect = normalizedGuess === round.word;
  const roundId = round.id;

  // Save to Database
  await persistGuess({
    roundId,
    playerId,
    guess: normalizedGuess,
    isCorrect,
  });

  round.guessesThisTick.set(playerId, {
    playerId,
    guess: normalizedGuess,
    timestamp: now,
  });
}
