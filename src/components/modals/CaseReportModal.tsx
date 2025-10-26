import React, { useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

interface CaseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CaseReportModal: React.FC<CaseReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [includeRelationships, setIncludeRelationships] = useState<boolean>(false);
  const { data: caseData } = useSelector((state: RootState) => state.case);

  const handleViewReport = () => {
    onClose();
    navigate(`/cases/${caseData?._id}/case-report?includeRelationships=${includeRelationships}`);
  };

  const renderFilters = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Choose Filters for Case Report
      </h3>
      <div className="flex items-center">
        <input
          id="filter-include-relationships"
          type="checkbox"
          checked={includeRelationships}
          onChange={() => setIncludeRelationships(!includeRelationships)}
          className="h-4 w-4 text-purple-600 focus:ring-purple border-gray-300 rounded cursor-pointer"
        />
        <label
          htmlFor="filter-include-relationships"
          className="ml-2 block text-sm text-gray-900 cursor-pointer"
        >
          Include Relationships
        </label>
      </div>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Case Report"
      widthClass="max-w-lg"
      footer={
        <div className="flex justify-between w-full">
          <div className="flex justify-end gap-2 w-full">
            <Button label="Cancel" onClick={onClose} variant="default" />
            <Button
              label="View Report"
              onClick={handleViewReport}
              variant="submitStyle"
            />
          </div>
        </div>
      }
    >
      {renderFilters()}
    </ModalWrapper>
  );
};

export default CaseReportModal;
