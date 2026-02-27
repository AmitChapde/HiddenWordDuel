console.log("REGISTERING GAME SOCKETS");
import { Server, Socket } from "socket.io";
import { findOrCreatePlayer } from "../player/player.service.js";
import {
  addToLobby,
  getMatchPair,
  removeFromLobby,
} from "../lobby/lobby.store.js";
import {
  createMatch,
  completeMatchForfeitInDb,
  completeMatchAbandonedInDb,
} from "../match/match.service.js";
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
import { scheduleNextRound } from "../game/round.scheduler.js";
import { getRound, removeRound } from "../game/round.store.js";
import { handleGuess } from "../game/guess.handler.js";
import { completeRoundInDb } from "../game/round.service.js";

export function registerGameSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_lobby", async ({ username }) => {
      try {
        console.log("Join request from:", username);

        const player = await findOrCreatePlayer(username);
        socket.data.playerId = player.id;
        socket.data.username = player.username;

        // Reconnect handling
        const existingMatch = findMatchByPlayer(player.id);
        if (existingMatch) {
          console.log("Reconnecting player:", player.username);

          existingMatch.sockets.set(player.id, socket.id);

          const timer = existingMatch.disconnectTimers.get(player.id);
          if (timer) {
            clearTimeout(timer);
            existingMatch.disconnectTimers.delete(player.id);
          }

          socket.data.matchId = existingMatch.matchId;
          socket.join(existingMatch.matchId);

          socket.emit("reconnected", {
            matchId: existingMatch.matchId,
            players: existingMatch.players,
          });

          socket.to(existingMatch.matchId).emit("player_rejoined", {
            playerId: player.id,
          });
          return;
        }

        // Normal lobby flow
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

        try {
          const match = await createMatch(p1.playerId, p2.playerId);
          const roomId = match.id;

          createActiveMatch(roomId, p1.playerId, p2.playerId);
          const active = getActiveMatch(roomId)!;

          active.sockets.set(p1.playerId, p1.socketId);
          active.sockets.set(p2.playerId, p2.socketId);

          const socket1 = io.sockets.sockets.get(p1.socketId);
          const socket2 = io.sockets.sockets.get(p2.socketId);

          if (!socket1 || !socket2) {
            throw new Error(`One or both sockets missing for match ${roomId}`);
          }

          // set matchId on BOTH sockets so "ready" works
          socket1.data.matchId = roomId;
          socket2.data.matchId = roomId;

          socket1.join(roomId);
          socket2.join(roomId);

          io.to(roomId).emit("match_found", {
            roomId, // keeping your existing client payload
            matchId: roomId, // also provide matchId to reduce confusion
            players: [
              { id: p1.playerId, username: p1.username },
              { id: p2.playerId, username: p2.username },
            ],
          });

          console.log(`Match created: ${roomId}`);
        } catch (err) {
          console.error("Failed to create match or join rooms:", err);
          socket.emit("error", "Failed to create match. Please try again.");
        }
      } catch (err) {
        console.error("Join lobby error:", err);
        socket.emit("error", "Failed to join lobby");
      }
    });

    socket.on("ready", () => {
      // fallback if socket.data.matchId not present for any reason
      const matchId =
        socket.data.matchId ?? findMatchByPlayer(socket.data.playerId)?.matchId;

      if (!matchId) {
        console.log("[ready] no matchId for socket:", socket.id);
        return;
      }

      const match = getActiveMatch(matchId);
      if (!match) {
        console.log("[ready] no active match:", matchId);
        return;
      }

      if (match.hasStarted) return; // ignore repeated ready clicks

      markPlayerReady(matchId, socket.data.playerId);

      console.log("[ready]", {
        matchId,
        playerId: socket.data.playerId,
        readyCount: getReadyPlayers(matchId).size,
        totalPlayers: match.players.length,
      });

      if (getReadyPlayers(matchId).size === match.players.length) {
        match.hasStarted = true;
        clearReady(matchId);

        console.log("[ready] BOTH READY -> starting round 1", { matchId });

        // Start Round 1 (immediately)
        scheduleNextRound(io, match, 0);
      }
    });
    socket.on("submit_guess", async ({ guess }) => {
      try {
        const playerId = socket.data.playerId;

        console.log("[submit_guess]", {
          socketId: socket.id,
          playerId,
          guess,
        });

        if (!playerId || !guess) {
          console.log("BLOCKED submit_guess");
          return;
        }

        const match = findMatchByPlayer(playerId);
        if (!match) {
          console.log("NO MATCH FOR PLAYER", playerId);
          return;
        }

        await handleGuess(io, match.matchId, playerId, guess);
      } catch (err) {
        console.error("Error in 'submit_guess' handler:", err);
      }
    });
    socket.on("disconnect", async () => {
      try {
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

        if (!opponentSocket) {
          console.log("Both players disconnected — ending match");
          io.to(match.matchId).emit("match_abandoned");

          const round = getRound(match.matchId);
          if (round && !round.isRoundOver) {
            round.isRoundOver = true;
            round.winnerId = null;
            round.status = "completed";
            await completeRoundInDb(match.matchId);
          }

          const liveMatch = getActiveMatch(match.matchId);
          if (liveMatch) {
            const { score1, score2 } = computeDbScores(liveMatch);
            await completeMatchAbandonedInDb({
              matchId: match.matchId,
              score1,
              score2,
            });
          }

          cleanupRuntimeRound(match.matchId);
          removeActiveMatch(match.matchId);
          return;
        }

        console.log("Starting grace timer for player:", playerId);

        if (match.disconnectTimers.has(playerId)) return;

        const timer = setTimeout(async () => {
          try {
            console.log("Forfeit triggered for:", playerId);
            const liveMatch = getActiveMatch(match.matchId);
            if (!liveMatch) return;

            const winnerId = opponentId;

            const round = getRound(match.matchId);
            if (round && !round.isRoundOver) {
              round.isRoundOver = true;
              round.winnerId = winnerId;
              round.status = "completed";
              await completeRoundInDb(match.matchId);
            }

            const { score1, score2 } = computeDbScores(liveMatch);
            await completeMatchForfeitInDb({
              matchId: match.matchId,
              winnerId,
              score1,
              score2,
            });

            io.to(match.matchId).emit("match_forfeit", {
              loser: playerId,
              winner: winnerId,
            });

            cleanupRuntimeRound(match.matchId);
            removeActiveMatch(match.matchId);
          } catch (err) {
            console.error("Error during forfeit cleanup:", err);
          }
        }, 10000);

        match.disconnectTimers.set(playerId, timer);
        removeFromLobby(socket.id);
      } catch (err) {
        console.error("Unexpected error in 'disconnect' handler:", err);
      }
    });
  });
}

function cleanupRuntimeRound(matchId: string) {
  const round = getRound(matchId);
  if (round?.tickInterval) {
    clearInterval(round.tickInterval);
    round.tickInterval = undefined;
  }
  removeRound(matchId);
}

function computeDbScores(match: any) {
  const score1 = match.scores?.[match.player1Id] ?? 0;
  const score2 = match.scores?.[match.player2Id] ?? 0;
  return { score1, score2 };
}
