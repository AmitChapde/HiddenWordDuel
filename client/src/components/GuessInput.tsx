import { useState } from "react";

interface Props {
  disabled: boolean;
  onSubmit: (guess: string) => void;
}

/**
 * 
 * Input filed for players to submit their guesses during a round.
 */
const GuessInput = ({ disabled, onSubmit }: Props) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <div className="guess-box">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Enter your guess"
      />
      <button onClick={handleSubmit} disabled={disabled}>
        Guess
      </button>
    </div>
  );
};

export default GuessInput;