import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import Button from "@/components/ui/Button";
import { fetchEnhancedOutcomeGoalsReport } from "@/services/ReportsApi";
import type {
  EnhancedOutcomeGoalsReport,
  OutcomeGoalsReportFilters,
  OutcomeGoalsReportFieldSelection,
} from "@/types";
import { useReactToPrint } from "react-to-print";
import { toZonedTime } from "date-fns-tz";
import { toast } from "react-toastify";

const EnhancedOutcomeGoalsReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [reportData, setReportData] =
    useState<EnhancedOutcomeGoalsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateOnly = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const zonedDate = toZonedTime(date, userTimeZone);
      return zonedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const zonedDate = toZonedTime(date, userTimeZone);
      return zonedDate.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Outcome Goals Report - ${formatDateOnly(
      new Date().toISOString()
    )}`,
    pageStyle: `
      @media print {
        @page {
          margin: 0.5in;
          size: A4;
        }
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .page-break-before {
          page-break-before: always;
        }
        .page-break-inside-avoid {
          page-break-inside: avoid;
        }
        .page-break-after-avoid {
          page-break-after: avoid;
        }
      }
    `,
  });

  useEffect(() => {
    const fetchReport = async () => {
      if (!userData?.userId || !userData?.activeLocation) {
        setError("User data not available");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Parse filters and field selection from URL parameters
        const filtersParam = searchParams.get("filters");
        const fieldSelectionParam = searchParams.get("fieldSelection");

        if (!filtersParam || !fieldSelectionParam) {
          setError("Missing report parameters");
          setLoading(false);
          return;
        }

        let filters: OutcomeGoalsReportFilters;
        let fieldSelection: OutcomeGoalsReportFieldSelection;

        try {
          filters = JSON.parse(decodeURIComponent(filtersParam));
          fieldSelection = JSON.parse(decodeURIComponent(fieldSelectionParam));
        } catch (parseError) {
          console.error("Error parsing URL parameters:", parseError);
          setError("Invalid report parameters");
          setLoading(false);
          return;
        }

        // Call the API to fetch the report data
        const response = await fetchEnhancedOutcomeGoalsReport(
          filters,
          fieldSelection,
          userData.userId,
          userData.activeLocation
        );

        // Check if response exists and has data
        if (response && response.data) {
          // Handle different response structures
          let reportData: any;
          if (response.data.success && response.data.data) {
            reportData = response.data.data;
          } else if (response.data.data) {
            reportData = response.data.data;
          } else if (response.data) {
            reportData = response.data;
          } else {
            throw new Error("Invalid response structure");
          }

          // The API response already contains filters, fieldSelection, summary, and records
          // We just need to add the missing fields for the interface
          const reportWithParams: EnhancedOutcomeGoalsReport = {
            companyId: reportData.companyId || userData.activeLocation || "",
            companyName: reportData.companyName || "Your Company",
            locationId: reportData.locationId || userData.activeLocation || "",
            locationName: reportData.locationName || "Your Location",
            summary: reportData.summary || {},
            records: reportData.records || [],
            pagination: reportData.pagination || {
              page: 1,
              limit: 10,
              totalPages: 1,
            },
            filters: reportData.filters || filters,
            fieldSelection: reportData.fieldSelection || fieldSelection,
          };

          setReportData(reportWithParams);
        } else {
          console.error("Invalid response structure:", response);
          setError("Failed to load report data - invalid response");
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(
          `Failed to load report data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [searchParams, userData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">
            {error || "Failed to load report"}
          </p>
          <Button
            label="Back to Reports"
            onClick={() => window.history.back()}
            variant="default"
            icon="mdi:arrow-left"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div ref={printRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page numbering for print */}
        <div className="hidden print:block page-info"></div>
        <div className="hidden print:block page-number"></div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:border-b-4 print:border-purple-600 print:mb-6 print:page-break-after-avoid">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-purple-800 print:text-purple-800">
                Outcome Goals Report
              </h1>
              <p className="text-gray-600 mt-1 print:text-base">
                Generated on {formatDateTime(new Date().toISOString())}
              </p>
            </div>
            <div className="flex gap-3 print:hidden">
              <Button
                label="Print Report"
                onClick={handlePrint}
                variant="submitStyle"
                icon="mdi:printer"
              />
              <Button
                label="Back to Reports"
                onClick={() => window.history.back()}
                variant="default"
                icon="mdi:arrow-left"
              />
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6 print:space-y-4">
          {/* Goal Summary */}
          {reportData.fieldSelection?.includeGoalSummary &&
            reportData.summary && (
              <div className="bg-white rounded-lg shadow-sm p-6 print:shadow-none print:border print:border-gray-300 print:page-break-inside-avoid">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 print:text-purple-800 print:page-break-after-avoid">
                  Goal Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:gap-4">
                  {reportData.fieldSelection.summaryTotalGoals &&
                    reportData.summary.totalGoals !== undefined && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg print:bg-blue-200 print:border print:border-blue-300">
                        <div className="text-2xl font-bold text-blue-800 print:text-blue-900">
                          {reportData.summary.totalGoals}
                        </div>
                        <div className="text-sm text-blue-600 print:text-blue-800">
                          Total Goals
                        </div>
                      </div>
                    )}
                  {reportData.fieldSelection.summaryCompletionRates &&
                    reportData.summary.completionRates && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg print:bg-green-200 print:border print:border-green-300">
                        <div className="text-2xl font-bold text-green-800 print:text-green-900">
                          {reportData.summary.completionRates.completionRate ||
                            0}
                          %
                        </div>
                        <div className="text-sm text-green-600 print:text-green-800">
                          Completion Rate
                        </div>
                      </div>
                    )}
                  {reportData.fieldSelection.summaryDueDateStatistics &&
                    reportData.summary.dueDateStatistics && (
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg print:bg-yellow-200 print:border print:border-yellow-300">
                        <div className="text-2xl font-bold text-yellow-800 print:text-yellow-900">
                          {reportData.summary.dueDateStatistics.upcoming || 0}
                        </div>
                        <div className="text-sm text-yellow-600 print:text-yellow-800">
                          Upcoming Goals
                        </div>
                      </div>
                    )}
                  {reportData.fieldSelection.summaryOverdueGoals &&
                    reportData.summary.overdueGoals !== undefined && (
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg print:bg-red-200 print:border print:border-red-300">
                        <div className="text-2xl font-bold text-red-800 print:text-red-900">
                          {reportData.summary.overdueGoals}
                        </div>
                        <div className="text-sm text-red-600 print:text-red-800">
                          Overdue Goals
                        </div>
                      </div>
                    )}
                </div>

                {/* Goals by Section */}
                {reportData.fieldSelection.summaryGoalsBySection &&
                  reportData.summary.goalsBySection && (
                    <div className="mt-6 print:mt-4">
                      <h3 className="text-md font-semibold text-gray-800 mb-3 print:text-gray-900">
                        Goals by Section
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-2">
                        {Object.entries(reportData.summary.goalsBySection).map(
                          ([sectionName, count]) => (
                            <div
                              key={sectionName}
                              className="bg-gray-50 p-3 rounded-lg print:bg-gray-100 print:border print:border-gray-300"
                            >
                              <div className="text-lg font-semibold text-gray-800 print:text-gray-900">
                                {count}
                              </div>
                              <div className="text-sm text-gray-600 print:text-gray-700">
                                {sectionName}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

          {/* Goal Records */}
          {reportData.fieldSelection?.includeGoalRecords &&
            reportData.records &&
            reportData.records.length > 0 && (
              <div className="print:page-break-before-always">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 print:text-purple-800 print:page-break-after-avoid">
                  Goal Records ({reportData.records.length})
                </h2>

                <div className="grid grid-cols-1 gap-6 print:gap-4">
                  {reportData.records.map((record, index) => (
                    <div
                      key={record.id || index}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 print:shadow-none print:border-2 print:border-gray-400 print:page-break-inside-avoid"
                    >
                      {/* Record Header */}
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200 print:bg-purple-200 print:border-b-2 print:border-purple-400">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {reportData.fieldSelection.goalName &&
                              record.goalName && (
                                <h3 className="text-lg font-semibold text-gray-900 print:text-purple-900">
                                  {record.goalName}
                                </h3>
                              )}
                            <div className="flex flex-wrap gap-4 mt-2 print:gap-2">
                              {reportData.fieldSelection.goalSection &&
                                record.sectionName && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 print:bg-blue-200 print:text-blue-900">
                                    {record.sectionName}
                                  </span>
                                )}
                              {reportData.fieldSelection.goalStatus &&
                                record.goalStatus && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 print:bg-green-200 print:text-green-900">
                                    {record.goalStatus}
                                  </span>
                                )}
                              {reportData.fieldSelection.goalCreatedDate &&
                                record.createdAt && (
                                  <span className="text-sm text-gray-600 print:text-gray-700">
                                    Created: {formatDateOnly(record.createdAt)}
                                  </span>
                                )}
                              {record.goalType && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 print:bg-purple-200 print:text-purple-900">
                                  {record.goalType}
                                </span>
                              )}
                              {record.caseName && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 print:bg-orange-200 print:text-orange-900">
                                  Case: {record.caseName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Record Content */}
                      <div className="p-6 print:p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:gap-4">
                          {/* Left Column */}
                          <div className="space-y-6 print:space-y-4">
                            {reportData.fieldSelection.goalDueDate &&
                              record.goalDueDate && (
                                <div className="print:bg-gray-50 print:p-3 print:rounded">
                                  <h4 className="font-medium text-gray-900 mb-2 print:text-gray-800">
                                    Due Date
                                  </h4>
                                  <p className="text-gray-600 print:text-gray-700">
                                    {formatDateOnly(record.goalDueDate)}
                                  </p>
                                </div>
                              )}

                            {reportData.fieldSelection.goalCompletionDate &&
                              record.completionDate && (
                                <div className="print:bg-gray-50 print:p-3 print:rounded">
                                  <h4 className="font-medium text-gray-900 mb-2 print:text-gray-800">
                                    Completion Date
                                  </h4>
                                  <p className="text-gray-600 print:text-gray-700">
                                    {formatDateOnly(record.completionDate)}
                                  </p>
                                </div>
                              )}

                            {reportData.fieldSelection.goalCreatedBy &&
                              record.createdBy && (
                                <div className="print:bg-gray-50 print:p-3 print:rounded">
                                  <h4 className="font-medium text-gray-900 mb-2 print:text-gray-800">
                                    Created By
                                  </h4>
                                  <p className="text-gray-600 print:text-gray-700">
                                    {record.createdBy.name}
                                  </p>
                                </div>
                              )}

                            {reportData.fieldSelection.outcomeTitle &&
                              record.outcomeTitle && (
                                <div className="print:bg-gray-50 print:p-3 print:rounded">
                                  <h4 className="font-medium text-gray-900 mb-2 print:text-gray-800">
                                    Outcome Title
                                  </h4>
                                  <p className="text-gray-600 print:text-gray-700">
                                    {record.outcomeTitle}
                                  </p>
                                </div>
                              )}

                            {reportData.fieldSelection.outcomeStatus &&
                              record.outcomeStatus && (
                                <div className="print:bg-gray-50 print:p-3 print:rounded">
                                  <h4 className="font-medium text-gray-900 mb-2 print:text-gray-800">
                                    Outcome Status
                                  </h4>
                                  <p className="text-gray-600 print:text-gray-700">
                                    {record.outcomeStatus}
                                  </p>
                                </div>
                              )}
                          </div>

                          {/* Right Column */}
                          <div className="space-y-6 print:space-y-4">
                            {reportData.fieldSelection.goalSteps &&
                              record.goalSteps &&
                              record.goalSteps.length > 0 && (
                                <div className="print:bg-gray-50 print:p-3 print:rounded">
                                  <h4 className="font-medium text-gray-900 mb-3 print:text-gray-800">
                                    Steps ({record.goalSteps.length})
                                  </h4>
                                  <div className="space-y-2 print:space-y-1">
                                    {record.goalSteps.map(
                                      (step: any, stepIndex: number) => (
                                        <div
                                          key={stepIndex}
                                          className="flex items-center justify-between p-2 bg-gray-50 rounded print:bg-white print:border print:border-gray-300"
                                        >
                                          <span className="text-sm text-gray-700 print:text-gray-800">
                                            {step.stepName}
                                          </span>
                                          <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                              step.complete
                                                ? "bg-green-100 text-green-800 print:bg-green-200 print:text-green-900"
                                                : "bg-yellow-100 text-yellow-800 print:bg-yellow-200 print:text-yellow-900"
                                            }`}
                                          >
                                            {step.complete
                                              ? "Complete"
                                              : "Pending"}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* No Records Message */}
          {reportData.fieldSelection?.includeGoalRecords &&
            (!reportData.records || reportData.records.length === 0) && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center print:shadow-none print:border print:border-gray-300">
                <div className="text-gray-500 text-lg mb-2">
                  No Goal Records Found
                </div>
                <p className="text-gray-400">
                  No goals match the selected filters and criteria.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedOutcomeGoalsReport;
