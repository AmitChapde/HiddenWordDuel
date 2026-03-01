import { ActiveMatch } from "../../types/types.js";

const activeMatches = new Map<string, ActiveMatch>();
const playerToMatch = new Map<string, string>();

/**
 * Creates a new active match and stores it in memory.
 * @param matchId - Unique identifier for the match.
 * @param player1Id - ID of the first player.
 * @param player2Id - ID of the second player.
 * @returns void  
 */
export function createActiveMatch(
  matchId: string,
  player1Id: string,
  player2Id: string,
) {
  const players = [player1Id, player2Id];

  const scores: Record<string, number> = {
    [player1Id]: 0,
    [player2Id]: 0,
  };

  const match: ActiveMatch = {
    matchId,
    player1Id,
    player2Id,
    players,
    sockets: new Map(),
    disconnectTimers: new Map(),
    scores,
    roundNumber: 0,
    hasStarted: false,
    nextRoundScheduled: false,
    nextRoundTimer: null,
  };

  activeMatches.set(matchId, match);

  players.forEach((pid) => playerToMatch.set(pid, matchId));
}

/**
 *
 * @param matchId
 * @returns The active match object for the given matchId, or undefined if not found.
 */

export function getActiveMatch(matchId: string): ActiveMatch | undefined {
  return activeMatches.get(matchId);
}
/**
 * Finds the active match for a given player ID.
 * @param playerId
 * @returns The active match object for the given player ID, or null if not found.
 */

export function findMatchByPlayer(playerId: string): ActiveMatch | null {
  const matchId = playerToMatch.get(playerId);
  if (!matchId) return null;
  return activeMatches.get(matchId) || null;
}

/** Removes an active match from memory and cleans up any associated timers or references.
 * @param matchId - The ID of the match to remove.
 */
export function removeActiveMatch(matchId: string) {
  const match = activeMatches.get(matchId);
  if (!match) return;
  match.players.forEach((pid) => playerToMatch.delete(pid));
  match.disconnectTimers.forEach((timer) => clearTimeout(timer));
  if (match.nextRoundTimer) clearTimeout(match.nextRoundTimer);
  activeMatches.delete(matchId);
}
