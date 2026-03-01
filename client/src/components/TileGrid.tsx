import type { Tile } from "../types/game";

interface Props {
  tiles: Tile[];
}

/**
 * The grid of tiles representing the current word state during a round, showing revealed letters and hiding unrevealed ones.
 */
const TileGrid = ({ tiles }: Props) => {
  return (
    <div className="tile-grid">
      {tiles.map((tile, i) => (
        <div
          key={i}
          className={`tile ${tile.revealed ? "revealed" : ""}`}
        >
          {tile.revealed ? tile.letter : "?"}
        </div>
      ))}
    </div>
  );
};

export default TileGrid;