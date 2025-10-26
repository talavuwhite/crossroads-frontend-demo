import { useEffect } from "react";
import { useBarcodeScanner } from "@/contexts/BarcodeScannerContext";

export const useKeyboardShortcuts = () => {
  const { openScanner, isScannerOpen } = useBarcodeScanner();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to open barcode scanner
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        if (!isScannerOpen) {
          openScanner();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openScanner, isScannerOpen]);
};
