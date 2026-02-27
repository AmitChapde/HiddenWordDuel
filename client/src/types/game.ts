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
  tickEndsAt: number;
}


export interface MatchState {
  matchId: string;
  players: Player[];
  status: string;
  currentRound?: RoundState;
}