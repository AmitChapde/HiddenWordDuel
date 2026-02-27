import { useGameContext } from "../contexts/GameContext";

interface Props {
  payload: any;
}

const MatchEndScreen = ({ payload }: Props) => {
  const { match } = useGameContext();
  if (!payload || !match) return null;

  const winner = match.players.find(p => p.id === payload.winnerId);

  return (
    <div className="match-end">
      <h1>🏆 Match Over</h1>

      <p>Winner: {winner?.username ?? "Draw"}</p>

      {/* <pre>{JSON.stringify(finalScores, null, 2)}</pre> */}

      <button onClick={() => window.location.reload()}>
        Play Again
      </button>
    </div>
  );
};

export default MatchEndScreen;