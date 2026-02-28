/**
 * Socket Test Client
 * Internal debugging utility used to simulate players
 * and test realtime matchmaking and round lifecycle.
 *
 * Not part of production runtime.
 */

import { io } from "socket.io-client";
import readline from "readline";

const username = process.argv[2] ;

const socket = io("http://localhost:5000");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

socket.on("connect", () => {
  console.log(`[${username}] Connected:`, socket.id);
  socket.emit("join_lobby", { username });
});

socket.on("waiting_for_opponent", () => {
  console.log(`[${username}] Waiting for opponent...`);
});

socket.on("match_found", (data) => {
  console.log(`[${username}] MATCH FOUND:`, data);
  console.log("Type 'r' to send READY");
});

socket.on("round_start", (data) => {
  console.log(`[${username}] ROUND START:`, data);
  console.log("Use g:WORD to guess (e.g., g:APPLE)");
});

socket.on("tick_update", (data) => {
  console.log(`[${username}] TICK:`, data);
});

socket.on("round_winner", (data) => {
  console.log(`[${username}] ROUND WINNER:`, data);
});

socket.on("round_draw", () => {
  console.log(`[${username}] ROUND DRAW`);
});

socket.on("round_end", (data) => {
  console.log(`[${username}] ROUND END:`, data);
});

socket.on("match_forfeit", (data) => {
  console.log(`[${username}] FORFEIT:`, data);
});

socket.on("reconnected", (data) => {
  console.log(`[${username}] RECONNECTED:`, data);
});

socket.on("disconnect", () => {
  console.log(`[${username}] Disconnected`);
});

// CLI commands
rl.on("line", (input) => {
  if (input === "r") {
    socket.emit("ready");
    console.log("Sent READY");
  }

  if (input.startsWith("g:")) {
    const guess = input.split(":")[1];
    socket.emit("submit_guess", { guess });
    console.log("Sent guess:", guess);
  }

  if (input === "x") {
    socket.disconnect();
    process.exit();
  }
});

socket.on("round_result", (data) => {
  console.log(`[${username}] ROUND RESULT:`, data);
});

socket.on("match_end", (data) => {
  console.log(`\n🏆 MATCH END`);
  console.log(`[${username}] WINNER:`, data.winnerId);
  console.log("Final Scores:", data.finalScores);
  process.exit(0); // stop CLI cleanly
});
