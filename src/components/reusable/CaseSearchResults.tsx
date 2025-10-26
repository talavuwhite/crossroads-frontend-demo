import React from "react";
import type { SearchMergeCaseResult } from "@/types/case";
import { STATIC_TEXTS } from "@/utils/textConstants";

interface CaseSearchResultsProps {
  loading: boolean;
  foundCases: SearchMergeCaseResult[];
  handleSelectCase: (caseData: SearchMergeCaseResult) => void;
}

const CaseSearchResults: React.FC<CaseSearchResultsProps> = ({
  loading,
  foundCases,
  handleSelectCase,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-700">Search results:</p>
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
          <p className="ml-2 text-gray-600">{STATIC_TEXTS.COMMON.LOADING}</p>
        </div>
      ) : foundCases.length > 0 ? (
        <ul className="space-y-3">
          {foundCases.map((caseItem, index) => (
            <li
              key={caseItem.id}
              className={`px-4 py-3  hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-purple/20 rounded-lg shadow-sm  ${index % 2 === 0 ? "bg-purpleLight/70" : "bg-white"
                }
              }`}
              onClick={() => handleSelectCase(caseItem)}
            >
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium text-gray-900">
                  {caseItem.fullName}
                </p>
                <div className="flex items-center gap-2">
                  {caseItem?.headOfHousehold && (
                    <span className="text-xs font-semibold text-purple uppercase tracking-wide">
                      HEAD OF HOUSEHOLD
                    </span>
                  )}
                  <p className="text-sm text-purple">#{caseItem.caseId}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <p>{caseItem.address || STATIC_TEXTS.CASE.NO_ADDRESS}</p>
                <p className="mt-2">
                  SSN : {caseItem.ssn || STATIC_TEXTS.COMMON.NOT_PROVIDED}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 text-center bg-purpleLight p-2 rounded-lg">
            {STATIC_TEXTS.COMMON.NO_DATA}
          </p>
        </div>
      )}
    </div>
  );
};

export default CaseSearchResults;
