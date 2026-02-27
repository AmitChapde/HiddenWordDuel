import type { Player } from "../types/game";

interface Props {
  players: Player[];
  winnerId?: string;
  myId?: string;
}

const PlayerStatus = ({ players, winnerId, myId }: Props) => {
  return (
    <div className="player-status">
      {players.map((player) => {
        const isWinner = winnerId === player.id;
        const isMe = myId === player.id;

        return (
          <div
            key={player.id}
            className={`player 
              ${isWinner ? "winner" : ""} 
              ${isMe ? "me" : ""}
            `}
          >
            {player.username}
            {isMe && " (You)"}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerStatus;