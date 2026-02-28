import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { SOCKET_EVENTS } from "../socket/events";
import { useGameContext } from "../contexts/GameContext";
import RoundPlaying from "../components/RoundPlaying";
import RoundResultScreen from "../components/RoundResultScreen";
import MatchEndScreen from "../components/MatchEndScreen";
import ReadyScreen from "../components/ReadyScreen";
import SystemNotice from "../components/SystemNotice";
import { maskedWordToTiles } from "../adapters/round.adapter";
import type {
  RoundStartPayload,
  TickPayload,
  RoundResultPayload,
  MatchEndPayload,
} from "../types/socket";

type GamePhase =
  | "LOBBY"
  | "READY"
  | "ROUND_PLAYING"
  | "ROUND_RESULT"
  | "MATCH_END";

const GamePage = () => {
  const { match, updateMatch, setMatch } = useGameContext();
  const [phase, setPhase] = useState<GamePhase>(match ? "READY" : "LOBBY");
  const [hasGuessed, setHasGuessed] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResultPayload|null>(null);
  const [matchEndPayload, setMatchEndPayload] =   useState<MatchEndPayload | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  const showNotice = (msg: string, duration = 3000) => {
    setSystemMessage(msg);
    setTimeout(() => setSystemMessage(null), duration);
  };

  useEffect(() => {
    const onRoundStart = (payload: RoundStartPayload) => {
      console.log("ROUND START RECEIVED", payload);

      updateMatch((prev) => {
        if (!prev) return prev;

        const tiles = Array(payload.wordLength)
          .fill(null)
          .map(() => ({
            letter: "",
            revealed: false,
          }));

        return {
          ...prev,
          currentRound: {
            roundNumber: payload.roundNumber,
            tiles,
            tickEndsAt: Date.now() + 15000,
          },
        };
      });

      setHasGuessed(false);
      setPhase("ROUND_PLAYING");
    };

    const onTick = (payload: TickPayload) => {
      setHasGuessed(false);

      updateMatch((prev) => {
        if (!prev?.currentRound) return prev;

        return {
          ...prev,
          currentRound: {
            ...prev.currentRound,
            tiles: maskedWordToTiles(payload.maskedWord),
            tickEndsAt: payload.tickEndsAt,
          },
        };
      });
    };

    const onRoundResult = (payload: RoundResultPayload) => {
      setRoundResult(payload);

      setMatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scores: payload.scores,
        };
      });

      setPhase("ROUND_RESULT");
    };

    const onMatchEnd = (payload: MatchEndPayload) => {
      setMatchEndPayload(payload);

      setMatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scores: payload.finalScores,
        };
      });

      setPhase("MATCH_END");
    };

    // RESILIENCE HANDLERS
    const onPlayerRejoined = (payload: { playerId: string }) => {
      console.log("[RESILIENCE] Player rejoined:", payload.playerId);
      showNotice("Opponent reconnected");
      // Opponent came back - UI is restored, no state change needed
      // The match state is already there, just continue the current phase
    };

    const onMatchAbandoned = () => {
      console.log("[RESILIENCE] Match abandoned - both players disconnected");
      showNotice("Match abandoned due to disconnect");

      setMatchEndPayload({
        winner: null,
        loser: null,
        finalScores: {},
      } as MatchEndPayload);

      // No need to update match state - match state already contains necessary info
      setPhase("MATCH_END");
    };

    const onMatchForfeit = (payload: { winner: string; loser: string }) => {
      console.log("[RESILIENCE] Match forfeited:", payload);
      showNotice("Opponent disconnected. You win by forfeit.");

      setMatchEndPayload({
        winner: payload.winner,
        loser: payload.loser,
        finalScores: {},
      } as MatchEndPayload);

      // No need to update match state - match state already contains necessary info
      setPhase("MATCH_END");
    };

    socket.on(SOCKET_EVENTS.ROUND_START, onRoundStart);
    socket.on(SOCKET_EVENTS.TICK, onTick);
    socket.on(SOCKET_EVENTS.ROUND_RESULT, onRoundResult);
    socket.on(SOCKET_EVENTS.MATCH_END, onMatchEnd);
    socket.on(SOCKET_EVENTS.PLAYER_REJOINED, onPlayerRejoined);
    socket.on(SOCKET_EVENTS.MATCH_ABANDONED, onMatchAbandoned);
    socket.on(SOCKET_EVENTS.MATCH_FORFEIT, onMatchForfeit);

    return () => {
      socket.off(SOCKET_EVENTS.ROUND_START, onRoundStart);
      socket.off(SOCKET_EVENTS.TICK, onTick);
      socket.off(SOCKET_EVENTS.ROUND_RESULT, onRoundResult);
      socket.off(SOCKET_EVENTS.MATCH_END, onMatchEnd);
      socket.off(SOCKET_EVENTS.PLAYER_REJOINED, onPlayerRejoined);
      socket.off(SOCKET_EVENTS.MATCH_ABANDONED, onMatchAbandoned);
      socket.off(SOCKET_EVENTS.MATCH_FORFEIT, onMatchForfeit);
    };
  }, []);

  const handleReady = () => {
    console.log("READY CLICKED");
    socket.emit("ready");
  };

  const handleGuess = (guess: string) => {
    socket.emit("submit_guess", { guess });
    setHasGuessed(true);
  };

  if (!match) return <div>Waiting for match...</div>;

  return (
    <div className="game-container">
      <SystemNotice message={systemMessage} />
      <h2>Match {match.matchId.slice(0, 4)}</h2>

      {phase === "READY" && <ReadyScreen onReady={handleReady} />}

      {phase === "ROUND_PLAYING" && (
        <RoundPlaying hasGuessed={hasGuessed} onGuess={handleGuess} />
      )}

      {phase === "ROUND_RESULT" && <RoundResultScreen result={roundResult} />}

      {phase === "MATCH_END" && <MatchEndScreen payload={matchEndPayload} />}
    </div>
  );
};

export default GamePage;
