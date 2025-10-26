import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchCaseById } from "@/services/CaseApi";

interface IBarcodeScannerContext {
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  handleBarcodeScanned: (barcodeData: string) => Promise<void>;
  isProcessing: boolean;
  autoOpenEnabled: boolean;
  setAutoOpenEnabled: (enabled: boolean) => void;
  lastScannedCase: any | null;
  lastScannedCaseId: string;
}

const BarcodeScannerContext = createContext<IBarcodeScannerContext | undefined>(
  undefined
);

export const useBarcodeScanner = () => {
  const context = useContext(BarcodeScannerContext);
  if (!context) {
    throw new Error(
      "useBarcodeScanner must be used within a BarcodeScannerProvider"
    );
  }
  return context;
};

interface IBarcodeScannerProviderProps {
  children: React.ReactNode;
  userId?: string;
  locationId?: string;
}

export const BarcodeScannerProvider: React.FC<IBarcodeScannerProviderProps> = ({
  children,
  userId,
  locationId,
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize autoOpenEnabled from localStorage or default to true
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(() => {
    const saved = localStorage.getItem("barcodeScannerAutoOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [lastScannedCase, setLastScannedCase] = useState<any | null>(null);
  const [lastScannedCaseId, setLastScannedCaseId] = useState("");
  const navigate = useNavigate();

  // Save autoOpenEnabled to localStorage whenever it changes
  const handleSetAutoOpenEnabled = useCallback((enabled: boolean) => {
    setAutoOpenEnabled(enabled);
    localStorage.setItem("barcodeScannerAutoOpen", JSON.stringify(enabled));
  }, []);

  const openScanner = useCallback(() => {
    setIsScannerOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
  }, []);

  const handleBarcodeScanned = useCallback(
    async (barcodeData: string) => {
      if (!barcodeData?.trim()) {
        toast.error("Invalid barcode data");
        return;
      }

      setIsProcessing(true);
      try {
        // Try to fetch case by the scanned barcode data
        const caseData = await fetchCaseById(barcodeData, userId, locationId);

        if (caseData) {
          toast.success(
            `Case found: ${caseData.firstName} ${caseData.lastName}`
          );

          // Handle based on autoOpenEnabled setting
          if (autoOpenEnabled) {
            // Auto-open is enabled: open modal to show case data
            if (!isScannerOpen) {
              // Set the case data first, then open the modal
              setLastScannedCase(caseData);
              setLastScannedCaseId(barcodeData);
              // Small delay to ensure case data is set before opening modal
              setTimeout(() => {
                setIsScannerOpen(true);
              }, 100);
            } else {
              // If modal is already open, the GlobalBarcodeScannerHandler will handle the navigation
            }
          } else {
            // Auto-open is disabled: navigate directly to case page WITHOUT opening modal
            // Don't open modal at all - just navigate directly
            navigate(`/cases/${caseData._id}`);
          }
        } else {
          toast.error("No case found with this barcode");
        }
      } catch (error) {
        toast.error(
          "Failed to find case. Please check the barcode and try again."
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [userId, locationId, isScannerOpen, autoOpenEnabled, closeScanner, navigate]
  );

  const value: IBarcodeScannerContext = {
    isScannerOpen,
    openScanner,
    closeScanner,
    handleBarcodeScanned,
    isProcessing,
    autoOpenEnabled,
    setAutoOpenEnabled: handleSetAutoOpenEnabled,
    lastScannedCase,
    lastScannedCaseId,
  };

  return (
    <BarcodeScannerContext.Provider value={value}>
      {children}
    </BarcodeScannerContext.Provider>
  );
};
