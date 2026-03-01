import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket/socket";
import { useGameContext } from "../contexts/GameContext";
import { SOCKET_EVENTS } from "../socket/events";
import SystemNotice from "../components/SystemNotice";
import type { MatchFoundPayload, ReconnectPayload } from "../types/socket";

// Helper function to normalize player data from payloads
const normalizePlayerData = (
  players: Array<{ id: string; username: string }>,
) =>
  players.map((p) => ({
    id: p.id,
    username: p.username,
  }));

const LobbyPage = () => {
  const navigate = useNavigate();
  const { setMatch } = useGameContext();

  const [username, setUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleWaiting = () => {
      setStatus("Waiting for opponent...");
    };

    const handleMatchFound = (payload: MatchFoundPayload) => {
      setMatch({
        matchId: payload.matchId,
        players: normalizePlayerData(payload.players),
      });

      navigate("/game");
    };

    const handleReconnect = (payload: ReconnectPayload) => {
      setMatch({
        matchId: payload.matchId,
        players: normalizePlayerData(payload.players),
      });

      navigate("/game");
    };

    socket.on(SOCKET_EVENTS.WAITING, handleWaiting);
    socket.on(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    socket.on(SOCKET_EVENTS.RECONNECTED, handleReconnect);

    return () => {
      socket.off(SOCKET_EVENTS.WAITING, handleWaiting);
      socket.off(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
      socket.off(SOCKET_EVENTS.RECONNECTED, handleReconnect);
    };
  }, [navigate, setMatch]);

  const handleFindMatch = () => {
    if (!username.trim()) {
      setNotice("Please enter a username to find a match!");
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    if (!socket.connected) socket.connect();

    socket.emit(SOCKET_EVENTS.JOIN_LOBBY, { username });

    setIsSearching(true);
    setStatus("Connecting...");
  };

  return (
    <div className="lobby-container">
      <h1>LexiClash</h1>

      <SystemNotice message={notice} />

      <input
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <button onClick={handleFindMatch} disabled={isSearching}>
        {isSearching ? "Searching..." : "Find Match"}
      </button>

      {status && <p>{status}</p>}
    </div>
  );
};

export default LobbyPage;
