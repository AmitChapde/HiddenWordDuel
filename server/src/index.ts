import express from "express";
import dotenv from "dotenv";
import { prisma } from "../src/config/prisma.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await prisma.$connect();
    console.log("DB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();
