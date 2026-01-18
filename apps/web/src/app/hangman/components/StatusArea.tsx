import React from 'react';
import { HintReveal } from './HintReveal';
import { HangmanFigure } from './HangmanFigure';
import { HangmanStatusBar } from './HangmanStatusBar';

interface StatusAreaProps {
  category?: string | null;
  hint?: string | null;
  wrongGuesses?: number;
  maxWrongGuesses?: number;
  status?: "playing" | "won" | "lost";
  showHint: boolean;
  onRevealHint: () => void;
}

export const StatusArea: React.FC<StatusAreaProps> = ({ 
  category, 
  hint, 
  wrongGuesses, 
  maxWrongGuesses, 
  status, 
  showHint, 
  onRevealHint 
}) => {
   return (
    <div className="flex justify-evenly w-screen gap-2 my-4">
      <div className=" p-4">
        <HangmanFigure wrongGuesses={wrongGuesses ?? 0} maxWrong={maxWrongGuesses ?? 6} />
      </div>
      <div className="p-4 w-full">
        <p className="mt-6">
          <strong>Category:</strong> {category ?? "—"}
        </p>
        {hint && (
          <HintReveal 
            hint={hint} 
            revealLabel="Show hint" 
            showHint={showHint} 
            onRevealHint={onRevealHint} 
          />
        )}
        <HangmanStatusBar
          status={status ?? "playing"}
          wrongGuesses={wrongGuesses ?? 0}
          maxWrong={maxWrongGuesses ?? 6}
        />
      </div>
    </div>
  );
};