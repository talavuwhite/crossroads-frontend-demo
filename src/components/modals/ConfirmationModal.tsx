import React from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import { STATIC_TEXTS } from "@utils/textConstants";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "success" | "danger" | "warning" | "info";
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = STATIC_TEXTS.COMMON.DELETE,
  cancelText = STATIC_TEXTS.COMMON.CANCEL,
  variant = "danger",
  loading = false,
}) => {
  const getButtonVariant = () => {
    switch (variant) {
      case "success":
        return "submitStyle";
      case "danger":
        return "dangerStyle";
      case "warning":
        return "warningStyle";
      case "info":
        return "infoStyle";
      default:
        return "dangerStyle";
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant={getButtonVariant()}
            label={loading ? <span className="flex items-center"><span className="loader mr-2"></span>{confirmText}</span> : confirmText}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
          />
          <Button label={cancelText} onClick={onClose} disabled={loading} />
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
      </div>
    </ModalWrapper>
  );
};

export default ConfirmationModal;
