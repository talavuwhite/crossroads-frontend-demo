import React, { useState, useEffect } from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";
import { fetchCategories, groupCategoriesBySection } from "@/utils/commonFunc";
import type { SimplifiedCategory } from "@/types";
import type {
  AssistanceReportFilters,
  AssistanceReportFieldSelection,
} from "@/types";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { userGender } from "@/utils/constants";
import type { UserData } from "@/types/user";
import { getUsersWithoutPagination } from "@/services/UserApi";
import { toast } from "react-toastify";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toZonedTime } from "date-fns-tz";
import ProgressIndicator from "@/components/ui/ProgressIndicator";

interface EnhancedAssistanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedAssistanceReportModal: React.FC<
  EnhancedAssistanceReportModalProps
> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Filters state
  const [filters, setFilters] = useState<AssistanceReportFilters>({});

  // Field selection state
  const [fieldSelection, setFieldSelection] =
    useState<AssistanceReportFieldSelection>({
      orderBy: "createdAt",
      orderDirection: "asc", // Default to Oldest to Newest
      includeAssistanceSummary: true,
      includeAssistanceRecord: true,
      // Summary fields - default to true and always enabled
      summaryAssistanceAmount: true,
      summaryAssistanceCount: true,
      summaryCaseCount: true,
      summaryHouseholdCount: true,
      summaryAgeRanges: true,
      summaryHouseholdAgeRanges: true,
      // Case fields - default to true and always enabled
      caseNumber: true,
      caseFullName: true, // Always enabled
      caseCounty: true,
      caseStreetAddress: true,
      caseDateOfBirth: true,
      casePhoneNumbers: true,
      caseEntryDate: true,
      casePersonalIncome: true,
      // Assistance fields - default to true and always enabled, except assistanceOtherFields
      assistanceDate: true,
      assistanceAgentName: true,
      assistanceAgencyName: true,
      assistanceCategory: true,
      assistanceAmount: true,
      assistanceUnit: true,
      assistanceDescription: true,
      assistanceOtherFields: false, // Only this one can be changed
    });

  // Data loading states
  const [categoryOptions, setCategoryOptions] = useState<SimplifiedCategory[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [agents, setAgents] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Expanded filters state
  const [expandedFilters, setExpandedFilters] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (!userData) return;
    fetchCategories(userData, setLoadingCategories, setCategoryOptions);
    setExpandedFilters({
      dateRange: false,
      amountRange: false,
      demographics: false,
      location: false,
      createdBy: false,
    });
  }, [userData?.userId, userData?.activeLocation, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFilters({});
      setFieldSelection({
        orderBy: "createdAt",
        orderDirection: "asc", // Default to Oldest to Newest
        includeAssistanceSummary: true,
        includeAssistanceRecord: true,
        // Summary fields - default to true and always enabled
        summaryAssistanceAmount: true,
        summaryAssistanceCount: true,
        summaryCaseCount: true,
        summaryHouseholdCount: true,
        summaryAgeRanges: true,
        summaryHouseholdAgeRanges: true,
        // Case fields - default to true and always enabled
        caseNumber: true,
        caseFullName: true, // Always enabled
        caseCounty: true,
        caseStreetAddress: true,
        caseDateOfBirth: true,
        casePhoneNumbers: true,
        caseEntryDate: true,
        casePersonalIncome: true,
        // Assistance fields - default to true and always enabled, except assistanceOtherFields
        assistanceDate: true,
        assistanceAgentName: true,
        assistanceAgencyName: true,
        assistanceCategory: true,
        assistanceAmount: true,
        assistanceUnit: true,
        assistanceDescription: true,
        assistanceOtherFields: false, // Only this one can be changed
      });
    }
  }, [isOpen]);

  // Helper function to check if a field is always enabled (readonly)
  const isFieldAlwaysEnabled = (fieldKey: string): boolean => {
    const alwaysEnabledFields = [
      "caseFullName",
      "assistanceDate",
      "assistanceAgentName",
      "assistanceAgencyName",
      "assistanceCategory",
      "assistanceAmount",
      "assistanceUnit",
      "assistanceDescription",
    ];
    return alwaysEnabledFields.includes(fieldKey);
  };

  // Helper function to parse date strings and convert to zoned time
  const parseDateString = (
    dateString: string | null | undefined
  ): Date | null => {
    if (!dateString) return null;

    try {
      // Handle various date string formats
      let date: Date;
      if (dateString.includes("T")) {
        // ISO format - parse as local date
        const [datePart] = dateString.split("T");
        const [year, month, day] = datePart.split("-");
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateString.includes("-")) {
        // YYYY-MM-DD format
        const [year, month, day] = dateString.split("-");
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (dateString.includes("/")) {
        // MM/DD/YYYY format
        const [month, day, year] = dateString.split("/");
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Default to current date
        date = new Date();
      }

      return date;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Helper function to validate numeric input
  const validateNumericInput = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    return value.replace(/[^0-9.]/g, "");
  };

  // Helper function to validate integer input
  const validateIntegerInput = (value: string): string => {
    // Remove all non-numeric characters
    return value.replace(/[^0-9]/g, "");
  };

  const handleFieldSelectionChange = (key: string, value: boolean) => {
    // Only allow changes for fields that are not always enabled
    if (isFieldAlwaysEnabled(key)) {
      return; // Don't allow changes to always enabled fields
    }

    setFieldSelection((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFilterChange = (
    key: keyof AssistanceReportFilters,
    value: any,
    subKey?: string
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (subKey) {
        if (!newFilters[key]) newFilters[key] = {} as any;
        (newFilters[key] as any)[subKey] = value;
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
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

  const handleViewReport = () => {
    // Navigate to report page with filters and field selection as query params
    const queryParams = new URLSearchParams();

    // Add filters
    if (filters.dateRange?.startDate) {
      queryParams.append("startDate", filters.dateRange.startDate);
    }
    if (filters.dateRange?.endDate) {
      queryParams.append("endDate", filters.dateRange.endDate);
    }
    if (filters.amountRange?.minAmount !== undefined) {
      queryParams.append("minAmount", String(filters.amountRange.minAmount));
    }
    if (filters.amountRange?.maxAmount !== undefined) {
      queryParams.append("maxAmount", String(filters.amountRange.maxAmount));
    }
    if (filters.demographics?.minAge !== undefined) {
      queryParams.append("minAge", String(filters.demographics.minAge));
    }
    if (filters.demographics?.maxAge !== undefined) {
      queryParams.append("maxAge", String(filters.demographics.maxAge));
    }
    if (filters.demographics?.gender) {
      queryParams.append("gender", filters.demographics.gender);
    }
    if (filters.location?.zipCode) {
      queryParams.append("zipCode", filters.location.zipCode);
    }
    if (filters.createdBy) {
      queryParams.append("createdBy", filters.createdBy);
    }
    if (filters.categoryId) {
      queryParams.append("categoryId", filters.categoryId);
    }

    // Add field selection
    Object.entries(fieldSelection).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    onClose();
    navigate(`/myAgency/assistance/report?${queryParams.toString()}`);
  };

  const fetchAgents = async () => {
    if (!userData?.userId) {
      toast.error("Please login with valid credentials");
      return;
    }
    setIsLoading(true);
    try {
      const response = await getUsersWithoutPagination(
        userData.userId,
        userData.activeLocation
      );
      setAgents(response.data || []);
    } catch (error: unknown) {
      if (typeof error === "object" && error && "data" in error) {
        toast.error(
          (error as { data?: { message?: string } })?.data?.message ||
            "Failed to fetch agents"
        );
      } else {
        toast.error("Failed to fetch agents");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

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

  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Date Range Filter */}
      {renderFilterBar(
        "dateRange",
        "Date Of Assistance",
        "Filter by assistance date range",
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
                  // Format date as YYYY-MM-DD without timezone conversion
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const dateString = `${year}-${month}-${day}`;
                  handleFilterChange("dateRange", dateString, "startDate");
                } else {
                  handleFilterChange("dateRange", "", "startDate");
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
                  // Format date as YYYY-MM-DD without timezone conversion
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const dateString = `${year}-${month}-${day}`;
                  handleFilterChange("dateRange", dateString, "endDate");
                } else {
                  handleFilterChange("dateRange", "", "endDate");
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

      {/* Amount Filter */}
      {renderFilterBar(
        "amount",
        "Amount Of Assistance",
        "Filter by assistance amount range",
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Minimum Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-medium">
                $
              </span>
              <input
                type="text"
                maxLength={8}
                placeholder="0.00"
                value={filters.amountRange?.minAmount || ""}
                onChange={(e) => {
                  const validatedValue = validateNumericInput(e.target.value);
                  handleFilterChange(
                    "amountRange",
                    validatedValue ? parseFloat(validatedValue) : undefined,
                    "minAmount"
                  );
                }}
                onKeyPress={(e) => {
                  // Allow only numbers and decimal point
                  const char = String.fromCharCode(e.which);
                  if (!/[0-9.]/.test(char)) {
                    e.preventDefault();
                  }
                }}
                className="w-full pl-10 pr-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Maximum Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-base font-medium">
                $
              </span>
              <input
                type="text"
                maxLength={8}
                placeholder="0.00"
                value={filters.amountRange?.maxAmount || ""}
                onChange={(e) => {
                  const validatedValue = validateNumericInput(e.target.value);
                  handleFilterChange(
                    "amountRange",
                    validatedValue ? parseFloat(validatedValue) : undefined,
                    "maxAmount"
                  );
                }}
                onKeyPress={(e) => {
                  // Allow only numbers and decimal point
                  const char = String.fromCharCode(e.which);
                  if (!/[0-9.]/.test(char)) {
                    e.preventDefault();
                  }
                }}
                className="w-full pl-10 pr-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              />
            </div>
          </div>
        </div>,
        "mdi:currency-usd"
      )}

      {/* Age Filter */}
      {renderFilterBar(
        "age",
        "Age",
        "Filter by client age range",
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Minimum Age
            </label>
            <input
              type="text"
              placeholder="0"
              maxLength={3}
              value={filters.demographics?.minAge || ""}
              onChange={(e) => {
                const validatedValue = validateIntegerInput(e.target.value);
                handleFilterChange(
                  "demographics",
                  validatedValue ? parseInt(validatedValue) : undefined,
                  "minAge"
                );
              }}
              onKeyPress={(e) => {
                // Allow only numbers
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
              value={filters.demographics?.maxAge || ""}
              onChange={(e) => {
                const validatedValue = validateIntegerInput(e.target.value);
                handleFilterChange(
                  "demographics",
                  validatedValue ? parseInt(validatedValue) : undefined,
                  "maxAge"
                );
              }}
              onKeyPress={(e) => {
                // Allow only numbers
                const char = String.fromCharCode(e.which);
                if (!/[0-9]/.test(char)) {
                  e.preventDefault();
                }
              }}
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            />
          </div>
        </div>,
        "mdi:account-child"
      )}

      {/* Gender Filter */}
      {renderFilterBar(
        "gender",
        "Gender",
        "Filter by client gender",
        <div>
          <label className="block text-base font-normal text-gray-700 mb-3">
            Gender
          </label>
          <select
            value={filters.demographics?.gender || ""}
            onChange={(e) =>
              handleFilterChange(
                "demographics",
                e.target.value || undefined,
                "gender"
              )
            }
            className="w-full px-2 py-2  border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
          >
            <option value="">All Genders</option>
            {userGender.map((gender: string) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </div>,
        "mdi:gender-male-female"
      )}

      {/* Zip Code Filter */}
      {renderFilterBar(
        "zipCode",
        "Zip Code",
        "Filter by location zip code",
        <div>
          <label className="block text-base font-normal text-gray-700 mb-3">
            Zip Code
          </label>
          <input
            type="text"
            maxLength={5}
            placeholder="Enter zip code"
            value={filters.location?.zipCode || ""}
            onChange={(e) =>
              handleFilterChange(
                "location",
                e.target.value || undefined,
                "zipCode"
              )
            }
            onKeyPress={(e) => {
              // Allow only numbers
              const char = String.fromCharCode(e.which);
              if (!/[0-9]/.test(char)) {
                e.preventDefault();
              }
            }}
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
          />
        </div>,
        "mdi:map-marker"
      )}

      {/* Agent Filter */}
      {renderFilterBar(
        "agent",
        "Agent",
        "Filter by specific agents",
        <div>
          <label className="block text-base font-normal text-gray-700 mb-3">
            Created by specific agents
          </label>
          <select
            value={filters.createdBy || ""}
            onChange={(e) =>
              handleFilterChange("createdBy", e.target.value || undefined)
            }
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            disabled={isLoading}
          >
            <option value="">All Agents</option>
            {isLoading ? (
              <option disabled>Loading agents...</option>
            ) : (
              agents.map((agent: UserData) => (
                <option key={agent._id} value={agent.userId}>
                  {agent.firstName} {agent.lastName}
                </option>
              ))
            )}
          </select>
        </div>,
        "mdi:account-multiple"
      )}

      {/* Category Filter */}
      {renderFilterBar(
        "category",
        "Assistance Category",
        "Filter by assistance category",
        <div>
          <label className="block text-base font-normal text-gray-700 mb-3">
            Category
          </label>
          <select
            value={filters.categoryId || ""}
            onChange={(e) =>
              handleFilterChange("categoryId", e.target.value || undefined)
            }
            className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            disabled={loadingCategories}
          >
            <option value="">All Categories</option>
            {loadingCategories ? (
              <option disabled>Loading categories...</option>
            ) : (
              Object.entries(groupCategoriesBySection(categoryOptions)).map(
                ([section, cats]) => (
                  <optgroup key={section} label={section}>
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
        </div>,
        "mdi:tag-multiple"
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-10">
      {/* Order By */}
      <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <Icon icon="mdi:sort" className="text-purple w-6 h-6 mr-3" />
          Order Assistance By
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
            <option value="createdAt-asc">Oldest to Newest</option>
            <option value="createdAt-desc">Newest to Oldest</option>
            <option value="amount-asc">Amount (Low to High)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="category-asc">Category (A-Z)</option>
            <option value="category-desc">Category (Z-A)</option>
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
                checked={fieldSelection.includeAssistanceSummary}
                onChange={(e) =>
                  handleFieldSelectionChange(
                    "includeAssistanceSummary",
                    e.target.checked
                  )
                }
                className="sr-only"
                disabled
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeAssistanceSummary
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeAssistanceSummary && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Assistance Summary
            </span>
          </label>
          <label className="flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple/30 hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={fieldSelection.includeAssistanceRecord}
                onChange={(e) =>
                  handleFieldSelectionChange(
                    "includeAssistanceRecord",
                    e.target.checked
                  )
                }
                className="sr-only"
                disabled
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeAssistanceRecord
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeAssistanceRecord && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Assistance Record
            </span>
          </label>
        </div>
      </div>

      {/* Summary Fields */}
      {fieldSelection.includeAssistanceSummary && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Icon icon="mdi:chart-box" className="text-purple w-6 h-6 mr-3" />
            Assistance Summary Report Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "summaryAssistanceAmount",
                label: "Summary: Assistance amount",
              },
              {
                key: "summaryAssistanceCount",
                label: "Summary: Assistance count",
              },
              { key: "summaryCaseCount", label: "Summary: Case count" },
              {
                key: "summaryHouseholdCount",
                label: "Summary: Household count",
              },
              { key: "summaryAgeRanges", label: "Summary: Age ranges" },
              {
                key: "summaryHouseholdAgeRanges",
                label: "Summary: Household age ranges",
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
                        key as keyof AssistanceReportFieldSelection
                      ] as boolean
                    }
                    onChange={(e) =>
                      handleFieldSelectionChange(key, e.target.checked)
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof AssistanceReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof AssistanceReportFieldSelection
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
      {fieldSelection.includeAssistanceRecord && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-8 flex items-center">
            <Icon
              icon="mdi:format-list-bulleted"
              className="text-purple w-6 h-6 mr-3"
            />
            Assistance Record Report Fields
          </h4>

          {/* Case Fields */}
          <div className="mb-8">
            <h5 className="text-lg font-bold text-gray-700 mb-6 flex items-center">
              <Icon icon="mdi:account" className="text-purple w-5 h-5 mr-3" />
              Case Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "caseNumber", label: "Case: Number" },
                { key: "caseFullName", label: "Case: Full name" },
                { key: "caseCounty", label: "Case: County" },
                { key: "caseStreetAddress", label: "Case: Street address" },
                { key: "caseDateOfBirth", label: "Case: Date of birth" },
                { key: "casePhoneNumbers", label: "Case: Phone numbers" },
                { key: "caseEntryDate", label: "Case: Entry date" },
                { key: "casePersonalIncome", label: "Case: Personal income" },
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
                          key as keyof AssistanceReportFieldSelection
                        ] as boolean
                      }
                      onChange={(e) =>
                        handleFieldSelectionChange(key, e.target.checked)
                      }
                      disabled={isFieldAlwaysEnabled(key)}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                        (fieldSelection[
                          key as keyof AssistanceReportFieldSelection
                        ] as boolean)
                          ? "bg-purple border-purple"
                          : "border-gray-300 hover:border-purple"
                      } `}
                    >
                      {(fieldSelection[
                        key as keyof AssistanceReportFieldSelection
                      ] as boolean) && (
                        <Icon icon="mdi:check" className="text-white w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <span className={`ml-4 text-base font-normal text-gray-700 `}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Assistance Fields */}
          <div>
            <h5 className="text-lg font-bold text-gray-700 mb-6 flex items-center">
              <Icon
                icon="mdi:hand-heart"
                className="text-purple w-5 h-5 mr-3"
              />
              Assistance Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "assistanceDate", label: "Assistance: Date" },
                { key: "assistanceAgentName", label: "Assistance: Agent name" },
                {
                  key: "assistanceAgencyName",
                  label: "Assistance: Agency name",
                },
                { key: "assistanceCategory", label: "Assistance: Category" },
                { key: "assistanceAmount", label: "Assistance: Amount" },
                { key: "assistanceUnit", label: "Assistance: Unit" },
                {
                  key: "assistanceDescription",
                  label: "Assistance: Description",
                },
                {
                  key: "assistanceOtherFields",
                  label: "Assistance: Other Fields",
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
                          key as keyof AssistanceReportFieldSelection
                        ] as boolean
                      }
                      onChange={(e) =>
                        handleFieldSelectionChange(key, e.target.checked)
                      }
                      disabled={isFieldAlwaysEnabled(key)}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                        (fieldSelection[
                          key as keyof AssistanceReportFieldSelection
                        ] as boolean)
                          ? "bg-purple border-purple"
                          : "border-gray-300 hover:border-purple"
                      } `}
                    >
                      {(fieldSelection[
                        key as keyof AssistanceReportFieldSelection
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
        </div>
      )}
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Assistance Report"
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
                onClick={handleViewReport}
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

export default EnhancedAssistanceReportModal;
