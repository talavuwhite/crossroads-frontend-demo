import React, { useEffect, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { useFormik } from "formik";
import type { CaseType, SearchMergeCaseResult } from "@/types/case";
import { searchCasesForMerge, fetchCaseById, mergeCases } from "@services/CaseApi";
import { toast } from "react-toastify";
import Button from "@ui/Button";
import { getFieldDisplayValue, hasValue } from "@/utils/commonFunc";
import { MergeFields } from "@/utils/constants";
import CaseSearchResults from "@/components/reusable/CaseSearchResults";
import CaseSearchInput from "@/components/reusable/CaseSearchInput";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

interface MergeCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKeepingCase: CaseType | null;
}

type MergedFieldDisplay = {
  field: string;
  initialKeepingCaseValue: any;
  initialKeepingCaseDisplay: string;
  selectedCaseValue: any;
  selectedCaseDisplay: string;
  isComplex: boolean;
  parentField?: string;
  itemValue?: any;
};

export const sanitizeKey = (key: string): string => {
  return key
    .replace(/ /g, "__space__")
    .replace(/\./g, "__dot__")
    .replace(/\(/g, "__open__")
    .replace(/\)/g, "__close__")
    .replace(/,/g, "__comma__")
    .replace(/-/g, "__dash__")
    .replace(/&/g, "__and__")
    .replace(/\//g, "__slash__");
};

export const unsanitizeKey = (sanitizedKey: string): string => {
  return sanitizedKey
    .replace(/__slash__/g, "/")
    .replace(/__and__/g, "&")
    .replace(/__dash__/g, "-")
    .replace(/__comma__/g, ",")
    .replace(/__close__/g, ")")
    .replace(/__open__/g, "(")
    .replace(/__dot__/g, ".")
    .replace(/__space__/g, " ");
};

const MergeCaseModal: React.FC<MergeCaseModalProps> = ({
  isOpen,
  onClose,
  initialKeepingCase,
}) => {
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [caseIdentifier, setCaseIdentifier] = useState("");
  const [error, setError] = useState("");
  const [foundCases, setFoundCases] = useState<SearchMergeCaseResult[]>([]);
  const [selectedCaseToMerge, setSelectedCaseToMerge] = useState<CaseType | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingCaseDetails, setLoadingCaseDetails] = useState(false);
  const [isSwitched, setIsSwitched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCaseIdentifier("");
      setError("");
      setFoundCases([]);
      setSelectedCaseToMerge(null);
      setIsSwitched(false);
    }
  }, [isOpen]);

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
      const fullCaseData = await fetchCaseById(
        caseData.id,
        userData?.userId,
        userData?.activeLocation
      );
      setSelectedCaseToMerge(fullCaseData);
      setStep(3);
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
    } else if (step === 3) {
      setStep(2);
      setSelectedCaseToMerge(null);
      setIsSwitched(false);
    }
  };

  const handleSwitchCases = () => {
    setIsSwitched(!isSwitched);
  };

  const getKeptCase = () => (isSwitched ? selectedCaseToMerge : initialKeepingCase);
  const getRemovedCase = () =>
    isSwitched ? initialKeepingCase : selectedCaseToMerge;

  const handleConfirmMerge = (values: Record<string, any>) => {
    const keptCase = getKeptCase();
    const removedCase = getRemovedCase();

    if (!keptCase || !removedCase) {
      toast.error("Cannot merge cases: Missing case data");
      return;
    }

    const mergedData: Record<string, any> = {} as Record<string, any>;
    differingFields.forEach((field) => {
      if (field.parentField) {
        const parentFieldKey = field.parentField as keyof CaseType;
        if (
          Array.isArray((initialKeepingCase as any)?.[parentFieldKey]) ||
          Array.isArray((selectedCaseToMerge as any)?.[parentFieldKey])
        ) {
          if (!mergedData[parentFieldKey]) {
            mergedData[parentFieldKey] = [];
          }
        } else if (
          (initialKeepingCase as any)?.[parentFieldKey] !== undefined ||
          (selectedCaseToMerge as any)?.[parentFieldKey] !== undefined
        ) {
          if (!mergedData[parentFieldKey]) {
            mergedData[parentFieldKey] = {};
          }
        }
      } else if (
        Array.isArray(
          (initialKeepingCase as any)?.[field.field as keyof CaseType]
        ) ||
        Array.isArray((selectedCaseToMerge as any)?.[field.field as keyof CaseType])
      ) {
        const fieldKey = field.field as keyof CaseType;
        if (!mergedData[fieldKey]) {
          mergedData[fieldKey] = [];
        }
      }
    });

    Object.keys(values).forEach((sanitizedKey) => {
      const fieldKey = unsanitizeKey(sanitizedKey);

      const fieldInfo = differingFields.find((f) => f.field === fieldKey);
      if (!fieldInfo) return;
      const selectedValue =
        values[sanitizedKey] === "initialKeepingCase"
          ? fieldInfo.initialKeepingCaseValue
          : fieldInfo.selectedCaseValue;
      if (fieldInfo.isComplex && fieldInfo.parentField) {
        const parentFieldKey = fieldInfo.parentField as keyof CaseType;

        if (!mergedData[parentFieldKey]) {
          mergedData[parentFieldKey] =
            fieldInfo.parentField === "phoneNumbers" ||
            fieldInfo.parentField === "identificationNumbers" ||
            fieldInfo.parentField === "incomeSources" ||
            fieldInfo.parentField === "expenses" ||
            fieldInfo.parentField === "governmentBenefits" ||
            fieldInfo.parentField === "raceAndEthnicity" ||
            fieldInfo.parentField === "gender" ||
            fieldInfo.parentField === "other" ||
            fieldInfo.parentField === "education" ||
            fieldInfo.parentField === "employment" ||
            fieldInfo.parentField === "maritalStatus" ||
            fieldInfo.parentField === "wePlayGroups" ||
            fieldInfo.parentField === "wePlayGroupsOther"
              ? []
              : {};
        }

        if (Array.isArray(mergedData[parentFieldKey])) {
          if (
            hasValue(selectedValue) &&
            !mergedData[parentFieldKey].some((item: any) => item === selectedValue)
          ) {
            mergedData[parentFieldKey].push(selectedValue);
          }
        } else {
          const rawFieldParts = fieldInfo.field.split(" - ");
          const subFieldKey = rawFieldParts[1]?.trim(); // e.g., "address", "state"
          if (subFieldKey) {
            mergedData[parentFieldKey][subFieldKey] = selectedValue;
          }
        }
      } else {
        const fieldKeyAsCaseTypeKey = fieldKey as keyof CaseType;
        mergedData[fieldKeyAsCaseTypeKey] = selectedValue;
      }
    });
    mergedData.mergedFrom = {
      keptCaseId: keptCase?.caseId,
      removedCaseId: removedCase?.caseId,
      mergedAt: new Date().toISOString(),
    };

    const performMerge = async () => {
      try {
        if (!keptCase?.caseId || !removedCase?.caseId) {
          toast.error("Cannot merge cases: Missing case IDs.");
          return;
        }

        await mergeCases(
          keptCase._id,
          removedCase._id,
          mergedData,
          userData?.userId,
          userData?.activeLocation
        );
        toast.success("Cases merged successfully!");
        onClose();
      } catch (error) {
        console.error("Error during merge API call:", error);
        toast.error("Failed to merge cases. Please try again.");
      }
    };

    performMerge();
  };

  const getDifferingFields = (): MergedFieldDisplay[] => {
    if (!initialKeepingCase || !selectedCaseToMerge) return [];

    const fieldsToProcess: (
      | keyof CaseType
      | { field: keyof CaseType; subFields: string[] }
    )[] = MergeFields;

    const differingFields: MergedFieldDisplay[] = [];

    fieldsToProcess.forEach((fieldInfo) => {
      if (typeof fieldInfo === "string") {
        const field = fieldInfo;
        const initialKeepingCaseValue = (initialKeepingCase as any)[field];
        const selectedCaseValue = (selectedCaseToMerge as any)[field];

        if (
          Array.isArray(initialKeepingCaseValue) ||
          Array.isArray(selectedCaseValue)
        ) {
          const initialKeepingCaseArray = Array.isArray(initialKeepingCaseValue)
            ? initialKeepingCaseValue
            : [];
          const selectedCaseArray = Array.isArray(selectedCaseValue)
            ? selectedCaseValue
            : [];
          const allValues = [...initialKeepingCaseArray, ...selectedCaseArray];
          const uniqueValues = Array.from(
            new Set(allValues.filter((value) => hasValue(value)))
          );

          uniqueValues.forEach((value) => {
            const initialKeepingCaseHasValue = initialKeepingCaseArray.some(
              (item) => item === value
            );
            const selectedCaseHasValue = selectedCaseArray.some(
              (item) => item === value
            );
            if (initialKeepingCaseHasValue || selectedCaseHasValue) {
              differingFields.push({
                field: `${field} - ${getFieldDisplayValue(value)}`,
                initialKeepingCaseValue: initialKeepingCaseHasValue
                  ? value
                  : undefined,
                selectedCaseValue: selectedCaseHasValue ? value : undefined,
                initialKeepingCaseDisplay: initialKeepingCaseHasValue
                  ? getFieldDisplayValue(value)
                  : "Not Provided",
                selectedCaseDisplay: selectedCaseHasValue
                  ? getFieldDisplayValue(value)
                  : "Not Provided",
                isComplex: true,
                parentField: field,
                itemValue: value,
              });
            }
          });
        } else {
          if (hasValue(initialKeepingCaseValue) || hasValue(selectedCaseValue)) {
            differingFields.push({
              field,
              initialKeepingCaseValue,
              selectedCaseValue,
              initialKeepingCaseDisplay: getFieldDisplayValue(
                initialKeepingCaseValue,
                field
              ),
              selectedCaseDisplay: getFieldDisplayValue(selectedCaseValue, field),
              isComplex: false,
            });
          }
        }
      } else {
        const { field, subFields } = fieldInfo;
        const initialKeepingCaseObject = (initialKeepingCase as any)[field] as any;
        const selectedCaseObject = (selectedCaseToMerge as any)[field] as any;

        subFields.forEach((subField) => {
          const initialKeepingCaseValue = initialKeepingCaseObject?.[subField];
          const selectedCaseValue = selectedCaseObject?.[subField];

          if (hasValue(initialKeepingCaseValue) || hasValue(selectedCaseValue)) {
            differingFields.push({
              field: `${String(field)} - ${subField}`,
              initialKeepingCaseValue,
              selectedCaseValue,
              initialKeepingCaseDisplay: getFieldDisplayValue(
                initialKeepingCaseValue,
                subField
              ),
              selectedCaseDisplay: getFieldDisplayValue(selectedCaseValue, subField),
              isComplex: true,
              parentField: String(field),
            });
          }
        });
      }
    });

    return differingFields;
  };

  const differingFields: MergedFieldDisplay[] = React.useMemo(
    () => getDifferingFields(),
    [initialKeepingCase, selectedCaseToMerge]
  );

  const initialValues: Record<string, string> = differingFields.reduce(
    (acc: Record<string, string>, field) => {
      acc[sanitizeKey(field.field)] = "initialKeepingCase";
      return acc;
    },
    {}
  );

  const formik = useFormik<Record<string, string>>({
    initialValues,
    onSubmit: handleConfirmMerge,
  });

  useEffect(() => {
    if (step === 3 && selectedCaseToMerge) {
      const newInitialValues: Record<string, string> = {};
      differingFields.forEach((field) => {
        newInitialValues[sanitizeKey(field.field)] = isSwitched
          ? "selectedCase"
          : "initialKeepingCase";
      });
      formik.setValues(newInitialValues);
    }
  }, [step, selectedCaseToMerge, isSwitched, differingFields]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Merge Case"
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-between gap-3">
          {step === 1 ? (
            <>
              <Button
                label="Search"
                onClick={triggerSearch}
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
                label="Cancel"
                icon="mdi:close"
                className="hover:bg-red-600 hover:text-white"
                onClick={onClose}
                variant="default"
              />

              <Button
                label="Merge Case"
                icon="mdi:content-merge"
                onClick={() => formik.handleSubmit()}
                variant="submitStyle"
              />
            </>
          )}
        </div>
      }
    >
      {step === 1 ? (
        <CaseSearchInput
          label={
            <p className="text-sm text-gray-700">
              Enter the name or case # of the case to merge with{" "}
              <span className="text-purple font-bold">
                {" "}
                {initialKeepingCase?.firstName + " " + initialKeepingCase?.lastName}
              </span>
            </p>
          }
          caseIdentifier={caseIdentifier}
          setCaseIdentifier={setCaseIdentifier}
          handleSearch={handleSearch}
          error={error}
        />
      ) : step === 2 ? (
        <CaseSearchResults
          foundCases={foundCases}
          handleSelectCase={handleSelectCaseToMerge}
          loading={loading}
        />
      ) : loadingCaseDetails ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
          <p className="ml-2 text-gray-600">Loading case details...</p>
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div
            className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4"
            role="alert"
          >
            <p className="font-bold">Choose which fields you would like to keep</p>
            <p className="text-sm">from each case in your merged case.</p>
            <p className="mt-2 text-sm">
              This will combine case #{getKeptCase()?.caseId || "N/A"} with case #
              {getRemovedCase()?.caseId || "N/A"}. Case #
              {getRemovedCase()?.caseId || "N/A"} will no longer exist after merging.
            </p>
            <div
              className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 text-xs"
              role="alert"
            >
              <p>Keeping: {getKeptCase()?.caseId || "N/A"}</p>
              <p>Removing: {getRemovedCase()?.caseId || "N/A"}</p>
              <p className="mt-2">
                <button
                  type="button"
                  onClick={handleSwitchCases}
                  className="text-blue-800 hover:underline"
                >
                  I want to keep Case # {getRemovedCase()?.caseId || "N/A"} instead.
                </button>
              </p>
            </div>
          </div>

          {differingFields.length > 0 ? (
            differingFields.map(
              ({ field, initialKeepingCaseDisplay, selectedCaseDisplay }) => (
                <div key={field as string} className="border-b border-gray-200 pb-4">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}:
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        id={`${field}-initialKeepingCase`}
                        name={sanitizeKey(field)}
                        type="radio"
                        value="initialKeepingCase"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        checked={
                          formik.values[sanitizeKey(field)] === "initialKeepingCase"
                        }
                        className="focus:ring-purple h-4 w-4 text-purple border-gray-300"
                      />
                      <label
                        htmlFor={`${field}-initialKeepingCase`}
                        className="ml-3 block text-sm text-gray-700"
                      >
                        Case #{initialKeepingCase?.caseId || "N/A"}:{" "}
                        {initialKeepingCaseDisplay}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id={`${field}-selectedCase`}
                        name={sanitizeKey(field)}
                        type="radio"
                        value="selectedCase"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        checked={
                          formik.values[sanitizeKey(field)] === "selectedCase"
                        }
                        className="focus:ring-purple h-4 w-4 text-purple border-gray-300"
                      />
                      <label
                        htmlFor={`${field}-selectedCase`}
                        className="ml-3 block text-sm text-gray-700"
                      >
                        Case #{selectedCaseToMerge?.caseId || "N/A"}:{" "}
                        {selectedCaseDisplay}
                      </label>
                    </div>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">
                No conflicting fields found between the cases.
              </p>
            </div>
          )}
        </form>
      )}
    </ModalWrapper>
  );
};

export default MergeCaseModal;
