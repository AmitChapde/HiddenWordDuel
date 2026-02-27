import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { useGameContext } from "../contexts/GameContext";
import RoundPlaying from "../components/RoundPlaying";
import RoundResultScreen from "../components/RoundResultScreen";
import MatchEndScreen from "../components/MatchEndScreen";
import ReadyScreen from "../components/ReadyScreen";
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

    socket.on("round_start", onRoundStart);
    socket.on("tick_update", onTick);
    socket.on("round_result", onRoundResult);
    socket.on("match_end", onMatchEnd);

    return () => {
      socket.off("round_start", onRoundStart);
      socket.off("tick_update", onTick);
      socket.off("round_result", onRoundResult);
      socket.off("match_end", onMatchEnd);
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
