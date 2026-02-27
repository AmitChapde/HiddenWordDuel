interface Props {
  onReady: () => void;
}

const ReadyScreen = ({ onReady }: Props) => {
  return (
    <div className="ready-screen">
      <h2>Match Found</h2>
      <button onClick={onReady}>I'm Ready</button>
    </div>
  );
};

export default ReadyScreen;