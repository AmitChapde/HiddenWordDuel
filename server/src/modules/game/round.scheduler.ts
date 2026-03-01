import { Server } from "socket.io";
import { ActiveMatch } from "../../types/types.js";
import {
  getActiveMatch,
  removeActiveMatch,
} from "../match/activeMatch.store.js";
import { getRound, createRound } from "./round.store.js";
import { createRoundState } from "../game/round.factory.js";
import { initRoundInDb } from "./round.service.js";
import { startTickEngine } from "./tick.engine.js";

export const ROUND_BUFFER_MS = 3000;
export const MAX_ROUNDS = 5;
export const TARGET_SCORE = 3;

//gets the winner based on current scores, returns null if tie
function getWinnerByScore(match: ActiveMatch): string | null {
  const [p1, p2] = match.players;
  const s1 = match.scores[p1] ?? 0;
  const s2 = match.scores[p2] ?? 0;
  if (s1 === s2) return null;
  return s1 > s2 ? p1 : p2;
}

function hasReachedTargetScore(match: ActiveMatch): boolean {
  return Object.values(match.scores).some((s) => (s ?? 0) >= TARGET_SCORE);
}

/**
 * @param io - The Socket.IO server instance for emitting events.
 * @param match - The active match for which to schedule the next round.
 * @param delayMs - Optional delay in milliseconds before starting the next round
 * @returns void
 */

export function scheduleNextRound(
  io: Server,
  match: ActiveMatch,
  delayMs: number = ROUND_BUFFER_MS,
) {
  if (match.nextRoundScheduled) return;
  match.nextRoundScheduled = true;

  // Cancel any previous timer just in case
  if (match.nextRoundTimer) clearTimeout(match.nextRoundTimer);

  match.nextRoundTimer = setTimeout(async () => {
    try {
      const currentMatch = getActiveMatch(match.matchId);
      if (!currentMatch) return;

      if (
        currentMatch.roundNumber >= MAX_ROUNDS ||
        hasReachedTargetScore(currentMatch)
      ) {
        const winnerId = getWinnerByScore(currentMatch);

        io.to(currentMatch.matchId).emit("match_end", {
          winnerId,
          finalScores: currentMatch.scores,
          reason:
            currentMatch.roundNumber >= MAX_ROUNDS
              ? "max_rounds"
              : "target_score",
        });

        removeActiveMatch(currentMatch.matchId);
        return;
      }

      // If a round is currently active, do not start another
      const existingRound = getRound(currentMatch.matchId);
      if (existingRound && !existingRound.isRoundOver) return;

      // Start next round
      const round = createRoundState(
        currentMatch.matchId,
        currentMatch.players,
      );
      createRound(round);

      currentMatch.roundNumber += 1;

      await initRoundInDb(currentMatch.matchId, round);

      io.to(currentMatch.matchId).emit("round_start", {
        roundNumber: currentMatch.roundNumber,
        wordLength: round.word.length,
      });

      startTickEngine(io, currentMatch.matchId);
    } catch (err) {
      io.to(match.matchId).emit("server_error", {
        message: "Failed to start next round.",
      });
    } finally {
      //ensures that even if there was an error, the nextRoundScheduled flag is reset so future rounds can be attempted
      const m = getActiveMatch(match.matchId);
      if (m) {
        m.nextRoundScheduled = false;
        m.nextRoundTimer = null;
      }
    }
  }, delayMs);
}
