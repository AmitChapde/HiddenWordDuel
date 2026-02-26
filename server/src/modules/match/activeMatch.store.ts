import { ActiveMatch } from "../../types/types.js";

const activeMatches = new Map<string, ActiveMatch>();
const playerToMatch = new Map<string, string>();

export function createActiveMatch(matchId: string, playerIds: string[]) {
  const scores: Record<string, number> = {};
  playerIds.forEach((p) => (scores[p] = 0));

  const match: ActiveMatch = {
    matchId,
    players: playerIds,
    sockets: new Map(),
    disconnectTimers: new Map(),
    scores,
    roundNumber: 1,
    nextRoundScheduled: false,
  };
  activeMatches.set(matchId, match);
  playerIds.forEach((pid) => playerToMatch.set(pid, matchId));
}

export function getActiveMatch(matchId: string) {
  return activeMatches.get(matchId);
}

export function findMatchByPlayer(playerId: string) {
  const matchId = playerToMatch.get(playerId);
  if (!matchId) return null;
  return activeMatches.get(matchId) || null;
}

export function removeActiveMatch(matchId: string) {
  const match = activeMatches.get(matchId);
  if (!match) return;
  match.players.forEach((pid) => playerToMatch.delete(pid));
  match.disconnectTimers.forEach((t) => clearTimeout(t));

  activeMatches.delete(matchId);
}
