import React from "react";
import type { AlphabetFilterProps } from "@/types";

const AlphabetFilter: React.FC<AlphabetFilterProps> = ({
  selectedLetter,
  onLetterSelect,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 pb-2 ${className}`}>
      <button
        className={`shrink-0  px-4 h-10 rounded-lg text-sm font-medium transition-colors ${
          !selectedLetter
            ? "bg-purple/30 text-purple"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        onClick={() => onLetterSelect(null)}
      >
        All
      </button>
      <div className="flex gap-1 overflow-x-auto w-full  custom-scrollbar mobile-scrollbar-hide">
        {[...Array(26)].map((_, i) => {
          const letter = String.fromCharCode(65 + i);
          return (
            <button
              key={i}
              className={`shrink-0  w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                selectedLetter === letter
                  ? "bg-purple/30 text-purple"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => onLetterSelect(letter)}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AlphabetFilter;
