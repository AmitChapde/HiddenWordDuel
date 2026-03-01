import { useGameContext } from "../contexts/GameContext";
import TileGrid from "./TileGrid";
import GuessInput from "./GuessInput";
import TimeBar from "./TimerBar";
import PlayerStatus from "./PlayerStatus";
import Scoreboard from "./Scoreboard";

interface Props {
  hasGuessed: boolean;
  onGuess: (guess: string) => void;
}

/**
 *
 * The main gameplay screen during a round, showing the current tiles, timer, player statuses, and guess input.
 */
const RoundPlaying = ({ hasGuessed, onGuess }: Props) => {
  const { match } = useGameContext();
  if (!match?.currentRound) return null;

  const round = match.currentRound;

  return (
    <div>
      <PlayerStatus players={match.players} />

      <Scoreboard />

      <h3>Round {round.roundNumber}</h3>

      <TimeBar remainingMs={round.remainingMs} />

      <TileGrid tiles={round.tiles} />

      {!hasGuessed && <GuessInput disabled={hasGuessed} onSubmit={onGuess} />}
    </div>
  );
};

export default RoundPlaying;
