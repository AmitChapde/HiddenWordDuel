import { Server } from "socket.io";
import { getRound } from "./round.store.js";
import { persistGuess } from "./guess.service.js";
import { getActiveMatch } from "../match/activeMatch.store.js";

// export async function handleGuess(
//   io: Server,
//   matchId: string,
//   playerId: string,
//   guess: string,
// ) {
//   console.log("[handleGuess] fired", { matchId, playerId, guess });
//   const round = getRound(matchId);
//   if (!round || round.isRoundOver) return;

//   const match = getActiveMatch(matchId);
//   if (!match) return;

//   const player = round.players[playerId];
//   if (!player) return;

//   const now = Date.now();

//   if (
//     typeof (round as any).tickEndsAt === "number" &&
//     now > (round as any).tickEndsAt
//   ) {
//     io.to(matchId).emit("guess_rejected", {
//       playerId,
//       reason: "late_submission",
//     });
//     return;
//   }

//   const currentTick = round.tick;

//   // One guess per tick (keep)
//   if (player.lastGuessTick === currentTick) return;

//   const normalizedGuess = String(guess).trim().toUpperCase();
//   player.lastGuessTick = currentTick;
//   player.lastGuess = normalizedGuess;

//   const isCorrect = normalizedGuess === round.word;

//   const roundId = round.id;

//   console.log("[persistGuess] about to save", {
//     roundId,
//     playerId,
//     normalizedGuess,
//     isCorrect,
//   });

//   // Persist guess
//   await persistGuess({
//     roundId,
//     playerId,
//     guess: normalizedGuess,
//     isCorrect,
//   });

//   round.guessesThisTick.set(playerId, {
//     playerId,
//     guess: normalizedGuess,
//     timestamp: now,
//   });
// }
export async function handleGuess(
  io: Server,
  matchId: string,
  playerId: string,
  guess: string,
) {
  console.log("[handleGuess] fired", { matchId, playerId, guess });
  const round = getRound(matchId);
  // 1. Safety check: prevent guesses if round is null or already finished
  if (!round || round.isRoundOver) return;

  const match = getActiveMatch(matchId);
  if (!match) return;

  const player = round.players[playerId];
  if (!player) return;

  const now = Date.now();

  // 2. Time-based validation
  if (
    typeof (round as any).tickEndsAt === "number" &&
    now > (round as any).tickEndsAt
  ) {
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

  // 3. Save to Database (Keeping your existing logic)
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
