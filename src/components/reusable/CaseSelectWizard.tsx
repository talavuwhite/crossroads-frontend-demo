import AddCaseModal from "@/components/modals/AddCaseModal";
import CaseSearchInput from "@/components/reusable/CaseSearchInput";
import CaseSearchResults from "@/components/reusable/CaseSearchResults";
import { fetchCaseById, searchCasesForMerge } from "@/services/CaseApi";
import type { CaseType, SearchMergeCaseResult } from "@/types/case";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useBarcodeScanner } from "@/contexts/BarcodeScannerContext";

interface ICaseSelectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  activeLocation?: string;
  onCaseSelected: (selectedCase: CaseType) => void;
  initialStep?: 1 | 2;
  // New: allow parent to render footer
  children?: (footerProps: ICaseSelectWizardFooterProps) => React.ReactNode;
}

export interface ICaseSelectWizardFooterProps {
  step: 1 | 2;
  loading: boolean;
  loadingCaseDetails: boolean;
  onSearch: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const CaseSelectWizard: React.FC<ICaseSelectWizardProps> = ({
  isOpen,
  onClose,
  userId,
  activeLocation,
  onCaseSelected,
  initialStep = 1,
  children,
}) => {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [caseIdentifier, setCaseIdentifier] = useState("");
  const [error, setError] = useState("");
  const [foundCases, setFoundCases] = useState<SearchMergeCaseResult[]>([]);
  const [isOpenAddCaseModal, setIsOpenAddCaseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCaseDetails, setLoadingCaseDetails] = useState(false);
  const { openScanner } = useBarcodeScanner();

  React.useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setCaseIdentifier("");
      setError("");
      setFoundCases([]);
    }
  }, [isOpen, initialStep]);

  const validateForm = () => {
    if (!caseIdentifier.trim()) {
      setError("Case name or number is required");
      return false;
    }
    setError("");
    return true;
  };

  const triggerSearch = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const results = await searchCasesForMerge(caseIdentifier, userId);
        setFoundCases(results);
        setStep(2);
      } catch (error) {
        console.error("Error searching cases:", error);
        toast.error("Failed to search cases. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch();
  };

  const handleSelectCase = async (caseData: SearchMergeCaseResult) => {
    setLoadingCaseDetails(true);
    try {
      const fullCaseData = await fetchCaseById(
        caseData.id,
        userId,
        activeLocation
      );
      onCaseSelected(fullCaseData);
    } catch (error) {
      console.error("Error fetching case details:", error);
      toast.error("Failed to fetch case details. Please try again.");
    } finally {
      setLoadingCaseDetails(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setCaseIdentifier("");
      setError("");
      setFoundCases([]);
    }
  };

  // Expose footer props for parent
  const footerProps: ICaseSelectWizardFooterProps = {
    step,
    loading,
    loadingCaseDetails,
    onSearch: triggerSearch,
    onBack: handleBack,
    onCancel: onClose,
  };

  return (
    <>
      {step === 1 ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={openScanner}
            className="mx-auto relative text-white bg-purple hover:bg-purple/90 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 group after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
          >
            <Icon icon="mdi:barcode-scan" width="18" height="18" />
            <span>Scan Barcode</span>
          </button>
          <div className="text-sm text-gray-700 text-center">Or</div>
          <CaseSearchInput
            label={
              <span className="text-sm text-gray-700">
                {STATIC_TEXTS.AGENCY.BED_MANAGEMENT.NAME_CASE_SEARCH}
              </span>
            }
            caseIdentifier={caseIdentifier}
            setCaseIdentifier={setCaseIdentifier}
            handleSearch={handleSearch}
            error={error}
          />
          <div className="text-sm text-gray-700 text-center">Or</div>
          <button
            onClick={() => setIsOpenAddCaseModal(true)}
            className="mx-auto relative text-white bg-purple hover:bg-purple/90 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 group  after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
          >
            <Icon icon="mdi:plus" width="18" height="18" />
            <span className="">
              {STATIC_TEXTS.AGENCY.BED_MANAGEMENT.ADD_NEW_PERSON}
            </span>
          </button>
        </div>
      ) : step === 2 ? (
        <CaseSearchResults
          foundCases={foundCases}
          handleSelectCase={handleSelectCase}
          loading={loading || loadingCaseDetails}
        />
      ) : null}
      <AddCaseModal
        isOpen={isOpenAddCaseModal}
        onClose={() => setIsOpenAddCaseModal(false)}
      />
      {children && children(footerProps)}
    </>
  );
};

export default CaseSelectWizard;
