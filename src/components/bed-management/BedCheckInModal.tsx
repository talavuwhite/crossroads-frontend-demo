/*
  BedCheckInModal.tsx
  -------------------
  Modal wizard for bed check-in: Step 1/2 for searching/selecting a case, Step 3 for check-in form.
  Combines search, selection, and check-in in a single modal. Used in bed management flows.
*/

// --- External Imports ---
import { FormikProvider, useFormik } from "formik";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toZonedTime } from "date-fns-tz";

// --- Utils & Constants ---
import { checkInBed } from "@/services/BedManagementApi";
import { fetchCaseById, searchCasesForMerge } from "@/services/CaseApi";
import { errorMsg } from "@/utils/formikHelpers";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";

// --- Components ---
import AddCaseModal from "@/components/modals/AddCaseModal";
import CaseSearchInput from "@/components/reusable/CaseSearchInput";
import CaseSearchResults from "@/components/reusable/CaseSearchResults";
import Button from "@/components/ui/Button";
import ModalWrapper from "@/components/ui/ModalWrapper";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

// --- Types ---
import type { RootState } from "@/redux/store";
import type { IBedListItem } from "@/types/bedManagement";
import type { CaseType, SearchMergeCaseResult } from "@/types/case";
import type { ApiErrorResponse } from "@/types/api";

// --- Main Component ---
interface BedCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: 1 | 2 | 3;
  selectedBed: IBedListItem | null;
  onSuccess?: () => void;
}
interface AddBedCheckInFormValues {
  bed?: string;
  checkInDate: Date | null;
  notes: string;
}

