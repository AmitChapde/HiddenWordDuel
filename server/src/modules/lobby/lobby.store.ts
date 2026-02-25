import { WaitingPlayer } from "../../types/types.js";

const waitingPlayers: WaitingPlayer[] = [];

/**
 * Add player to waiting lobby
 */
export function addToLobby(player: WaitingPlayer) {
  waitingPlayers.push(player);
}

/**
 * Remove player from lobby
 */
export function removeFromLobby(socketId: string) {
  const index = waitingPlayers.findIndex((p) => p.socketId === socketId);
  if (index !== -1) waitingPlayers.splice(index, 1);
}

/**
 * Get two players if available
 */
export function getMatchPair(): WaitingPlayer[] | null {
  if (waitingPlayers.length >= 2) {
    const player1 = waitingPlayers.shift();
    const player2 = waitingPlayers.shift();

    if (player1 && player2) {
      return [player1, player2];
    }
  }
  return null;
}

/**
 * Get number of players
 */
export function lobbySize() {
  return waitingPlayers.length;
}
