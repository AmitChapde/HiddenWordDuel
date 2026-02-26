import { MatchId } from "../../types/types.js";
import { RoundState } from "../../types/types.js";

const activeRounds = new Map<MatchId, RoundState>();

export function createRound(round: RoundState) {
  activeRounds.set(round.matchId, round);
}

export function getRound(matchId: MatchId) {
  return activeRounds.get(matchId);
}

export function removeRound(matchId: MatchId) {
  activeRounds.delete(matchId);
}

export function hasRound(matchId: MatchId) {
  return activeRounds.has(matchId);
}