const BedCheckInModal: React.FC<BedCheckInModalProps> = ({
  isOpen,
  onClose,
  initialStep,
  selectedBed,
  onSuccess,
}) => {
  // --- State ---
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [caseIdentifier, setCaseIdentifier] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [foundCases, setFoundCases] = useState<SearchMergeCaseResult[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseType | null>(null);
  const [isOpenAddCaseModal, setIsOpenAddCaseModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCaseDetails, setLoadingCaseDetails] = useState<boolean>(false);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // --- Step 3: Bed Check-In Form State ---
  const initialCheckInValues: AddBedCheckInFormValues = {
    checkInDate: toZonedTime(new Date(), userTimeZone),
    notes: "",
  };

  const checkInValidationSchema = Yup.object().shape({
    checkInDate: Yup.date()
      .nullable()
      .required(ERROR_MESSAGES.FORM.REQUIRED)
      .typeError("Please select a valid date"),
    notes: Yup.string(),
  });

  const submitBedCheckInForm = async (values: AddBedCheckInFormValues) => {
    if (!userData?.userId || !selectedCase || !selectedBed) {
      toast.error("Missing required data for check-in.");
      return;
    }
    try {
      const payload = {
        // 1. Case Related Details - Retrieved from the Case Search Results
        caseId: selectedCase?._id ?? "",
        caseName: `${selectedCase?.firstName} ${selectedCase?.lastName}`.trim(),

        // 2. Bed Related Details - Obtained from the Bed List Table; these are required for check-in
        bedId: selectedBed?.bedId ?? "",
        bedName: selectedBed?.bedName ?? "",
        room: selectedBed?.room ?? "",
        bedTypeId: selectedBed?.bedTypeId ?? "",
        bedTypeName: selectedBed?.type ?? "",

        // 3. User Check-In Details - Retrieved from the Bed Check-In Form
        checkInDate: values?.checkInDate
          ? values.checkInDate.toISOString().split("T")[0]
          : "",
        notes: values?.notes,
      };
      const result = await checkInBed(userData?.userId ?? "", payload);
      if (result?.success) {
        toast.success(result?.message || "Bed checked in successfully.");
        // Trigger bed list refetch after successful check-in
        onSuccess?.();
        onClose();
      } else {
        toast.error(result?.message || "Failed to check in bed.");
      }
    } catch (err: unknown) {
      // This catch is now just for unexpected errors (network issues, etc.)
      const error = err as ApiErrorResponse;
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "An unexpected error occurred. Please try again."
      );
    }
  };

  const checkInFormik = useFormik<AddBedCheckInFormValues>({
    initialValues: initialCheckInValues,
    validationSchema: checkInValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: submitBedCheckInForm,
  });

  const getCheckInInputClass = (field: string) =>
    `border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm ${
      checkInFormik.touched[field as keyof AddBedCheckInFormValues] &&
      checkInFormik.errors[field as keyof AddBedCheckInFormValues]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  // --- Effects ---
  const resetModalWizardState = useCallback(() => {
    setStep(initialStep ?? 1);
    setCaseIdentifier("");
    setError("");
    setFoundCases([]);
    setSelectedCase(null);
  }, [initialStep]);

  useEffect(() => {
    if (isOpen) {
      resetModalWizardState();
    }
  }, [isOpen, resetModalWizardState]);

  // --- Handlers ---
  const validateCaseSearchInput = (): boolean => {
    if (!caseIdentifier.trim()) {
      setError("Case name or number is required");
      return false;
    }
    setError("");
    return true;
  };

  const searchForCases = async () => {
    if (validateCaseSearchInput()) {
      setLoading(true);
      try {
        // Search for cases matching the identifier
        const results = await searchCasesForMerge(
          caseIdentifier,
          userData?.userId
        );
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

  const onCaseSearchFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    searchForCases();
  };

  const onCaseSearchResultSelect = async (caseData: SearchMergeCaseResult) => {
    setLoadingCaseDetails(true);
    try {
      // Fetch full case details for the selected case
      const fullCaseData = await fetchCaseById(
        caseData.id,
        userData?.userId,
        userData?.activeLocation
      );
      setSelectedCase(fullCaseData);
      setStep(3);
    } catch (error) {
      console.error("Error fetching case details:", error);
      toast.error("Failed to fetch case details. Please try again.");
    } finally {
      setLoadingCaseDetails(false);
    }
  };

  const goToPreviousStep = () => {
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

  // --- Render ---
  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        title={
          step === 3
            ? STATIC_TEXTS.AGENCY.BED_MANAGEMENT.ADD_BED_CHECK_IN
            : STATIC_TEXTS.AGENCY.BED_MANAGEMENT.SELECT_CASE
        }
        widthClass="max-w-2xl"
        footer={
          <div className="flex justify-between gap-3">
            {step === 1 ? (
              <>
                <Button
                  label="Search"
                  onClick={searchForCases}
                  variant="submitStyle"
                  icon="mdi:magnify"
                />
                <Button
                  label="Cancel"
                  icon="mdi:close"
                  className="hover:bg-red-600 hover:text-white"
                  onClick={onClose}
                  variant="default"
                />
              </>
            ) : step === 2 ? (
              <>
                <Button
                  label="Back"
                  icon="mdi:arrow-left"
                  onClick={goToPreviousStep}
                  variant="submitStyle"
                />
                <Button
                  label="Cancel"
                  icon="mdi:close"
                  className="hover:bg-red-600 hover:text-white"
                  onClick={onClose}
                  variant="default"
                />
              </>
            ) : (
              <>
                <Button
                  label="Add"
                  icon="mdi:plus"
                  onClick={() => checkInFormik.handleSubmit()}
                  variant="submitStyle"
                />
                <Button
                  label="Cancel"
                  icon="mdi:close"
                  className="hover:bg-red-600 hover:text-white"
                  onClick={onClose}
                  variant="default"
                />
              </>
            )}
          </div>
        }
      >
        {step === 1 ? (
          // --- Step 1: Search for a case ---
          <div className="flex flex-col gap-3">
            <CaseSearchInput
              label={
                <span className="text-sm text-gray-700">
                  {STATIC_TEXTS.AGENCY.BED_MANAGEMENT.NAME_CASE_SEARCH}
                </span>
              }
              caseIdentifier={caseIdentifier}
              setCaseIdentifier={setCaseIdentifier}
              handleSearch={onCaseSearchFormSubmit}
              error={error}
            />
            <div className="text-sm text-gray-700 text-center">Or</div>
            <button
              onClick={() => setIsOpenAddCaseModal(true)}
              className="mx-auto relative text-white bg-purple hover:bg-purple/90 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 group  after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
            >
              <Icon icon="mdi:plus" width="18" height="18" />
              <span>{STATIC_TEXTS.AGENCY.BED_MANAGEMENT.ADD_NEW_PERSON}</span>
            </button>
          </div>
        ) : step === 2 ? (
          // --- Step 2: Show search results ---
          <CaseSearchResults
            foundCases={foundCases}
            handleSelectCase={onCaseSearchResultSelect}
            loading={loading}
          />
        ) : loadingCaseDetails ? (
          // --- Step 3: Loading case details ---
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
            <p className="ml-2 text-gray-600">Loading case details...</p>
          </div>
        ) : (
          // --- Step 3: Bed Check-In Form ---
          <FormikProvider value={checkInFormik}>
            <form
              onSubmit={checkInFormik.handleSubmit}
              className="grid grid-cols-1 gap-4"
            >
              <div className="flex items-start gap-3 text-sm p-4 bg-yellow-50 border border-yellow-400 rounded-md">
                <Icon
                  icon="mdi:warning"
                  width="18"
                  height="18"
                  className="text-yellow-600"
                />
                <span className="text-yellow-800">
                  For HUD data accuracy, it's required that you enroll{" "}
                  <span className="font-bold">
                    "{selectedCase?.firstName} {selectedCase?.lastName}"
                  </span>{" "}
                  into an Outcomes before or after check-in.
                </span>
              </div>
              <div className="border border-gray-300 rounded-md overflow-hidden w-full">
                <table className="w-full table-auto text-sm text-gray-800 border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <th className="text-left bg-purple-50 px-4 py-3 w-1/3">
                        Case
                      </th>
                      <td className="px-4 py-2">
                        <span className="font-bold">
                          {selectedCase?.firstName} {selectedCase?.lastName}
                        </span>{" "}
                        <br />
                        {Array.isArray(selectedCase?.gender) &&
                        selectedCase.gender.length > 0 ? (
                          selectedCase.gender
                            .map((g) => g.charAt(0).toUpperCase() + g.slice(1))
                            .join(", ")
                        ) : (
                          <span className="text-gray-400 italic">
                            Gender unknown
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <th className="text-left bg-purple-50 px-4 py-3">Bed</th>
                      <td className="px-4 py-2">
                        <span className="font-bold">
                          {selectedBed?.bedName}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <th className="text-left bg-purple-50 px-4 py-3">Room</th>
                      <td className="px-4 py-2">
                        <span className="font-bold">{selectedBed?.room}</span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <th className="text-left bg-purple-50 px-4 py-3">Type</th>
                      <td className="px-4 py-2">
                        <span className="font-bold">{selectedBed?.type}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* <div className="grow">
                                <label className="font-semibold">
                                    {LABELS.FORM.BED}
                                    <span className="text-red-600">*</span>
                                </label>
                                {showBedOptions && (
                                    <div>
                                        <select
                                            className={getCheckInInputClass("bed")}
                                            {...checkInFormik.getFieldProps("bed")}
                                            onBlur={checkInFormik.handleBlur}
                                        >
                                            {showBedOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errorMsg("bed", checkInFormik)}
                                    </div>
                                )}
                            </div> */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold">
                  {LABELS.FORM.CHECKED_IN_DATE}{" "}
                  <span className="text-red-600">*</span>
                </label>
                <DatePicker
                  selected={checkInFormik.values.checkInDate}
                  onChange={(date) =>
                    checkInFormik.setFieldValue("checkInDate", date)
                  }
                  onBlur={checkInFormik.handleBlur}
                  className={getCheckInInputClass("checkInDate")}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="MM/DD/YYYY"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={10}
                  scrollableYearDropdown
                  maxDate={new Date()}
                />
                {errorMsg("checkInDate", checkInFormik)}
              </div>
              <div className="grow">
                <label className="font-semibold">{LABELS.FORM.NOTES}</label>
                <textarea
                  rows={3}
                  {...checkInFormik.getFieldProps("notes")}
                  onChange={checkInFormik.handleChange}
                  onBlur={checkInFormik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none resize-none"
                />
              </div>
            </form>
          </FormikProvider>
        )}
      </ModalWrapper>

      {/* Add Case Modal (for creating a new case) */}
      <AddCaseModal
        isOpen={isOpenAddCaseModal}
        onClose={() => setIsOpenAddCaseModal(false)}
      />
    </>
  );
};

export default BedCheckInModal;
