import "dotenv/config";
import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { prisma } from "../src/config/prisma.js";
import { registerGameSockets } from "./modules/sockets/game.socket.js";

dotenv.config();

const app = express();
app.use(cors());

app.get("/", (_, res) => {
  res.send("Hidden Word Duel server running");
});

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

registerGameSockets(io);

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  try {
    await prisma.$connect();
    console.log("DB connected");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();
