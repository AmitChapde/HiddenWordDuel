import { Server } from "socket.io";
import {
  getActiveMatch,
  removeActiveMatch,
} from "../match/activeMatch.store.js";
import { getRound, removeRound } from "./round.store.js";
import { revealRandomLetter } from "./word.engine.js";
import { scheduleNextRound } from "./round.scheduler.js";

const GUESS_WINDOW = 15000;

/**
 * Starts authoritative tick loop
 */
export function startTickEngine(io: Server, matchId: string) {
  const round = getRound(matchId);
  const match = getActiveMatch(matchId);
  if (!round || !match) return;

  // Prevent duplicate engines
  if (round.tickInterval) return;

  // First reveal
  revealRandomLetter(round.word, round.maskedWord);

  io.to(matchId).emit("tick_update", {
    tick: 1,
    maskedWord: round.maskedWord,
    remainingReveals: countHidden(round.maskedWord),
    guessWindowMs: GUESS_WINDOW,
  });

  round.tick = 1;

  round.tickInterval = setInterval(() => {
    const currentRound = getRound(matchId);

    //  Zombie interval guard
    if (!currentRound || currentRound !== round) {
      hardStopRound(round, matchId);
      return;
    }

    // If already ended, stop
    if (round.isRoundOver) {
      hardStopRound(round, matchId);
      return;
    }

    //  ARBITRATE PREVIOUS TICK
    if (resolveTickGuesses(io, matchId)) {
      hardStopRound(round, matchId);
      return;
    }

    // Fully revealed = draw
    if (allRevealed(round.maskedWord)) {
      round.isRoundOver = true;

      io.to(matchId).emit("round_result", {
        winnerId: null,
        word: round.word,
        scores: match.scores,
        reason: "fully_revealed",
      });

      round.guessesThisTick.clear();
      hardStopRound(round, matchId);

      if (getActiveMatch(matchId)) {
        scheduleNextRound(io, match);
      }
      return;
    }

    // Next tick
    round.tick++;
    round.guessesThisTick.clear();

    revealRandomLetter(round.word, round.maskedWord);

    io.to(matchId).emit("tick_update", {
      tick: round.tick,
      maskedWord: round.maskedWord,
      remainingReveals: countHidden(round.maskedWord),
      guessWindowMs: GUESS_WINDOW,
    });
  }, GUESS_WINDOW);
}

/**
 * Winner / draw resolver (SAFE VERSION)
 */
function resolveTickGuesses(io: Server, matchId: string): boolean {
  const round = getRound(matchId);
  const match = getActiveMatch(matchId);
  if (!round || !match) return false;

  const guesses = Array.from(round.guessesThisTick.values());
  if (!guesses.length) return false;

  const correct = guesses.filter(
    (g) => g.guess.toUpperCase() === round.word
  );
  if (!correct.length) return false;

  // Atomic stop
  round.isRoundOver = true;
  round.guessesThisTick.clear();

  // Same-tick draw
  if (correct.length > 1) {
    const diff = Math.abs(correct[0].timestamp - correct[1].timestamp);
    if (diff <= 5) {
      io.to(matchId).emit("round_result", {
        winnerId: null,
        word: round.word,
        scores: match.scores,
        reason: "draw_same_tick",
      });

      scheduleNextRound(io, match);
      return true;
    }
  }

  // Single winner
  const winner = correct.sort((a, b) => a.timestamp - b.timestamp)[0];
  match.scores[winner.playerId] += 1;

  io.to(matchId).emit("round_result", {
    winnerId: winner.playerId,
    word: round.word,
    scores: match.scores,
  });

  //  MATCH END HARD STOP
  if (match.scores[winner.playerId] >= 3) {
    io.to(matchId).emit("match_end", {
      winnerId: winner.playerId,
      finalScores: match.scores,
    });

    hardTerminateMatch(round, matchId);
    return true;
  }

  scheduleNextRound(io, match);
  return true;
}

/**
 * Hard stop for a round
 */
function hardStopRound(round: any, matchId: string) {
  if (round.tickInterval) {
    clearInterval(round.tickInterval);
    round.tickInterval = undefined;
  }

  round.guessesThisTick.clear();
  removeRound(matchId);
}

/**
 * Hard stop entire match
 */
function hardTerminateMatch(round: any, matchId: string) {
  if (round.tickInterval) {
    clearInterval(round.tickInterval);
    round.tickInterval = undefined;
  }

  round.guessesThisTick.clear();
  removeRound(matchId);
  removeActiveMatch(matchId);
}

/**
 * Helpers
 */
function countHidden(masked: string[]) {
  return masked.filter((c) => c === "_").length;
}

function allRevealed(masked: string[]) {
  return !masked.includes("_");
}