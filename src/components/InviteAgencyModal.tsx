import React, { useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

const InviteAgencyModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full p-2 hover:bg-[#3B3E5B] rounded-lg transition-colors duration-200"
      >
        <Icon icon="mdi:account-plus" width="20" height="20" />
        <span className="text-sm">Invite</span>
      </button>

      <ModalWrapper
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Invite an Agency"
        footer={
          <>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors duration-200">
              <Icon icon="mdi:check-circle" width="20" height="20" />
              Invite
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors duration-200"
            >
              <Icon icon="mdi:cancel" width="20" height="20" />
              Cancel
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {["Agency Name", "First Name", "Last Name", "Email"].map(
            (label, i) => (
              <div key={i} className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  {label} <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter ${label}`}
                />
              </div>
            )
          )}
        </div>
      </ModalWrapper>
    </>
  );
};

export default InviteAgencyModal;
