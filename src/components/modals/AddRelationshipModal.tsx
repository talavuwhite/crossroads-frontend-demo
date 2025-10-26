import React, { useEffect, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import type { CaseType, SearchMergeCaseResult } from "@/types/case";
import {
  searchCasesForMerge,
  fetchCaseById,
  createCaseRelationship,
  updateCaseRelationship,
} from "@services/CaseApi";
import { toast } from "react-toastify";
import Button from "@ui/Button";
import CaseSearchInput from "@components/reusable/CaseSearchInput";
import CaseSearchResults from "@components/reusable/CaseSearchResults";
import Loader from "@/components/ui/Loader";
import { ERROR_MESSAGES, STATIC_TEXTS } from "@/utils/textConstants";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPerson: CaseType | null;
  setIsAddNewPerson: (value: boolean) => void;
  editMode?: boolean;
  relationshipToEdit?: {
    id: string;
    name: string;
    dob: string;
    age: string;
    label: string;
    customLabelAtoB: string;
    customLabelBtoA: string;
    livesTogether?: boolean;
    showDependantTag?: boolean;
  };
  onSuccess?: () => void;
}

const AddRelationshipModal: React.FC<AddRelationshipModalProps> = ({
  isOpen,
  onClose,
  initialPerson,
  setIsAddNewPerson,
  editMode = false,
  relationshipToEdit,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(editMode ? 3 : 1);
  const [caseIdentifier, setCaseIdentifier] = useState("");
  const [error, setError] = useState("");
  const [foundCases, setFoundCases] = useState<SearchMergeCaseResult[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseType | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCaseDetails, setLoadingCaseDetails] = useState(false);
  const [relationshipTypeA, setRelationshipTypeA] = useState("");
  const [relationshipTypeB, setRelationshipTypeB] = useState("");
  const [isDependant, setIsDependant] = useState(false);
  const [liveTogether, setLiveTogether] = useState(false);
  const { data: userData } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (isOpen) {
      if (editMode && relationshipToEdit) {
        setRelationshipTypeA(relationshipToEdit.customLabelAtoB);
        setRelationshipTypeB(relationshipToEdit.customLabelBtoA);
        setIsDependant(relationshipToEdit?.showDependantTag ?? false);
        setLiveTogether(relationshipToEdit?.livesTogether ?? false);
        setError("");
        setStep(3);
      } else {
        setStep(1);
        setCaseIdentifier("");
        setError("");
        setFoundCases([]);
        setSelectedCase(null);
        setRelationshipTypeA("");
        setRelationshipTypeB("");
        setIsDependant(false);
        setLiveTogether(false);
      }
      setIsAddNewPerson(false);
    }
  }, [isOpen, editMode, relationshipToEdit]);

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setCaseIdentifier("");
      setError("");
      setFoundCases([]);
    } else if (step === 3) {
      setStep(2);
      setSelectedCase(null);
    }
  };

  const validateForm = () => {
    if (step === 1) {
      if (!caseIdentifier.trim()) {
        setError(ERROR_MESSAGES.FORM.REQUIRED);
        return false;
      }
    } else if (step === 3) {
      if (!relationshipTypeA.trim()) {
        setError(ERROR_MESSAGES.FORM.REQUIRED);
        return false;
      }
      if (/\d/.test(relationshipTypeA)) {
        setError(
          "Relationship type for " +
            initialPerson?.firstName +
            " cannot contain numbers."
        );
        return false;
      }
      if (relationshipTypeA.length > 20) {
        setError(
          "Relationship type for " +
            initialPerson?.firstName +
            " cannot exceed 20 characters."
        );
        return false;
      }

      if (!relationshipTypeB.trim()) {
        setError(ERROR_MESSAGES.FORM.REQUIRED);
        return false;
      }
      if (/\d/.test(relationshipTypeB)) {
        setError(
          "Relationship type for " +
            selectedCase?.firstName +
            " cannot contain numbers."
        );
        return false;
      }
      if (relationshipTypeB.length > 20) {
        setError(
          "Relationship type for " +
            selectedCase?.firstName +
            " cannot exceed 20 characters."
        );
        return false;
      }
    }
    setError("");
    return true;
  };

  const triggerSearch = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const results = await searchCasesForMerge(
          caseIdentifier,
          userData?.userId,
          userData?.activeLocation
        );
        setFoundCases(results);
        setStep(2);
      } catch (error) {
        console.error("Error searching cases:", error);
        toast.error(ERROR_MESSAGES.FETCH.GENERIC);
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
        userData?.userId,
        userData?.activeLocation
      );
      setSelectedCase(fullCaseData);
      setStep(3);
    } catch (error) {
      console.error("Error fetching case details:", error);
      toast.error(ERROR_MESSAGES.FETCH.GENERIC);
    } finally {
      setLoadingCaseDetails(false);
    }
  };

  const handleAddRelationship = async () => {
    if (!validateForm()) {
      return;
    }

    if (!initialPerson?.caseId || (!selectedCase?.caseId && !editMode)) {
      toast.error(ERROR_MESSAGES.FETCH.GENERIC);
      return;
    }

    const relationshipTypeArray = [];
    if (isDependant) relationshipTypeArray.push("dependant");
    if (liveTogether) relationshipTypeArray.push("live_with");
    if (relationshipTypeArray.length === 0) relationshipTypeArray.push("related");

    const relationshipData = {
      relationshipType: relationshipTypeArray,
      customLabelAtoB: relationshipTypeA.trim() || undefined,
      customLabelBtoA: relationshipTypeB.trim() || undefined,
    };

    try {
      if (editMode && relationshipToEdit) {
        const response = await updateCaseRelationship(
          relationshipToEdit.id,
          relationshipData,
          userData?.userId || "",
          userData?.activeLocation || ""
        );
        toast.success(response?.message || "Relationship updated successfully!");
      } else {
        const response = await createCaseRelationship(
          {
            ...relationshipData,
            caseAId: initialPerson.caseId,
            caseBId: selectedCase!.caseId,
          },
          userData?.userId || "",
          userData?.activeLocation || ""
        );
        toast.success(response?.message || "Relationship added successfully!");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error managing relationship:", error);
      toast.error(error.message || ERROR_MESSAGES.FETCH.GENERIC);
    }
  };

  const renderStep = () => {
    if (editMode) {
      return (
        <div className="space-y-6">
          <p className="text-lg font-medium text-gray-700">
            Edit relationship between:
          </p>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-purple">
                {initialPerson?.firstName} {initialPerson?.lastName}
              </span>
              <span>is the</span>
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="e.g., Parent"
                  className={`border ${
                    error && (!relationshipTypeA.trim() || step !== 3)
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-purple rounded-md px-2 py-1 w-full`}
                  value={relationshipTypeA}
                  onChange={(e) => setRelationshipTypeA(e.target.value)}
                />
                {error && !relationshipTypeA.trim() && step === 3 && (
                  <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
              </div>
              <span>of</span>
              <span className="font-bold text-green-800">
                {relationshipToEdit?.name}
              </span>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-green-800">
                {relationshipToEdit?.name}
              </span>
              <span>is the</span>
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="e.g., Child"
                  className={`border ${
                    error && (!relationshipTypeB.trim() || step !== 3)
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-purple rounded-md px-2 py-1 w-full`}
                  value={relationshipTypeB}
                  onChange={(e) => setRelationshipTypeB(e.target.value)}
                />
                {error && !relationshipTypeB.trim() && step === 3 && (
                  <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
              </div>
              <span>of</span>
              <span className="font-bold text-purple">
                {initialPerson?.firstName} {initialPerson?.lastName}
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="dependantCheckbox"
              className="mr-2"
              checked={isDependant}
              onChange={(e) => setIsDependant(e.target.checked)}
            />
            <label htmlFor="dependantCheckbox" className="text-gray-700 helvi-font">
              {initialPerson?.firstName} Is A Dependant Of {relationshipToEdit?.name}
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="liveWithCheckbox"
              className="mr-2"
              checked={liveTogether}
              onChange={(e) => setLiveTogether(e.target.checked)}
            />
            <label htmlFor="liveWithCheckbox" className="text-gray-600 helvi-font">
              Both People Live At The Same Address?
            </label>
          </div>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <CaseSearchInput
            caseIdentifier={caseIdentifier}
            setCaseIdentifier={setCaseIdentifier}
            error={error}
            handleSearch={handleSearch}
            label={
              <>
                Enter the name or case # of the case to link with{" "}
                <span className="text-purple font-bold">
                  {initialPerson?.firstName} {initialPerson?.lastName}
                </span>{" "}
              </>
            }
            showAddcase={true}
            onAddNewPersonCLick={() => setIsAddNewPerson(true)}
          />
        );
      case 2:
        return (
          <>
            {loadingCaseDetails ? (
              <Loader />
            ) : (
              <CaseSearchResults
                loading={loading}
                foundCases={foundCases}
                handleSelectCase={handleSelectCase}
              />
            )}
          </>
        );
      case 3:
        return (
          <div className="space-y-6">
            <p className="text-lg font-medium text-gray-700">
              {STATIC_TEXTS.CASE_DETAILS.RELATED} the relationship between:
            </p>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-purple">
                  {initialPerson?.firstName} {initialPerson?.lastName}
                </span>
                <span>is the</span>
                <div className="flex flex-col">
                  <input
                    type="text"
                    placeholder="e.g., Parent"
                    className={`border ${
                      error && (!relationshipTypeA.trim() || step !== 3)
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-purple rounded-md px-2 py-1 w-full`}
                    value={relationshipTypeA}
                    onChange={(e) => setRelationshipTypeA(e.target.value)}
                  />
                  {error && !relationshipTypeA.trim() && step === 3 && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}
                </div>
                <span>of</span>
                <span className="font-bold text-green-800">
                  {selectedCase?.firstName} {selectedCase?.lastName}
                </span>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-green-800">
                  {selectedCase?.firstName} {selectedCase?.lastName}
                </span>
                <span>is the</span>
                <div className="flex flex-col">
                  <input
                    type="text"
                    placeholder="e.g., Child"
                    className={`border ${
                      error && (!relationshipTypeB.trim() || step !== 3)
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-purple rounded-md px-2 py-1 w-full`}
                    value={relationshipTypeB}
                    onChange={(e) => setRelationshipTypeB(e.target.value)}
                  />
                  {error && !relationshipTypeB.trim() && step === 3 && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  )}
                </div>
                <span>of</span>
                <span className="font-bold text-purple">
                  {initialPerson?.firstName} {initialPerson?.lastName}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="dependantCheckbox"
                className="mr-2"
                checked={isDependant}
                onChange={(e) => setIsDependant(e.target.checked)}
              />
              <label
                htmlFor="dependantCheckbox"
                className="text-gray-700 helvi-font"
              >
                {initialPerson?.firstName} Is A Dependant Of{" "}
                {selectedCase?.firstName}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="liveWithCheckbox"
                className="mr-2"
                checked={liveTogether}
                onChange={(e) => setLiveTogether(e.target.checked)}
              />
              <label htmlFor="liveWithCheckbox" className="text-gray-600 helvi-font">
                Both People Live At The Same Address?
              </label>
            </div>
          </div>
        );
      default:
        return <Loader height={8} width={8} />;
    }
  };

  const renderFooterButtons = () => {
    if (editMode) {
      return (
        <>
          <Button
            label={STATIC_TEXTS.COMMON.CANCEL}
            icon="mdi:close"
            className="hover:bg-red-600 hover:text-white"
            onClick={onClose}
            variant="default"
          />
          <Button
            label={STATIC_TEXTS.COMMON.SAVE}
            variant="submitStyle"
            icon="mdi:content-save"
            onClick={handleAddRelationship}
          />
        </>
      );
    }

    switch (step) {
      case 1:
        return (
          <>
            <Button
              label={STATIC_TEXTS.COMMON.SEARCH}
              onClick={triggerSearch}
              variant="submitStyle"
              icon="mdi:magnify"
            />
            <Button
              label={STATIC_TEXTS.COMMON.CANCEL}
              icon="mdi:close"
              className="hover:bg-red-600 hover:text-white"
              onClick={onClose}
              variant="default"
            />
          </>
        );
      case 2:
        return (
          <>
            <Button
              label={STATIC_TEXTS.COMMON.BACK}
              icon="mdi:arrow-left"
              onClick={handleBack}
              variant="submitStyle"
            />
            <Button
              label={STATIC_TEXTS.COMMON.CANCEL}
              icon="mdi:close"
              className="hover:bg-red-600 hover:text-white"
              onClick={onClose}
              variant="default"
            />
          </>
        );
      case 3:
        return (
          <>
            <Button
              label={STATIC_TEXTS.COMMON.CANCEL}
              icon="mdi:close"
              className="hover:bg-red-600 hover:text-white"
              onClick={onClose}
              variant="default"
            />
            <Button
              label={STATIC_TEXTS.RELATIONSHIPS.ADD_RELATIONSHIP}
              variant="submitStyle"
              icon="mdi:plus"
              onClick={handleAddRelationship}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      widthClass="max-w-xl"
      title={
        editMode
          ? STATIC_TEXTS.RELATIONSHIPS.EDIT_RELATIONSHIP
          : STATIC_TEXTS.RELATIONSHIPS.ADD_RELATIONSHIP
      }
      footer={
        <div className="flex justify-between gap-3">{renderFooterButtons()}</div>
      }
    >
      {renderStep()}
    </ModalWrapper>
  );
};

export default AddRelationshipModal;
