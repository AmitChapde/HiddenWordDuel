import { useGameContext } from "../contexts/GameContext";
import type { RoundResultPayload } from "../types/socket";

interface Props {
  result: RoundResultPayload | null;
}

/**
 * 
 * screens displays result at the end of each round, showing the correct word and winner (or draw) before transitioning to the next round or match end
 */
const RoundResultScreen = ({ result }: Props) => {
  const { match } = useGameContext();
  if (!result || !match) return null;

  const winnerId = result.winnerId;

  // Find player matching winnerId (or null for draw)
  const player = match.players.find((p) => p.id === winnerId);

  const winnerName = player?.username ?? "Draw";


  return (
    <div className="round-result">
      <h2>Round Complete</h2>
      <p>Word was: {result.word}</p>
      <p>Winner: {winnerName}</p>
    </div>
  );
};

export default RoundResultScreen;
