import { RoundState } from "../../types/types.js";
import { pickRandomWord, maskWord } from "./word.engine.js";

export function createRoundState(
  matchId: string,
  playerIds: string[],
): RoundState {
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
    matchId,
    word,
    maskedWord,
    players,
    tick: 0,
    maxTicks: word.length + 5,
    guessesThisTick: new Map(),
    startedAt: Date.now(),
    isRoundOver: false,
  };
}
