export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Lobby
  JOIN_LOBBY: "join_lobby",
  WAITING: "waiting_for_opponent",
  MATCH_FOUND: "match_found",
  RECONNECTED: "reconnected",

  // Game
  READY: "ready",
  SUBMIT_GUESS: "submit_guess",

  // Runtime
  ROUND_START: "round_start",
  TICK: "tick_update",
  ROUND_RESULT: "round_result",
  MATCH_END: "match_end",
  MATCH_FORFEIT: "match_forfeit",
  MATCH_ABANDONED: "match_abandoned",

  // Resilience
  PLAYER_REJOINED: "player_rejoined",
};
