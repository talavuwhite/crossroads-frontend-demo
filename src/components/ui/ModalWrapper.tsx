import React from "react";
import Modal from "react-modal";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import type { ModalWrapperProps } from "@/types";

Modal.setAppElement("#root");

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  widthClass = "max-w-md",
  noPadding = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      className={`bg-white w-full  ${widthClass} rounded-lg shadow-xl outline-none !mx-4 md:mx-auto ${
        (title === "Add Case" ||
          title === "Edit Case" ||
          title === "Edit Network Settings") &&
        "!w-[95%] md:!w-full"
      }`}
    >
      <div className="bg-purple text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="flex hover:bg-purpleflex justify-center w-10 h-10 hover:text-red-400 p-1 items-center rounded-full transition-colors duration-200 cursor-pointer"
        >
          <Icon icon="mdi:close" className="" size={34} />
        </button>
      </div>

      <div
        className={`${
          noPadding
            ? "max-h-[72vh]"
            : "max-h-[70vh] overflow-y-auto px-4 hide-scrollbar p-6"
        }`}
      >
        {children}
      </div>

      {footer && (
        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t-1 border-t-gray-200 rounded-b-lg">
          {footer}
        </div>
      )}
    </Modal>
  );
};

export default ModalWrapper;
