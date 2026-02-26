import { prisma } from "../../config/prisma.js";

export async function persistGuess({
  roundId,
  playerId,
  guess,
  isCorrect,
}: {
  roundId: string;
  playerId: string;
  guess: string;
  isCorrect: boolean;
}) {
  try {
    
    await prisma.guess.create({
      data: {
        roundId,
        playerId,
        guess,
        isCorrect,
      },
    });
     console.log("[persistGuess] success");
  } catch (err) {
    console.error("Guess persistence failed:", err);
  }
}