import type { MatchState } from "../types/game";

export const getWinnerName = (match: MatchState, winnerId?: string | null) => {
  //check if winnnerId is provided if match ended due to time running out, if so use that to determine winner instead of score-based logic
  if (winnerId) {
    const player = match.players.find((p) => p.id === winnerId);
    return player?.username ?? "Unknown";
  }

  // Fall back to score-based logic for normal match completion
  if (!match.scores || Object.keys(match.scores).length === 0)
    return "No scores yet";

  const entries = Object.entries(match.scores);
  // Sort descending
  entries.sort((a, b) => b[1] - a[1]);

  const [firstId, firstScore] = entries[0];

  // Check for a tie
  if (entries.length > 1 && firstScore === entries[1][1] && firstScore !== 0) {
    return "It's a Tie!";
  }

  const player = match.players.find((p) => p.id === firstId);
  return player?.username ?? "Unknown";
};
