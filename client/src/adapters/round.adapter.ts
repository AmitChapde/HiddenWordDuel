import type { Tile } from "../types/game";

export const createInitialTiles = (wordLength: number): Tile[] => {
  return Array.from({ length: wordLength }, () => ({
    letter: "",
    revealed: false,
  }));
};

export const maskedWordToTiles = (maskedWord: string[]): Tile[] => {
  return maskedWord.map((char) => ({
    letter: char === "_" ? "" : char,
    revealed: char !== "_",
  }));
};