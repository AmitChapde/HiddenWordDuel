import { useGameContext } from "../contexts/GameContext";
import TileGrid from "./TileGrid";
import GuessInput from "./GuessInput";
import TimeBar from "./TimerBar";
import PlayerStatus from "./PlayerStatus";

interface Props {
  hasGuessed: boolean;
  onGuess: (guess: string) => void;
}

const RoundPlaying = ({ hasGuessed, onGuess }: Props) => {
  const { match } = useGameContext();
  if (!match?.currentRound) return null;

  const round = match.currentRound;

  return (
    <div>
      <PlayerStatus players={match.players} />

      <h3>Round {round.roundNumber}</h3>

      <TimeBar endsAt={round.tickEndsAt} />

      <TileGrid tiles={round.tiles} />

      {!hasGuessed && (
        <GuessInput disabled={hasGuessed} onSubmit={onGuess} />
      )}
    </div>
  );
};

export default RoundPlaying;