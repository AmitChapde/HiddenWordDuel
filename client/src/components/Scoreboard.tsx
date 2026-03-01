import { useGameContext } from "../contexts/GameContext";

/**
 * 
  * The scoreboard component that displays the current scores of both players during a match.
 */
const Scoreboard = () => {
  const { match } = useGameContext();
  if (!match?.scores || match.players.length < 2) return null;

  const [player1, player2] = match.players;
  const score1 = match.scores?.[player1.id] ?? 0;
  const score2 = match.scores?.[player2.id] ?? 0;

  return (
    <div className="scoreboard">
      <h3>Current Score</h3>
      
      <div className="score-player-left">
        <div className="score-player-name">{player1.username}</div>
        <div className="score-player-score">{score1}</div>
      </div>

      <div className="scoreboard-vs">VS</div>

      <div className="score-player-right">
        <div className="score-player-name">{player2.username}</div>
        <div className="score-player-score">{score2}</div>
      </div>
    </div>
  );
};

export default Scoreboard;