
/**
 * Lightweight Socket.IO test client
 * Used for validating multiplayer flows without frontend.
 * Simulates multiple players via CLI args.
 *
 * Usage:
 * node scripts/test-client.js Amit
 */

import { io } from "socket.io-client";

const username = process.argv[2] || "Bot";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);


  socket.emit("join_lobby", { username });
});

socket.on("waiting_for_opponent", () => {
  console.log("Waiting for opponent...");
});

socket.on("match_found", (data) => {
  console.log("MATCH FOUND:", data);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});