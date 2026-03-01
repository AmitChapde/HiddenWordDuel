interface Props {
  onReady: () => void;
}

/**
 * 
 * The screen that shows to players after a match is found, prompting them to confirm they're ready before the match starts.
 */
const ReadyScreen = ({ onReady }: Props) => {
  return (
    <div className="ready-screen">
      <h2>Match Found</h2>
      <button onClick={onReady}>I'm Ready</button>
    </div>
  );
};

export default ReadyScreen;