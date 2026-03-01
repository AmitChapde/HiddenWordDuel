export interface Player {
  id: string;
  username: string;
}

export interface Tile {
  letter: string;
  revealed: boolean;
}

export interface RoundState {
  roundNumber: number;
  tiles: Tile[];
  remainingMs: number;
}

export interface MatchState {
  matchId: string;
  players: Player[];
  currentRound?: RoundState;
  scores?: Record<string, number>;
}

export type GamePhase =
  | "LOBBY"
  | "READY"
  | "ROUND_PLAYING"
  | "ROUND_RESULT"
  | "MATCH_END";
