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
  ReferralReportFilters,
  ReferralReportFieldSelection,
  ServiceOption,
  Unit,
} from "@/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { toZonedTime } from "date-fns-tz";
import { STATIC_TEXTS } from "@/utils/textConstants";
import {
  fetchCategories,
  groupCategoriesBySection,
  groupServicesBySection,
  validateIntegerInput,
} from "@/utils/commonFunc";
import type { SimplifiedCategory } from "@/types";
import { getRequestStatuses } from "@/services/RequestStatusApi";
import type { RequestStatus } from "@/types";
import { toast } from "react-toastify";
import { getServices } from "@/services/ServiceApi";
import { getUnits } from "@/services/UnitApi";

interface EnhancedReferralReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedReferralReportModal: React.FC<
  EnhancedReferralReportModalProps
> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateOnly = (date: Date): string => {
    const zonedDate = toZonedTime(date, userTimeZone);
    return zonedDate.toISOString().split("T")[0];
  };

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Filters state
  const [filters, setFilters] = useState<ReferralReportFilters>({});

  // Field selection state
  const [fieldSelection, setFieldSelection] =
    useState<ReferralReportFieldSelection>({
      orderBy: "createdAt",
      orderDirection: "desc", // Default to Newest to Oldest
      includeReportFilters: true,
      includeReferralSummary: true,
      includeReferralRecords: true,
      // Summary fields - default to true and always enabled
      summaryTotalReferrals: true,
      summaryReferralsByStatus: true,
      summaryAmountStatistics: true,
      summaryServiceDistribution: true,
      summaryDeadlineStatistics: true,
      // Referral record fields - default to true and always enabled
      referralCase: true,
      referralAmount: true,
      referralUnit: true,
      referralService: true,
      referralCategory: true,
      referralDescription: true,
      referralStatus: true,
      referralStatusNotes: true,
      referralDeadline: true,
      referralCreatedBy: true,
      referralCreatedDate: true,
      referralStatusHistory: true,
      referralRequestedAssistance: true,
      referralOtherFields: true,
    });

  // Data loading states
  const [agents, setAgents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState({
    agents: false,
    statuses: false,
    services: false,
    units: false,
  });
  const [categoryOptions, setCategoryOptions] = useState<SimplifiedCategory[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus[]>([]);
  const [servicesOptions, setServicesOptions] = useState<ServiceOption[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  // Expanded filters state
  const [expandedFilters, setExpandedFilters] = useState<{
    [key: string]: boolean;
  }>({});

  // Sort options
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
    {
      value: "requestDeadline",
      label: "Deadline (Earliest First)",
      direction: "asc",
    },
    {
      value: "requestDeadline",
      label: "Deadline (Latest First)",
      direction: "desc",
    },
    { value: "amount", label: "Amount (Low to High)", direction: "asc" },
    { value: "amount", label: "Amount (High to Low)", direction: "desc" },
    { value: "status", label: "Status (A-Z)", direction: "asc" },
    { value: "status", label: "Status (Z-A)", direction: "desc" },
  ];

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
  const loadRequestStatuses = async () => {
    if (!userData) return;
    try {
      setLoading({ ...loading, statuses: true });
      const response = await getRequestStatuses(
        userData.userId,
        userData.activeLocation
      );
      setRequestStatuses(response);
    } catch (error) {
      console.error("Error loading request statuses:", error);
    } finally {
      setLoading({ ...loading, statuses: false });
    }
  };
  const fetchServices = async () => {
    try {
      if (!userData) return;
      const res = await getServices(
        1,
        100,
        userData?.userId,
        userData?.activeLocation,
        undefined,
        undefined,
        false
      );
      const grouped = groupServicesBySection(res.data.results);
      setServicesOptions(grouped);
    } catch (e: any) {
      console.error("🚀 ~ fetchServices ~ e:", e);
      toast.error(e || STATIC_TEXTS.REFERRALS.FETCH_SERVICE_ERROR);
    }
  };
  const fetchUnits = async () => {
    try {
      if (!userData) return;
      const res = await getUnits(userData?.userId, userData?.activeLocation);
      setUnits(res);
    } catch (e: any) {
      console.error("🚀 ~ fetchUnits ~ e:", e);
      toast.error(e || STATIC_TEXTS.REFERRALS.FETCH_UNITS_ERROR);
    }
  };
  useEffect(() => {
    if (!userData) {
      toast.error("User authentication missing");
      return;
    }
    fetchCategories(userData, setLoadingCategories, setCategoryOptions);
    loadRequestStatuses();
    loadAgents();
    fetchServices();
    fetchUnits();
    setExpandedFilters({
      dateRange: false,
      deadlineRange: false,
      status: false,
      amountRange: false,
      requestedAmountRange: false,
      service: false,
      createdBy: false,
    });
  }, [userData?.userId, userData?.activeLocation, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFilters({});
      setFieldSelection({
        orderBy: "createdAt",
        orderDirection: "desc",
        includeReportFilters: true,
        includeReferralSummary: true,
        includeReferralRecords: true,
        summaryTotalReferrals: true,
        summaryReferralsByStatus: true,
        summaryAmountStatistics: true,
        summaryServiceDistribution: true,
        summaryDeadlineStatistics: true,
        referralCase: true,
        referralAmount: true,
        referralUnit: true,
        referralService: true,
        referralCategory: true,
        referralDescription: true,
        referralStatus: true,
        referralStatusNotes: true,
        referralDeadline: true,
        referralCreatedBy: true,
        referralCreatedDate: true,
        referralStatusHistory: true,
        referralRequestedAssistance: true,
        referralOtherFields: true,
      });
    }
  }, [isOpen]);

  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!userData) return;
    const params = new URLSearchParams();

    // Add filters
    if (filters.dateRange?.startDate) {
      params.append("startDate", filters.dateRange.startDate);
    }
    if (filters.dateRange?.endDate) {
      params.append("endDate", filters.dateRange.endDate);
    }
    if (filters.deadlineRange?.startDate) {
      params.append("deadlineStartDate", filters.deadlineRange.startDate);
    }
    if (filters.deadlineRange?.endDate) {
      params.append("deadlineEndDate", filters.deadlineRange.endDate);
    }
    if (filters.status) {
      params.append("status", filters.status);
    }
    if (filters.amountRange?.minAmount !== undefined) {
      params.append("minAmount", String(filters.amountRange.minAmount));
    }
    if (filters.amountRange?.maxAmount !== undefined) {
      params.append("maxAmount", String(filters.amountRange.maxAmount));
    }
    if (filters.requestedAmountRange?.minAmount !== undefined) {
      params.append(
        "minRequestedAmount",
        String(filters.requestedAmountRange.minAmount)
      );
    }
    if (filters.requestedAmountRange?.maxAmount !== undefined) {
      params.append(
        "maxRequestedAmount",
        String(filters.requestedAmountRange.maxAmount)
      );
    }
    if (filters.serviceType) {
      params.append("serviceType", filters.serviceType);
    }
    if (filters.categoryId) {
      params.append("categoryId", filters.categoryId);
    }
    if (filters.unitId) {
      params.append("unitId", filters.unitId);
    }
    if (filters.createdBy) {
      params.append("createdBy", filters.createdBy);
    }
    if (filters.agencyId) {
      params.append("agencyId", filters.agencyId);
    }
    if (filters.locationId) {
      params.append("locationId", filters.locationId);
    }

    // Add field selection
    if (fieldSelection.orderBy) {
      params.append("orderBy", fieldSelection.orderBy);
    }
    if (fieldSelection.orderDirection) {
      params.append("orderDirection", fieldSelection.orderDirection);
    }

    Object.entries(fieldSelection).forEach(([key, value]) => {
      if (
        key !== "orderBy" &&
        key !== "orderDirection" &&
        value !== undefined
      ) {
        params.append(key, String(value));
      }
    });

    navigate(`/myAgency/referrals/report?${params.toString()}`);
    onClose();
  };

  const isFieldAlwaysEnabled = (fieldName: string) => {
    const alwaysEnabledFields = [
      "summaryTotalReferrals",
      "referralCase",
      "referralAmount",
      "referralStatus",
      "referralDeadline",
      "referralCreatedBy",
    ];
    return alwaysEnabledFields.includes(fieldName);
  };

  const toggleFilterExpansion = (filterKey: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
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

  const renderFiltersStep = () => (
    <div className="space-y-6">
      {/* Date Range Filters */}
      {renderFilterBar(
        "dateRange",
        "Date Range Filters",
        "Filter by referral creation date range",
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Creation Start Date
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
              onChange={(date) =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: {
                    ...prev.dateRange,
                    startDate: date ? formatDateOnly(date) : undefined,
                  },
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              placeholderText="Select start date"
              dateFormat="MM/dd/yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperClassName="datepicker-modal-fix"
              popperPlacement="bottom-start"
              maxDate={toZonedTime(new Date(), userTimeZone)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Creation End Date
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
              onChange={(date) =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: {
                    ...prev.dateRange,
                    endDate: date ? formatDateOnly(date) : undefined,
                  },
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
              placeholderText="Select end date"
              dateFormat="MM/dd/yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperClassName="datepicker-modal-fix"
              popperPlacement="bottom-start"
              maxDate={toZonedTime(new Date(), userTimeZone)}
              minDate={
                filters.dateRange?.startDate
                  ? toZonedTime(
                      new Date(filters.dateRange.startDate),
                      userTimeZone
                    )
                  : undefined
              }
            />
          </div>
        </div>,
        "mdi:calendar"
      )}

      {/* Deadline Range Filters */}
      {renderFilterBar(
        "deadlineRange",
        "Deadline Range Filters",
        "Filter by referral deadline date range",
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Start Date
            </label>
            <DatePicker
              selected={
                filters.deadlineRange?.startDate
                  ? toZonedTime(
                      new Date(filters.deadlineRange.startDate),
                      userTimeZone
                    )
                  : null
              }
              onChange={(date) =>
                setFilters((prev) => ({
                  ...prev,
                  deadlineRange: {
                    ...prev.deadlineRange,
                    startDate: date ? formatDateOnly(date) : undefined,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholderText="Select start date"
              dateFormat="MM/dd/yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperClassName="datepicker-modal-fix"
              popperPlacement="bottom-start"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline End Date
            </label>
            <DatePicker
              selected={
                filters.deadlineRange?.endDate
                  ? toZonedTime(
                      new Date(filters.deadlineRange.endDate),
                      userTimeZone
                    )
                  : null
              }
              onChange={(date) =>
                setFilters((prev) => ({
                  ...prev,
                  deadlineRange: {
                    ...prev.deadlineRange,
                    endDate: date ? formatDateOnly(date) : undefined,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholderText="Select end date"
              dateFormat="MM/dd/yyyy"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperClassName="datepicker-modal-fix"
              popperPlacement="bottom-start"
              minDate={
                filters.deadlineRange?.startDate
                  ? toZonedTime(
                      new Date(filters.deadlineRange.startDate),
                      userTimeZone
                    )
                  : undefined
              }
            />
          </div>
        </div>,
        "mdi:clock-outline"
      )}

      {/* Status Filters */}
      {renderFilterBar(
        "status",
        "Status Filters",
        "Filter by referral status",
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referral Status
          </label>
          <select
            value={filters.status || ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value || undefined,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {requestStatuses.map((status) => (
              <option key={status._id} value={status._id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>,
        "mdi:format-list-checks"
      )}

      {/* Amount Filters */}
      {renderFilterBar(
        "amountRange",
        "Amount Filters",
        "Filter by referral and requested assistance amounts",
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Amount Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Min Amount"
                maxLength={15}
                value={filters.amountRange?.minAmount || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    amountRange: {
                      ...prev.amountRange,
                      minAmount: e.target.value
                        ? parseInt(validateIntegerInput(e.target.value))
                        : undefined,
                    },
                  }))
                }
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
                maxLength={15}
                value={filters.amountRange?.maxAmount || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    amountRange: {
                      ...prev.amountRange,
                      maxAmount: e.target.value
                        ? parseInt(validateIntegerInput(e.target.value))
                        : undefined,
                    },
                  }))
                }
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requested Assistance Amount Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Min Amount"
                maxLength={15}
                value={filters.requestedAmountRange?.minAmount || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    requestedAmountRange: {
                      ...prev.requestedAmountRange,
                      minAmount: e.target.value
                        ? parseInt(validateIntegerInput(e.target.value))
                        : undefined,
                    },
                  }))
                }
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
                maxLength={15}
                value={filters.requestedAmountRange?.maxAmount || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    requestedAmountRange: {
                      ...prev.requestedAmountRange,
                      maxAmount: e.target.value
                        ? parseInt(validateIntegerInput(e.target.value))
                        : undefined,
                    },
                  }))
                }
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
        "mdi:currency-usd"
      )}

      {/* Service Filters */}
      {renderFilterBar(
        "service",
        "Service Filters",
        "Filter by service type, category, and unit",
        <div className="grid grid-cols-1  gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              name="referredAgencyService"
              value={filters.serviceType || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  serviceType: e.target.value || undefined,
                }))
              }
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple resize-none border-gray-300
              `}
            >
              <option value="">All Services</option>
              {servicesOptions.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.options.map((service: any) => (
                    <option key={service.value} value={service.value}>
                      {service.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.categoryId || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: e.target.value || undefined,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {loadingCategories ? (
                <option disabled>Loading categories...</option>
              ) : (
                Object.entries(groupCategoriesBySection(categoryOptions)).map(
                  ([section, cats]) => (
                    <optgroup
                      key={section}
                      label={section}
                      className="font-bold !text-purple"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Units</option>
              {units.map((unit) => (
                <option key={unit?._id} value={unit?._id}>
                  {unit?.name}
                </option>
              ))}
            </select>
          </div>
        </div>,
        "mdi:cog"
      )}

      {/* Agent/Staff Filters */}
      {renderFilterBar(
        "createdBy",
        "Agent/Staff Filters",
        "Filter by created by, agency, and location",
        <div className="">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.firstName} {agent.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>,
        "mdi:account-group"
      )}
    </div>
  );

  const renderFieldSelectionStep = () => (
    <div className="space-y-6">
      {/* Order Referrals By */}
      <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
          <Icon icon="mdi:sort" className="text-purple w-6 h-6 mr-3" />
          Order Referrals By
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
        <div className="grid grid-cols-1  gap-4">
          {[
            { key: "includeReportFilters", label: "Report Filters" },
            { key: "includeReferralSummary", label: "Referral Summary" },
            { key: "includeReferralRecords", label: "Referral Records" },
          ].map(({ key, label }) => (
            <label
              key={key}
              className={`flex items-center p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-purple/30 hover:shadow-md transition-all duration-200 cursor-pointer`}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={
                    fieldSelection[
                      key as keyof ReferralReportFieldSelection
                    ] as boolean
                  }
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
                    (fieldSelection[
                      key as keyof ReferralReportFieldSelection
                    ] as boolean)
                      ? "bg-purple border-purple"
                      : "border-gray-300 hover:border-purple"
                  }`}
                >
                  {(fieldSelection[
                    key as keyof ReferralReportFieldSelection
                  ] as boolean) && (
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

      {/* Referral Summary Fields */}
      {fieldSelection.includeReferralSummary && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Icon
              icon="mdi:chart-line"
              className="text-green-600 w-6 h-6 mr-3"
            />
            Referral Summary Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "summaryTotalReferrals",
                label: "Summary: Total referrals",
              },
              {
                key: "summaryReferralsByStatus",
                label: "Summary: Referrals by status",
              },
              {
                key: "summaryAmountStatistics",
                label: "Summary: Amount statistics",
              },
              {
                key: "summaryServiceDistribution",
                label: "Summary: Service distribution",
              },
              {
                key: "summaryDeadlineStatistics",
                label: "Summary: Deadline statistics",
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
                        key as keyof ReferralReportFieldSelection
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
                        key as keyof ReferralReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof ReferralReportFieldSelection
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

      {/* Referral Record Fields */}
      {fieldSelection.includeReferralRecords && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-8 flex items-center">
            <Icon
              icon="mdi:format-list-bulleted"
              className="text-purple w-6 h-6 mr-3"
            />
            Referral Record Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "referralCase", label: "Referral: Case" },
              { key: "referralAmount", label: "Referral: Amount" },
              { key: "referralUnit", label: "Referral: Unit" },
              { key: "referralService", label: "Referral: Service" },
              { key: "referralCategory", label: "Referral: Category" },
              { key: "referralDescription", label: "Referral: Description" },
              { key: "referralStatus", label: "Referral: Status" },
              { key: "referralStatusNotes", label: "Referral: Status notes" },
              { key: "referralDeadline", label: "Referral: Deadline" },
              { key: "referralCreatedBy", label: "Referral: Created by" },
              { key: "referralCreatedDate", label: "Referral: Created date" },
              {
                key: "referralStatusHistory",
                label: "Referral: Status history",
              },
              {
                key: "referralRequestedAssistance",
                label: "Referral: Requested assistance",
              },
              { key: "referralOtherFields", label: "Referral: Other Fields" },
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
                        key as keyof ReferralReportFieldSelection
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
                        key as keyof ReferralReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof ReferralReportFieldSelection
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
      title="Referral Report"
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

export default EnhancedReferralReportModal;
