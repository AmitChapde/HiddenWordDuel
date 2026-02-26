export type WaitingPlayer = {
  socketId: string;
  playerId: string;
  username: string;
};

export type ActiveMatch = {
  matchId: string;
  players: string[];
  sockets: Map<string, string>;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  scores: Record<string, number>;
  roundNumber: number;
  nextRoundScheduled?: boolean;
};

export type PlayerId = string;
export type MatchId = string;

export interface PlayerRoundState {
  playerId: PlayerId;
  score: number;
  lastGuessTick: number;
  lastGuess?: string;
}

export interface TickGuess {
  playerId: PlayerId;
  guess: string;
  timestamp: number;
}

export interface RoundState {
  matchId: MatchId;
  word: string;
  maskedWord: string[];
  players: Record<PlayerId, PlayerRoundState>;
  tick: number;
  maxTicks: number;
  guessesThisTick: Map<PlayerId, TickGuess>;
  startedAt: number;
  tickInterval?: NodeJS.Timeout;
  isRoundOver: boolean;
}
