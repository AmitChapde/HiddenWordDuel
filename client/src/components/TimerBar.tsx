import { useState, useEffect } from "react";

interface Props {
  remainingMs: number;
}

/**
 * visual timer bar that counts down from remaining milliseconds
 */
const TimeBar = ({ remainingMs }: Props) => {
  const [percent, setPercent] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const totalMs = Math.max(remainingMs, 1);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(totalMs - elapsed, 0);
      const p = (remaining / totalMs) * 100;
      setPercent(p);
    }, 100);

    return () => clearInterval(interval);
  }, [remainingMs]);

  return (
    <div className="timebar">
      <div className="timebar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
};

export default TimeBar;
