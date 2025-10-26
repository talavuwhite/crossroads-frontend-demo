import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useBarcodeScanner } from "@/contexts/BarcodeScannerContext";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import {
  fetchCaseById,
  fetchAssistanceBarcodeData,
  searchCasesForMerge,
} from "@/services/CaseApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import type { CaseType, SearchMergeCaseResult } from "@/types/case";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { createAssistance } from "@/services/AssistanceApi";
import { getBackendUrl } from "@/utils/commonFunc";
import { ERROR_MESSAGES, STATIC_TEXTS } from "@/utils/textConstants";
import { debounce } from "lodash";
import Barcode from "react-barcode";
import { fetchBarcodes } from "@/services/AssistanceBarcodeApi";
import type { AssistanceBarcode } from "@/types";
import Loader from "./ui/Loader";

const GlobalBarcodeScannerHandler: React.FC = () => {
  const {
    isScannerOpen,
    closeScanner,
    openScanner,
    autoOpenEnabled,
    setAutoOpenEnabled,
    lastScannedCase,
    lastScannedCaseId,
  } = useBarcodeScanner();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [scannedCaseId, setScannedCaseId] = useState("");
  const [isManualProcessing, setIsManualProcessing] = useState(false);
  const [isFetchingCase, setIsFetchingCase] = useState(false);
  const [scannedCase, setScannedCase] = useState<CaseType | null>(null);
  const [assistanceItems, setAssistanceItems] = useState<any[]>([]);
  const [isScanningAssistance, setIsScanningAssistance] = useState(false);
  const [currentAssistanceBarcode, setCurrentAssistanceBarcode] = useState("");
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScanTsRef = useRef<number>(0);
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMergeCaseResult[]>(
    []
  );
  const [isAvailableBarcodesOpen, setIsAvailableBarcodesOpen] = useState(false);
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [availableBarcodes, setAvailableBarcodes] = useState<
    AssistanceBarcode[]
  >([]);
  const [loadingAvailableBarcodes, setLoadingAvailableBarcodes] =
    useState(false);

  useEffect(() => {
    const loadAvailable = async () => {
      if (!isAvailableBarcodesOpen || !userData?.userId) return;
      setLoadingAvailableBarcodes(true);
      try {
        const resp = await fetchBarcodes(
          "Agency Only",
          userData.userId,
          userData?.activeLocation,
          1,
          50
        );
        setAvailableBarcodes(resp?.barcodes || []);
      } catch (e) {
        toast.error("Failed to load barcodes");
        setAvailableBarcodes([]);
      } finally {
        setLoadingAvailableBarcodes(false);
      }
    };
    loadAvailable();
  }, [isAvailableBarcodesOpen, userData?.userId, userData?.activeLocation]);

  // --- Central barcode handler ---
  const isLikelyValidBarcode = (value: string) => {
    if (!value) return false;
    const trimmed = value.trim();
    if (trimmed.length < 3) return false;
    // Allow alphanumerics and common scanner chars
    if (!/^[a-zA-Z0-9\-_\.]+$/.test(trimmed)) return false;
    return true;
  };

  const handleBarcodeInput = (barcode: string) => {
    const nowTs = Date.now();
    if (nowTs - (lastScanTsRef.current || 0) < 200) {
      return;
    }
    lastScanTsRef.current = nowTs;

    const trimmed = (barcode || "").trim();
    if (!trimmed || !isLikelyValidBarcode(trimmed)) {
      toast.error("Invalid scan. Please scan again.");
      return;
    }

    if (!scannedCase) {
      lookupCaseById(trimmed, true);
      return;
    }

    handleAssistanceBarcodeScan(trimmed);
  };

  useEffect(() => {
    if (isScannerOpen) {
    } else {
      // Closing: stop and clear state
      stopScanner();
      setScannedCaseId("");
      setScannedCase(null);
      setIsManualProcessing(false);
      setIsFetchingCase(false);
      setAssistanceItems([]);
      setIsScanningAssistance(false);
      setCurrentAssistanceBarcode("");
    }

    return () => {
      stopScanner();
    };
  }, [isScannerOpen]);

  useEffect(() => {
    if (isScannerOpen && lastScannedCase && lastScannedCaseId) {
      setScannedCaseId(lastScannedCase?.caseId || lastScannedCaseId);
      setScannedCase(lastScannedCase);
    }
  }, [isScannerOpen, lastScannedCase, lastScannedCaseId]);

  // --- Hardware scanner input ---
  useEffect(() => {
    let barcodeBuffer = "";
    let barcodeTimeout: NodeJS.Timeout;
    let lastKeyTime = 0;

    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // ⛔ Ignore if typing in input/textarea/contentEditable
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        (target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 200) {
        barcodeBuffer = "";
        clearTimeout(barcodeTimeout);
      }
      lastKeyTime = currentTime;

      if (event.key === "Enter") {
        if (barcodeBuffer.length > 0) {
          event.preventDefault();
          handleBarcodeInput(barcodeBuffer);
          barcodeBuffer = "";
        }
      } else if (
        event.key.length === 1 &&
        event.key.match(/[a-zA-Z0-9\-_\.]/)
      ) {
        barcodeBuffer += event.key;
        clearTimeout(barcodeTimeout);
        barcodeTimeout = setTimeout(() => {
          if (barcodeBuffer.length > 0 && barcodeBuffer.length >= 3) {
            handleBarcodeInput(barcodeBuffer);
            barcodeBuffer = "";
          }
        }, 150);
      }
    };

    document.addEventListener("keypress", handleKeyPress);
    return () => {
      document.removeEventListener("keypress", handleKeyPress);
      clearTimeout(barcodeTimeout);
    };
  }, [scannedCase, autoOpenEnabled]);

  // --- Camera scanner logic ---
  // const initializeScanner = async () => {
  //   let attempts = 0;
  //   const maxAttempts = 10;
  //   while (!videoRef.current && attempts < maxAttempts) {
  //     await new Promise((resolve) => setTimeout(resolve, 100));
  //     attempts++;
  //   }
  //   if (!videoRef.current) {
  //     return;
  //   }
  //   try {
  //     let codeReader: BrowserMultiFormatReader;
  //     try {
  //       codeReader = new BrowserMultiFormatReader();
  //       codeReaderRef.current = codeReader;
  //     } catch (zxingError) {
  //       throw new Error("Failed to initialize barcode scanner library");
  //     }
  //     let videoInputDevices;
  //     try {
  //       videoInputDevices = await codeReader.listVideoInputDevices();
  //     } catch (deviceError) {
  //       throw new Error(
  //         "Failed to access camera devices - check camera permissions"
  //       );
  //     }
  //     if (videoInputDevices.length === 0) {
  //       return;
  //     }
  //     try {
  //       await codeReader.decodeFromVideoDevice(
  //         videoInputDevices[0].deviceId,
  //         videoRef.current,
  //         (result: Result | null, error: any) => {
  //           if (result && !isScanning && !isFetchingCase) {
  //             let barcodeText: string;
  //             try {
  //               barcodeText = result.getText();
  //               const cleanBarcodeText = barcodeText.replace(
  //                 /[^a-zA-Z0-9\-_\.]/g,
  //                 ""
  //               );
  //               if (cleanBarcodeText.length > 0) {
  //                 setIsScanning(true);
  //                 handleBarcodeInput(cleanBarcodeText);
  //               }
  //             } catch {
  //               // Ignore getText errors
  //             }
  //           }
  //           if (error && error.name !== "NotFoundException") {
  //             // handle error or log
  //           }
  //         }
  //       );
  //     } catch {
  //       throw new Error("Failed to start camera scanning");
  //     }
  //   } catch (err: any) {
  //     let errorMessage = "Failed to initialize camera";
  //     if (err.message.includes("permission")) {
  //       errorMessage =
  //         "Camera permission denied. Please allow camera access and try again.";
  //     } else if (err.message.includes("No camera devices")) {
  //       errorMessage =
  //         "No camera found. Please connect a camera or use hardware scanner mode.";
  //     } else if (err.message.includes("Failed to access camera devices")) {
  //       errorMessage =
  //         "Cannot access camera. Please check camera permissions and try again.";
  //     } else {
  //       errorMessage = err.message || "Failed to initialize camera";
  //     }
  //     toast.error(`Camera initialization failed: ${errorMessage}`);
  //     if (
  //       err.message.includes("No camera devices") ||
  //       err.message.includes("permission")
  //     ) {
  //       setTimeout(() => {}, 2000);
  //     }
  //   } finally {
  //   }
  // };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (error) {}
      codeReaderRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanner();
    setScannedCaseId("");
    setScannedCase(null);
    setIsManualProcessing(false);
    setIsFetchingCase(false);
    closeScanner();
  };

  const lookupCaseById = async (id: string, isFromScan: boolean = false) => {
    const trimmed = (id || "").trim();
    if (!trimmed) {
      toast.error("No barcode data received");
      return;
    }
    if (isFromScan) {
      setScannedCaseId(trimmed);
    }
    setIsFetchingCase(true);
    try {
      if (!trimmed || trimmed.length < 3) {
        throw new Error("Invalid case ID format - too short");
      }
      const caseData = await fetchCaseById(
        trimmed.replace(/^C-/, ""),
        userData?.userId,
        userData?.activeLocation
      );
      if (!caseData) {
        throw new Error("No case found with this ID");
      }
      if (!caseData._id) {
        throw new Error("Invalid case data received - missing case ID");
      }
      setScannedCase(caseData as unknown as CaseType);
      setScannedCaseId(caseData.caseId);
      if (isFromScan) {
        const caseName = `${caseData.firstName || ""} ${
          caseData.lastName || ""
        }`.trim();
        toast.success(`Case found: ${caseName || "Unknown"}`);
        if (autoOpenEnabled) {
          setScannedCase(caseData as unknown as CaseType);
          setScannedCaseId(caseData.caseId);
          if (!isScannerOpen) {
            openScanner();
          } else {
          }
        } else {
          stopScanner();
          window.location.href = `/cases/${caseData._id}`;
          return;
        }
      }
    } catch (e: any) {
      const errorMessage = e.message || "No case found for this ID";
      toast.error(`Error: ${errorMessage}`);
      setScannedCase(null);
    } finally {
      setIsFetchingCase(false);
    }
  };

  const handleManualCaseSearch = async () => {
    if (!scannedCaseId.trim()) {
      toast.error("Please enter a case number");
      return;
    }
    setIsManualProcessing(true);
    try {
      await lookupCaseById(scannedCaseId.trim(), false);
    } catch (error) {
      toast.error(
        "Failed to find case. Please check the case ID and try again."
      );
    } finally {
      setIsManualProcessing(false);
    }
  };

  const handleAssistanceBarcodeScan = async (barcodeData: string) => {
    if (!scannedCase) {
      toast.error("No case selected. Please scan a case first.");
      return;
    }
    if (!userData?.userId) {
      toast.error("Please login with valid GHL credentials");
      return;
    }
    setIsScanningAssistance(true);
    setCurrentAssistanceBarcode(barcodeData);
    try {
      const response = await fetchAssistanceBarcodeData(
        barcodeData,
        userData?.userId,
        userData?.activeLocation
      );
      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Failed to fetch assistance barcode data"
        );
      }
      const assistanceData = response.data;
      const assistanceItem = {
        ...assistanceData,
        barcodeId: barcodeData,
        scannedAt: new Date().toISOString(),
      };
      setAssistanceItems((prev) => [...prev, assistanceItem]);
      toast.success(`Assistance item added: ${assistanceData.barcodeName}`);
    } catch (error: any) {
      toast.error(
        error?.message ??
          "Failed to process assistance barcode. Please check the barcode and try again."
      );
    } finally {
      setIsScanningAssistance(false);
      setCurrentAssistanceBarcode("");
    }
  };

  const handleConfirmAssistance = async () => {
    try {
      if (!userData?.userId) {
        toast.error("Please login with valid GHL account");
        return;
      }

      if (!scannedCase) {
        toast.error("Please select case");
        return;
      }

      if (!assistanceItems || assistanceItems.length === 0) {
        toast.error("Please select at least one assistance barcode");
        return;
      }

      // Run all requests in parallel
      const promises = assistanceItems.map((assistance) => {
        const formData = {
          amount: assistance.assistanceAmount?.toString() || "0",
          unit: assistance.assistanceUnit?._id,
          category: assistance.assistanceCategory?._id,
          description: assistance.assistanceDescription || "",
          visibleTo: scannedCase.visibleTo,
        };

        return createAssistance(
          scannedCase._id,
          formData,
          userData.userId,
          userData.activeLocation
        );
      });

      await Promise.all(promises);
      handleClose();
      toast.success("Assistance confirmed successfully!");
    } catch (error) {
      console.error("Error confirming assistance:", error);
      toast.error("Something went wrong while confirming assistance");
    }
  };
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      setLoadingSearchResults(true);
      try {
        const results = await searchCasesForMerge(
          term,
          userData?.userId,
          userData?.activeLocation
        );
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching cases:", error);
        toast.error(ERROR_MESSAGES.FETCH.CASES);
        setSearchResults([]);
      } finally {
        setLoadingSearchResults(false);
      }
    }, 500),
    [userData?.activeLocation, userData?.userId]
  );
  const handleCaseSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setCaseSearchTerm(term);
    if (term.length > 2) {
      debouncedSearch(term);
    } else {
      setSearchResults([]);
    }
  };
  const handleSelectCase = async (caseItem: SearchMergeCaseResult) => {
    try {
      if (!userData?.userId) {
        toast.error("Please login with valid GHL credentials");
        return;
      }
      const res = await fetchCaseById(
        caseItem?.id,
        userData?.userId,
        userData?.activeLocation
      );
      setScannedCase(res);
    } catch (error: any) {
      const errorMessage = error.message || "No case found for this ID";
      toast.error(`Error: ${errorMessage}`);
    }

    setSearchResults([]);
    setCaseSearchTerm("");
  };

  return (
    <ModalWrapper
      isOpen={isScannerOpen}
      onClose={handleClose}
      title="Barcode Mode"
      widthClass="max-w-md"
      footer={
        <>
          {!isFetchingCase &&
            !isManualProcessing &&
            !scannedCase &&
            !isAvailableBarcodesOpen && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="submitStyle"
                  label={isManualProcessing ? "SEARCHING..." : "SEARCH"}
                  onClick={handleManualCaseSearch}
                  disabled={isManualProcessing || !scannedCaseId.trim()}
                  className="px-6 py-3 text-lg font-bold uppercase tracking-wide"
                />
                <Button
                  variant="dangerStyle"
                  label="CANCEL"
                  onClick={handleClose}
                  className="px-8 py-3 text-lg font-bold uppercase tracking-wide"
                />
              </div>
            )}
          {!isFetchingCase &&
            !isManualProcessing &&
            scannedCase &&
            assistanceItems.length > 0 && (
              <div className="w-full flex gap-3">
                <Button
                  label="Confirm Assistance"
                  onClick={handleConfirmAssistance}
                  variant="submitStyle"
                  className="flex-1 justify-center"
                />
                <Button
                  label="Cancel"
                  onClick={handleClose}
                  className="flex-1 justify-center"
                />
              </div>
            )}
        </>
      }
    >
      <div className="flex flex-col space-y-6">
        {/* Available Barcodes Link */}
        {!isAvailableBarcodesOpen && scannedCase && (
          <div className="flex justify-end">
            <button
              className="text-sm text-gray-500 underline"
              onClick={() => setIsAvailableBarcodesOpen(true)}
            >
              Available Barcodes
            </button>
          </div>
        )}

        {/* Available Barcodes Modal */}
        {isAvailableBarcodesOpen ? (
          <div className=" rounded-lg p-3 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">
                Available Barcodes
              </h3>
              <Button
                label="Close"
                onClick={() => setIsAvailableBarcodesOpen(false)}
              />
            </div>
            {loadingAvailableBarcodes ? (
              <div className="py-6 text-center text-sm text-gray-600">
                <Loader width={5} height={5} />
              </div>
            ) : availableBarcodes.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-600">
                No barcodes found
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableBarcodes.map((b) => (
                  <button
                    key={b._id}
                    className="border  border-gray-200 rounded-md p-3 hover:shadow transition text-left"
                    onClick={() => {
                      // Add to assistance items immediately
                      const assistanceItem = {
                        ...b,
                        barcodeId: `A-${b._id}`,
                        scannedAt: new Date().toISOString(),
                      } as any;
                      setAssistanceItems((prev) => [...prev, assistanceItem]);
                      setIsAvailableBarcodesOpen(false);
                    }}
                  >
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-2 flex items-center justify-center mb-2">
                      <Barcode
                        value={`A-${b._id}`}
                        height={40}
                        width={1.5}
                        displayValue={false}
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {b.barcodeName}
                    </div>
                    <div className="text-xs text-gray-600">
                      {b.assistanceCategory?.sectionId?.name}:{" "}
                      {b.assistanceCategory?.name}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {b.assistanceUnit?.name === "Dollars"
                        ? "$"
                        : b.assistanceUnit?.name}{" "}
                      {b.assistanceAmount}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Case Search Input */}
            <div className="flex items-center w-full gap-2 relative">
              <span className="text-sm font-medium text-gray-700 w-14">
                Case #
              </span>
              <input
                type="text"
                value={caseSearchTerm || scannedCaseId}
                onChange={handleCaseSearchChange}
                placeholder="Scanned case number will appear here"
                className="min-w-32 w-full text-sm px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
              />

              {/* Search Results Dropdown */}
              {caseSearchTerm.length > 2 && searchResults.length > 0 && (
                <ul className="absolute z-10 top-9 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {searchResults.map((caseItem) => (
                    <li
                      key={caseItem.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800"
                      onClick={() => handleSelectCase(caseItem)}
                    >
                      {caseItem.caseId} - {caseItem.fullName}
                    </li>
                  ))}
                </ul>
              )}

              {/* Search Loading */}
              {loadingSearchResults && caseSearchTerm.length > 2 && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple"></div>
                </div>
              )}

              {/* No Cases Found */}
              {caseSearchTerm.length > 2 &&
                searchResults.length === 0 &&
                !loadingSearchResults && (
                  <div className="text-red-500 text-xs block mt-1">
                    {STATIC_TEXTS.COMMON.NO_CASES_FOUND}
                  </div>
                )}
            </div>

            {/* Loading Case */}
            {(isFetchingCase || isManualProcessing) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <div className="text-center">
                    <span className="text-sm text-blue-700 font-medium">
                      {isFetchingCase
                        ? "Searching for case..."
                        : "Processing..."}
                    </span>
                    <p className="text-xs text-blue-600 mt-1">
                      Please wait while we fetch the case details...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Case Found */}
            {!isFetchingCase && !isManualProcessing && scannedCase && (
              <div className="w-full rounded-md border border-gray-200 bg-blue-50 p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 flex items-center justify-center shadow-sm bg-gray-50 border border-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    {scannedCase &&
                    scannedCase?.caseImage &&
                    scannedCase?.caseImage?.length > 0 ? (
                      <img
                        src={getBackendUrl(scannedCase.caseImage[0])}
                        alt={`${scannedCase?.firstName || "Case"} profile`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <Icon
                      icon="mdi:user"
                      width={24}
                      height={24}
                      className={`text-gray-400 ${
                        scannedCase?.caseImage &&
                        scannedCase?.caseImage?.length > 0
                          ? "hidden"
                          : ""
                      }`}
                    />
                  </div>

                  {/* Case Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {scannedCase.firstName} {scannedCase.lastName}
                      </h3>
                      <div className="text-sm text-gray-500">
                        {scannedCase.caseId}
                      </div>
                    </div>

                    <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
                      <div>
                        {scannedCase.streetAddress?.address && (
                          <div>{scannedCase.streetAddress.address}</div>
                        )}
                        {(scannedCase.streetAddress?.city ||
                          scannedCase.streetAddress?.state ||
                          scannedCase.streetAddress?.zip) && (
                          <div>
                            {scannedCase.streetAddress?.city || ""}
                            {scannedCase.streetAddress?.city ? ", " : ""}
                            {scannedCase.streetAddress?.state || ""}{" "}
                            {scannedCase.streetAddress?.zip || ""}
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {scannedCase.dateOfBirth && (
                          <div>
                            <span className="font-medium">DOB:</span>{" "}
                            {scannedCase.dateOfBirth}
                          </div>
                        )}
                        {scannedCase.ssn && (
                          <div>
                            <span className="font-medium">SSN:</span> ***-**-
                            {scannedCase.ssn.slice(-4)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="submitStyle"
                        label="VIEW CASE"
                        onClick={() => {
                          closeScanner();
                          window.location.href = `/cases/${scannedCase._id}`;
                        }}
                        className="px-4 py-2 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Barcode Visualization - Show when case is scanned */}
            {!isFetchingCase &&
              !isManualProcessing &&
              scannedCase &&
              assistanceItems?.length === 0 && (
                <div className="w-full bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">
                    SCAN ASSISTANCE BARCODE
                  </h3>
                  <div className="flex justify-center space-x-8">
                    {/* Active Barcode (with red scan line) */}
                    <div className="flex flex-col items-center">
                      <div className="relative bg-white border border-gray-300 rounded-lg p-4 shadow-md mb-3">
                        <div className="w-48 h-16 bg-white relative overflow-hidden">
                          {/* Barcode lines */}
                          <div className="flex h-full items-center justify-center space-x-1">
                            <Barcode
                              value="randomGeneration"
                              displayValue={false}
                            />
                          </div>

                          {/* Red scan line (animated up & down) */}
                          <div className="absolute left-0 w-full h-0.5 bg-red-500 animate-scan"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            {/* Assistance Items */}
            {!isFetchingCase &&
              !isManualProcessing &&
              scannedCase &&
              assistanceItems.length > 0 && (
                <div className="w-full bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
                  <table className="w-full text-sm text-gray-700 border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold uppercase text-xs tracking-wider">
                          Item Name
                        </th>
                        <th className="px-5 py-3 text-left font-semibold uppercase text-xs tracking-wider">
                          Amount / Unit
                        </th>
                        <th className="px-5 py-3 text-center font-semibold uppercase text-xs tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assistanceItems.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-none"
                        >
                          <td className="px-5 py-3 font-medium flex flex-col text-gray-900">
                            <span>{item.barcodeName || "Unknown Item"}</span>
                            <span className="text-gray-400 normal">
                              {item?.assistanceCategory?.sectionId?.name} :{" "}
                              {item?.assistanceCategory?.name}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-800">
                            {parseFloat(item.assistanceAmount || 0).toFixed(2)}
                            {item.assistanceUnit?.name && (
                              <span className="text-sm text-gray-500 ml-1">
                                / {item.assistanceUnit.name}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => {
                                setAssistanceItems((prev) =>
                                  prev.filter((_, i) => i !== index)
                                );
                                toast.success("Assistance item removed");
                              }}
                              className="inline-flex items-center justify-center p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                            >
                              <Icon icon="mdi:close" className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* Assistance Scanning */}
            {isScanningAssistance && (
              <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <div className="text-center">
                    <span className="text-sm text-blue-700 font-medium">
                      Processing assistance barcode...
                    </span>
                    <p className="text-xs text-blue-600 mt-1">
                      Adding item to case: {currentAssistanceBarcode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Default (no case scanned) */}
            {!isFetchingCase && !isManualProcessing && !scannedCase && (
              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-2 my-2">
                  <input
                    type="checkbox"
                    id="autoOpen"
                    checked={autoOpenEnabled}
                    onChange={(e) => setAutoOpenEnabled(e.target.checked)}
                    className="w-4 h-4 text-purple border-gray-300 rounded focus:ring-purple accent-purple"
                  />
                  <label htmlFor="autoOpen" className="text-sm text-gray-700">
                    Open this window whenever a barcode is scanned
                  </label>
                </div>

                {/* Hardware Scanner UI */}
                <div className="relative bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden w-full">
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <div className="text-center">
                      <p className="text-sm text-blue-600 mb-3 font-semibold">
                        Hardware Scanner Mode
                      </p>
                      <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-700 font-medium">
                            Listening for barcode input...
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        Point your hardware barcode scanner at a barcode and
                        scan. The data will be automatically detected and
                        processed.
                      </p>
                      <p className="text-xs text-gray-500">
                        <strong>Alternative:</strong> You can also manually
                        enter the case ID above.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                    Hardware Scanner Mode
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Point your hardware scanner at a barcode and scan, or enter
                    case ID manually
                  </p>
                </div>

                <div className="text-center">
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(
                        "https://help.simonsolutions.com/en/articles/670989-barcodes-scanning-assistance-client-ids",
                        "_blank"
                      );
                    }}
                  >
                    Click to watch a video of how to create and use client ID
                    cards
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ModalWrapper>
  );
};

export default GlobalBarcodeScannerHandler;
