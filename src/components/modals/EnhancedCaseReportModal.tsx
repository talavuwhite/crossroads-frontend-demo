import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import ProgressIndicator from "@/components/ui/ProgressIndicator";
import { getUsersWithoutPagination } from "@/services/UserApi";
import type { UserData } from "@/types/user";
import type { CaseReportFilters, CaseReportFieldSelection } from "@/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { countyOptions, userGender } from "@/utils/constants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { toZonedTime } from "date-fns-tz";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { validateIntegerInput } from "@/utils/commonFunc";

interface EnhancedCaseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedCaseReportModal: React.FC<EnhancedCaseReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Filters state
  const [filters, setFilters] = useState<CaseReportFilters>({});

  // Field selection state
  const [fieldSelection, setFieldSelection] =
    useState<CaseReportFieldSelection>({
      orderBy: "createdAt",
      orderDirection: "desc", // Default to Newest to Oldest
      includeReportFilters: true,
      includeCaseSummary: true,
      includeCaseRecords: true,
      // Summary fields - default to true and always enabled
      summaryTotalCases: true,
      summaryTotalAssistanceAmount: true,
      summaryTotalAssistanceCount: true,
      summaryAgeRanges: true,
      summaryGenderDistribution: true,
      summaryHouseholdSizes: true,
      // Case fields - default to true and always enabled
      caseNumber: true,
      caseEntryDate: true,
      caseEntryAgent: true,
      caseEntryAgency: true,
      caseFullName: true,
      caseMaidenName: true,
      caseNickname: true,
      caseDateOfBirth: true,
      caseAge: true,
      caseSSNumber: true,
      caseStreetAddress: true,
      caseCounty: true,
      caseMailingAddress: true,
      casePersonalIncome: true,
      caseHouseholdIncome: true,
      casePersonalExpenses: true,
      caseHouseholdExpenses: true,
      casePhoneNumbers: true,
      caseEmail: true,
      caseIdentificationNumbers: true,
      caseDemographics: true,
      caseAssistanceCount: true,
      caseAssistanceAmount: true,
      caseLastAssistanceDate: true,
      caseHouseholdSize: true,
      caseOtherInfo: false, // Initially deselected
    });

  // Data loading states
  const [agents, setAgents] = useState<UserData[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const sortOptions = [
    { value: "createdAt", label: "Newest to Oldest", direction: "desc" },
    { value: "createdAt", label: "Oldest to Newest", direction: "asc" },
    {
      value: "updatedAt",
      label: "Last Updated (Newest First)",
      direction: "desc",
    },
    {
      value: "updatedAt",
      label: "Last Updated (Oldest First)",
      direction: "asc",
    },
    { value: "firstName", label: "First Name (A-Z)", direction: "asc" },
    { value: "firstName", label: "First Name (Z-A)", direction: "desc" },
    { value: "lastName", label: "Last Name (A-Z)", direction: "asc" },
    { value: "lastName", label: "Last Name (Z-A)", direction: "desc" },
  ];

  const initialExpands = {
    dateRange: false,
    demographics: false,
    location: false,
    agent: false,
  };
  // Filter expansion states
  const [expandedFilters, setExpandedFilters] = useState(initialExpands);

  useEffect(() => {
    setExpandedFilters(initialExpands);
  }, [isOpen]);

  // Load agents data
  useEffect(() => {
    const loadAgents = async () => {
      if (!userData) return;

      try {
        setLoadingAgents(true);
        const response = await getUsersWithoutPagination(
          userData.userId,
          userData.activeLocation
        );
        setAgents(response.data || []);
      } catch (error) {
        console.error("Error loading agents:", error);
      } finally {
        setLoadingAgents(false);
      }
    };

    loadAgents();
  }, [userData]);

  // Update filter function
  const updateFilter = (
    key: keyof CaseReportFilters,
    subKey: string,
    value: any
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (!newFilters[key]) {
        (newFilters[key] as any) = {};
      }
      (newFilters[key] as any)[subKey] = value;
      return newFilters;
    });
  };

  // Toggle filter expansion
  const toggleFilterExpansion = (filterKey: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  // Handle field selection change
  const handleFieldSelectionChange = (
    field: keyof CaseReportFieldSelection
  ) => {
    // Only allow changes for fields that are not always enabled
    if (isFieldAlwaysEnabled(field)) {
      return; // Don't allow changes to always enabled fields
    }

    setFieldSelection((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Helper function to check if a field is always enabled (readonly)
  const isFieldAlwaysEnabled = (fieldKey: string): boolean => {
    const alwaysEnabledFields = [
      "caseFullName",
      "caseEmail",
      "caseNumber",
      "summaryTotalCases",
    ];
    return alwaysEnabledFields.includes(fieldKey);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!userData) return;

    // Build query parameters
    const params = new URLSearchParams();

    // Add filters
    if (filters.dateRange?.startDate) {
      params.append("startDate", filters.dateRange.startDate);
    }
    if (filters.dateRange?.endDate) {
      params.append("endDate", filters.dateRange.endDate);
    }
    if (filters.demographics?.minAge) {
      params.append("minAge", String(filters.demographics.minAge));
    }
    if (filters.demographics?.maxAge) {
      params.append("maxAge", String(filters.demographics.maxAge));
    }
    if (filters.demographics?.gender) {
      params.append("gender", filters.demographics.gender);
    }
    if (filters.demographics?.maritalStatus) {
      params.append("maritalStatus", filters.demographics.maritalStatus);
    }
    if (filters.location?.county) {
      params.append("county", filters.location.county);
    }
    if (filters.location?.zipCode) {
      params.append("zipCode", filters.location.zipCode);
    }
    if (filters.location?.city) {
      params.append("city", filters.location.city);
    }
    if (filters.location?.state) {
      params.append("state", filters.location.state);
    }
    if (filters.createdBy) {
      params.append("createdBy", filters.createdBy);
    }

    // Add ordering parameters explicitly
    if (fieldSelection.orderBy) {
      params.append("orderBy", fieldSelection.orderBy);
    }
    if (fieldSelection.orderDirection) {
      params.append("orderDirection", fieldSelection.orderDirection);
    }

    // Add field selection (excluding orderBy and orderDirection as they're handled above)
    Object.entries(fieldSelection).forEach(([key, value]) => {
      if (
        key !== "orderBy" &&
        key !== "orderDirection" &&
        value !== undefined
      ) {
        params.append(key, String(value));
      }
    });

    // Navigate to report page
    navigate(`/myAgency/cases/report?${params.toString()}`);
    onClose();
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
        onClick={() =>
          toggleFilterExpansion(filterKey as keyof typeof expandedFilters)
        }
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
                expandedFilters[filterKey as keyof typeof expandedFilters]
                  ? "mdi:chevron-up"
                  : "mdi:chevron-down"
              }
              className="text-purple w-6 h-6 transition-all duration-300"
            />
          </div>
        </div>
      </div>
      {expandedFilters[filterKey as keyof typeof expandedFilters] && (
        <div className="bg-white border border-purple/20 rounded-2xl p-6 mt-4 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );

  // Render Step 1: Filters
  const renderFiltersStep = () => (
    <div className="space-y-8">
      {/* Date Range Filters */}
      {renderFilterBar(
        "dateRange",
        "Date Range Filters",
        "Filter by case entry date range",
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Start Date
            </label>
            <DatePicker
              selected={
                filters.dateRange?.startDate
                  ? toZonedTime(
                      new Date(filters.dateRange.startDate),
                      userTimeZone
                    )
                  : null
              }
              onChange={(date) => {
                if (date) {
                  // Convert to user's timezone and format as YYYY-MM-DD
                  const userDate = new Date(
                    date.toLocaleString("en-US", { timeZone: userTimeZone })
                  );
                  const formattedDate = userDate.toISOString().split("T")[0];
                  updateFilter("dateRange", "startDate", formattedDate);
                } else {
                  updateFilter("dateRange", "startDate", undefined);
                }
              }}
              dateFormat="MM/dd/yyyy"
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              wrapperClassName="w-full"
              placeholderText="Select start date"
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
                  ? toZonedTime(
                      new Date(filters.dateRange.endDate),
                      userTimeZone
                    )
                  : null
              }
              onChange={(date) => {
                if (date) {
                  // Convert to user's timezone and format as YYYY-MM-DD
                  const userDate = new Date(
                    date.toLocaleString("en-US", { timeZone: userTimeZone })
                  );
                  const formattedDate = userDate.toISOString().split("T")[0];
                  updateFilter("dateRange", "endDate", formattedDate);
                } else {
                  updateFilter("dateRange", "endDate", undefined);
                }
              }}
              dateFormat="MM/dd/yyyy"
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              wrapperClassName="w-full"
              placeholderText="Select end date"
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
        "mdi:calendar"
      )}

      {/* Demographic Filters */}
      {renderFilterBar(
        "demographics",
        "Demographic Filters",
        "Filter by age, gender, and marital status",
        <div className="space-y-4">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Age Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Min Age"
                maxLength={3}
                value={filters.demographics?.minAge || ""}
                onChange={(e) => {
                  const value = validateIntegerInput(e.target.value);
                  updateFilter(
                    "demographics",
                    "minAge",
                    value ? parseInt(value) : undefined
                  );
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              />
              <input
                type="text"
                placeholder="Max Age"
                maxLength={3}
                value={filters.demographics?.maxAge || ""}
                onChange={(e) => {
                  const value = validateIntegerInput(e.target.value);
                  updateFilter(
                    "demographics",
                    "maxAge",
                    value ? parseInt(value) : undefined
                  );
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Gender
            </label>
            <select
              value={filters.demographics?.gender || ""}
              onChange={(e) =>
                updateFilter(
                  "demographics",
                  "gender",
                  e.target.value || undefined
                )
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            >
              <option value="">All Genders</option>
              {userGender.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Marital Status
            </label>
            <input
              value={filters.demographics?.maritalStatus || ""}
              maxLength={20}
              onChange={(e) =>
                updateFilter(
                  "demographics",
                  "maritalStatus",
                  e.target.value || undefined
                )
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            />
          </div>
        </div>,
        "mdi:account-group"
      )}

      {/* Geographic Filters */}
      {renderFilterBar(
        "location",
        "Geographic Filters",
        "Filter by location information",
        <div className="space-y-4">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              County
            </label>
            <select
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              value={filters.location?.county || ""}
              onChange={(e) =>
                updateFilter("location", "county", e.target.value || undefined)
              }
            >
              <option value="">All Counties</option>
              {countyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Zip Code
            </label>
            <input
              type="text"
              placeholder="Enter zip code"
              value={filters.location?.zipCode || ""}
              maxLength={5}
              onChange={(e) =>
                updateFilter("location", "zipCode", e.target.value || undefined)
              }
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            />
          </div>

          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              City
            </label>
            <input
              type="text"
              placeholder="Enter city"
              value={filters.location?.city || ""}
              maxLength={20}
              onChange={(e) =>
                updateFilter("location", "city", e.target.value || undefined)
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            />
          </div>

          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              State
            </label>
            <input
              type="text"
              placeholder="Enter state"
              value={filters.location?.state || ""}
              maxLength={20}
              onChange={(e) =>
                updateFilter("location", "state", e.target.value || undefined)
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            />
          </div>
        </div>,
        "mdi:map-marker"
      )}

      {/* Agent/Staff Filters */}
      {renderFilterBar(
        "agent",
        "Agent/Staff Filters",
        "Filter by specific agents who created cases",
        <div>
          <label className="block text-base font-normal text-gray-700 mb-3">
            Created By
          </label>
          <select
            value={filters.createdBy || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                createdBy: e.target.value || undefined,
              }))
            }
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
          >
            <option value="">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.userId} value={agent.userId}>
                {agent.firstName} {agent.lastName}
              </option>
            ))}
            {loadingAgents && (
              <option value="" disabled>
                Loading agents...
              </option>
            )}
          </select>
        </div>,
        "mdi:user"
      )}
    </div>
  );

  // Render Step 2: Field Selection
  const renderFieldSelectionStep = () => (
    <div className="space-y-10">
      {/* Order By */}
      <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <Icon icon="mdi:sort" className="text-purple w-6 h-6 mr-3" />
          Order Cases By
        </h4>
        <div>
          <select
            value={`${fieldSelection.orderBy}-${fieldSelection.orderDirection}`}
            onChange={(e) => {
              const [orderBy, orderDirection] = e.target.value.split("-");
              setFieldSelection((prev) => ({
                ...prev,
                orderBy: orderBy as string,
                orderDirection: orderDirection as "asc" | "desc",
              }));
            }}
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
          >
            {sortOptions.map((option) => (
              <option
                key={`${option.value}-${option.direction}`}
                value={`${option.value}-${option.direction}`}
              >
                {option.label}
              </option>
            ))}
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
                checked={true}
                disabled
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
                checked={fieldSelection.includeCaseSummary}
                onChange={() =>
                  handleFieldSelectionChange("includeCaseSummary")
                }
                className="sr-only"
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeCaseSummary
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeCaseSummary && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Case Summary
            </span>
          </label>
          <label className="flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple/30 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={fieldSelection.includeCaseRecords}
                disabled
                className="sr-only"
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeCaseRecords
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeCaseRecords && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Case Records
            </span>
          </label>
        </div>
      </div>

      {/* Case Summary Fields */}
      {fieldSelection.includeCaseSummary && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Icon icon="mdi:chart-box" className="text-purple w-6 h-6 mr-3" />
            Case Summary Report Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "summaryTotalCases", label: "Total Cases" },
              {
                key: "summaryTotalAssistanceAmount",
                label: "Total Assistance Amount",
              },
              {
                key: "summaryTotalAssistanceCount",
                label: "Total Assistance Count",
              },
              { key: "summaryAgeRanges", label: "Age Ranges" },
              {
                key: "summaryGenderDistribution",
                label: "Gender Distribution",
              },
              { key: "summaryHouseholdSizes", label: "Household Sizes" },
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
                        key as keyof CaseReportFieldSelection
                      ] as boolean
                    }
                    onChange={() =>
                      handleFieldSelectionChange(
                        key as keyof CaseReportFieldSelection
                      )
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof CaseReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof CaseReportFieldSelection
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

      {/* Case Record Fields */}
      {fieldSelection.includeCaseRecords && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-8 flex items-center">
            <Icon
              icon="mdi:format-list-bulleted"
              className="text-purple w-6 h-6 mr-3"
            />
            Case Record Report Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "caseNumber", label: "Case Number" },
              { key: "caseEntryDate", label: "Entry Date" },
              { key: "caseEntryAgent", label: "Entry Agent" },
              { key: "caseEntryAgency", label: "Entry Agency" },
              { key: "caseFullName", label: "Full Name" },
              { key: "caseMaidenName", label: "Maiden Name" },
              { key: "caseNickname", label: "Nickname" },
              { key: "caseDateOfBirth", label: "Date of Birth" },
              { key: "caseAge", label: "Age" },
              { key: "caseSSNumber", label: "SS Number" },
              { key: "caseStreetAddress", label: "Street Address" },
              { key: "caseCounty", label: "County" },
              { key: "caseMailingAddress", label: "Mailing Address" },
              { key: "casePersonalIncome", label: "Personal Income" },
              { key: "caseHouseholdIncome", label: "Household Income" },
              { key: "casePersonalExpenses", label: "Personal Expenses" },
              { key: "caseHouseholdExpenses", label: "Household Expenses" },
              { key: "casePhoneNumbers", label: "Phone Numbers" },
              { key: "caseEmail", label: "Email" },
              {
                key: "caseIdentificationNumbers",
                label: "Identification Numbers",
              },
              { key: "caseDemographics", label: "Demographics" },
              { key: "caseAssistanceCount", label: "Assistance Count" },
              { key: "caseAssistanceAmount", label: "Assistance Amount" },
              { key: "caseLastAssistanceDate", label: "Last Assistance Date" },
              { key: "caseHouseholdSize", label: "Household Size" },
              { key: "caseOtherInfo", label: "Other Fields" },
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
                        key as keyof CaseReportFieldSelection
                      ] as boolean
                    }
                    onChange={() =>
                      handleFieldSelectionChange(
                        key as keyof CaseReportFieldSelection
                      )
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof CaseReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof CaseReportFieldSelection
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

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Case Report"
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

export default EnhancedCaseReportModal;
