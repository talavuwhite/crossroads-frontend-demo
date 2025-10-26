import React from "react";
import { Icon } from "@iconify-icon/react";
import { useBarcodeScanner } from "@/contexts/BarcodeScannerContext";

const BarcodeScannerFAB: React.FC = () => {
  const { openScanner, isProcessing } = useBarcodeScanner();

  return (
    <button
      onClick={openScanner}
      disabled={isProcessing}
      className="fixed bottom-10 right-6 z-40 w-14 h-14 bg-purple hover:bg-purple/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      title="Scan Barcode"
    >
      <Icon icon="mdi:barcode-scan" className="text-2xl" />
    </button>
  );
};

export default BarcodeScannerFAB;
