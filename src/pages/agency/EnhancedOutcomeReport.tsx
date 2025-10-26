import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { fetchEnhancedOutcomeReport } from "@/services/ReportsApi";
import type { EnhancedOutcomeReport } from "@/types";
import Button from "@/components/ui/Button";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";

const EnhancedOutcomeReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const printRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState<EnhancedOutcomeReport | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format date with user timezone
  const formatDateWithTimezone = (
    dateString: string,
    options?: Intl.DateTimeFormatOptions
  ) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        timeZone: userTimeZone,
        ...options,
      });
    } catch {
      return dateString;
    }
  };

  // Format date for display (date only)
  const formatDateOnly = (dateString: string) => {
    return formatDateWithTimezone(dateString, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    return formatDateWithTimezone(dateString, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Outcome Case Report - ${formatDateOnly(
      new Date().toISOString()
    )}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .print-break {
          page-break-before: always;
        }
        .print-break-inside-avoid {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .print-break-after-avoid {
          page-break-after: avoid;
        }
        .print\\:page-break-before-always {
          page-break-before: always !important;
        }
        .page-number {
          position: fixed;
          bottom: 0.5in;
          right: 0.5in;
          font-size: 12px;
          font-weight: bold;
          color: #666;
        }
        .page-number::after {
          content: counter(page);
        }
        .total-pages::after {
          content: counter(pages);
        }
        .page-info {
          position: fixed;
          bottom: 0.5in;
          left: 0.5in;
          font-size: 12px;
          color: #666;
        }
        .page-info::after {
          content: "Page " counter(page) " of " counter(pages);
        }
      }
    `,
  });

  useEffect(() => {
    const loadReport = async () => {
      if (!userData) {
        toast.error("Please login in GHL to continue");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Extract filters from URL params
        const filters: any = {};
        const fieldSelection: any = {};

        // Try to parse JSON-encoded parameters first
        const filtersParam = searchParams.get("filters");
        const fieldSelectionParam = searchParams.get("fieldSelection");

        if (filtersParam) {
          try {
            Object.assign(
              filters,
              JSON.parse(decodeURIComponent(filtersParam))
            );
          } catch (error) {
            console.error("Error parsing filters JSON:", error);
          }
        }

        if (fieldSelectionParam) {
          try {
            Object.assign(
              fieldSelection,
              JSON.parse(decodeURIComponent(fieldSelectionParam))
            );
          } catch (error) {
            console.error("Error parsing fieldSelection JSON:", error);
          }
        }

        const response = await fetchEnhancedOutcomeReport(
          filters,
          fieldSelection,
          userData.userId,
          userData.activeLocation
        );
        const reportDataWithFieldSelection = {
          ...response.data.data,
          fieldSelection: fieldSelection,
          filters: filters, // Use the filters from URL parameters instead of empty filters from API
        };

        setReportData(reportDataWithFieldSelection);
      } catch (error) {
        console.error("Error loading report:", error);
        setError("Failed to load report. Please try again.");
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [searchParams, userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading outcome report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon
            icon="mdi:alert-circle"
            className="text-red-500 text-4xl mx-auto mb-4"
          />
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            label="Try Again"
            onClick={() => window.location.reload()}
            variant="default"
          />
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon
            icon="mdi:file-document-outline"
            className="text-gray-400 text-4xl mx-auto mb-4"
          />
          <p className="text-gray-600">No report data available</p>
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
                Outcome Case Report
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
          {/* Outcome Summary */}
          {reportData.fieldSelection?.includeOutcomeSummary &&
            reportData.summary && (
              <div className="bg-white rounded-lg shadow-sm p-6 print:shadow-none print:border print:border-gray-300 print:page-break-inside-avoid">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 print:text-purple-800">
                  Outcome Summary
                </h2>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:gap-3">
                  {reportData.summary.totalOutcomes !== undefined && (
                    <div className="bg-purple-50 p-4 rounded-lg print:bg-purple-100 print:border print:border-purple-300">
                      <dt className="text-sm font-medium text-purple-600 print:text-purple-800">
                        Total Outcomes
                      </dt>
                      <dd className="text-2xl font-bold text-purple-900 mt-1 print:text-2xl">
                        {reportData.summary.totalOutcomes}
                      </dd>
                    </div>
                  )}

                  {reportData.summary.completionRates?.completionRate !==
                    undefined && (
                    <div className="bg-green-50 p-4 rounded-lg print:bg-green-100 print:border print:border-green-300">
                      <dt className="text-sm font-medium text-green-600 print:text-green-800">
                        Completion Rate
                      </dt>
                      <dd className="text-2xl font-bold text-green-900 mt-1 print:text-2xl">
                        {reportData.summary.completionRates.completionRate}%
                      </dd>
                    </div>
                  )}

                  {reportData.summary.dueDateStatistics?.overdue !==
                    undefined && (
                    <div className="bg-red-50 p-4 rounded-lg print:bg-red-100 print:border print:border-red-300">
                      <dt className="text-sm font-medium text-red-600 print:text-red-800">
                        Overdue Goals
                      </dt>
                      <dd className="text-2xl font-bold text-red-900 mt-1 print:text-2xl">
                        {reportData.summary.dueDateStatistics.overdue}
                      </dd>
                    </div>
                  )}

                  {reportData.summary.dueDateStatistics?.upcoming !==
                    undefined && (
                    <div className="bg-blue-50 p-4 rounded-lg print:bg-blue-100 print:border print:border-blue-300">
                      <dt className="text-sm font-medium text-blue-600 print:text-blue-800">
                        Upcoming Due Dates
                      </dt>
                      <dd className="text-2xl font-bold text-blue-900 mt-1 print:text-2xl">
                        {reportData.summary.dueDateStatistics.upcoming}
                      </dd>
                    </div>
                  )}
                </div>

                {/* Outcomes by Status */}
                {reportData.summary.outcomesByStatus && (
                  <div className="mb-6 print:page-break-inside-avoid">
                    <h3 className="text-md font-medium text-gray-800 mb-3 print:text-purple-800">
                      Outcomes by Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-3">
                      {Object.entries(reportData.summary.outcomesByStatus).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="bg-gray-50 p-3 rounded print:bg-gray-100 print:border print:border-gray-300"
                          >
                            <dt className="text-sm font-medium text-gray-600 capitalize print:text-gray-800">
                              {status.replace(/_/g, " ")}
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900 mt-1 print:text-xl">
                              {count}
                            </dd>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Goals by Status */}
                {reportData.summary.goalsByStatus && (
                  <div className="mb-6 print:page-break-inside-avoid">
                    <h3 className="text-md font-medium text-gray-800 mb-3 print:text-purple-800">
                      Goals by Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-3">
                      {Object.entries(reportData.summary.goalsByStatus).map(
                        ([status, count]) => (
                          <div
                            key={status}
                            className="bg-gray-50 p-3 rounded print:bg-gray-100 print:border print:border-gray-300"
                          >
                            <dt className="text-sm font-medium text-gray-600 capitalize print:text-gray-800">
                              {status.replace(/_/g, " ")}
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900 mt-1 print:text-xl">
                              {count}
                            </dd>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Due Date Statistics */}
                {reportData.summary.dueDateStatistics && (
                  <div className="print:page-break-inside-avoid">
                    <h3 className="text-md font-medium text-gray-800 mb-3 print:text-purple-800">
                      Due Date Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:gap-3">
                      {Object.entries(reportData.summary.dueDateStatistics).map(
                        ([period, count]) => (
                          <div
                            key={period}
                            className="bg-gray-50 p-3 rounded print:bg-gray-100 print:border print:border-gray-300"
                          >
                            <dt className="text-sm font-medium text-gray-600 capitalize print:text-gray-800">
                              {period.replace(/_/g, " ")}
                            </dt>
                            <dd className="text-lg font-semibold text-gray-900 mt-1 print:text-xl">
                              {count}
                            </dd>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Outcome Records */}
          {reportData.fieldSelection?.includeOutcomeRecords &&
            reportData.records && (
              <div className="print:page-break-before-always">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 print:text-purple-800 print:page-break-after-avoid">
                  Outcome Records ({reportData.records.length})
                </h2>

                <div className="grid grid-cols-1 gap-6 print:gap-4">
                  {reportData.records.map((record, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 print:shadow-none print:border-2 print:border-gray-400 print:page-break-inside-avoid"
                    >
                      {/* Record Header */}
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200 print:bg-purple-200 print:border-b-2 print:border-purple-400">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 print:text-purple-900">
                              {record.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 print:gap-3 print:text-xs">
                              {reportData.fieldSelection?.outcomeStatus && (
                                <span
                                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                    record.status === "CLOSED"
                                      ? "bg-green-100 text-green-800 border border-green-200 print:bg-green-200 print:border-green-400"
                                      : record.status === "IN_PROCESS"
                                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200 print:bg-yellow-200 print:border-yellow-400"
                                      : "bg-gray-100 text-gray-800 border border-gray-200 print:bg-gray-200 print:border-gray-400"
                                  }`}
                                >
                                  {record.status?.replace(/_/g, " ")}
                                </span>
                              )}
                              {reportData.fieldSelection?.outcomeCase &&
                                record.case && (
                                  <span className="flex items-center gap-1">
                                    <Icon
                                      icon="mdi:account"
                                      className="text-gray-400 print:hidden"
                                    />
                                    {record.case.firstName}{" "}
                                    {record.case.lastName} (Age:{" "}
                                    {record.case.age})
                                  </span>
                                )}
                              {reportData.fieldSelection?.outcomeCreatedBy &&
                                record.createdBy && (
                                  <span className="flex items-center gap-1">
                                    <Icon
                                      icon="mdi:account-edit"
                                      className="text-gray-400 print:hidden"
                                    />
                                    Created by {record.createdBy.name}
                                  </span>
                                )}
                              {reportData.fieldSelection?.outcomeCreatedDate &&
                                record.createdAt && (
                                  <span className="flex items-center gap-1">
                                    <Icon
                                      icon="mdi:calendar"
                                      className="text-gray-400 print:hidden"
                                    />
                                    {formatDateOnly(record.createdAt)}
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
                            {/* Sections */}
                            {reportData.fieldSelection?.outcomeSections && (
                              <div className="print:page-break-inside-avoid">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 print:text-purple-800">
                                  <Icon
                                    icon="mdi:folder-multiple"
                                    className="text-purple-500 print:text-purple-700"
                                  />
                                  Sections ({record.sections?.length || 0})
                                </h4>
                                {record.sections &&
                                record.sections.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 print:gap-1">
                                    {record.sections.map(
                                      (section: any, idx: number) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 print:bg-purple-200 print:border-purple-400 print:text-purple-900"
                                        >
                                          {section.sectionName}
                                        </span>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-sm print:text-gray-600">
                                    No sections
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Goals */}
                            {reportData.fieldSelection?.outcomeGoals && (
                              <div className="print:page-break-inside-avoid">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 print:text-purple-800">
                                  <Icon
                                    icon="mdi:target"
                                    className="text-blue-500 print:text-blue-700"
                                  />
                                  Goals ({record.totalGoals || 0})
                                </h4>
                                {record.sections &&
                                record.sections.length > 0 ? (
                                  <div className="space-y-4 print:space-y-3">
                                    {record.sections.map(
                                      (section: any, sectionIdx: number) => (
                                        <div
                                          key={sectionIdx}
                                          className="bg-blue-50 rounded-lg p-4 border border-blue-100 print:bg-blue-100 print:border-blue-300"
                                        >
                                          <h5 className="text-sm font-semibold text-blue-800 mb-3 print:text-blue-900">
                                            {section.sectionName}
                                          </h5>
                                          {section.goals &&
                                          section.goals.length > 0 ? (
                                            <div className="space-y-2 print:space-y-1">
                                              {section.goals.map(
                                                (
                                                  goal: any,
                                                  goalIdx: number
                                                ) => (
                                                  <div
                                                    key={goalIdx}
                                                    className="bg-white rounded-md p-3 border border-blue-200 print:bg-white print:border-blue-400"
                                                  >
                                                    <div className="flex items-start justify-between">
                                                      <div className="flex-1">
                                                        <div className="text-sm font-medium text-gray-900 print:text-gray-800">
                                                          {goal.goalName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1 print:text-gray-600">
                                                          {goal.isCustom
                                                            ? "Custom Goal"
                                                            : "Standard Goal"}
                                                        </div>
                                                      </div>
                                                      {goal.steps &&
                                                        goal.steps.length >
                                                          0 && (
                                                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded print:bg-gray-200 print:text-gray-800">
                                                            {goal.steps.length}{" "}
                                                            steps
                                                          </span>
                                                        )}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-gray-400 text-sm italic print:text-gray-600">
                                              No goals in this section
                                            </p>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-sm print:text-gray-600">
                                    No goals
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right Column */}
                          <div className="space-y-6 print:space-y-4">
                            {/* Due Dates */}
                            {reportData.fieldSelection?.outcomeDueDates && (
                              <div className="print:page-break-inside-avoid">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 print:text-purple-800">
                                  <Icon
                                    icon="mdi:calendar-clock"
                                    className="text-orange-500 print:text-orange-700"
                                  />
                                  Due Dates ({record.dueDates?.length || 0})
                                </h4>
                                {record.dueDates &&
                                record.dueDates.length > 0 ? (
                                  <div className="space-y-3 print:space-y-2">
                                    {record.dueDates.map(
                                      (dueDate: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="bg-orange-50 rounded-lg p-4 border border-orange-200 print:bg-orange-100 print:border-orange-300"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="text-sm font-semibold text-orange-800 print:text-orange-900">
                                                {dueDate.goalName}
                                              </div>
                                              <div className="text-xs text-orange-600 mt-1 print:text-orange-700">
                                                Due:{" "}
                                                {formatDateOnly(
                                                  dueDate.dueDate
                                                )}
                                              </div>
                                            </div>
                                            <Icon
                                              icon="mdi:clock-outline"
                                              className="text-orange-400 print:hidden"
                                            />
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-sm print:text-gray-600">
                                    No due dates
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Comments */}
                            {reportData.fieldSelection?.outcomeComments && (
                              <div className="print:page-break-inside-avoid">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 print:text-purple-800">
                                  <Icon
                                    icon="mdi:comment-multiple"
                                    className="text-green-500 print:text-green-700"
                                  />
                                  Comments ({record.comments?.length || 0})
                                </h4>
                                {record.comments &&
                                record.comments.length > 0 ? (
                                  <div className="space-y-3 max-h-60 overflow-y-auto print:max-h-none print:space-y-2">
                                    {record.comments.map(
                                      (comment: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="bg-green-50 rounded-lg p-4 border border-green-200 print:bg-green-100 print:border-green-300"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 print:hidden">
                                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <Icon
                                                  icon="mdi:account"
                                                  className="text-green-600 text-sm"
                                                />
                                              </div>
                                            </div>
                                            <div className="flex-1">
                                              <div className="text-sm font-semibold text-green-800 mb-1 print:text-green-900">
                                                {comment.createdBy.name}
                                              </div>
                                              <div className="text-sm text-green-700 mb-2 print:text-green-800">
                                                "{comment.text}"
                                              </div>
                                              <div className="text-xs text-green-600 print:text-green-700">
                                                {formatDateTime(
                                                  comment.createdAt
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 text-sm print:text-gray-600">
                                    No comments
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Additional Info */}
                            <div className="bg-gray-50 rounded-lg p-4 print:bg-gray-100 print:border print:border-gray-300">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 print:text-purple-800">
                                <Icon
                                  icon="mdi:information"
                                  className="text-gray-500 print:text-gray-700"
                                />
                                Summary
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm print:gap-3">
                                <div>
                                  <div className="text-gray-500 print:text-gray-700">
                                    Total Goals
                                  </div>
                                  <div className="font-semibold text-gray-900 print:text-gray-800">
                                    {record.totalGoals || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 print:text-gray-700">
                                    Completed
                                  </div>
                                  <div className="font-semibold text-green-600 print:text-green-800">
                                    {record.completedGoals || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 print:text-gray-700">
                                    Overdue
                                  </div>
                                  <div className="font-semibold text-red-600 print:text-red-800">
                                    {record.overdueGoals || 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 print:text-gray-700">
                                    Completion Rate
                                  </div>
                                  <div className="font-semibold text-blue-600 print:text-blue-800">
                                    {record.completionRate || 0}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedOutcomeReport;
