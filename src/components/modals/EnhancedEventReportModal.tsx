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
  EventReportFilters,
  EventReportFieldSelection,
  EventActivity,
  EventTypeData,
  EventLocation,
} from "@/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { toZonedTime } from "date-fns-tz";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { toast } from "react-toastify";
import { sortOptionsForEvents } from "@/utils/constants";
import {
  getEventLocationsDedicated,
  getEventTypes,
  getEventActivity,
} from "@/services/EventsApi";

interface EnhancedEventReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedEventReportModal: React.FC<EnhancedEventReportModalProps> = ({
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
  const [filters, setFilters] = useState<EventReportFilters>({
    eventVisibility: "All Agencies",
  });

  // Field selection state
  const [fieldSelection, setFieldSelection] =
    useState<EventReportFieldSelection>({
      orderBy: "createdAt",
      orderDirection: "desc", // Default to Newest to Oldest
      includeReportFilters: true,
      includeEventSummary: true,
      includeEventRecords: true, // Always selected
      // Summary fields - default to true and always enabled
      summaryTotalEvents: true,
      summaryEventsByType: true,
      summaryEventsByLocation: true,
      summaryAttendanceStatistics: true,
      summaryDateRanges: true,
      // Event fields - default to true and always enabled
      eventTitle: true, // Always selected
      eventType: true, // Always selected
      eventLocation: true, // Always selected
      eventDateTime: true, // Always selected
      eventDescription: true,
      eventFacilitator: true,
      eventActivities: true,
      eventCreatedBy: true, // Always selected
      eventCreatedDate: true,
    });

  // Data loading states
  const [agents, setAgents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState({
    agents: false,
    locations: false,
    eventTypes: false,
    activities: false,
  });
  const [eventTypes, setEventTypes] = useState<EventTypeData[]>([]);
  const [locationsData, setLocationsData] = useState<EventLocation[]>([]);
  const [activities, setActivities] = useState<EventActivity[]>([]);

  const initialExpands = {
    dateRange: false,
    eventType: false,
    agent: false,
    activity: false,
  };
  // Filter expansion states
  const [expandedFilters, setExpandedFilters] = useState(initialExpands);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset to initial state when modal opens
      setCurrentStep(1);
      setFilters({
        eventVisibility: "All Agencies", // Preserve the default eventVisibility
      });
      setFieldSelection({
        orderBy: "createdAt",
        orderDirection: "desc",
        includeReportFilters: true,
        includeEventSummary: true,
        includeEventRecords: true,
        summaryTotalEvents: true,
        summaryEventsByType: true,
        summaryEventsByLocation: true,
        summaryAttendanceStatistics: true,
        summaryDateRanges: true,
        eventTitle: true,
        eventType: true,
        eventLocation: true,
        eventDateTime: true,
        eventDescription: true,
        eventFacilitator: true,
        eventActivities: true,
        eventCreatedBy: true,
        eventCreatedDate: true,
      });
      setExpandedFilters(initialExpands);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!userData) {
      toast.error(
        "Unable to apply filters. Please ensure you are properly logged in to GHL with an active location selected."
      );
      return;
    }
    if (isOpen) {
      fetchEventLocationDedicated();
      fetchAgents();
      fetchEventTypes();
      fetchEventActivities();
    }
  }, [userData, isOpen]);

  const fetchEventActivities = async () => {
    if (!userData?.userId) return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO);
    setLoading({ ...loading, activities: true });
    try {
      const response = await getEventActivity(
        userData.userId,
        userData.activeLocation
      );
      if (response && response.success) {
        const { data } = response.data;
        setActivities(data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR);
    } finally {
      setLoading({ ...loading, activities: false });
    }
  };

  const fetchEventTypes = async () => {
    if (!userData?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT_TYPE);
    setLoading({ ...loading, eventTypes: true });
    try {
      const response = await getEventTypes(
        userData.userId,
        userData.activeLocation
      );
      if (response && response.success) {
        setEventTypes(response.data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR_EVENTS_TYPE);
    } finally {
      setLoading({ ...loading, eventTypes: false });
    }
  };

  const fetchEventLocationDedicated = async () => {
    if (!userData?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_LOCATION);
    setLoading({ ...loading, locations: true });
    try {
      const response = await getEventLocationsDedicated(
        userData.userId,
        userData.activeLocation
      );
      if (response && response.success) {
        const data = response.data;
        setLocationsData(data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR_LOCATION);
    } finally {
      setLoading({ ...loading, locations: false });
    }
  };

  const fetchAgents = async () => {
    if (!userData?.userId) return;
    setLoading({ ...loading, agents: true });
    try {
      const response = await getUsersWithoutPagination(
        userData.userId,
        userData.activeLocation
      );
      setAgents(response.data || []);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to fetch agents");
    } finally {
      setLoading({ ...loading, agents: false });
    }
  };
  // Load agents data
  useEffect(() => {}, [userData]);

  // Update filter function
  const updateFilter = (
    key: keyof EventReportFilters,
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
    field: keyof EventReportFieldSelection
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
      "eventTitle",
      "eventType",
      "eventLocation",
      "eventDateTime",
      "includeEventRecords",
      "summaryTotalEvents",
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
    if (filters.eventTypeId) {
      params.append("eventTypeId", filters.eventTypeId);
    }
    if (filters.eventLocationId) {
      params.append("eventLocationId", filters.eventLocationId);
    }
    if (filters.facilitatorId) {
      params.append("facilitatorId", filters.facilitatorId);
    }
    if (filters.activityTypeId) {
      params.append("activityTypeId", filters.activityTypeId);
    }
    if (filters.eventVisibility) {
      params.append("visibilityFilter", filters.eventVisibility);
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
    navigate(`/myAgency/events/report?${params.toString()}`);
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
        "Filter by event date range",
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

      {/* Event Type Filters */}
      {renderFilterBar(
        "eventType",
        "Event Type Filters",
        "Filter by event type, location, and facilitator",
        <div className="space-y-4">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Event Type
            </label>
            <select
              value={filters.eventTypeId || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  eventTypeId: e.target.value || undefined,
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            >
              <option value="">All Event Types</option>
              {eventTypes.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Event Location
            </label>
            <select
              value={filters.eventLocationId || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  eventLocationId: e.target.value || undefined,
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            >
              <option value="">All Locations</option>
              {locationsData.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Facilitator
            </label>
            <select
              value={filters.facilitatorId || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  facilitatorId: e.target.value || undefined,
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            >
              <option value="">All Facilitators</option>
              {Object.entries(
                agents.reduce<Record<string, any>>((acc, user) => {
                  const companyName =
                    user.company?.locationName || "Unknown Company";
                  if (!acc[companyName]) acc[companyName] = [];
                  acc[companyName].push(user);
                  return acc;
                }, {})
              ).map(([company, users]) => (
                <optgroup key={company} label={company} className="text-purple">
                  {users.map((option: any) => (
                    <option
                      key={option._id}
                      value={option._id}
                      className="text-black"
                    >
                      {option.firstName} {option.lastName}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>,
        "mdi:calendar-multiple"
      )}

      {/* Activity Filters */}
      {renderFilterBar(
        "activity",
        "Activity Filters",
        "Filter by activity type and value",
        <div className="space-y-4">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Activity
            </label>
            <select
              value={filters.activityTypeId || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  activityTypeId: e.target.value || undefined,
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            >
              <option value="">All Activities</option>
              {activities.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>,
        "mdi:chart-line"
      )}

      {/* Event Visibility Filter */}
      {renderFilterBar(
        "visibility",
        "Event Visibility Filter",
        "Filter by event visibility",
        <div className="space-y-4">
          <div>
            <label className="block text-base font-normal text-gray-700 mb-3">
              Event Visibility
            </label>
            <select
              value={filters.eventVisibility || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  eventVisibility: e.target.value || undefined,
                }))
              }
              className="w-full px-2 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple/20 focus:border-purple transition-all duration-200 text-base"
            >
              <option value="All Agencies">All Agencies</option>
              <option value="My Agency">My Agency</option>
            </select>
          </div>
        </div>,
        "mdi:eye"
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
          Order Events By
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
            {sortOptionsForEvents.map((option) => (
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
                checked={fieldSelection.includeEventSummary}
                onChange={() =>
                  handleFieldSelectionChange("includeEventSummary")
                }
                className="sr-only"
              />
              <div
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                  fieldSelection.includeEventSummary
                    ? "bg-purple border-purple"
                    : "border-gray-300 hover:border-purple"
                }`}
              >
                {fieldSelection.includeEventSummary && (
                  <Icon icon="mdi:check" className="text-white w-4 h-4" />
                )}
              </div>
            </div>
            <span className="ml-4 text-base font-normal text-gray-700">
              Event Summary
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
              Event Records
            </span>
          </label>
        </div>
      </div>

      {/* Event Summary Fields */}
      {fieldSelection.includeEventSummary && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Icon icon="mdi:chart-box" className="text-purple w-6 h-6 mr-3" />
            Event Summary Report Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "summaryTotalEvents", label: "Total Events" },
              {
                key: "summaryEventsByType",
                label: "Events by Type",
              },
              {
                key: "summaryEventsByLocation",
                label: "Events by Location",
              },
              {
                key: "summaryAttendanceStatistics",
                label: "Attendance Statistics",
              },
              {
                key: "summaryDateRanges",
                label: "Date Ranges",
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
                        key as keyof EventReportFieldSelection
                      ] as boolean
                    }
                    onChange={() =>
                      handleFieldSelectionChange(
                        key as keyof EventReportFieldSelection
                      )
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof EventReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof EventReportFieldSelection
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

      {/* Event Record Fields */}
      {fieldSelection.includeEventRecords && (
        <div className="bg-gradient-to-r from-purpleLight to-purple/5 rounded-2xl p-8 border border-purple/10">
          <h4 className="text-lg font-bold text-gray-800 mb-8 flex items-center">
            <Icon
              icon="mdi:format-list-bulleted"
              className="text-purple w-6 h-6 mr-3"
            />
            Event Record Report Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "eventTitle", label: "Event Title" },
              { key: "eventType", label: "Event Type" },
              { key: "eventLocation", label: "Event Location" },
              { key: "eventDateTime", label: "Event Date/Time" },
              { key: "eventFacilitator", label: "Event Facilitator" },
              { key: "eventDescription", label: "Event Description" },
              { key: "eventActivities", label: "Event Activities" },
              { key: "eventCreatedDate", label: "Event Created Date" },
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
                        key as keyof EventReportFieldSelection
                      ] as boolean
                    }
                    onChange={() =>
                      handleFieldSelectionChange(
                        key as keyof EventReportFieldSelection
                      )
                    }
                    disabled={isFieldAlwaysEnabled(key)}
                    className="sr-only"
                  />
                  <div
                    className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
                      (fieldSelection[
                        key as keyof EventReportFieldSelection
                      ] as boolean)
                        ? "bg-purple border-purple"
                        : "border-gray-300 hover:border-purple"
                    }`}
                  >
                    {(fieldSelection[
                      key as keyof EventReportFieldSelection
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
      title="Event Report"
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

export default EnhancedEventReportModal;
