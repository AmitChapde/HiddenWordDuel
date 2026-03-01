import type { Player } from "../types/game";

interface Props {
  players: Player[];
  winnerId?: string;
}

const PlayerStatus = ({ players, winnerId }: Props) => {
  return (
    <div className="player-status">
      {players.map((player) => {
        const isWinner = winnerId === player.id;

        return (
          <div
            key={player.id}
            className={`player 
              ${isWinner ? "winner" : ""} 
            `}
          >
            {player.username}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerStatus;
