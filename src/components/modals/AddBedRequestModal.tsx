// -----------------------------------------------------------------------------
// AddBedRequestModal.tsx
// Modal for searching, selecting, and adding a bed request for a case/person.
// Handles multi-step flow: search case, select case, fill bed request form.
// -----------------------------------------------------------------------------

// --- External Imports ---
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// --- Utils / Constants ---
import { LABELS, STATIC_TEXTS } from "@/utils/textConstants";

// --- Components ---
import AddCaseModal from "@/components/modals/AddCaseModal";
import CaseSearchInput from "@/components/reusable/CaseSearchInput";
import CaseSearchResults from "@/components/reusable/CaseSearchResults";
import Button from "@/components/ui/Button";
import ModalWrapper from "@/components/ui/ModalWrapper";

// --- Types ---
import { triggerRequestsRefetch } from "@/redux/bedManagementSlice";
import type { RootState } from "@/redux/store";
import type { IBedCheckInRequestItem } from "@/services/BedManagementApi";
import {
  createBedRequest,
  fetchCompanySiteBedSummary,
  type ICompanyBedSummary,
  updateBedRequest,
} from "@/services/BedManagementApi";
import { fetchCaseById, searchCasesForMerge } from "@/services/CaseApi";
import type { CaseType, SearchMergeCaseResult } from "@/types/case";

// -----------------------------------------------------------------------------
// --- Component ---
// -----------------------------------------------------------------------------

interface AddBedRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: 1 | 2 | 3;
  editRequest?: IBedCheckInRequestItem;
  caseData?: CaseType | null;
  onSuccess?: () => void; // <-- Added for refetch callback
}

