import { prisma } from "../../config/prisma.js";
/**
 * Persists a player's guess to the database.
 * @param roundId - The ID of the round the guess belongs to.
 * @param playerId - The ID of the player making the guess.
 * @param guess - The player's guess as a string.
 * @param isCorrect - A boolean indicating whether the guess was correct or not.
 * @returns void
 */
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
  } catch (err) {
    throw new Error("Failed to persist guess data to database");
  }
}
