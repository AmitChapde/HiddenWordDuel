import { Server } from "socket.io";
import { getRound } from "./round.store.js";

/**
 * Handles incoming guesses.
 * This file ONLY:
 * - Validates input
 * - Enforces anti-spam rules
 * - Stores guess for tick arbitration
 *
 * Winner resolution is handled inside tick.engine.ts
 */
export function handleGuess(
  io: Server,
  matchId: string,
  playerId: string,
  guess: string
) {
  const round = getRound(matchId);
  if (!round || round.isRoundOver) return;

  const player = round.players[playerId];
  if (!player) return;

  const currentTick = round.tick;

  // Prevent multiple guesses in same tick
  if (player.lastGuessTick === currentTick) return;

  // Prevent duplicate spam guesses
  if (player.lastGuess === guess) return;

  player.lastGuessTick = currentTick;
  player.lastGuess = guess;

  // Store guess for tick arbitration
  round.guessesThisTick.set(playerId, {
    playerId,
    guess,
    timestamp: Date.now(),
  });
}