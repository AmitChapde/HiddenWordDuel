export interface PlayerDTO {
  id: string;
  username: string;
}

export interface MatchFoundPayload {
  matchId: string;
  roomId: string;
  players: PlayerDTO[];
}

export interface RoundStartPayload {
  roundNumber: number;
  wordLength: number;
}

export interface TickPayload {
  maskedWord: string[];
  tickEndsAt: number;
}

export interface RoundResultPayload {
  word: string;
  winnerId: string | null;
  scores: Record<string, number>;
}

export interface MatchEndPayload {
  finalScores: Record<string, number>;
}

export interface ReconnectPayload {
  matchId: string;
  players: PlayerDTO[];
}