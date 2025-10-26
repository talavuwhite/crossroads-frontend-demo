import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "../ui/Button";
import ModalWrapper from "../ui/ModalWrapper";
import type { IOutcomeGoal } from "@/services/CaseApi";

interface GoalRemoveCOnfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  notApplicableGoals: IOutcomeGoal[];
  submitLoading: boolean;
}

const GoalRemoveCOnfirmationModal: React.FC<
  GoalRemoveCOnfirmationModalProps
> = ({ isOpen, onClose, onConfirm, notApplicableGoals, submitLoading }) => {
  const footerContent = (
    <>
      <Button
        onClick={onClose}
        label="Cancel"
        disabled={submitLoading}
        className="px-4 py-2"
      />
      <Button
        onClick={onConfirm}
        label="Continue & Save"
        variant="submitStyle"
        disabled={submitLoading}
        className="px-4 py-2"
        icon={submitLoading ? "mdi:loading" : "mdi:check"}
      />
    </>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Goal Exclusion"
      footer={footerContent}
      widthClass="max-w-md"
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <Icon
              icon="mdi:alert-circle"
              className="text-orange-500"
              width={24}
              height={24}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Goal Exclusion
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            The following {notApplicableGoals.length || 0} goal(s) marked as
            "Not Applicable" will be excluded from this section:
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
            {notApplicableGoals.map((goal, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-gray-700 mb-1 last:mb-0"
              >
                <Icon
                  icon="mdi:minus-circle"
                  className="text-red-500"
                  width={16}
                  height={16}
                />
                <span className="font-medium">{goal.name}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 mt-3">
            Do you want to continue and exclude these goals?
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default GoalRemoveCOnfirmationModal;
