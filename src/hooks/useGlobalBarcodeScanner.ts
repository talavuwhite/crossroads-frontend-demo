import { useEffect, useRef } from "react";
import { useBarcodeScanner } from "@/contexts/BarcodeScannerContext";

export const useGlobalBarcodeScanner = () => {
  const { handleBarcodeScanned, autoOpenEnabled } = useBarcodeScanner();
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  useEffect(() => {
    // Only add listener if auto-open is enabled
    if (!autoOpenEnabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();

      // Reset buffer if too much time has passed (barcode scanners send keys rapidly)
      if (currentTime - lastKeyTime.current > 100) {
        barcodeBuffer.current = "";
      }

      lastKeyTime.current = currentTime;

      // Ignore modifier keys and function keys
      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.key.length > 1
      ) {
        return;
      }

      // Add character to buffer
      barcodeBuffer.current += event.key;

      // Check for Enter key (barcode scanners typically end with Enter)
      if (event.key === "Enter") {
        const barcodeData = barcodeBuffer.current.slice(0, -1); // Remove the Enter key

        if (barcodeData.length > 0) {
          // Prevent the Enter key from triggering other actions
          event.preventDefault();
          // Handle the barcode scan
          handleBarcodeScanned(barcodeData);
        }

        // Reset buffer
        barcodeBuffer.current = "";
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBarcodeScanned, autoOpenEnabled]);
};
