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
};
