import Button from "@/components/ui/Button";
import { PLACEHOLDERS } from "@/utils/textConstants";
import React, { useEffect, useRef } from "react";

interface CaseSearchInputProps {
  caseIdentifier: string;
  setCaseIdentifier: (value: string) => void;
  error: string;
  handleSearch: (e: React.FormEvent) => void;
  label?: React.ReactNode | string;
  showAddcase?: boolean;
  onAddNewPersonCLick?: () => void;
  addPersonButtonLabel?: string;
}

const CaseSearchInput: React.FC<CaseSearchInputProps> = ({
  caseIdentifier,
  setCaseIdentifier,
  error,
  handleSearch,
  label = "Enter the name or case # of the case",
  showAddcase = false,
  onAddNewPersonCLick,
  addPersonButtonLabel = "Add a new person",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <form onSubmit={handleSearch} className="space-y-3">
      <p className="text-sm text-gray-700">{label}</p>

      <div>
        <input
          ref={inputRef}
          type="text"
          value={caseIdentifier}
          onChange={(e) => {
            setCaseIdentifier(e.target.value);
          }}
          placeholder={PLACEHOLDERS.SEARCH.CASES}
          className={`w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"
            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {showAddcase && onAddNewPersonCLick && (
        <>
          <div className="text-center text-purple font-medium italic">or</div>
          <Button
            className="w-full flex items-center justify-center !py-3 hover:!bg-purple-800/70  focus:!bg-purple focus:!text-white"
            icon="mdi:plus"
            label={addPersonButtonLabel}
            variant="submitStyle"
            onClick={onAddNewPersonCLick}
          />
        </>
      )}
    </form>
  );
};

export default CaseSearchInput;
