interface Props {
  result: any;
}

const RoundResultScreen = ({ result }: Props) => {
  if (!result) return null;

  const { winnerId, word } = result;

  return (
    <div className="round-result">
      <h2>Round Complete</h2>
      <p>Word was: {word}</p>
      {winnerId ? <p>Winner decided 🎉</p> : <p>Draw!</p>}
    </div>
  );
};

export default RoundResultScreen;