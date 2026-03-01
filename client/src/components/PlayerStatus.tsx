import type { Player } from "../types/game";

interface Props {
  players: Player[];
}

const PlayerStatus = ({ players }: Props) => {
  return (
    <div className="player-status">
      {players.map((player) => {
        return (
          <div key={player.id} className="player">
            {player.username}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerStatus;
