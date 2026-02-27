import { useState, useEffect } from "react";

interface Props {
  endsAt: number;
}

const TimeBar = ({ endsAt }: Props) => {
  const [percent, setPercent] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const total = Math.max(endsAt - start, 1);

    const interval = setInterval(() => {
      const remaining = Math.max(endsAt - Date.now(), 0);
      const p = (remaining / total) * 100;
      setPercent(p);
    }, 100);

    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="timebar">
      <div className="timebar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
};

export default TimeBar;
