import { RoundState } from "../../types/types.js";
import { pickRandomWord, maskWord } from "./word.engine.js";
import { randomUUID } from "crypto";
/**
 * creates the initial state for a new round
 * @param matchId 
 * @param playerIds 
 * @returns The initial state for a new round
 */
export function createRoundState(
  matchId: string,
  playerIds: string[],
): RoundState {
  const id = randomUUID();
  const word = pickRandomWord();
  const maskedWord = maskWord(word);

  const players: RoundState["players"] = {};

  playerIds.forEach((id) => {
    players[id] = {
      playerId: id,
      score: 0,
      lastGuessTick: -1,
    };
  });

  return {
    id,
    matchId,
    word,
    maskedWord,
    players,
    tick: 0,
    maxTicks: word.length + 5,
    guessesThisTick: new Map(),
    startedAt: Date.now(),
    isRoundOver: false,
    winnerId: undefined, 
    status:"active"
  };
}
