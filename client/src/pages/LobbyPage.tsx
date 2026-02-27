import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket/socket";
import { useGameContext } from "../contexts/GameContext";
import { SOCKET_EVENTS } from "../socket/events";

const LobbyPage = () => {
  const navigate = useNavigate();
  const { setMatch } = useGameContext();

  const [username, setUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState("");



  useEffect(() => {
    const handleWaiting = () => {
      console.log("Waiting for opponent...");
      setStatus("Waiting for opponent...");
    };

    const handleMatchFound = (payload: any) => {
      console.log("🎉 Match found:", payload);

      setMatch({
        matchId: payload.matchId,
        players: payload.players.map((name: string, i: number) => ({
          id: String(i), 
          username: name,
        })),
        status: "playing",
      });

      navigate("/game");
    };

    const handleReconnect = (payload: any) => {
      console.log("🔁 Reconnected:", payload);

      setMatch({
        matchId: payload.matchId,
        players: payload.players.map((p: any) => ({
          id: p.id,
          username: p.username,
        })),
        status: "playing",
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
    if (!username.trim()) return;

    if (!socket.connected) socket.connect();

    socket.emit(SOCKET_EVENTS.JOIN_LOBBY, { username });

    setIsSearching(true);
    setStatus("Connecting...");
  };

  return (
    <div className="lobby-container">
      <h1>Hidden Word Duel</h1>

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