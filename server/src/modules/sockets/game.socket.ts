import { Server, Socket } from "socket.io";
import { findOrCreatePlayer } from "../player/player.service.js";
import {
  addToLobby,
  getMatchPair,
  removeFromLobby,
} from "../lobby/lobby.store.js";
import { createMatch } from "../match/match.service.js";
import {
  createActiveMatch,
  findMatchByPlayer,
  getActiveMatch,
  removeActiveMatch,
} from "../match/activeMatch.store.js";
import {
  markPlayerReady,
  getReadyPlayers,
  clearReady,
} from "../game/ready.store.js";
import { createRoundState } from "../game/round.factory.js";
import { createRound } from "../game/round.store.js";
import { startTickEngine } from "../game/tick.engine.js";
import { handleGuess } from "../game/guess.handler.js";

export function registerGameSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    //Join Lobby
    socket.on("join_lobby", async ({ username }) => {
      try {
        console.log("Join request from:", username);

        const player = await findOrCreatePlayer(username);
        socket.data.playerId = player.id;
        socket.data.username = player.username;

        // Checking Reconnection
        const existingMatch = findMatchByPlayer(player.id);

        if (existingMatch) {
          console.log("Reconnecting player:", player.username);

          // Attach new socket
          existingMatch.sockets.set(player.id, socket.id);

          // Cancel forfeit timer if running
          const timer = existingMatch.disconnectTimers.get(player.id);
          if (timer) {
            clearTimeout(timer);
            existingMatch.disconnectTimers.delete(player.id);
          }

          socket.join(existingMatch.matchId);
          console.log("Rooms for socket:", socket.rooms);

          socket.emit("reconnected", {
            matchId: existingMatch.matchId,
            players: existingMatch.players,
          });

          socket.to(existingMatch.matchId).emit("player_rejoined", {
            playerId: player.id,
          });
          console.log("Player rejoined room:", existingMatch.matchId);
          return;
        }

        // Normal Matchmaking Flow
        addToLobby({
          socketId: socket.id,
          playerId: player.id,
          username: player.username,
        });

        const pair = getMatchPair();
        if (!pair) {
          socket.emit("waiting_for_opponent");
          return;
        }

        const [p1, p2] = pair;

        // Persist match in DB
        const match = await createMatch(p1.playerId, p2.playerId);
        const roomId = match.id;

        // Create runtime match registry
        createActiveMatch(roomId, [p1.playerId, p2.playerId]);
        const active = getActiveMatch(roomId)!;

        // Track sockets
        active.sockets.set(p1.playerId, p1.socketId);
        active.sockets.set(p2.playerId, p2.socketId);

        const socket1 = io.sockets.sockets.get(p1.socketId);
        const socket2 = io.sockets.sockets.get(p2.socketId);

        if (!socket1 || !socket2) return;

        socket1.join(roomId);
        socket2.join(roomId);

        io.to(roomId).emit("match_found", {
          roomId,
          players: [p1.username, p2.username],
        });

        console.log(`Match created: ${roomId}`);
      } catch (err) {
        console.error("Join lobby error:", err);
        socket.emit("error", "Failed to join lobby");
      }
    });

    //Ready Event
    socket.on("ready", () => {
      const playerId = socket.data.playerId;
      if (!playerId) return;

      const match = findMatchByPlayer(playerId);
      if (!match) return;

      markPlayerReady(match.matchId, playerId);

      const readyPlayers = getReadyPlayers(match.matchId);

      // Start round when both ready
      if (readyPlayers.size === match.players.length) {
        const round = createRoundState(match.matchId, match.players);
        createRound(round);
        clearReady(match.matchId);

        io.to(match.matchId).emit("round_start", {
          wordLength: round.word.length,
        });

        startTickEngine(io, match.matchId);
      }
    });

    //Submit Guess
    socket.on("submit_guess", ({ guess }) => {
      const playerId = socket.data.playerId;
      if (!playerId || !guess) return;

      const match = findMatchByPlayer(playerId);
      if (!match) return;

      handleGuess(io, match.matchId, playerId, guess);
    });

    //Disconnect and match forfeit
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      const playerId = socket.data.playerId;
      if (!playerId) {
        removeFromLobby(socket.id);
        return;
      }

      const match = findMatchByPlayer(playerId);
      if (!match) {
        removeFromLobby(socket.id);
        return;
      }

      const opponentId = match.players.find((p) => p !== playerId);
      if (!opponentId) return;
      const opponentSocket = match.sockets.get(opponentId);

      // when both players disconnect
      if (!opponentSocket) {
        console.log("Both players disconnected — ending match");

        io.to(match.matchId).emit("match_abandoned");

        removeActiveMatch(match.matchId);
        return;
      }
      console.log("Starting grace timer for player:", playerId);

      const timer = setTimeout(() => {
        console.log("Forfeit triggered for:", playerId);

        const opponentId = match.players.find((p) => p !== playerId);

        io.to(match.matchId).emit("match_forfeit", {
          loser: playerId,
          winner: opponentId,
        });

        removeActiveMatch(match.matchId);
      }, 10000);

      match.disconnectTimers.set(playerId, timer);

      removeFromLobby(socket.id);
    });
  });
}
