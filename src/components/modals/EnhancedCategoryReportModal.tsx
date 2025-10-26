import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import ProgressIndicator from "@/components/ui/ProgressIndicator";
import { getUsersWithoutPagination } from "@/services/UserApi";
import type { UserData } from "@/types/user";
import type {
  CategoryReportFilters,
  CategoryReportFieldSelection,
} from "@/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { toZonedTime } from "date-fns-tz";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { validateIntegerInput } from "@/utils/commonFunc";
import { getCategorySections } from "@/services/CategorySectionApi";
import { getUnits } from "@/services/UnitApi";
import { toast } from "react-toastify";

interface EnhancedCategoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedCategoryReportModal: React.FC<
  EnhancedCategoryReportModalProps
> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Filters state
  const [filters, setFilters] = useState<CategoryReportFilters>({});

  // Field selection state
  const [fieldSelection, setFieldSelection] =
    useState<CategoryReportFieldSelection>({
      orderBy: "createdAt",
      orderDirection: "desc", // Default to Newest to Oldest
      includeReportFilters: true,
      includeCategorySummary: true,
      includeCategoryRecords: true, // Always selected
      // Summary fields - default to true and always enabled
      summaryTotalCategories: true,
      summaryCategoriesBySection: true,
      summaryUsageStatistics: true,
      // Category fields - default to true and always enabled
      categoryName: true, // Always selected
      categorySection: true, // Always selected
      categoryDescription: true,
      categoryDefaultAmount: true,
      categoryDefaultUnit: true,
      categoryCreatedBy: true, // Always selected
      categoryCreatedDate: true,
      categoryUsageCount: true,
      categoryTotalAmount: true,
      categoryVisibility: true,
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
    { value: "name", label: "Name (A-Z)", direction: "asc" },
    { value: "name", label: "Name (Z-A)", direction: "desc" },
    { value: "defaultAmount", label: "Amount (Low to High)", direction: "asc" },
    {
      value: "defaultAmount",
      label: "Amount (High to Low)",
      direction: "desc",
    },
    { value: "usageCount", label: "Usage (Low to High)", direction: "asc" },
    { value: "usageCount", label: "Usage (High to Low)", direction: "desc" },
  ];

  const initialExpands = {
    dateRange: false,
    lastUpdatedRange: false,
    category: false,
    agent: false,
    usage: false,
  };
  // Filter expansion states
  const [expandedFilters, setExpandedFilters] = useState(initialExpands);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [units, setUnits] = useState<{ _id: string; name: string }[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  useEffect(() => {
    if (isOpen && userData?.userId) {
      (async () => {
        setSectionsLoading(true);
        setUnitsLoading(true);
        try {
          const locationId = userData.activeLocation || "";
          const [sectionsResult, unitsResult] = await Promise.all([
            getCategorySections(userData.userId, locationId).catch(() => []),
            getUnits(userData.userId, locationId).catch(() => []),
          ]);
          setSections(sectionsResult);
          setUnits(unitsResult);
        } catch (err: any) {
          console.error("🚀 ~ err:", err);
          toast.error(err || "Failed to fetch units or sections");
          setSections([]);
          setUnits([]);
        } finally {
          setSectionsLoading(false);
          setUnitsLoading(false);
        }
      })();
    }
  }, [isOpen, userData?.userId]);

  useEffect(() => {
    setExpandedFilters(initialExpands);
  }, [isOpen]);

  // Reset modal state when reopening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFilters({});
      setFieldSelection({
        orderBy: "createdAt",
        orderDirection: "desc",
        includeReportFilters: true,
        includeCategorySummary: true,
        includeCategoryRecords: true,
        summaryTotalCategories: true,
        summaryCategoriesBySection: true,
        summaryUsageStatistics: true,
        categoryName: true,
        categorySection: true,
        categoryDescription: true,
        categoryDefaultAmount: true,
        categoryDefaultUnit: true,
        categoryCreatedBy: true, // Always selected
        categoryCreatedDate: true,
        categoryUsageCount: true,
        categoryTotalAmount: true,
        categoryVisibility: true,
      });

      // Reset expanded filters
      setExpandedFilters(initialExpands);
    }
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
    key: keyof CategoryReportFilters,
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
    field: keyof CategoryReportFieldSelection
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
      "categoryName",
      "categorySection",
      "categoryCreatedBy",
      "includeCategoryRecords",
      "summaryTotalCategories",
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
    if (filters.lastUpdatedRange?.startDate) {
      params.append("lastUpdatedStartDate", filters.lastUpdatedRange.startDate);
    }
    if (filters.lastUpdatedRange?.endDate) {
      params.append("lastUpdatedEndDate", filters.lastUpdatedRange.endDate);
    }
    if (filters.sectionId) {
      params.append("sectionId", filters.sectionId);
    }
    if (filters.unitId) {
      params.append("unitId", filters.unitId);
    }
    if (filters.amountRange?.minAmount) {
      params.append("minAmount", String(filters.amountRange.minAmount));
    }
    if (filters.amountRange?.maxAmount) {
      params.append("maxAmount", String(filters.amountRange.maxAmount));
    }
    if (filters.visibility) {
      params.append("visibility", filters.visibility);
    }
    if (filters.createdBy) {
      params.append("createdBy", filters.createdBy);
    }
    if (filters.usageCount?.minCount) {
      params.append("minUsageCount", String(filters.usageCount.minCount));
    }
    if (filters.usageCount?.maxCount) {
      params.append("maxUsageCount", String(filters.usageCount.maxCount));
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
    navigate(`/myAgency/categories/report?${params.toString()}`);
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
        "Filter by category creation date range",
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

      {/* Category Filters */}
      {renderFilterBar(
        "category",
        "Category Filters",
        "Filter by section, unit, amount, and visibility",
        <div className="space-y-4">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Section
            </label>

            <select
              name="unit"
              value={filters.unitId || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  unitId: e.target.value || undefined,
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              disabled={unitsLoading}
            >
              <option value="">All Units</option>
              {units.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Section
            </label>

            <select
              name="section"
              value={filters.sectionId || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sectionId: e.target.value || undefined,
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              disabled={sectionsLoading}
            >
              <option value="">All Sections</option>
              {sections.map((opt) => (
                <option key={opt._id} value={opt._id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Visibility
            </label>
            <select
              value={filters.visibility || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  visibility: e.target.value || undefined,
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            >
              <option value="">All Visibility</option>
              <option value="All Agencies">All Agencies</option>
              <option value="Agency Only">My Agency</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Default Amount Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Min Amount"
                min={0}
                max={1000000}
                value={filters.amountRange?.minAmount || ""}
                onChange={(e) => {
                  const value = validateIntegerInput(e.target.value);
                  updateFilter(
                    "amountRange",
                    "minAmount",
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
                placeholder="Max Amount"
                min={filters.amountRange?.minAmount || 0}
                max={1000000}
                maxLength={10}
                value={filters.amountRange?.maxAmount || ""}
                onChange={(e) => {
                  const value = validateIntegerInput(e.target.value);
                  updateFilter(
                    "amountRange",
                    "maxAmount",
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
        </div>,
        "mdi:tag"
      )}

      {/* Agent/Staff Filters */}
      {renderFilterBar(
        "agent",
        "Agent/Staff Filters",
        "Filter by specific agents who created categories",
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

      {/* Usage Filters */}
      {renderFilterBar(
        "usage",
        "Usage Filters",
        "Filter by number of times category was used",
        <div>
          <label className="block text-base font-normal text-gray-700 mb-3">
            Usage Count Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Min Usage Count"
              value={filters.usageCount?.minCount || ""}
              onChange={(e) => {
                const value = validateIntegerInput(e.target.value);
                updateFilter(
                  "usageCount",
                  "minCount",
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
              placeholder="Max Usage Count"
              value={filters.usageCount?.maxCount || ""}
              onChange={(e) => {
                const value = validateIntegerInput(e.target.value);
                updateFilter(
                  "usageCount",
                  "maxCount",
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
        </div>,
        "mdi:chart-line"
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
          Order Categories By
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
                checked={fieldSelection.includeReportFilters}
                onChange={() =>
                  handleFieldSelectionChange("includeReportFilters")
                }
                className="sr-only"
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeReportFilters
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeReportFilters && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
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
                checked={fieldSelection.includeCategorySummary}
                onChange={() =>
                  handleFieldSelectionChange("includeCategorySummary")
                }
                className="sr-only"
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeCategorySummary
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeCategorySummary && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Category Summary
            </span>
          </label>
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
              Category Records
            </span>
          </label>
        </div>
      </div>

      {/* Category Summary Fields */}
      {fieldSelection.includeCategorySummary && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Icon icon="mdi:chart-box" className="text-purple w-6 h-6 mr-3" />
            Category Summary Report Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "summaryTotalCategories", label: "Total Categories" },
              {
                key: "summaryCategoriesBySection",
                label: "Categories by Section",
              },
              {
                key: "summaryUsageStatistics",
                label: "Usage Statistics",
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
                        key as keyof CategoryReportFieldSelection
                      ] as boolean
                    }
                    onChange={() =>
                      handleFieldSelectionChange(
                        key as keyof CategoryReportFieldSelection
                      )
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof CategoryReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof CategoryReportFieldSelection
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

      {/* Category Record Fields */}
      {fieldSelection.includeCategoryRecords && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-8 flex items-center">
            <Icon
              icon="mdi:format-list-bulleted"
              className="text-purple w-6 h-6 mr-3"
            />
            Category Record Report Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "categoryName", label: "Category Name" },
              { key: "categorySection", label: "Category Section" },
              { key: "categoryDescription", label: "Description" },
              { key: "categoryDefaultAmount", label: "Default Amount" },
              { key: "categoryDefaultUnit", label: "Default Unit" },
              { key: "categoryCreatedBy", label: "Created By" },
              { key: "categoryCreatedDate", label: "Created Date" },
              { key: "categoryUsageCount", label: "Usage Count" },
              { key: "categoryTotalAmount", label: "Total Amount" },
              { key: "categoryVisibility", label: "Visibility" },
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
                        key as keyof CategoryReportFieldSelection
                      ] as boolean
                    }
                    onChange={() =>
                      handleFieldSelectionChange(
                        key as keyof CategoryReportFieldSelection
                      )
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof CategoryReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof CategoryReportFieldSelection
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
      title="Category Report"
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

export default EnhancedCategoryReportModal;
