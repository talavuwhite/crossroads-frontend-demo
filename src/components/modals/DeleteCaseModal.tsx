import React, { useEffect, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@/components/ui/Button";

interface DeleteCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  confirmButtonLabel?: string;
}

const DeleteCaseModal: React.FC<DeleteCaseModalProps> = ({
  isOpen,
  onClose,
  title = "Permanently Delete",
  message = "Are you sure you want to delete this case? All identification information, assistance records, notes and alerts will be irreversibly deleted.",
  confirmLabel = "DELETE",
  confirmButtonLabel = "Delete Case",
  onConfirmDelete,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmButtonEnabled = confirmText === "DELETE";

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);
  const footerContent = (
    <>
      <Button variant={"default"} label="Cancel" onClick={onClose} />
      <Button
        variant="default"
        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${
          isConfirmButtonEnabled
            ? "!bg-red-600 !hover:bg-red-700"
            : "!bg-gray-400 !cursor-not-allowed"
        }`}
        onClick={onConfirmDelete}
        disabled={!isConfirmButtonEnabled}
        label={confirmButtonLabel}
      />
    </>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footerContent}
      widthClass="max-w-md"
    >
      <div className="space-y-4 text-sm text-gray-700">
        <p>{message}</p>
        <div>
          <label htmlFor="confirm-delete" className="block font-semibold mb-1">
            Type{" "}
            <strong className="text-red-600 uppercase">{confirmLabel}</strong>{" "}
            to confirm (case sensitive)
          </label>
          <input
            id="confirm-delete"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
          />
        </div>
      </div>
    </ModalWrapper>
  );
};

export default DeleteCaseModal;
