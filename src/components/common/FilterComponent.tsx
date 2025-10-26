import React from "react";

interface FilterComponentProps {
  type: "date" | "category" | "status";
  label: string;
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
}

export const FilterComponent: React.FC<FilterComponentProps> = ({
  label,
  isChecked,
  onToggle,
}) => {
  return (
    <div
      className={`flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer text-sm bg-purpleLight `}
      onClick={() => onToggle(!isChecked)}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onToggle(e.target.checked)}
        className="form-checkbox text-purple-600 border-gray-300 rounded accent-purple"
      />
      <span className={`${isChecked ? "text-purple" : "text-gray-700"}`}>
        {label}
      </span>
    </div>
  );
};
