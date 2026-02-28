import { Server } from "socket.io";
import { getActiveMatch } from "../match/activeMatch.store.js";
import { getRound, removeRound } from "./round.store.js";
import { revealRandomLetter } from "./word.engine.js";
import {
  scheduleNextRound,
  MAX_ROUNDS,
  TARGET_SCORE,
  ROUND_BUFFER_MS,
} from "./round.scheduler.js";
import { completeRoundInDb } from "./round.service.js";
const GUESS_WINDOW = 15000;
import type { RoundWithEngine } from "../../types/types.js";

export function startTickEngine(io: Server, matchId: string) {
  const round = getRound(matchId) as RoundWithEngine;
  if (!round) return;

  // Prevent double intervals for same round instance
  if (round.tickInterval) return;

  round.tickStartedAt = Date.now();
  round.tickEndsAt = round.tickStartedAt + GUESS_WINDOW;

  // First reveal + tick 1
  revealRandomLetter(round.word, round.maskedWord);

  io.to(matchId).emit("tick_update", {
    tick: 1,
    maskedWord: round.maskedWord,
    remainingReveals: countHidden(round.maskedWord),
    guessWindowMs: GUESS_WINDOW,
    tickEndsAt: round.tickEndsAt,
  });

  round.tick = 1;

  round.tickInterval = setInterval(async () => {
    const currentRound = getRound(matchId) as RoundWithEngine;

    // Round replaced/removed -> stop this engine
    if (!currentRound || currentRound !== round) {
      hardStopRound(round, matchId);
      return;
    }

    if (round.isRoundOver) {
      hardStopRound(round, matchId);
      return;
    }

    // Someone guessed correctly (or draw)
    const roundFinishedByGuess = await resolveTickGuesses(io, matchId);
    if (roundFinishedByGuess) {
      hardStopRound(round, matchId);

      const currentMatch = getActiveMatch(matchId);
      if (currentMatch) {
        const shouldEndNow =
          currentMatch.roundNumber >= MAX_ROUNDS ||
          Object.values(currentMatch.scores).some(
            (s) => (s ?? 0) >= TARGET_SCORE,
          );
        console.log("[tick] round ended -> scheduling next", {
          matchId,
          roundNumber: currentMatch.roundNumber,
          scores: currentMatch.scores,
          delay: shouldEndNow ? 0 : ROUND_BUFFER_MS,
        });

        scheduleNextRound(io, currentMatch, shouldEndNow ? 0 : ROUND_BUFFER_MS);
      }

      return;
    }

    // Fully revealed == round over
    if (allRevealed(round.maskedWord)) {
      round.isRoundOver = true;
      round.status = "completed";
      round.winnerId = null;

      await completeRoundInDb(matchId);
      const match = getActiveMatch(matchId);
      if (!round.resultEmitted) {
        round.resultEmitted = true;
        io.to(matchId).emit("round_result", {
          winnerId: null,
          word: round.word,
          scores: match?.scores ?? {},
          reason: "fully_revealed",
        });
      }

      round.guessesThisTick.clear();
      hardStopRound(round, matchId);

      const currentMatch = getActiveMatch(matchId);
      if (currentMatch) {
        const shouldEndNow =
          currentMatch.roundNumber >= MAX_ROUNDS ||
          Object.values(currentMatch.scores).some(
            (s) => (s ?? 0) >= TARGET_SCORE,
          );
        console.log("[tick] round ended -> scheduling next", {
          matchId,
          roundNumber: currentMatch.roundNumber,
          scores: currentMatch.scores,
          delay: shouldEndNow ? 0 : ROUND_BUFFER_MS,
        });

        scheduleNextRound(io, currentMatch, shouldEndNow ? 0 : ROUND_BUFFER_MS);
      }

      return;
    }

    // Next tick
    round.tick++;
    round.guessesThisTick.clear();

    round.tickStartedAt = Date.now();
    round.tickEndsAt = round.tickStartedAt + GUESS_WINDOW;

    revealRandomLetter(round.word, round.maskedWord);

    io.to(matchId).emit("tick_update", {
      tick: round.tick,
      maskedWord: round.maskedWord,
      remainingReveals: countHidden(round.maskedWord),
      guessWindowMs: GUESS_WINDOW,
      tickEndsAt: round.tickEndsAt,
    });
  }, GUESS_WINDOW);
}

async function resolveTickGuesses(
  io: Server,
  matchId: string,
): Promise<boolean> {
  const round = getRound(matchId) as RoundWithEngine;
  const match = getActiveMatch(matchId);
  if (!round || !match) return false;

  if (round.isRoundOver) return false;

  const guesses = Array.from(round.guessesThisTick.values());
  if (!guesses.length) return false;

  const correct = guesses.filter((g) => g.guess.toUpperCase() === round.word);
  if (!correct.length) return false;

  round.isRoundOver = true;
  round.status = "completed";
  round.guessesThisTick.clear();

  // Draw: 2+ players correct in same tick
  if (correct.length >= 2) {
    round.winnerId = null;

    await completeRoundInDb(matchId);

    if (!round.resultEmitted) {
      round.resultEmitted = true;
      io.to(matchId).emit("round_result", {
        winnerId: null,
        word: round.word,
        scores: match.scores,
        reason: "draw_same_tick",
      });
    }

    return true;
  }

  // Single winner: earliest timestamp wins
  const winner = correct.sort((a, b) => a.timestamp - b.timestamp)[0];

  // Safe increment
  match.scores[winner.playerId] = (match.scores[winner.playerId] ?? 0) + 1;
  round.winnerId = winner.playerId;

  await completeRoundInDb(matchId);

  if (!round.resultEmitted) {
    round.resultEmitted = true;
    io.to(matchId).emit("round_result", {
      winnerId: winner.playerId,
      word: round.word,
      scores: match.scores,
      reason: "correct_guess",
    });
  }

  return true;
}

function hardStopRound(round: RoundWithEngine, matchId: string) {
  if (round.tickInterval) {
    clearInterval(round.tickInterval);
    round.tickInterval = undefined;
  }

  round.guessesThisTick.clear();

  // Only remove if the stored round is THIS round instance
  const current = getRound(matchId);
  if (current === round) removeRound(matchId);
}

function countHidden(masked: string[]) {
  return masked.filter((c) => c === "_").length;
}

function allRevealed(masked: string[]) {
  return !masked.includes("_");
}
