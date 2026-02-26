
const readyMap = new Map<string, Set<string>>();

export function markPlayerReady(matchId: string, playerId: string) {
  if (!readyMap.has(matchId)) {
    readyMap.set(matchId, new Set());
  }
  readyMap.get(matchId)!.add(playerId);
}

export function getReadyPlayers(matchId: string) {
  return readyMap.get(matchId) || new Set();
}

export function clearReady(matchId: string) {
  readyMap.delete(matchId);
}