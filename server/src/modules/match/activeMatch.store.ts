import { ActiveMatch } from "../../types/types.js";

const activeMatches = new Map<string, ActiveMatch>();

export function createActiveMatch(matchId: string, playerIds: string[]) {
  activeMatches.set(matchId, {
    matchId,
    players: playerIds,
    sockets: new Map(),
    disconnectTimers: new Map(),
  });
}

export function getActiveMatch(matchId: string) {
  return activeMatches.get(matchId);
}

export function findMatchByPlayer(playerId: string) {
  for (const match of activeMatches.values()) {
    if (match.players.includes(playerId)) return match;
  }
  return null;
}

export function removeActiveMatch(matchId: string) {
  activeMatches.delete(matchId);
}
