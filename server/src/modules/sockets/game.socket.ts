import { Server, Socket } from "socket.io";
import { prisma } from "../../config/prisma.js";
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
import { ActiveMatch } from "../../types/types.js";

/**
 *
 * Registers All Socket.IO event handlers related to the game flow, including lobby management, match setup, player readiness, guess submission, and disconnection handling.
 */
export function registerGameSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("join_lobby", async ({ username }) => {
      try {
        const player = await findOrCreatePlayer(username);
        socket.data.playerId = player.id;
        socket.data.username = player.username;

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
          //Db entry for match
          const match = await createMatch(p1.playerId, p2.playerId);
          const roomId = match.id;

          //live in-memory match
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

          // Emit match found to both players with their opponent's info
          io.to(roomId).emit("match_found", {
            roomId,
            matchId: roomId,
            players: [
              { id: p1.playerId, username: p1.username },
              { id: p2.playerId, username: p2.username },
            ],
          });
        } catch (err) {
          socket.emit("error", "Failed to create match. Please try again.");
        }
      } catch (err) {
        socket.emit("error", "Failed to join lobby");
      }
    });

    // Ready handler
    socket.on("ready", () => {
      // fallback if socket.data.matchId not present for any reason
      const matchId =
        socket.data.matchId ?? findMatchByPlayer(socket.data.playerId)?.matchId;

      if (!matchId) {
        throw new Error("No matchId found for ready event");
        return;
      }

      const match = getActiveMatch(matchId);
      if (!match) {
        throw new Error("No active match found for ready event");
        return;
      }

      if (match.hasStarted) return; // ignore repeated ready clicks

      markPlayerReady(matchId, socket.data.playerId);

      // If all players are ready, start the round
      if (getReadyPlayers(matchId).size === match.players.length) {
        match.hasStarted = true;
        clearReady(matchId);

        // Start Round 1 (immediately)
        scheduleNextRound(io, match, 0);
      }
    });
    socket.on("submit_guess", async ({ guess }) => {
      try {
        const playerId = socket.data.playerId;

        if (!playerId || !guess) {
          throw new Error("Missing playerId or guess in submit_guess event");
        }

        const match = findMatchByPlayer(playerId);
        if (!match) {
          throw new Error("No match found for player in submit_guess event");
        }

        await handleGuess(io, match.matchId, playerId, guess);
      } catch (err) {
        throw new Error("Error handling guess submission");
      }
    });
    socket.on("disconnect", async () => {
      try {
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
          io.to(match.matchId).emit("match_abandoned");

          // Mark round as completed with no winner
          const round = getRound(match.matchId);
          if (round && !round.isRoundOver) {
            round.isRoundOver = true;
            round.winnerId = null;
            round.status = "completed";
            await completeRoundInDb(match.matchId);
          }

          // Mark match as abandoned in DB
          const liveMatch = getActiveMatch(match.matchId);
          if (liveMatch) {
            const { score1, score2 } = computeDbScores(liveMatch);
            await completeMatchAbandonedInDb({
              matchId: match.matchId,
              score1,
              score2,
            });
          }

          // Cleanup in-memory state
          cleanupRuntimeRound(match.matchId);
          removeActiveMatch(match.matchId);
          return;
        }

        if (match.disconnectTimers.has(playerId)) return;

        // Start a timer to forfeit the match
        const timer = setTimeout(async () => {
          try {
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

            // Override winner for disconnect forfeits.
            // Avoided changing service logic to prevent lifecycle regressions.
            // Can be moved to service layer later.
            await prisma.match.update({
              where: { id: match.matchId },
              data: { winnerId },
            });

            io.to(match.matchId).emit("match_forfeit", {
              loser: playerId,
              winner: winnerId,
            });

            cleanupRuntimeRound(match.matchId);
            removeActiveMatch(match.matchId);
          } catch (err) {
            throw new Error("Error during match forfeit after disconnect");
          }
        }, 7000);

        match.disconnectTimers.set(playerId, timer);
        removeFromLobby(socket.id);
      } catch (err) {
        throw new Error("Unexpected error during disconnect handling");
      }
    });
  });
}

// Helper function to clean up in-memory round state and timers when a match ends
function cleanupRuntimeRound(matchId: string) {
  const round = getRound(matchId);
  if (round?.tickInterval) {
    clearInterval(round.tickInterval);
    round.tickInterval = undefined;
  }
  removeRound(matchId);
}

// Helper function to compute current scores for both players in a match
function computeDbScores(match: ActiveMatch) {
  const score1 = match.scores?.[match.player1Id] ?? 0;
  const score2 = match.scores?.[match.player2Id] ?? 0;
  return { score1, score2 };
}
