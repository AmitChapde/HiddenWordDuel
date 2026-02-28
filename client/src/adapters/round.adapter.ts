import type { Tile } from "../types/game";

export const maskedWordToTiles = (maskedWord: string[]): Tile[] => {
  return maskedWord.map(char => ({
    letter: char === "_" ? "" : char,
    revealed: char !== "_",
  }));
};  