export type WaitingPlayer = {
  socketId: string;
  playerId: string;
  username: string;
};

export type ActiveMatch = {
  matchId: string;
  player1Id: string;
  player2Id: string;
  players: string[];
  sockets: Map<string, string>;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  scores: Record<string, number>;
    hasStarted: boolean;
  roundNumber: number;
  nextRoundScheduled?: boolean;
  nextRoundTimer?: NodeJS.Timeout | null;
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
  id: string;
  matchId: MatchId;
  word: string;
  maskedWord: string[];
  players: Record<PlayerId, PlayerRoundState>;
  tick: number;
  maxTicks: number;
  guessesThisTick: Map<PlayerId, TickGuess>;
  startedAt: number;
  tickInterval?: NodeJS.Timeout;
  tickStartedAt?: number;
  tickEndsAt?: number;
  isRoundOver: boolean;
  winnerId: PlayerId | null | undefined;
  status: "active" | "completed";
}
