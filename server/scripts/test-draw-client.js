/**
 * Deterministic DRAW Test Client
 *
 * Usage:
 * node scripts/test-draw-client.js a
 * node scripts/test-draw-client.js b
 *
 * Make sure server round word is forced to "APPLE"
 */

import { io } from "socket.io-client";
import readline from "readline";

const username = process.argv[2] || "Bot";
const socket = io("http://localhost:5000");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ===== CONNECT =====
socket.on("connect", () => {
  console.log(`[${username}] Connected`);
  socket.emit("join_lobby", { username });
});

// ===== MATCH FLOW =====
socket.on("waiting_for_opponent", () => {
  console.log(`[${username}] Waiting...`);
});

socket.on("match_found", (data) => {
  console.log(`[${username}] MATCH FOUND`, data.players);
  console.log("Press 'r' to ready");
});

socket.on("round_start", (data) => {
  console.log(`[${username}] ROUND START`, data);
});

// ===== DRAW AUTO GUESS =====
socket.on("tick_update", ({ maskedWord }) => {
  const revealed = maskedWord.filter(c => c !== "_").length;
  const total = maskedWord.length;

  // Trigger when only 1 letter hidden
  if (revealed < total - 1) return;

  console.log(`[${username}] Triggering DRAW guess`);

  setTimeout(() => {
    socket.emit("submit_guess", { guess: "APPLE" }); // MUST MATCH SERVER WORD
    console.log(`[${username}] AUTO GUESS APPLE`);
  }, 100); // identical delay for both clients
});

// ===== RESULTS =====
socket.on("round_result", (data) => {
  console.log(`\n[${username}] ROUND RESULT`);
  console.log(data);
});

socket.on("match_end", (data) => {
  console.log(`\n🏆 MATCH END`);
  console.log(data);
  process.exit(0);
});

// ===== CLI =====
rl.on("line", (input) => {
  if (input === "r") {
    socket.emit("ready");
    console.log("READY sent");
  }

  if (input === "x") {
    socket.disconnect();
    process.exit();
  }
});