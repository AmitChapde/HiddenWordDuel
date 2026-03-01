import { MatchId } from "../../types/types.js";
import { RoundState } from "../../types/types.js";

const activeRounds = new Map<MatchId, RoundState>();

// This file contains functions for managing the in-memory state of active rounds, including creating, retrieving, and removing rounds.


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
