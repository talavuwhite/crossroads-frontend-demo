import React, { useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { Icon } from "@iconify-icon/react";

const KioskModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const kioskLink = "https://jrc.charitytracker.net/kiosk/530a4e241cccc";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(kioskLink);
      alert("Link copied to clipboard!");
    } catch (error) {
      alert("Failed to copy link");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full p-2 hover:bg-[#3B3E5B] rounded-lg transition-colors duration-200"
      >
        <Icon icon="mdi:tablet-dashboard" width="20" height="20" />
        <span className="text-sm font-medium">Kiosk</span>
      </button>

      <ModalWrapper
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Kiosk Mode"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-md flex items-center gap-2 transition duration-200">
              <Icon icon="mdi:login" width="20" height="20" />
              Enter Kiosk Mode
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 text-sm rounded-md flex items-center gap-2 transition duration-200">
              <Icon icon="mdi:cog-outline" width="20" height="20" />
              Kiosk Settings
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm rounded-md flex items-center gap-2 transition duration-200"
            >
              <Icon icon="mdi:cancel" width="20" height="20" />
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <p className="text-gray-700 text-sm">
            Kiosk mode enables secure client intake on-site using a desktop,
            laptop, or tablet.
          </p>

          <div className="bg-blue-50 p-4 rounded-md space-y-3 border border-blue-100">
            <p className="text-blue-800 font-semibold text-sm">
              Share this <strong>Remote Intake</strong> link with clients:
            </p>
            <div className="relative">
              <input
                type="text"
                value={kioskLink}
                readOnly
                className="w-full px-4 py-2 pr-28 rounded-md border border-blue-200 bg-white font-mono text-sm text-gray-800"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm transition duration-200"
                onClick={handleCopy}
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
};

export default KioskModal;
