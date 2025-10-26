import React from "react";
import { useGlobalBarcodeScanner } from "@/hooks/useGlobalBarcodeScanner";

const GlobalBarcodeScannerListener: React.FC = () => {
  useGlobalBarcodeScanner();
  return null; // This component doesn't render anything
};

export default GlobalBarcodeScannerListener;
