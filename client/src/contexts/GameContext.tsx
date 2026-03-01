import { createContext, useContext, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ReactNode } from "react";
import type { MatchState } from "../types/game";

//Context to hold the current match state and provide a way to update it across the app 
interface GameContextType {
  match: MatchState | null;
  setMatch: Dispatch<SetStateAction<MatchState | null>>;
  updateMatch: (
    updater: (prev: MatchState | null) => MatchState | null,
  ) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [match, setMatch] = useState<MatchState | null>(null);

  const updateMatch = (
    updater: (prev: MatchState | null) => MatchState | null,
  ) => {
    setMatch((prev) => updater(prev));
  };

  return (
    <GameContext.Provider value={{ match, setMatch, updateMatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used inside GameProvider");
  return ctx;
};
