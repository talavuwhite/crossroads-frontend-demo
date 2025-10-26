import React from "react";
import { STATIC_TEXTS } from "@utils/textConstants";
import type { FilterKeys } from "@/types/case";

interface CaseDetailsFilterProps {
  filters: {
    [key in FilterKeys]: boolean;
  };
  onFilterChange: (key: FilterKeys) => void;
  caseName: string;
  showOptions?: { label: string; value: string }[];
  onShowChange?: (value: string) => void;
  selectedShow?: string;
  label?: string;
}

const CaseDetailsFilter: React.FC<CaseDetailsFilterProps> = ({
  filters,
  onFilterChange,
  caseName,
  showOptions,
  onShowChange,
  selectedShow = "all",
  label = `${STATIC_TEXTS.CASE_DETAILS.ASSISTANCE_FOR}`,
}) => {
  return (
    <div className="p-3 px-6 border-b border-gray-200 bg-white">
      <div className="flex justify-between w-full flex-wrap items-center gap-4 text-sm">
        <div className="flex justify-start items-center gap-2">
          <div className="flex items-center">
            <label className="font-medium text-gray-700 text-base">
              {STATIC_TEXTS.CASE_DETAILS.SHOW}
            </label>
            {showOptions && (
              <select
                className="max-w-34 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple ml-2 !accent-purple"
                value={selectedShow}
                onChange={(e) => onShowChange?.(e.target.value)}
              >
                {showOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <span className="text-gray-700 font-medium text-base">{label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.caseName}
              className="w-4 h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple"
              readOnly
            />
            <span className="select-none">{caseName}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.live_with}
              onChange={() => onFilterChange("live_with")}
              className="w-4 h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple"
            />
            <span className="select-none">
              {STATIC_TEXTS.CASE_DETAILS.LIVING_WITH}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.related}
              onChange={() => onFilterChange("related")}
              className="w-4 h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple"
            />
            <span className="select-none">
              {STATIC_TEXTS.CASE_DETAILS.RELATED}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsFilter;
