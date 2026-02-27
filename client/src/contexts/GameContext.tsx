import { createContext, useContext, useState} from "react";
import type { ReactNode } from "react";
import type { MatchState } from "../types/game";

interface GameContextType {
  match: MatchState | null;
  setMatch: (match: MatchState | null) => void;
  setRound: (
    updater: (prev: MatchState | null) => MatchState | null
  ) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [match, setMatch] = useState<MatchState | null>(null);

  const setRound = (
    updater: (prev: MatchState | null) => MatchState | null
  ) => {
    setMatch((prev) => updater(prev));
  };

  return (
    <GameContext.Provider value={{ match, setMatch, setRound }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used inside GameProvider");
  return ctx;
};