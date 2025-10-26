import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import ProgressIndicator from "@/components/ui/ProgressIndicator";
import type {
  OutcomeGoalsReportFilters,
  OutcomeGoalsReportFieldSelection,
} from "@/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { STATIC_TEXTS } from "@/utils/textConstants";
import {
  getOutcomeGoals,
  getOutcomeStatuses,
  type IOutcomeGoalsApiResponse,
} from "@/services/OutcomesApi";
import { toast } from "react-toastify";

// Add custom styles for date picker positioning
const datePickerStyles = `
  .datepicker-popper {
    z-index: 9999 !important;
  }
  
  .react-datepicker-wrapper {
    width: 100%;
  }
  
  .react-datepicker__input-container {
    width: 100%;
  }
  
  .react-datepicker__input-container input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .react-datepicker__input-container input:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
  
  .react-datepicker {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  .react-datepicker__header {
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0.5rem 0.5rem 0 0;
  }
  
  .react-datepicker__day--selected {
    background-color: #8b5cf6 !important;
    color: white !important;
  }
  
  .react-datepicker__day--keyboard-selected {
    background-color: rgba(139, 92, 246, 0.1) !important;
    color: #8b5cf6 !important;
  }
  
  .react-datepicker__day:hover {
    background-color: rgba(139, 92, 246, 0.1) !important;
  }
`;

interface EnhancedOutcomeGoalsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedOutcomeGoalsReportModal: React.FC<
  EnhancedOutcomeGoalsReportModalProps
> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateOnly = (date: Date): string => {
    // Format the date as YYYY-MM-DD in user's timezone
    const zonedDate = new Date(
      date.toLocaleString("en-US", { timeZone: userTimeZone })
    );
    const year = zonedDate.getFullYear();
    const month = String(zonedDate.getMonth() + 1).padStart(2, "0");
    const day = String(zonedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Filters state
  const [filters, setFilters] = useState<OutcomeGoalsReportFilters>({});

  // Field selection state
  const [fieldSelection, setFieldSelection] =
    useState<OutcomeGoalsReportFieldSelection>({
      orderBy: "createdAt",
      orderDirection: "desc",
      includeReportFilters: true,
      includeGoalSummary: true,
      includeGoalRecords: true,
      // Summary fields - default to true and always enabled
      summaryTotalGoals: true,
      summaryGoalsBySection: true,
      summaryCompletionRates: true,
      summaryDueDateStatistics: true,
      summaryOverdueGoals: true,
      // Goal record fields - default to true and always enabled
      goalName: true,
      goalSection: true,
      goalStatus: true,
      goalDueDate: true,
      goalSteps: true,
      goalCreatedDate: true,
      goalCompletionDate: false, // Initially deselected
      outcomeTitle: true,
      outcomeStatus: true,
    });

  // Data loading states
  const [loading, setLoading] = useState({
    statuses: false,
  });
  const [statuses, setStatuses] = useState<{ _id: string; name: string }[]>([]);
  const [sectionsGoals, setSectionsGoals] = useState<
    IOutcomeGoalsApiResponse["results"]
  >([]);

  // Expanded filters state
  const [expandedFilters, setExpandedFilters] = useState<{
    [key: string]: boolean;
  }>({});

  // Helper function to check if a field is always enabled (readonly)
  const isFieldAlwaysEnabled = (fieldKey: string): boolean => {
    const alwaysEnabledFields = [
      "goalName",
      "goalSection",
      "goalStatus",
      "summaryTotalGoals",
      "includeGoalRecords",
      "outcomeTitle",
      "outcomeStatus",
    ];
    return alwaysEnabledFields.includes(fieldKey);
  };

  // Helper function to parse date strings
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

  // Load statuses
  useEffect(() => {
    const loadStatuses = async () => {
      if (!userData?.userId) return;

      try {
        setLoading((prev) => ({ ...prev, statuses: true }));
        const response = await getOutcomeStatuses(userData.userId);
        setStatuses(response || []);
      } catch (error) {
        console.error("Error loading statuses:", error);
        toast.error("Failed to load statuses");
      } finally {
        setLoading((prev) => ({ ...prev, statuses: false }));
      }
    };

    loadStatuses();
  }, [userData?.userId]);

  // Load sections and goals
  useEffect(() => {
    const loadSectionsGoals = async () => {
      if (!userData?.userId) return;

      try {
        setLoading((prev) => ({ ...prev, goals: true }));
        const response = await getOutcomeGoals(0, 500, userData.userId, true);
        setSectionsGoals(response.results || []);
      } catch (error) {
        console.error("Error loading sections and goals:", error);
        toast.error("Failed to load goals");
      } finally {
        setLoading((prev) => ({ ...prev, goals: false }));
      }
    };

    loadSectionsGoals();
  }, [userData?.userId]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle date range filter changes
  const handleDateRangeChange = (
    rangeKey: string,
    dateKey: string,
    value: Date | null
  ) => {
    setFilters((prev) => {
      const currentRange = prev[
        rangeKey as keyof OutcomeGoalsReportFilters
      ] as any;
      return {
        ...prev,
        [rangeKey]: {
          ...currentRange,
          [dateKey]: value ? formatDateOnly(value) : undefined,
        },
      };
    });
  };

  // Toggle filter expansion
  const toggleFilterExpansion = (filterKey: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  // Initialize expanded filters
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFilters({});
      setFieldSelection({
        orderBy: "createdAt",
        orderDirection: "desc",
        includeReportFilters: true,
        includeGoalSummary: true,
        includeGoalRecords: true,
        summaryTotalGoals: true,
        summaryGoalsBySection: true,
        summaryCompletionRates: true,
        summaryDueDateStatistics: true,
        summaryOverdueGoals: true,
        goalName: true,
        goalSection: true,
        goalStatus: true,
        goalDueDate: true,
        goalSteps: true,
        goalCreatedDate: true,
        goalCompletionDate: false,
        outcomeTitle: true,
        outcomeStatus: true,
      });
      setExpandedFilters({
        dateRanges: false,
        goalFilters: false,
        statusFilters: false,
      });
    }
  }, [isOpen]);

  // Handle form submission - following the pattern of other modals
  const handleSubmit = () => {
    if (!userData) {
      toast.error("Please login to continue");
      return;
    }

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
    navigate(`/myAgency/outcome-goals/report?${params.toString()}`);
    onClose();
  };

  // Render filter bar component
  const renderFilterBar = (
    filterKey: keyof typeof expandedFilters,
    title: string,
    subtitle: string,
    children: React.ReactNode,
    icon: string
  ) => (
    <div className="mb-5">
      <div
        className="bg-gradient-to-r from-purpleLight to-purple/5 hover:from-purple/10 hover:to-purple/10 rounded-2xl p-4 cursor-pointer transition-all duration-300 border border-purple/10 hover:border-purple/20"
        onClick={() => toggleFilterExpansion(filterKey)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-full shadow-sm border border-purple/10 flex items-center justify-center w-12 h-12">
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

  // Render step 1: Filters
  const renderFiltersStep = () => (
    <div className="space-y-6">
      {/* Date Range Filters */}
      {renderFilterBar(
        "dateRanges",
        "Date Range Filters",
        "Filter by goal creation, due date, and completion date ranges",
        <div className="space-y-6">
          {/* Goal Creation Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Goal Creation Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DatePicker
                  selected={parseDateString(filters.dateRange?.startDate)}
                  onChange={(date) =>
                    handleDateRangeChange("dateRange", "startDate", date)
                  }
                  placeholderText="Start Date"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200"
                  dateFormat="MM/dd/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  popperClassName="datepicker-popper"
                  popperPlacement="bottom-start"
                />
              </div>
              <div>
                <DatePicker
                  selected={parseDateString(filters.dateRange?.endDate)}
                  onChange={(date) =>
                    handleDateRangeChange("dateRange", "endDate", date)
                  }
                  placeholderText="End Date"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200"
                  dateFormat="MM/dd/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  minDate={
                    parseDateString(filters.dateRange?.startDate) || undefined
                  }
                  popperClassName="datepicker-popper"
                  popperPlacement="bottom-start"
                />
              </div>
            </div>
          </div>

          {/* Goal Due Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Goal Due Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DatePicker
                  selected={parseDateString(filters.dueDateRange?.startDate)}
                  onChange={(date) =>
                    handleDateRangeChange("dueDateRange", "startDate", date)
                  }
                  placeholderText="Start Date"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200"
                  dateFormat="MM/dd/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  popperClassName="datepicker-popper"
                  popperPlacement="bottom-start"
                />
              </div>
              <div>
                <DatePicker
                  selected={parseDateString(filters.dueDateRange?.endDate)}
                  onChange={(date) =>
                    handleDateRangeChange("dueDateRange", "endDate", date)
                  }
                  placeholderText="End Date"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200"
                  dateFormat="MM/dd/yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  minDate={
                    parseDateString(filters.dueDateRange?.startDate) ||
                    undefined
                  }
                  popperClassName="datepicker-popper"
                  popperPlacement="bottom-start"
                />
              </div>
            </div>
          </div>
        </div>,
        "mdi:calendar"
      )}

      {/* Goal Filters */}
      {renderFilterBar(
        "goalFilters",
        "Goal Filters",
        "Filter by goal section and type",
        <div className="space-y-4">
          {/* Section-based Filtering */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <select
              value={filters.sectionId || ""}
              onChange={(e) => handleFilterChange("sectionId", e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200"
            >
              <option value="">All Sections</option>
              {sectionsGoals.map((section) => (
                <option key={section.section._id} value={section.section._id}>
                  {section.section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Type
            </label>
            <select
              value={filters.goalType || ""}
              onChange={(e) => handleFilterChange("goalType", e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200"
            >
              <option value="">All Types</option>
              <option value="custom">Custom Goals</option>
              <option value="standard">Standard Goals</option>
            </select>
          </div>
        </div>,
        "mdi:target"
      )}

      {/* Status Filters */}
      {renderFilterBar(
        "statusFilters",
        "Status Filters",
        "Filter by goal completion status",
        <div className="space-y-4">
          {/* Goal Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Status
            </label>
            <select
              value={filters.goalStatus || ""}
              onChange={(e) => handleFilterChange("goalStatus", e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200"
              disabled={loading.statuses}
            >
              <option value="">All Statuses</option>
              {loading.statuses ? (
                <option value="">Loading...</option>
              ) : (
                statuses.map((status) => (
                  <option key={status._id} value={status._id}>
                    {status.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>,
        "mdi:flag"
      )}
    </div>
  );

  // Render step 2: Field Selection
  const renderFieldSelectionStep = () => (
    <div className="space-y-6">
      {/* Order Goals By */}
      <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <Icon icon="mdi:sort" className="text-purple w-6 h-6 mr-3" />
          Order Goals By
        </h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Option
            </label>
            <select
              value={`${fieldSelection.orderBy}-${fieldSelection.orderDirection}`}
              onChange={(e) => {
                const [orderBy, orderDirection] = e.target.value.split("-");
                setFieldSelection((prev) => ({
                  ...prev,
                  orderBy,
                  orderDirection: orderDirection as "asc" | "desc",
                }));
              }}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200"
            >
              <option value="createdAt-desc">Newest to Oldest</option>
              <option value="createdAt-asc">Oldest to Newest</option>
              <option value="dueDate-asc">Due Date (Earliest First)</option>
              <option value="dueDate-desc">Due Date (Latest First)</option>
              <option value="name-asc">Goal Name (A-Z)</option>
              <option value="name-desc">Goal Name (Z-A)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Sections */}
      <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <Icon
            icon="mdi:file-document-outline"
            className="text-purple w-6 h-6 mr-3"
          />
          Report Sections
        </h4>
        <div className="grid grid-cols-1 gap-4">
          {[
            { key: "includeReportFilters", label: "Report Filters" },
            { key: "includeGoalSummary", label: "Goal Summary" },
            { key: "includeGoalRecords", label: "Goal Records" },
          ].map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple/30 hover:shadow-md transition-all duration-200 cursor-pointer`}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={
                    isFieldAlwaysEnabled(key)
                      ? true
                      : (fieldSelection[
                          key as keyof OutcomeGoalsReportFieldSelection
                        ] as boolean)
                  }
                  disabled={isFieldAlwaysEnabled(key)}
                  onChange={(e) =>
                    setFieldSelection((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                  className="sr-only"
                />
                <div
                  className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                    (
                      isFieldAlwaysEnabled(key)
                        ? true
                        : (fieldSelection[
                            key as keyof OutcomeGoalsReportFieldSelection
                          ] as boolean)
                    )
                      ? "bg-purple border-purple"
                      : "border-gray-300 hover:border-purple"
                  }`}
                >
                  {(isFieldAlwaysEnabled(key)
                    ? true
                    : (fieldSelection[
                        key as keyof OutcomeGoalsReportFieldSelection
                      ] as boolean)) && (
                    <Icon icon="mdi:check" className="text-white w-4 h-4" />
                  )}
                </div>
              </div>
              <span className="ml-4 text-base font-normal text-gray-700">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Goal Summary Fields */}
      {fieldSelection.includeGoalSummary && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Icon
              icon="mdi:chart-line"
              className="text-green-600 w-6 h-6 mr-3"
            />
            Goal Summary Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "summaryTotalGoals",
                label: "Summary: Total goals",
              },
              {
                key: "summaryGoalsBySection",
                label: "Summary: Goals by section",
              },
              {
                key: "summaryCompletionRates",
                label: "Summary: Completion rates",
              },
              {
                key: "summaryDueDateStatistics",
                label: "Summary: Due date statistics",
              },
              {
                key: "summaryOverdueGoals",
                label: "Summary: Overdue goals",
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
                        key as keyof OutcomeGoalsReportFieldSelection
                      ] as boolean
                    }
                    onChange={(e) =>
                      setFieldSelection((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof OutcomeGoalsReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof OutcomeGoalsReportFieldSelection
                    ] as boolean) && (
                      <Icon icon="mdi:check" className="text-white w-4 h-4" />
                    )}
                  </div>
                </div>
                <span className="ml-4 text-base font-normal text-gray-700">
                  {label}
                  {isFieldAlwaysEnabled(key) && (
                    <span className="text-xs text-gray-400 ml-1">
                      (Always enabled)
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Goal Record Fields */}
      {fieldSelection.includeGoalRecords && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-8 flex items-center">
            <Icon
              icon="mdi:format-list-bulleted"
              className="text-purple w-6 h-6 mr-3"
            />
            Goal Record Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "goalName", label: "Goal: Name" },
              { key: "goalSection", label: "Goal: Section" },
              { key: "goalStatus", label: "Goal: Status" },
              { key: "goalDueDate", label: "Goal: Due date" },
              { key: "goalSteps", label: "Goal: Steps" },
              { key: "goalCreatedDate", label: "Goal: Created date" },
              { key: "goalCompletionDate", label: "Goal: Completion date" },
              { key: "outcomeTitle", label: "Outcome: Title" },
              { key: "outcomeStatus", label: "Outcome: Status" },
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
                        key as keyof OutcomeGoalsReportFieldSelection
                      ] as boolean
                    }
                    onChange={(e) =>
                      setFieldSelection((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof OutcomeGoalsReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof OutcomeGoalsReportFieldSelection
                    ] as boolean) && (
                      <Icon icon="mdi:check" className="text-white w-4 h-4" />
                    )}
                  </div>
                </div>
                <span className="ml-4 text-base font-normal text-gray-700">
                  {label}
                  {isFieldAlwaysEnabled(key) && (
                    <span className="text-xs text-gray-400 ml-1">
                      (Always enabled)
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Outcome Goals Report"
      widthClass="max-w-3xl"
      noPadding={true}
      footer={
        <div className="flex justify-between w-full">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                label="Back"
                onClick={() => setCurrentStep(currentStep - 1)}
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
                onClick={() => setCurrentStep(currentStep + 1)}
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
      <style>{datePickerStyles}</style>
      <div className="flex flex-col h-full">
        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          steps={[
            { number: 1, label: "Filters" },
            { number: 2, label: "Fields" },
          ]}
        />

        {/* Scrollable Content */}
        <div className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto hide-scrollbar px-4 p-6 relative">
          {currentStep === 1 && renderFiltersStep()}
          {currentStep === 2 && renderFieldSelectionStep()}
        </div>
      </div>
    </ModalWrapper>
  );
};

export default EnhancedOutcomeGoalsReportModal;
