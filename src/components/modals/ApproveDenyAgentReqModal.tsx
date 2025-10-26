import React, { useState } from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";

interface ApproveDenyAgentReqModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: string; // Request name or email or identifier
  onApprove: () => void;
  onDeny: (reason: string) => void;
  isApprove?: boolean; // true = approve flow, false = deny flow
}

const ApproveDenyAgentReqModal: React.FC<ApproveDenyAgentReqModalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onDeny,
  isApprove = false,
}) => {
  const [denyReason, setDenyReason] = useState("");

  const handleDenySubmit = () => {
    if (denyReason.trim()) {
      onDeny(denyReason.trim());
      setDenyReason("");
    }
  };

  const handleCancel = () => {
    setDenyReason("");
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleCancel}
      title={isApprove ? "Approve Agent Request" : "Deny Agent Request"}
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-3">
          <Button label="Cancel" onClick={handleCancel} variant="default" />
          {isApprove ? (
            <Button
              label="Confirm Approve"
              variant="submitStyle"
              icon="mdi:check"
              onClick={onApprove}
            />
          ) : (
            <Button
              label="Deny Request"
              variant="dangerStyle"
              icon="mdi:close"
              onClick={handleDenySubmit}
              disabled={!denyReason.trim()}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
        </div>
      }
    >
      {isApprove ? (
        <div className="p-4 text-gray-800">
          <p>
            Are you sure you want to approve the agent request for{" "}
            <span className="font-semibold">{request}</span>?
          </p>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-gray-800 mb-3">
            Please provide a reason for denying this request. This will be sent
            to the requester.
          </p>
          <textarea
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            placeholder="Enter reason for denial..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700 resize-none !outline-none"
            rows={4}
          />
        </div>
      )}
    </ModalWrapper>
  );
};

export default ApproveDenyAgentReqModal;
