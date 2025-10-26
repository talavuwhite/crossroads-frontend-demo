import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useReactToPrint } from "react-to-print";
import Button from "@/components/ui/Button";
import { fetchEnhancedEventReport } from "@/services/ReportsApi";
import type {
  EventReportFilters,
  EventReportFieldSelection,
  EnhancedEventReport,
  EventReportApiResponse,
  EventReportApiSummary,
  EventReportApiFilters,
  EventReportApiEvent,
} from "@/types";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

const EnhancedEventReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const printRef = useRef<HTMLDivElement>(null);

  // State
  const [reportData, setReportData] = useState<EnhancedEventReport | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse URL parameters
  const parseUrlParams = () => {
    const filters: EventReportFilters = {};
    const fieldSelection: EventReportFieldSelection = {};

    // Parse filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      filters.dateRange = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
    }

    const eventTypeId = searchParams.get("eventTypeId");
    if (eventTypeId) filters.eventTypeId = eventTypeId;

    const eventLocationId = searchParams.get("eventLocationId");
    if (eventLocationId) filters.eventLocationId = eventLocationId;

    const facilitatorId = searchParams.get("facilitatorId");
    if (facilitatorId) filters.facilitatorId = facilitatorId;

    const createdBy = searchParams.get("createdBy");
    if (createdBy) filters.createdBy = createdBy;

    const agencyId = searchParams.get("agencyId");
    if (agencyId) filters.agencyId = agencyId;

    const locationId = searchParams.get("locationId");
    if (locationId) filters.locationId = locationId;

    const activityTypeId = searchParams.get("activityTypeId");
    if (activityTypeId) filters.activityTypeId = activityTypeId;

    const minActivityValue = searchParams.get("minActivityValue");
    const maxActivityValue = searchParams.get("maxActivityValue");
    if (minActivityValue || maxActivityValue) {
      filters.activityValue = {
        minValue: minActivityValue ? parseInt(minActivityValue) : undefined,
        maxValue: maxActivityValue ? parseInt(maxActivityValue) : undefined,
      };
    }

    const eventVisibility =
      searchParams.get("eventVisibility") ||
      searchParams.get("visibilityFilter");
    if (eventVisibility) filters.eventVisibility = eventVisibility;

    // Parse field selection
    const orderBy = searchParams.get("orderBy");
    const orderDirection = searchParams.get("orderDirection");
    if (orderBy) fieldSelection.orderBy = orderBy;
    if (orderDirection)
      fieldSelection.orderDirection = orderDirection as "asc" | "desc";

    // Parse all boolean fields
    const booleanFields = [
      "includeReportFilters",
      "includeEventSummary",
      "includeEventRecords",
      "summaryTotalEvents",
      "summaryEventsByType",
      "summaryEventsByLocation",
      "summaryAttendanceStatistics",
      "summaryDateRanges",
      "eventTitle",
      "eventType",
      "eventLocation",
      "eventDateTime",
      "eventDescription",
      "eventFacilitator",
      "eventActivities",
      "eventCreatedBy",
      "eventCreatedDate",
    ];

    booleanFields.forEach((field) => {
      const value = searchParams.get(field);
      if (value !== null) {
        (fieldSelection as any)[field] = value === "true";
      }
    });

    return { filters, fieldSelection };
  };

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      if (!userData) return;

      try {
        setLoading(true);
        setError(null);

        const { filters, fieldSelection: urlFieldSelection } = parseUrlParams();

        const response = await fetchEnhancedEventReport(
          filters,
          urlFieldSelection,
          userData.userId,
          userData.activeLocation
        );

        // Transform the API response to match the expected structure
        const apiData = response?.data;

        // Handle different possible response structures
        let eventsData: EventReportApiEvent[] = apiData.data;
        let summaryData: EventReportApiSummary | undefined = apiData.summary;
        let filtersData: EventReportApiFilters | undefined = apiData.filters;
        let userInfoData: EventReportApiResponse["userInfo"] | undefined =
          apiData.userInfo;

        // If the response structure is different, try alternative paths
        if (!Array.isArray(eventsData)) {
          console.warn(
            "Expected data.data to be an array, trying alternative structure..."
          );

          // Try direct access if the response is already the data
          if (Array.isArray(apiData)) {
            eventsData = apiData as EventReportApiEvent[];
            summaryData = undefined;
            filtersData = undefined;
            userInfoData = undefined;
          } else if (apiData && typeof apiData === "object") {
            // Try to find the events array in the response
            for (const key in apiData) {
              const value = (apiData as unknown as Record<string, unknown>)[
                key
              ];
              if (Array.isArray(value)) {
                eventsData = value as EventReportApiEvent[];
                break;
              }
            }
          }
        }

        // Ensure eventsData is an array before mapping
        if (!Array.isArray(eventsData)) {
          setError("Invalid data format received from server.");
          return;
        }

        // Transform event records from the nested data structure
        const transformedRecords = eventsData.map(
          (event: EventReportApiEvent) => ({
            eventTitle: event.title,
            eventType: event.eventType?.name,
            eventLocation: event.location?.name,
            eventDateTime: event.dateTime,
            eventDescription: event.description,
            eventFacilitator: event.facilitator
              ? `${event.facilitator.firstName} ${event.facilitator.lastName}`
              : undefined,
            eventActivities:
              event.activities?.map((activity) => ({
                name: activity.name, // Use the actual name from API
                type: activity.type, // Use the actual type from API
                value:
                  activity.value !== undefined
                    ? activity.value
                    : "Not specified",
              })) || [],
            eventCreatedBy: event.createdBy
              ? `${event.createdBy.firstName} ${event.createdBy.lastName}`
              : undefined,
            eventCreatedDate: event.createdAt,
            eventVisibility: "Not specified", // Default value since API doesn't provide this
          })
        );

        // Transform summary data
        const transformedSummary = summaryData
          ? {
              totalEvents: summaryData.totalEvents,
              eventsByType: summaryData.eventsByType,
              eventsByLocation: summaryData.eventsByLocation,
              attendanceStatistics: {
                totalAttendance:
                  summaryData.attendanceStatistics?.totalAttendance ||
                  summaryData.totalAttendance,
                averageAttendance:
                  summaryData.attendanceStatistics?.averageAttendance ||
                  summaryData.averageAttendance,
                maxAttendance:
                  summaryData.attendanceStatistics?.maxAttendance ||
                  summaryData.maxAttendance,
                minAttendance:
                  summaryData.attendanceStatistics?.minAttendance ||
                  summaryData.minAttendance,
              },
              dateRanges: {
                earliestEvent:
                  summaryData.dateRanges?.earliestEvent ||
                  summaryData.earliestEvent,
                latestEvent:
                  summaryData.dateRanges?.latestEvent ||
                  summaryData.latestEvent,
                totalDays: summaryData.dateRanges?.totalDays || 0,
              },
            }
          : undefined;

        // Create field selection from API response
        const apiFieldSelection: EventReportFieldSelection = {
          orderBy: filtersData?.orderBy,
          orderDirection: filtersData?.orderDirection as "asc" | "desc",
          includeReportFilters: filtersData?.includeReportFilters === "true",
          includeEventSummary: filtersData?.includeEventSummary === "true",
          includeEventRecords: filtersData?.includeEventRecords === "true",
          summaryTotalEvents: filtersData?.summaryTotalEvents === "true",
          summaryEventsByType: filtersData?.summaryEventsByType === "true",
          summaryEventsByLocation:
            filtersData?.summaryEventsByLocation === "true",
          summaryAttendanceStatistics:
            filtersData?.summaryAttendanceStatistics === "true",
          summaryDateRanges: filtersData?.summaryDateRanges === "true",
          eventTitle: filtersData?.eventTitle === "true",
          eventType: filtersData?.eventType === "true",
          eventLocation: filtersData?.eventLocation === "true",
          eventDateTime: filtersData?.eventDateTime === "true",
          eventDescription: filtersData?.eventDescription === "true",
          eventFacilitator: filtersData?.eventFacilitator === "true",
          eventActivities: filtersData?.eventActivities === "true",
          eventCreatedBy: filtersData?.eventCreatedBy === "true",
          eventCreatedDate: filtersData?.eventCreatedDate === "true",
        };

        // Create the transformed report data
        const transformedReportData: EnhancedEventReport = {
          summary: transformedSummary,
          records: transformedRecords,
          filters: filtersData || {},
          fieldSelection: apiFieldSelection,
          userInfo: userInfoData
            ? {
                userId: userData.userId,
                userType: userInfoData.userType || userData.type,
                userName:
                  userInfoData.firstName && userInfoData.lastName
                    ? `${userInfoData.firstName} ${userInfoData.lastName}`
                    : userData.userName,
                agencyName: userInfoData.locationName || userData.companyId,
                subAgencyName: null,
              }
            : {
                userId: userData.userId,
                userType: userData.type,
                userName: userData.userName,
                agencyName: userData.companyId,
                subAgencyName: null,
              },
        };

        setReportData(transformedReportData);
      } catch (err) {
        console.error("Error fetching event report:", err);
        setError("Failed to load event report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [searchParams, userData]);

  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Event Report",
    onAfterPrint: () => console.log("Print completed"),
  });

  // Format date
  const formatDate = (dateString: string) => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: userTimeZone,
    });
  };

  // Format date with time
  const formatDateTime = (dateString: string) => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: userTimeZone,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:alert-circle"
            className="text-red-500 w-12 h-12 mx-auto"
          />
          <p className="mt-4 text-red-600">{error}</p>
          <Button
            label="Go Back"
            onClick={() => navigate(-1)}
            variant="default"
            className="mt-4"
          />
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No report data available.</p>
          <Button
            label="Go Back"
            onClick={() => navigate(-1)}
            variant="default"
            className="mt-4"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white" ref={printRef}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg w-10 h-10 flex items-center justify-center transition-colors"
            >
              <Icon
                icon="mdi:arrow-left"
                className="w-full h-full  text-xl text-gray-600"
              />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Report</h1>
              <p className="text-gray-600">
                Generated By :{" "}
                <span className="font-medium">
                  {reportData.userInfo?.userName}
                </span>{" "}
                on{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                })}
              </p>
              {reportData.userInfo && (
                <p className="text-lg font-semibold text-purple print:text-base">
                  {reportData.userInfo.agencyName ||
                    reportData.userInfo.subAgencyName}
                </p>
              )}
            </div>
          </div>
          <Button
            label="Print Report"
            onClick={handlePrint}
            variant="submitStyle"
            icon="mdi:printer"
            className="px-6 py-3 print:hidden"
          />
        </div>
      </div>

      {/* Report Content */}
      <div className="p-6 space-y-8">
        {/* Event Summary Section */}
        {reportData.fieldSelection?.includeEventSummary &&
          reportData.summary && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Icon
                  icon="mdi:chart-box"
                  className="text-green-600 w-6 h-6 mr-3"
                />
                Event Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportData.fieldSelection?.summaryTotalEvents && (
                  <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {reportData.summary.totalEvents || 0}
                    </div>
                    <p className="text-gray-600 font-medium">Total Events</p>
                  </div>
                )}

                {reportData.fieldSelection?.summaryAttendanceStatistics &&
                  reportData.summary.attendanceStatistics && (
                    <>
                      <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {reportData.summary.attendanceStatistics
                            .totalAttendance || 0}
                        </div>
                        <p className="text-gray-600 font-medium">
                          Total Attendance
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {reportData.summary.attendanceStatistics.averageAttendance?.toFixed(
                            1
                          ) || "0.0"}
                        </div>
                        <p className="text-gray-600 font-medium">
                          Average Attendance
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {reportData.summary.attendanceStatistics
                            .maxAttendance || 0}
                        </div>
                        <p className="text-gray-600 font-medium">
                          Max Attendance
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {reportData.summary.attendanceStatistics
                            .minAttendance || 0}
                        </div>
                        <p className="text-gray-600 font-medium">
                          Min Attendance
                        </p>
                      </div>
                    </>
                  )}
              </div>

              {/* Events by Type */}
              {reportData.fieldSelection?.summaryEventsByType &&
                reportData.summary.eventsByType && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Icon
                        icon="mdi:chart-pie"
                        className="text-green-600 w-5 h-5 mr-2"
                      />
                      Events by Type
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(reportData.summary.eventsByType).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="bg-white rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow"
                          >
                            <p className="font-semibold text-gray-800 mb-1">
                              {type}
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {count}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Events by Location */}
              {reportData.fieldSelection?.summaryEventsByLocation &&
                reportData.summary.eventsByLocation && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Icon
                        icon="mdi:map-marker"
                        className="text-green-600 w-5 h-5 mr-2"
                      />
                      Events by Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(reportData.summary.eventsByLocation).map(
                        ([location, count]) => (
                          <div
                            key={location}
                            className="bg-white rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow"
                          >
                            <p className="font-semibold text-gray-800 mb-1">
                              {location}
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {count}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Date Ranges */}
              {reportData.fieldSelection?.summaryDateRanges &&
                reportData.summary.dateRanges && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Icon
                        icon="mdi:calendar-range"
                        className="text-green-600 w-5 h-5 mr-2"
                      />
                      Date Ranges
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-green-200">
                        <p className="font-semibold text-gray-800 mb-1">
                          Earliest Event
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {reportData.summary.dateRanges.earliestEvent
                            ? formatDate(
                                reportData.summary.dateRanges.earliestEvent
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-green-200">
                        <p className="font-semibold text-gray-800 mb-1">
                          Latest Event
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {reportData.summary.dateRanges.latestEvent
                            ? formatDate(
                                reportData.summary.dateRanges.latestEvent
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-green-200">
                        <p className="font-semibold text-gray-800 mb-1">
                          Total Days
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {reportData.summary.dateRanges.totalDays || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

        {/* Event Records Section */}
        {reportData.fieldSelection?.includeEventRecords &&
          reportData.records &&
          reportData.records.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Icon
                  icon="mdi:format-list-bulleted"
                  className="text-purple-600 w-6 h-6 mr-3"
                />
                Event Records ({reportData.records.length})
              </h2>
              <div className="space-y-8">
                {reportData.records.map((record, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-8 border border-purple-200 shadow-sm print-record"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-purple-100 text-purple-600 font-bold text-lg rounded-full w-8 h-8 flex items-center justify-center print-number">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {record.eventTitle || "Untitled Event"}
                          </h3>
                          {record.eventDescription && (
                            <p className="text-gray-600 mt-1">
                              {record.eventDescription}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                          {record.eventType || "No Type"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Event Details */}
                      <div className="space-y-4 md:border-r md:border-purple-100 md:pr-6">
                        <h4 className="font-semibold text-purple text-sm uppercase tracking-wide mb-3 border-b border-purple-100 md:border-b-0">
                          Event Details
                        </h4>

                        {record.eventLocation && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-semibold text-gray-800">
                              {record.eventLocation}
                            </span>
                          </div>
                        )}

                        {record.eventDateTime && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Date/Time:</span>
                            <span className="font-semibold text-gray-800">
                              {formatDateTime(record.eventDateTime)}
                            </span>
                          </div>
                        )}

                        {record.eventFacilitator && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Facilitator:</span>
                            <span className="font-semibold text-gray-800">
                              {record.eventFacilitator}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Activities */}
                      <div className="space-y-4 md:border-r md:border-purple-100 md:pr-6">
                        <h4 className="font-semibold text-purple text-sm uppercase tracking-wide mb-3 border-b border-purple-100 md:border-b-0">
                          Activities
                        </h4>

                        {record.eventActivities &&
                        record.eventActivities.length > 0 ? (
                          record.eventActivities.map(
                            (activity, activityIndex) => (
                              <div
                                key={activityIndex}
                                className="py-2 border-b border-gray-100"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    {activity.name}:
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {activity.value}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  Type: {activity.type}
                                </p>
                              </div>
                            )
                          )
                        ) : (
                          <div className="py-2 border-b border-gray-100">
                            <span className="text-gray-500">No activities</span>
                          </div>
                        )}
                      </div>

                      {/* Creation Details */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-purple text-sm uppercase tracking-wide mb-3 border-b border-purple-100 md:border-b-0">
                          Creation Details
                        </h4>

                        {record.eventCreatedBy && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Created By:</span>
                            <span className="font-semibold text-gray-800">
                              {record.eventCreatedBy}
                            </span>
                          </div>
                        )}

                        {record.eventCreatedDate && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Created Date:</span>
                            <span className="font-semibold text-gray-800">
                              {formatDateTime(record.eventCreatedDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .print-content {
            page-break-inside: avoid;
          }
          
          .print-page-break {
            page-break-before: always;
          }
          
          @page {
            margin: 1in;
            size: A4;
          }
          
          /* Ensure colors print */
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          /* Hide non-printable elements */
          button, .no-print {
            display: none !important;
          }
          
          /* Page numbering */
          .print-content::after {
            content: "Page " counter(page) " of " counter(pages);
            position: fixed;
            bottom: 1in;
            right: 1in;
            font-size: 12px;
            color: #666;
          }

          /* New styles for print-record */
          .print-record {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 1.5in; /* Adjust as needed for spacing */
            padding: 0.5in; /* Adjust as needed for padding */
            box-shadow: none; /* Remove shadow for print */
            border: 1px solid #eee; /* Slightly lighter border for print */
          }

          .print-number {
            font-size: 1.5rem; /* Larger font for print */
            font-weight: bold;
            color: #4f46e5; /* Darker purple for print */
            background-color: #e0dcfc; /* Lighter purple background for print */
            border: 1px solid #d1d5db; /* Subtle border for print */
            width: 2.5rem; /* Fixed width for number */
            height: 2.5rem; /* Fixed height for number */
            display: flex; /* Center content */
            align-items: center; /* Center content */
            justify-content: center; /* Center content */
            flex-shrink: 0; /* Prevent shrinking */
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedEventReport;
