const WORDS = ["APPLE", "GRAPE", "MANGO", "BANANA", "ORANGE", "PAPAYA"];

export function pickRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function maskWord(word: string): string[] {
  return Array.from(word).map(() => "_");
}


// Reveal a random unrevealed index 
export function revealRandomLetter(
  word: string,
  masked: string[]
): number | null {
  const hiddenIndexes: number[] = [];

  masked.forEach((char, i) => {
    if (char === "_") hiddenIndexes.push(i);
  });

  if (!hiddenIndexes.length) return null;

  const index =
    hiddenIndexes[Math.floor(Math.random() * hiddenIndexes.length)];

  masked[index] = word[index];
  return index;
}