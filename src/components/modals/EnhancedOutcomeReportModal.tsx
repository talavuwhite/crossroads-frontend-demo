import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import ProgressIndicator from "@/components/ui/ProgressIndicator";
import { getUsersWithoutPagination } from "@/services/UserApi";
import type { UserData } from "@/types/user";
import type {
  OutcomeReportFilters,
  OutcomeReportFieldSelection,
} from "@/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { GOAL_SET_STATUS } from "@/utils/constants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { toZonedTime } from "date-fns-tz";
import {
  ERROR_MESSAGES,
  PLACEHOLDERS,
  STATIC_TEXTS,
} from "@/utils/textConstants";
import { validateIntegerInput } from "@/utils/commonFunc";
import {
  getOutcomeGoals,
  getOutcomeStatuses,
  type IOutcomeGoalsApiResponse,
} from "@/services/OutcomesApi";
import { toast } from "react-toastify";
import type { SearchMergeCaseResult } from "@/types/case";
import { searchCasesForMerge } from "@/services/CaseApi";
import { debounce } from "lodash";

interface EnhancedOutcomeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedOutcomeReportModal: React.FC<EnhancedOutcomeReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateOnly = (date: Date): string => {
    // Format the date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Filters state
  const [filters, setFilters] = useState<OutcomeReportFilters>({});

  // Field selection state
  const [fieldSelection, setFieldSelection] =
    useState<OutcomeReportFieldSelection>({
      orderBy: "createdAt",
      orderDirection: "desc",
      includeReportFilters: true,
      includeOutcomeSummary: true,
      includeOutcomeRecords: true,
      // Summary fields - default to true and always enabled
      summaryTotalOutcomes: true,
      summaryOutcomesByStatus: true,
      summaryGoalsByStatus: true,
      summaryCompletionRates: true,
      summaryDueDateStatistics: true,
      // Outcome fields - default to true and always enabled
      outcomeTitle: true,
      outcomeStatus: true,
      outcomeCase: true,
      outcomeSections: true,
      outcomeGoals: true,
      outcomeDueDates: true,
      outcomeCreatedBy: true,
      outcomeCreatedDate: true,
      outcomeComments: false, // Initially deselected
    });

