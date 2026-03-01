import { WORDS } from "../dictionary/word.dictionary.js";

/**
 * @returns  random word from the dictionary and returns it
 *
 */
export function pickRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * @returns an array of underscores with the same length as the input word, representing the masked version of the word
 *
 */
export function maskWord(word: string): string[] {
  return Array.from(word).map(() => "_");
}

/**
 * @returns index of the letter that was revealed, or null if all letters are already revealed
 *
 */
export function revealRandomLetter(
  word: string,
  masked: string[],
): number | null {
  const hiddenIndexes: number[] = [];

  masked.forEach((char, i) => {
    if (char === "_") hiddenIndexes.push(i);
  });

  if (!hiddenIndexes.length) return null;

  const index = hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)];

  masked[index] = word[index];
  return index;
}