const AddBedRequestModal: React.FC<AddBedRequestModalProps> = ({
  isOpen,
  onClose,
  initialStep,
  editRequest,
  caseData,
  onSuccess, // <-- Add to destructure
}) => {
  // --- State ---
  const { data: userData } =
    useSelector((state: RootState) => state.user) ?? {};
  const dispatch = useDispatch();

  // Get user timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // If caseData is provided, always start at step 3 and use it as selectedCase
  const [step, setStep] = useState<1 | 2 | 3>(
    editRequest ? 3 : caseData ? 3 : 1
  );
  const [caseIdentifier, setCaseIdentifier] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [foundCases, setFoundCases] = useState<SearchMergeCaseResult[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseType | null>(
    caseData ?? null
  );
  const [isOpenAddCaseModal, setIsOpenAddCaseModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingCaseDetails, setLoadingCaseDetails] = useState<boolean>(false);
  const [companySiteBedSummary, setCompanySiteBedSummary] = useState<
    ICompanyBedSummary[] | null
  >(null);

  // --- New Form State ---
  const agencyOptions = useMemo(
    () =>
      (companySiteBedSummary || []).map((company) => ({
        label: company?.companyName ?? "",
        value: company?.companyId ?? "",
      })),
    [companySiteBedSummary]
  );

  const initialAgency =
    editRequest?.agencyId ?? agencyOptions?.[0]?.value ?? "";
  const [selectedAgency, setSelectedAgency] = useState<string>(initialAgency);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string[]>(
    editRequest?.caseId ? [editRequest.caseId] : []
  );
  const [userSelectedSite, setUserSelectedSite] = useState<boolean>(false);

  // --- Derived Data ---
  const selectedCompany =
    companySiteBedSummary?.find(
      (company) => company?.companyId === selectedAgency
    ) ?? null;

  const siteOptions = useMemo(() => {
    const options =
      selectedCompany?.sites?.map((site) => ({
        label: `${site?.siteName ?? ""} (${
          site?.totalAvailableBeds ?? 0
        } Beds Available)`,
        value: site?.siteId ?? "",
      })) ?? [];
    return options;
  }, [selectedCompany]);

  const isOwnAgency = selectedAgency === userData?.activeLocation;

  // --- Effects ---
  useEffect(() => {
    if (isOpen && editRequest) {
      // Initialize agency and site when editing
      setSelectedAgency(editRequest.agencyId);
      setSelectedSite(editRequest.siteId);
    }
  }, [isOpen, editRequest]);

  useEffect(() => {
    // Only auto-select site if no site is currently selected AND user hasn't manually selected one
    if (!selectedSite && !userSelectedSite) {
      if (!editRequest) {
        const firstSiteId = selectedCompany?.sites?.[0]?.siteId ?? "";
        if (firstSiteId) {
          setSelectedSite(firstSiteId);
        }
      } else if (editRequest && selectedCompany) {
        // When editing, find the site that matches the editRequest.siteId
        const matchingSite = selectedCompany.sites?.find(
          (site) => site.siteId === editRequest.siteId
        );
        if (matchingSite) {
          setSelectedSite(matchingSite.siteId);
        }
      }
    }
  }, [
    selectedAgency,
    selectedCompany,
    editRequest,
    selectedSite,
    userSelectedSite,
  ]);

  useEffect(() => {
    if (!editRequest && (agencyOptions?.length ?? 0) > 0) {
      setSelectedAgency(agencyOptions?.[0]?.value ?? "");
    } else if (editRequest && (agencyOptions?.length ?? 0) > 0) {
      // When editing, set the agency from editRequest
      setSelectedAgency(editRequest.agencyId);
    }
  }, [agencyOptions, editRequest]);

  // Helper function to parse date string to Date object
  const parseDateString = (dateString: string) => {
    if (!dateString || typeof dateString !== "string") return null;

    try {
      // Try parsing yyyy-MM-dd format first (ISO date format)
      let date = parse(dateString, "yyyy-MM-dd", new Date());
      if (date instanceof Date && !isNaN(date.getTime())) {
        return toZonedTime(date, userTimeZone);
      }

      // Try parsing MM-dd-yyyy format
      date = parse(dateString, "MM-dd-yyyy", new Date());
      if (date instanceof Date && !isNaN(date.getTime())) {
        return toZonedTime(date, userTimeZone);
      }

      // Try parsing as ISO string
      date = new Date(dateString);
      if (date instanceof Date && !isNaN(date.getTime())) {
        return toZonedTime(date, userTimeZone);
      }

      return null;
    } catch (error) {
      console.warn("Error parsing date string:", dateString, error);
      return null;
    }
  };

  // --- Formik Setup for dateOfArrival and notes ---
  const initialFormikValues = {
    dateOfArrival: editRequest?.dateOfArrival
      ? parseDateString(editRequest.dateOfArrival.split("T")[0])
      : toZonedTime(new Date(), userTimeZone),
    notes: editRequest?.notes ?? "",
    sendMail: editRequest?.sendMail ?? true,
  };

  const validationSchema = Yup.object().shape({
    dateOfArrival: Yup.date()
      .nullable()
      .required("Date of arrival is required")
      .typeError("Please select a valid date"),
    notes: Yup.string()
      .trim()
      .min(1, "Notes are required")
      .max(1000, "Notes must be less than 1000 characters"),
  });

  // --- Handlers & Data Fetchers ---
  // Get and log the company-site-bed summary
  const getCompanySiteBedSummary = useCallback(async () => {
    if (userData?.userId) {
      try {
        const res = await fetchCompanySiteBedSummary(userData?.userId);
        const raw = res?.data as
          | ICompanyBedSummary
          | ICompanyBedSummary[]
          | undefined;
        const data = Array.isArray(raw) ? raw : raw ? [raw] : [];
        setCompanySiteBedSummary(data ?? []);
      } catch {
        // Optionally handle error (e.g., show toast)
      }
    }
  }, [userData?.userId]);

  // Reset all modal state to initial values
  const resetModalState = useCallback(() => {
    if (editRequest) {
      setStep(3);
      setCaseIdentifier("");
      setError("");
      setFoundCases([]);
      setSelectedCase({
        _id: editRequest.caseId,
        firstName: editRequest.caseName,
        lastName: "",
        relatedCases: [],
      } as unknown as CaseType);
      setSelectedMember([editRequest.caseId]);
      setSelectedAgency(editRequest.agencyId);
      setSelectedSite(editRequest.siteId);
      setUserSelectedSite(false); // Reset user selection flag for edit mode
    } else {
      setStep(initialStep ?? 1);
      setCaseIdentifier("");
      setError("");
      setFoundCases([]);
      setSelectedCase(null);
      setSelectedMember([]);
      setSelectedAgency("");
      setSelectedSite(""); // Reset to empty, let useEffect handle initial selection
      setUserSelectedSite(false); // Reset user selection flag
    }
  }, [initialStep, editRequest]);

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      if (caseData) {
        setStep(3);
        setSelectedCase(caseData);
        setUserSelectedSite(false); // Reset user selection flag
      } else if (editRequest) {
        setStep(3);
        setCaseIdentifier("");
        setError("");
        setFoundCases([]);
        setSelectedCase({
          _id: editRequest.caseId,
          firstName: editRequest.caseName,
          lastName: "",
          relatedCases: [],
        } as unknown as CaseType);
        setSelectedMember([editRequest.caseId]);
        setSelectedAgency(editRequest.agencyId);
        setSelectedSite(editRequest.siteId);
        setUserSelectedSite(false); // Reset user selection flag for edit mode
      } else {
        setStep(initialStep ?? 1);
        setCaseIdentifier("");
        setError("");
        setFoundCases([]);
        setSelectedCase(null);
        setSelectedMember([]);
        setSelectedAgency("");
        setSelectedSite(""); // Reset to empty, let useEffect handle initial selection
        setUserSelectedSite(false); // Reset user selection flag
      }
      getCompanySiteBedSummary();
    }
  }, [
    isOpen,
    resetModalState,
    getCompanySiteBedSummary,
    caseData,
    editRequest,
    initialStep,
  ]);

  // --- Validation & Search Logic ---
  const validateForm = (): boolean => {
    if (!(caseIdentifier?.trim?.() ?? false)) {
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
        const results = await searchCasesForMerge(
          caseIdentifier,
          userData?.userId,
          userData?.activeLocation
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch();
  };

  const handleSelectCaseToMerge = async (caseData: SearchMergeCaseResult) => {
    setLoadingCaseDetails(true);
    try {
      // Fetch full case details for selected case
      const fullCaseData = await fetchCaseById(
        caseData?.id ?? "",
        userData?.userId,
        userData?.activeLocation
      );
      setSelectedCase(fullCaseData ?? null);
      setStep(3);
    } catch {
      // Show error toast if fetch fails
      toast.error("Failed to fetch case details. Please try again.");
    } finally {
      setLoadingCaseDetails(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      // Go back to search step
      setStep(1);
      setCaseIdentifier("");
      setError("");
      setFoundCases([]);
    } else if (step === 3) {
      // Go back to case selection
      setStep(2);
      setSelectedCase(null);
    }
  };

  // --- Handlers ---
  const handleAgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgency(e?.target?.value ?? "");
    setUserSelectedSite(false); // Reset user selection flag when agency changes
  };
  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSite = e?.target?.value ?? "";
    setSelectedSite(newSite);
    setUserSelectedSite(true); // Mark that user has manually selected a site
  };
  const handleMemberChange = (memberName: string, checked: boolean) => {
    setSelectedMember((prev) =>
      checked
        ? [...(prev ?? []), memberName]
        : (prev ?? []).filter((v) => v !== memberName)
    );
  };

  const handleHybridSubmit = async (
    formikValues: typeof initialFormikValues
  ) => {
    setSubmitting(true);
    try {
      const company =
        companySiteBedSummary?.find((c) => c?.companyId === selectedAgency) ??
        null;
      const site =
        company?.sites?.find((s) => s?.siteId === selectedSite) ?? null;
      const allCases = [
        selectedCase && {
          caseId: selectedCase?._id ?? "",
          caseName:
            `${selectedCase?.firstName ?? ""} ${
              selectedCase?.lastName ?? ""
            }`.trim() ||
            selectedCase?.firstName ||
            "Current Case",
        },
        ...((selectedCase?.relatedCases ?? []).map((rc) => ({
          caseId: rc?.caseId ?? "",
          caseName: rc?.name ?? "",
        })) ?? []),
      ].filter(Boolean);
      const cases = (allCases ?? []).filter(
        (c): c is { caseId: string; caseName: string } =>
          !!c && (selectedMember ?? []).includes(c.caseId)
      );
      const payload = {
        caseId: cases?.[0]?.caseId ?? "",
        caseName: cases?.[0]?.caseName ?? "",
        agencyId: String(company?.companyId ?? editRequest?.agencyId ?? ""),
        agencyName: String(
          company?.companyName ?? editRequest?.agencyName ?? ""
        ),
        siteId: String(site?.siteId ?? editRequest?.siteId ?? ""),
        siteName: String(site?.siteName ?? editRequest?.siteName ?? ""),
        dateOfArrival: formikValues?.dateOfArrival
          ? format(formikValues.dateOfArrival, "yyyy-MM-dd")
          : "",
        notes: formikValues?.notes ?? "",
        sendMail: formikValues?.sendMail,
      };

      if (!userData?.userId) throw new Error("User ID missing");
      if (editRequest) {
        const res = await updateBedRequest(
          userData.userId,
          editRequest?._id ?? "",
          payload
        );
        if (res?.success) {
          toast.success(res?.message ?? "Bed request updated successfully!");
          dispatch?.(triggerRequestsRefetch?.());
          onClose?.();
          onSuccess?.(); // <-- Call the callback if provided
        } else {
          toast.error(res?.message ?? "Failed to update bed request");
        }
      } else {
        const res = await createBedRequest(userData.userId, {
          cases,
          ...payload,
        });
        toast.success(res?.message ?? "Bed request created successfully!");
        dispatch?.(triggerRequestsRefetch?.());
        onClose?.(); // Close the modal after success
        onSuccess?.(); // <-- Call the callback if provided
      }
    } catch (err: unknown) {
      let errorMsg = "Failed to create/update bed request";

      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        errorMsg = (err as any).message;
      }

      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Derived Data ---
  // Build household members array: current case (always selected, cannot be unchecked) + related cases (selectable)
  const householdMembers = editRequest
    ? [
        {
          id: editRequest?.caseId ?? "",
          caseId: editRequest?.caseId ?? "",
          caseName: editRequest?.caseName ?? "",
          isCurrent: true,
        },
      ]
    : [
        selectedCase && {
          id: selectedCase?._id ?? "", // Use _id for the current case
          caseId: selectedCase?._id ?? "", // For consistency in payload
          caseName:
            `${selectedCase?.firstName ?? ""} ${
              selectedCase?.lastName ?? ""
            }`.trim() ||
            selectedCase?.firstName ||
            "Current Case",
          isCurrent: true,
        },
        ...((selectedCase?.relatedCases ?? []).map((rc) => ({
          id: rc?.caseId ?? "",
          caseId: rc?.caseId ?? "",
          caseName: rc?.name ?? "",
          isCurrent: false,
          relationshipType: rc?.relationshipType ?? "",
        })) ?? []),
      ].filter(Boolean);

  // Ensure current case is always selected
  useEffect(() => {
    if (
      selectedCase?._id &&
      !(selectedMember ?? []).includes(selectedCase._id)
    ) {
      setSelectedMember([selectedCase._id]);
    }
  }, [selectedCase?._id, selectedMember]);

  // Find the selected site object from the selected company
  const selectedSiteObj =
    selectedCompany?.sites?.find((site) => site?.siteId === selectedSite) ??
    null;

  // Fallback: If no site found by ID, try to find by name or select first available
  let fallbackSiteObj = selectedSiteObj;
  if (
    !fallbackSiteObj &&
    selectedCompany?.sites &&
    selectedCompany.sites.length > 0
  ) {
    // If editing, try to find site by name from editRequest
    if (editRequest?.siteName) {
      const siteByName = selectedCompany.sites.find(
        (site) =>
          site.siteName
            .toLowerCase()
            .includes(editRequest.siteName.toLowerCase()) ||
          editRequest.siteName
            .toLowerCase()
            .includes(site.siteName.toLowerCase())
      );
      if (siteByName) {
        fallbackSiteObj = siteByName;
      }
    }
    // If still no match, select the first available site
    if (!fallbackSiteObj) {
      fallbackSiteObj = selectedCompany.sites[0];
    }
  }

  const bedTypes = fallbackSiteObj?.bedTypes ?? [];

  // ---------------------------------------------------------------------------
  // --- Render ---
  // ---------------------------------------------------------------------------

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        title={
          step === 3
            ? editRequest
              ? "Edit Bed Request"
              : STATIC_TEXTS.AGENCY.BED_MANAGEMENT.ADD_BED_REQUEST
            : STATIC_TEXTS.AGENCY.BED_MANAGEMENT.SELECT_CASE
        }
        widthClass="max-w-2xl"
        footer={
          <div className="flex justify-between gap-3">
            {step === 1 && !caseData ? (
              <>
                <Button
                  label={loading ? "Searching..." : "Search"}
                  onClick={triggerSearch}
                  variant="submitStyle"
                  icon={loading ? "mdi:loading" : "mdi:magnify"}
                  disabled={loading}
                  className={loading ? "!opacity-75 !cursor-not-allowed" : ""}
                />
                <Button
                  label="Cancel"
                  icon="mdi:close"
                  className="hover:bg-red-600 hover:text-white"
                  onClick={onClose}
                  variant="default"
                />
              </>
            ) : step === 2 && !caseData ? (
              <>
                <Button
                  label="Back"
                  icon="mdi:arrow-left"
                  onClick={handleBack}
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
                  label={
                    submitting
                      ? editRequest
                        ? "Updating..."
                        : "Creating..."
                      : editRequest
                      ? "Save Changes"
                      : "Add"
                  }
                  icon={
                    submitting
                      ? "mdi:loading"
                      : editRequest
                      ? "mdi:content-save"
                      : "mdi:plus"
                  }
                  type="submit"
                  form="bed-request-form"
                  variant="submitStyle"
                  disabled={submitting}
                  className={
                    submitting ? "!opacity-75 !cursor-not-allowed" : ""
                  }
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
        {/* --- Step 1: Search Case --- */}
        {step === 1 && !caseData ? (
          <div className="flex flex-col gap-3">
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
              disabled={loading}
              className={`mx-auto relative text-white bg-purple hover:bg-purple/90 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 group after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer ${
                loading ? "!`opacity-50 !cursor-not-allowed" : ""
              }`}
            >
              <Icon
                icon={loading ? "mdi:loading" : "mdi:plus"}
                width="18"
                height="18"
                className={loading ? "animate-spin" : ""}
              />
              <span>
                {loading
                  ? "Loading..."
                  : STATIC_TEXTS.AGENCY.BED_MANAGEMENT.ADD_NEW_PERSON}
              </span>
            </button>
          </div>
        ) : step === 2 && !caseData ? (
          // --- Step 2: Show Search Results ---
          <CaseSearchResults
            foundCases={foundCases}
            handleSelectCase={handleSelectCaseToMerge}
            loading={loading}
          />
        ) : loadingCaseDetails ? (
          // --- Step 3: Loading Case Details ---
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
              <p className="text-gray-600 font-medium">
                Loading case details...
              </p>
            </div>
          </div>
        ) : (
          // --- Step 3: Bed Request Form ---
          <Formik
            initialValues={initialFormikValues}
            validationSchema={validationSchema}
            onSubmit={handleHybridSubmit}
            enableReinitialize
          >
            {(formik) => (
              <Form className="space-y-6 relative" id="bed-request-form">
                {/* Loading Overlay */}
                {submitting && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
                      <p className="text-gray-600 font-medium">
                        {editRequest
                          ? "Updating bed request..."
                          : "Creating bed request..."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Edit Mode Indicator */}
                {editRequest && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <Icon
                      icon="mdi:pencil"
                      className="text-blue-600"
                      width={20}
                      height={20}
                    />
                    <span className="text-sm text-blue-800 font-medium">
                      Editing bed request for {editRequest.caseName}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* --- Select Members --- */}
                  {!editRequest && (
                    <div className="mb-2">
                      <label className="font-semibold text-sm text-gray-800">
                        {LABELS.FORM.MEMBERS_NEED_BED}
                        <span className="text-red-600">*</span>
                      </label>
                      <div className="flex flex-col gap-2 mt-1">
                        {householdMembers?.filter(Boolean).map((member) => {
                          if (!member) return null;
                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between"
                            >
                              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                <input
                                  id={member.id}
                                  type="checkbox"
                                  value={member.id}
                                  checked={selectedMember.includes(member.id)}
                                  disabled={member.isCurrent}
                                  onChange={(e) => {
                                    if (!member.isCurrent) {
                                      handleMemberChange(
                                        member.id,
                                        e.target.checked
                                      );
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none accent-purple"
                                />
                                <span className="select-none">
                                  {member?.caseName}
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* --- Agency Select --- */}
                  <div className="mb-2">
                    <label className="font-semibold text-sm text-gray-800">
                      {LABELS.FORM.AGENCY}
                      <span className="text-red-600">*</span>
                    </label>
                    <div className="mt-1">
                      <select
                        className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm border-gray-300 bg-white"
                        value={selectedAgency}
                        onChange={handleAgencyChange}
                        disabled={agencyOptions?.length === 0}
                      >
                        {agencyOptions?.length === 0 ? (
                          <option value="">Loading agencies...</option>
                        ) : (
                          agencyOptions?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  {/* --- Date & Site Select --- */}
                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4">
                    {/* Date Picker */}
                    <div className="min-w-[140px]">
                      <label className="font-semibold text-sm text-gray-800">
                        {LABELS.FORM.DATE_OF_ARRIAVAL}
                      </label>
                      <div className="mt-1">
                        <DatePicker
                          selected={formik.values.dateOfArrival}
                          onChange={(date: Date | null) => {
                            formik.setFieldValue("dateOfArrival", date);
                            // Only mark as touched if a date is actually selected
                            if (date) {
                              formik.setFieldTouched(
                                "dateOfArrival",
                                true,
                                false
                              );
                            }
                          }}
                          onBlur={() => {
                            formik.setFieldTouched(
                              "dateOfArrival",
                              true,
                              false
                            );
                          }}
                          dateFormat="MM/dd/yyyy"
                          className={`border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm border-gray-300 bg-white ${
                            formik.touched.dateOfArrival &&
                            formik.errors.dateOfArrival
                              ? "border-red-500"
                              : ""
                          }`}
                          wrapperClassName="w-full"
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={10}
                          scrollableYearDropdown
                          minDate={new Date()}
                          maxDate={
                            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                          }
                          placeholderText="MM/DD/YYYY"
                          popperProps={{
                            strategy: "absolute",
                            placement: "bottom-start",
                          }}
                        />
                      </div>
                      <ErrorMessage
                        name="dateOfArrival"
                        component="div"
                        className="text-red-500 text-xs mt-1"
                      />
                    </div>

                    {/* Site Dropdown */}
                    <div>
                      <label className="font-semibold text-sm text-gray-800">
                        {LABELS.FORM.SITE}
                        <span className="text-red-600">*</span>
                      </label>
                      <div className="mt-1">
                        <select
                          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm border-gray-300 bg-white"
                          value={selectedSite}
                          onChange={handleSiteChange}
                          disabled={siteOptions?.length === 0}
                        >
                          {siteOptions?.length === 0 ? (
                            <option value="">
                              {selectedAgency
                                ? "Loading sites..."
                                : "Select agency first"}
                            </option>
                          ) : (
                            siteOptions?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* --- Bed Table --- */}
                  <div className="mb-2">
                    <table className="w-full border border-gray-300 border-collapse rounded-md text-sm bg-white">
                      <thead>
                        <tr className="bg-purple text-white font-bold">
                          <th className="w-1/2 px-[6px] py-[10px] border border-gray-300">
                            {STATIC_TEXTS.AGENCY.BED_MANAGEMENT.BED_TYPE}
                          </th>
                          <th className="w-1/2 px-[6px] py-[10px] border border-gray-300">
                            {STATIC_TEXTS.AGENCY.BED_MANAGEMENT.UNITS}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bedTypes?.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="text-center py-4">
                              No beds available
                            </td>
                          </tr>
                        ) : (
                          bedTypes?.map((bed) => (
                            <tr key={bed.bedTypeId}>
                              <td className="w-1/2 p-[10px] border border-gray-300">
                                {bed?.bedTypeName}
                              </td>
                              <td className="w-1/2 p-[10px] border border-gray-300">
                                {bed?.availableUnits} Available
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* --- Notes --- */}
                  <div className="mb-2">
                    <label className="font-semibold text-sm text-gray-800">
                      {LABELS.FORM.NOTES}
                    </label>
                    <Field
                      as="textarea"
                      rows={4}
                      name="notes"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none text-sm bg-white mt-1 resize-none"
                    />
                    <ErrorMessage
                      name="notes"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                  {/* --- Send Email UI (only if not own agency) --- */}
                  {!isOwnAgency && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-md p-3 my-2">
                      <Icon
                        icon="mdi:alert-circle-outline"
                        className="text-red-400 mt-0.5"
                        width={20}
                        height={20}
                      />
                      <div className="flex-1">
                        <div className="text-sm text-red-700 mb-1">
                          Bed requests do not guarantee placement. This request
                          will be sent to{" "}
                          <span className="font-medium">
                            {
                              agencyOptions.find(
                                (a) => a.value === selectedAgency
                              )?.label
                            }
                          </span>
                          .
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-700 mt-1">
                          <Field
                            type="checkbox"
                            name="sendMail"
                            className="accent-red-500"
                          />
                          Send email notification to this agency
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        )}
      </ModalWrapper>
      {/* --- Add New Case Modal --- */}
      {!caseData && (
        <AddCaseModal
          isOpen={isOpenAddCaseModal}
          onClose={() => setIsOpenAddCaseModal(false)}
        />
      )}
    </>
  );
};

export default AddBedRequestModal;
