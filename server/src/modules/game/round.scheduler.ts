import { Server } from "socket.io";
import { createRoundState } from "./round.factory.js";
import { createRound } from "./round.store.js";
import { startTickEngine } from "./tick.engine.js";
import { getActiveMatch } from "../match/activeMatch.store.js";

const ROUND_BUFFER = 6000;

/**
 * Schedules next round safely
 * Guards against:
 * - Zombie timers
 * - Match-end races
 * - Duplicate scheduling
 */
export function scheduleNextRound(io: Server, match: any) {
  if (!match) return;

  const matchId = match.matchId;

  if (match.nextRoundScheduled) return;
  match.nextRoundScheduled = true;

  setTimeout(() => {
    const current = getActiveMatch(matchId);

    // Match deleted → stop
    if (!current) return;

    // Stale reference → stop
    if (current !== match) return;

    current.nextRoundScheduled = false;

    current.roundNumber += 1;

    const round = createRoundState(matchId, current.players);
    createRound(round);

    io.to(matchId).emit("round_start", {
      roundNumber: current.roundNumber,
      wordLength: round.word.length,
      scores: current.scores,
    });

    startTickEngine(io, matchId);
  }, ROUND_BUFFER);
}