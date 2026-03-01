import { useGameContext } from "../contexts/GameContext";
import type { MatchEndPayload } from "../types/socket";
import { getWinnerName } from "../utils/player.utils";
import { useNavigate } from "react-router-dom";

interface Props {
  payload: MatchEndPayload | null;
}

const MatchEndScreen = ({ payload }: Props) => {
  const navigate = useNavigate();
  const { match, setMatch } = useGameContext();

  if (!payload || !match) return null;

  const winnerName = getWinnerName(match);

  const handleReplay = () => {
    setMatch(null);
    navigate("/");
  };

  return (
    <div className="match-end">
      <h1>🏆 Match Over</h1>

      <p>Winner: {winnerName}</p>

      <button onClick={handleReplay}>Play Again</button>
    </div>
  );
};

export default MatchEndScreen;
