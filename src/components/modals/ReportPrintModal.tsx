import React, { useCallback, useEffect, useState } from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { reportCards } from "@/utils/constants";
import {
  ERROR_MESSAGES,
  PLACEHOLDERS,
  STATIC_TEXTS,
} from "@/utils/textConstants";
import { debounce } from "lodash";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { searchCasesForMerge } from "@/services/CaseApi";
import type { SearchMergeCaseResult } from "@/types/case";
import { toast } from "react-toastify";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { fetchCategories, groupCategoriesBySection } from "@/utils/commonFunc";
import type { SimplifiedCategory } from "@/types";
import { useNavigate } from "react-router-dom";
import EnhancedAssistanceReportModal from "./EnhancedAssistanceReportModal";

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string | null;
}

const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  reportId,
}) => {
  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const currentReport = reportCards.find((report) => report.id === reportId);

  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] =
    useState<SearchMergeCaseResult | null>();
  const [categoryOptions, setCategoryOptions] = useState<SimplifiedCategory[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);

  useEffect(() => {
    if (!userData) return;
    fetchCategories(userData, setLoadingCategories, setCategoryOptions);
  }, [userData?.userId, userData?.activeLocation, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedCase(null);
      setSelectedCategory("");
      setShowEnhancedModal(false);
    }
  }, [isOpen]);

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

  const handleSelectCase = (caseItem: SearchMergeCaseResult) => {
    setSelectedCase(caseItem);
    setSearchResults([]);
    setCaseSearchTerm("");
  };

  const handleViewReport = () => {
    if (reportId === "assistance") {
      navigate(
        `/myAgency/${reportId}/report?caseId=${
          selectedCase?.id || ""
        }&categoryId=${selectedCategory || ""}`
      );
    } else {
      navigate(`/myAgency/${reportId}/report`);
    }
  };

  const handleEnhancedReport = () => {
    setShowEnhancedModal(true);
  };

  if (!reportId || !currentReport) {
    return null;
  }

  // If it's an assistance report and enhanced modal is requested, show the enhanced modal
  if (reportId === "assistance" && showEnhancedModal) {
    return (
      <EnhancedAssistanceReportModal
        isOpen={isOpen}
        onClose={() => {
          setShowEnhancedModal(false);
          onClose();
        }}
      />
    );
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`${currentReport?.title} ${STATIC_TEXTS.REPORTS.REPORT}`}
      widthClass="max-w-lg"
      footer={
        <div className="flex justify-between w-full">
          <div className="flex justify-end gap-2 w-full">
            <Button
              label={STATIC_TEXTS.COMMON.CANCEL}
              onClick={onClose}
              variant="default"
            />
            {reportId === "assistance" ? (
              <>
                <Button
                  label="Enhanced Report"
                  onClick={handleEnhancedReport}
                  variant="submitStyle"
                />
                <Button
                  label={STATIC_TEXTS.REPORTS.VIEW_REPORT}
                  onClick={handleViewReport}
                  variant="default"
                />
              </>
            ) : (
              <Button
                label={STATIC_TEXTS.REPORTS.VIEW_REPORT}
                onClick={handleViewReport}
                variant="submitStyle"
              />
            )}
          </div>
        </div>
      }
    >
      {reportId === "assistance" ? (
        <div className="space-y-4 h-full">
          <h3 className="text-lg font-semibold text-gray-900">
            {STATIC_TEXTS.REPORTS.CHOOSE_FILTERS} {currentReport?.title}{" "}
            {STATIC_TEXTS.REPORTS.REPORT}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">
                {STATIC_TEXTS.REPORTS.CHOOSE_CASE}
              </label>
              <div className="relative flex flex-col gap-1">
                <input
                  type="text"
                  value={caseSearchTerm}
                  onChange={handleCaseSearchChange}
                  placeholder={PLACEHOLDERS.SEARCH.CASE_NUMBER_OR_NAME}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple ${
                    caseSearchTerm.length > 2 &&
                    searchResults.length === 0 &&
                    !loadingSearchResults
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {caseSearchTerm.length > 2 && searchResults.length > 0 && (
                  <ul className="absolute top-[46px] z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
              </div>
              {loadingSearchResults && caseSearchTerm.length > 2 && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple"></div>
                </div>
              )}
              {caseSearchTerm.length > 2 &&
                searchResults.length === 0 &&
                !loadingSearchResults && (
                  <div className="text-red-500 text-xs mt-1">
                    {STATIC_TEXTS.COMMON.NO_CASES_FOUND}
                  </div>
                )}
              {selectedCase && (
                <div className="flex items-center justify-between bg-purple-100 rounded-md px-3 py-2 text-sm text-gray-800">
                  <span>
                    {selectedCase?.caseId} - {selectedCase?.fullName}
                  </span>
                  <button
                    className="text-red-600 hover:text-red-800 w-4 h-4"
                    onClick={() => setSelectedCase(null)}
                  >
                    <Icon icon="mdi:close" width="16" height="16" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">
                {STATIC_TEXTS.REPORTS.CHOOSE_CATEGORY}
              </label>
              <select
                name="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`${
                  selectedCategory ? "" : "text-[#999]"
                } w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple`}
                disabled={loadingCategories}
              >
                <option value="">{STATIC_TEXTS.COMMON.SELECT_OPTION}</option>
                {loadingCategories ? (
                  <option disabled>{STATIC_TEXTS.COMMON.LOADING}</option>
                ) : (
                  Object.entries(groupCategoriesBySection(categoryOptions)).map(
                    ([section, cats]) => (
                      <optgroup
                        key={section}
                        label={section}
                        className="font-bold text-gray-700"
                      >
                        {cats.map((cat: SimplifiedCategory) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  )
                )}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          {STATIC_TEXTS.COMMON.NO_FILTERS_FOUND}
        </div>
      )}
    </ModalWrapper>
  );
};

export default ReportPrintModal;
