import { useGameContext } from "../contexts/GameContext";

const Scoreboard = () => {
  const { match } = useGameContext();
  if (!match?.scores) return null;

  return (
    <div className="scoreboard">
      <h3>Score</h3>
      {match.players.map((p) => (
        <div key={p.id}>
          {p.username}: {match.scores?.[p.id] ?? 0}
        </div>
      ))}
    </div>
  );
};

export default Scoreboard;