  // Data loading states
  const [agents, setAgents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState({
    agents: false,
    statuses: false,
    goals: false,
  });
  const [statuses, setStatuses] = useState<{ _id: string; name: string }[]>([]);
  const [sectionsGoals, setSectionsGoals] = useState<
    IOutcomeGoalsApiResponse["results"]
  >([]);
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMergeCaseResult[]>(
    []
  );
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [selectedCases, setSelectedCases] = useState<SearchMergeCaseResult[]>(
    []
  );
  // Expanded filters state
  const [expandedFilters, setExpandedFilters] = useState<{
    [key: string]: boolean;
  }>({});

  // Helper function to check if a field is always enabled (readonly)
  const isFieldAlwaysEnabled = (fieldKey: string): boolean => {
    const alwaysEnabledFields = [
      "outcomeTitle",
      "outcomeStatus",
      "outcomeCase",
      "outcomeCreatedBy",
      "summaryTotalOutcomes",
      "includeOutcomeRecords",
      "includeOutcomeSummary",
    ];
    return alwaysEnabledFields.includes(fieldKey);
  };

  // Helper function to parse date strings and convert to zoned time
  const parseDateString = (
    dateString: string | null | undefined
  ): Date | null => {
    if (!dateString) return null;

    try {
      // Handle YYYY-MM-DD format (most common from our form)
      if (dateString.includes("-") && dateString.length === 10) {
        const [year, month, day] = dateString.split("-");
        // Create date in local timezone to avoid timezone conversion issues
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Handle other formats as fallback
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Load agents on component mount
  const loadAgents = async () => {
    if (!userData) return;

    try {
      setLoading({ ...loading, agents: true });
      const response = await getUsersWithoutPagination(
        userData.userId,
        userData.activeLocation
      );
      setAgents(response.data || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setLoading({ ...loading, agents: false });
    }
  };
  useEffect(() => {
    if (!userData) {
      toast.error("Please login to continue");
      return;
    }

    loadAgents();
    fetchStatuses();
    fetchGoals();
  }, [userData]);
  const fetchStatuses = async () => {
    if (!userData?.userId) return;
    try {
      const data = await getOutcomeStatuses(userData?.userId);
      setStatuses(data || []);
    } catch {
      toast.error("Failed to fetch statuses");
    }
  };

  const fetchGoals = useCallback(async () => {
    if (!userData?.userId) return; // -> If no user, do nothing
    setLoading({ ...loading, goals: true }); // -> Show loading spinner
    try {
      // -> Call the API to get outcome goals for this page
      const data = await getOutcomeGoals(0, 500, userData?.userId, true);
      setSectionsGoals(data.results);
    } catch (err: unknown) {
      toast.error("Failed to load goals");
    } finally {
      setLoading({ ...loading, goals: false }); // -> Hide loading spinner
    }
  }, [userData?.userId]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFilters({});
      setFieldSelection({
        orderBy: "createdAt",
        orderDirection: "desc",
        includeReportFilters: true,
        includeOutcomeSummary: true,
        includeOutcomeRecords: true,
        summaryTotalOutcomes: true,
        summaryOutcomesByStatus: true,
        summaryGoalsByStatus: true,
        summaryCompletionRates: true,
        summaryDueDateStatistics: true,
        outcomeTitle: true,
        outcomeStatus: true,
        outcomeCase: true,
        outcomeSections: true,
        outcomeGoals: true,
        outcomeDueDates: true,
        outcomeCreatedBy: true,
        outcomeCreatedDate: true,
        outcomeComments: false,
      });
      setExpandedFilters({
        dateRange: false,
        dueDateRange: false,
        status: false,
        goal: false,
        agent: false,
        case: false,
      });
      // Clear case-related state
      setSelectedCases([]);
      setCaseSearchTerm("");
      setSearchResults([]);
      setFilters((prev) => ({
        ...prev,
        caseId: undefined,
      }));
    }
  }, [isOpen]);

  // Handle filter changes
  const handleFilterChange = (key: keyof OutcomeReportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle nested filter changes
  const handleNestedFilterChange = (
    parentKey: keyof OutcomeReportFilters,
    childKey: string,
    value: any
  ) => {
    setFilters((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [childKey]: value,
      },
    }));
  };

  // Handle field selection changes
  const handleFieldSelectionChange = (
    key: keyof OutcomeReportFieldSelection,
    value: any
  ) => {
    // Only allow changes for fields that are not always enabled
    if (isFieldAlwaysEnabled(key)) {
      return; // Don't allow changes to always enabled fields
    }

    setFieldSelection((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const toggleFilter = (filterKey: string) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
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
        const filteredResults = results.filter(
          (result) =>
            !selectedCases.some((selected) => selected.id === result.id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Error searching cases:", error);
        toast.error(ERROR_MESSAGES.FETCH.CASES);
        setSearchResults([]);
      } finally {
        setLoadingSearchResults(false);
      }
    }, 500),
    [selectedCases, userData?.activeLocation, userData?.userId]
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
    setSelectedCases((prev) => [...prev, caseItem]);
    // Also update the filters state with the case ID (support multiple cases)
    setFilters((prev) => ({
      ...prev,
      caseId: prev.caseId ? [...prev.caseId, caseItem.id] : [caseItem.id],
    }));
    setSearchResults([]);
    setCaseSearchTerm("");
  };

  const handleRemoveCase = (caseId: string) => {
    setSelectedCases((prev) => prev.filter((c) => c.id !== caseId));
    // Remove the case ID from filters when removing
    setFilters((prev) => {
      if (!prev.caseId || !Array.isArray(prev.caseId)) return prev;

      const updatedCaseIds = prev.caseId.filter((id) => id !== caseId);

      return {
        ...prev,
        caseId: updatedCaseIds.length > 0 ? updatedCaseIds : undefined,
      };
    });
  };

  const renderFilterBar = (
    filterKey: string,
    title: string,
    subtitle: string,
    children: React.ReactNode,
    icon: string
  ) => (
    <div className="mb-5">
      <div
        className="bg-gradient-to-r from-purpleLight to-purple/5 hover:from-purple/10 hover:to-purple/10 rounded-2xl p-4 cursor-pointer transition-all duration-300 border border-purple/10 hover:border-purple/20"
        onClick={() => toggleFilter(filterKey)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-purple/10 flex items-center justify-center w-12 h-12">
              <Icon icon={icon} className="text-purple" />
            </div>
            <div>
              <div className="font-bold text-gray-800 text-lg">{title}</div>
              <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Icon
              icon={
                expandedFilters[filterKey]
                  ? "mdi:chevron-up"
                  : "mdi:chevron-down"
              }
              className="text-purple w-6 h-6 transition-all duration-300"
            />
          </div>
        </div>
      </div>
      {expandedFilters[filterKey] && (
        <div className="bg-white border border-purple/20 rounded-2xl p-6 mt-4 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );

  // Render Step 1: Filters
  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Date Range Filter */}
      {renderFilterBar(
        "dateRange",
        "Outcome Creation Date",
        "Filter by outcome creation date range",
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Start Date
            </label>
            <DatePicker
              selected={
                filters.dateRange?.startDate
                  ? parseDateString(filters.dateRange.startDate)
                  : null
              }
              onChange={(date: Date | null) => {
                if (date) {
                  handleNestedFilterChange(
                    "dateRange",
                    "startDate",
                    formatDateOnly(date)
                  );
                } else {
                  handleNestedFilterChange("dateRange", "startDate", "");
                }
              }}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select start date"
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              wrapperClassName="w-full"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperClassName="datepicker-modal-fix"
              popperPlacement="bottom-start"
              maxDate={toZonedTime(new Date(), userTimeZone)}
            />
          </div>
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              End Date
            </label>
            <DatePicker
              selected={
                filters.dateRange?.endDate
                  ? parseDateString(filters.dateRange.endDate)
                  : null
              }
              onChange={(date: Date | null) => {
                if (date) {
                  handleNestedFilterChange(
                    "dateRange",
                    "endDate",
                    formatDateOnly(date)
                  );
                } else {
                  handleNestedFilterChange("dateRange", "endDate", "");
                }
              }}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select end date"
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              wrapperClassName="w-full"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperClassName="datepicker-modal-fix"
              popperPlacement="bottom-start"
              maxDate={toZonedTime(new Date(), userTimeZone)}
              minDate={
                filters.dateRange?.startDate
                  ? new Date(filters.dateRange.startDate)
                  : undefined
              }
            />
          </div>
        </div>,
        "mdi:calendar-range"
      )}

      {/* Due Date Range Filter */}
      {renderFilterBar(
        "dueDateRange",
        "Due Date Range",
        "Filter by outcome due date range",
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Start Date
            </label>
            <DatePicker
              selected={
                filters.dueDateRange?.startDate
                  ? parseDateString(filters.dueDateRange.startDate)
                  : null
              }
              onChange={(date: Date | null) => {
                if (date) {
                  handleNestedFilterChange(
                    "dueDateRange",
                    "startDate",
                    formatDateOnly(date)
                  );
                } else {
                  handleNestedFilterChange("dueDateRange", "startDate", "");
                }
              }}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select start date"
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              wrapperClassName="w-full"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperClassName="datepicker-modal-fix"
              popperPlacement="bottom-start"
            />
          </div>
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              End Date
            </label>
            <DatePicker
              selected={
                filters.dueDateRange?.endDate
                  ? parseDateString(filters.dueDateRange.endDate)
                  : null
              }
              onChange={(date: Date | null) => {
                if (date) {
                  handleNestedFilterChange(
                    "dueDateRange",
                    "endDate",
                    formatDateOnly(date)
                  );
                } else {
                  handleNestedFilterChange("dueDateRange", "endDate", "");
                }
              }}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select end date"
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              wrapperClassName="w-full"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperClassName="datepicker-modal-fix"
              popperPlacement="bottom-start"
              minDate={
                filters.dueDateRange?.startDate
                  ? new Date(filters.dueDateRange.startDate)
                  : undefined
              }
            />
          </div>
        </div>,
        "mdi:calendar-clock"
      )}

      {/* Status Filters */}
      {renderFilterBar(
        "status",
        "Status Filters",
        "Filter by outcome, goal, and section status",
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Outcome Status
            </label>
            <select
              value={filters.outcomeStatus || ""}
              onChange={(e) =>
                handleFilterChange("outcomeStatus", e.target.value || undefined)
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            >
              <option value="">All Statuses</option>
              {GOAL_SET_STATUS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Goal Status
            </label>
            <select
              value={filters.goalStatus || ""}
              onChange={(e) =>
                handleFilterChange("goalStatus", e.target.value || undefined)
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              disabled={loading.statuses}
            >
              <option value="">All Goal Statuses</option>
              {loading.statuses ? (
                <option disabled>Loading statuses...</option>
              ) : (
                statuses?.map((option) => (
                  <option key={option?._id} value={option?._id}>
                    {option?.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>,
        "mdi:flag"
      )}

      {/* Goal Filters */}
      {renderFilterBar(
        "goal",
        "Goal Filters",
        "Filter by goal type and completion status",

        <div>
          <label className="block text-base font-normal text-gray-700 mb-3">
            Goal Type
          </label>
          <select
            value={filters.goalType || ""}
            onChange={(e) =>
              handleFilterChange("goalType", e.target.value || undefined)
            }
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            disabled={loading.goals}
          >
            <option value="">All Goal Types</option>
            {sectionsGoals.map((sectionData) => (
              <optgroup
                key={sectionData.section._id}
                label={sectionData.section.name}
              >
                {sectionData.goals.map((goal) => (
                  <option key={goal._id} value={goal._id}>
                    {goal.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>,
        "mdi:target"
      )}

      {/* Agent/Staff Filters */}
      {renderFilterBar(
        "agent",
        "Agent/Staff Filters",
        "Filter by created by ",

        <div>
          <label className="block text-base font-normal text-gray-700 mb-3">
            Created By
          </label>
          <select
            value={filters.createdBy || ""}
            onChange={(e) =>
              handleFilterChange("createdBy", e.target.value || undefined)
            }
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            disabled={loading.agents}
          >
            <option value="">All Agents</option>
            {loading.agents ? (
              <option disabled>Loading agents...</option>
            ) : (
              agents.map((agent) => (
                <option key={agent._id} value={agent.userId}>
                  {agent.firstName} {agent.lastName}
                </option>
              ))
            )}
          </select>
        </div>,
        "mdi:account-multiple"
      )}

      {/* Case Filters */}
      {renderFilterBar(
        "case",
        "Case Filters",
        "Filter by case ID and demographics",
        <div className="space-y-6">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Case ID
            </label>
            <div className="order-1 md:order-2 bg-purpleLight p-5 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-grow relative">
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
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
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
                </div>
              </div>
              <div className="space-y-2">
                {selectedCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="flex items-center justify-between bg-purple-100 rounded-md px-3 py-2 text-sm text-gray-800"
                  >
                    <span>
                      {caseItem.caseId} - {caseItem.fullName}
                    </span>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleRemoveCase(caseItem.id)}
                    >
                      <Icon icon="mdi:close" width="16" height="16" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-normal text-gray-700 mb-3">
                Minimum Age
              </label>
              <input
                type="text"
                placeholder="0"
                maxLength={3}
                value={filters.caseDemographics?.minAge || ""}
                onChange={(e) => {
                  const value = validateIntegerInput(e.target.value);
                  handleNestedFilterChange(
                    "caseDemographics",
                    "minAge",
                    value ? parseInt(value) : undefined
                  );
                }}
                onKeyPress={(e) => {
                  const char = String.fromCharCode(e.which);
                  if (!/[0-9]/.test(char)) {
                    e.preventDefault();
                  }
                }}
                className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              />
            </div>
            <div>
              <label className="block text-base font-normal text-gray-700 mb-3">
                Maximum Age
              </label>
              <input
                type="text"
                placeholder="100"
                maxLength={3}
                value={filters.caseDemographics?.maxAge || ""}
                onChange={(e) => {
                  const value = validateIntegerInput(e.target.value);
                  handleNestedFilterChange(
                    "caseDemographics",
                    "maxAge",
                    value ? parseInt(value) : undefined
                  );
                }}
                onKeyPress={(e) => {
                  const char = String.fromCharCode(e.which);
                  if (!/[0-9]/.test(char)) {
                    e.preventDefault();
                  }
                }}
                className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              />
            </div>
          </div>
        </div>,
        "mdi:account-group"
      )}
    </div>
  );

  // Render Step 2: Field Selection
  const renderStep2 = () => (
    <div className="space-y-10">
      {/* Order By */}
      <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <Icon icon="mdi:sort" className="text-purple w-6 h-6 mr-3" />
          Order Outcomes By
        </h4>
        <div>
          <select
            value={`${fieldSelection.orderBy}-${fieldSelection.orderDirection}`}
            onChange={(e) => {
              const [orderBy, orderDirection] = e.target.value.split("-");
              setFieldSelection((prev) => ({
                ...prev,
                orderBy: orderBy,
                orderDirection: orderDirection as "asc" | "desc",
              }));
            }}
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
          >
            <option value="createdAt-desc">Newest to Oldest</option>
            <option value="createdAt-asc">Oldest to Newest</option>
            <option value="updatedAt-desc">Last Updated (Newest First)</option>
            <option value="updatedAt-asc">Last Updated (Oldest First)</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Report Sections */}
      <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <Icon
            icon="mdi:file-document-multiple"
            className="text-purple w-6 h-6 mr-3"
          />
          Report Sections To Include
        </h4>
        <div className="space-y-4">
          <label className="flex items-center p-4 bg-white rounded-xl border-2 border-purple shadow-sm hover:shadow-md transition-all duration-200">
            <div className="relative">
              <input
                type="checkbox"
                checked={fieldSelection.includeReportFilters}
                onChange={(e) =>
                  handleFieldSelectionChange(
                    "includeReportFilters",
                    e.target.checked
                  )
                }
                className="sr-only"
              />
              <div className="w-6 h-6 bg-purple border-2 border-purple rounded-lg flex items-center justify-center shadow-sm">
                <Icon icon="mdi:check" className="text-white w-4 h-4" />
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Report Filters
            </span>
          </label>
          <label className="flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple/30 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={fieldSelection.includeOutcomeSummary}
                onChange={(e) =>
                  handleFieldSelectionChange(
                    "includeOutcomeSummary",
                    e.target.checked
                  )
                }
                className="sr-only"
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeOutcomeSummary
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeOutcomeSummary && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Outcome Summary
            </span>
          </label>
          <label className="flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple/30 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={fieldSelection.includeOutcomeRecords}
                onChange={(e) =>
                  handleFieldSelectionChange(
                    "includeOutcomeRecords",
                    e.target.checked
                  )
                }
                className="sr-only"
                disabled
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeOutcomeRecords
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeOutcomeRecords && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Outcome Records
            </span>
          </label>
        </div>
      </div>

      {/* Summary Fields */}
      {fieldSelection.includeOutcomeSummary && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Icon icon="mdi:chart-box" className="text-purple w-6 h-6 mr-3" />
            Outcome Summary Report Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "summaryTotalOutcomes",
                label: "Summary: Total outcomes",
              },
              {
                key: "summaryOutcomesByStatus",
                label: "Summary: Outcomes by status",
              },
              {
                key: "summaryGoalsByStatus",
                label: "Summary: Goals by status",
              },
              {
                key: "summaryCompletionRates",
                label: "Summary: Completion rates",
              },
              {
                key: "summaryDueDateStatistics",
                label: "Summary: Due date statistics",
              },
            ].map(({ key, label }) => (
              <label
                key={key}
                className={`flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple/30 hover:shadow-md transition-all duration-200 ${
                  isFieldAlwaysEnabled(key)
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={
                      fieldSelection[
                        key as keyof OutcomeReportFieldSelection
                      ] as boolean
                    }
                    onChange={(e) =>
                      handleFieldSelectionChange(
                        key as keyof OutcomeReportFieldSelection,
                        e.target.checked
                      )
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof OutcomeReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof OutcomeReportFieldSelection
                    ] as boolean) && (
                      <Icon icon="mdi:check" className="text-white w-4 h-4" />
                    )}
                  </div>
                </div>
                <span className={`ml-4 text-base font-normal text-gray-700`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Record Fields */}
      {fieldSelection.includeOutcomeRecords && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-8 flex items-center">
            <Icon
              icon="mdi:format-list-bulleted"
              className="text-purple w-6 h-6 mr-3"
            />
            Outcome Record Report Fields
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "outcomeTitle", label: "Outcome: Title" },
              { key: "outcomeStatus", label: "Outcome: Status" },
              { key: "outcomeCase", label: "Outcome: Case" },
              { key: "outcomeSections", label: "Outcome: Sections" },
              { key: "outcomeGoals", label: "Outcome: Goals" },
              { key: "outcomeDueDates", label: "Outcome: Due dates" },
              { key: "outcomeCreatedBy", label: "Outcome: Created by" },
              { key: "outcomeCreatedDate", label: "Outcome: Created date" },
              { key: "outcomeComments", label: "Outcome: Comments" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className={`flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple/30 hover:shadow-md transition-all duration-200 ${
                  isFieldAlwaysEnabled(key)
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={
                      fieldSelection[
                        key as keyof OutcomeReportFieldSelection
                      ] as boolean
                    }
                    onChange={(e) =>
                      handleFieldSelectionChange(
                        key as keyof OutcomeReportFieldSelection,
                        e.target.checked
                      )
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof OutcomeReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    } `}
                  >
                    {(fieldSelection[
                      key as keyof OutcomeReportFieldSelection
                    ] as boolean) && (
                      <Icon icon="mdi:check" className="text-white w-4 h-4" />
                    )}
                  </div>
                </div>
                <span className={`ml-4 text-base font-normal text-gray-700`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Handle form submission
  const handleSubmit = () => {
    if (!userData) return;

    // Build query parameters for navigation
    const params = new URLSearchParams();

    // Encode filters and field selection as JSON strings for URL parameters
    const filtersParam = encodeURIComponent(JSON.stringify(filters));
    const fieldSelectionParam = encodeURIComponent(
      JSON.stringify(fieldSelection)
    );

    params.append("filters", filtersParam);
    params.append("fieldSelection", fieldSelectionParam);

    // Navigate to report page
    navigate(`/myAgency/outcomes/report?${params.toString()}`);
    onClose();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Outcome Report"
      widthClass="max-w-3xl"
      noPadding={true}
      footer={
        <div className="flex justify-between w-full">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                label="Back"
                onClick={handlePreviousStep}
                variant="default"
                icon="mdi:arrow-left"
                className="px-6 py-3"
              />
            )}
          </div>
          <div className="flex gap-3">
            <Button
              label={STATIC_TEXTS.COMMON.CANCEL}
              onClick={onClose}
              variant="default"
              className="px-6 py-3"
            />
            {currentStep < 2 ? (
              <Button
                label="Next"
                onClick={handleNextStep}
                variant="submitStyle"
                icon="mdi:arrow-right"
                className="px-6 py-3"
              />
            ) : (
              <Button
                label="Generate Report"
                onClick={handleSubmit}
                variant="submitStyle"
                icon="mdi:file-chart"
                className="px-6 py-3"
              />
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Sticky Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          steps={[
            { number: 1, label: "Filters" },
            { number: 2, label: "Fields" },
          ]}
        />
        {/* Scrollable Content */}
        <div className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto hide-scrollbar px-4 p-6 relative">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
        </div>
      </div>
    </ModalWrapper>
  );
};

export default EnhancedOutcomeReportModal;
