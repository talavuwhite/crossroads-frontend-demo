import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useReactToPrint } from "react-to-print";
import Button from "@/components/ui/Button";
import { fetchEnhancedCategoryReport } from "@/services/ReportsApi";
import type {
  CategoryReportFilters,
  CategoryReportFieldSelection,
  EnhancedCategoryReport,
} from "@/types";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

const EnhancedCategoryReport: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const printRef = useRef<HTMLDivElement>(null);

  // State
  const [reportData, setReportData] = useState<EnhancedCategoryReport | null>(
    null
  );
  const [fieldSelection, setFieldSelection] =
    useState<CategoryReportFieldSelection>({
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
      categoryCreatedBy: true,
      categoryCreatedDate: true,
      categoryUsageCount: true,
      categoryTotalAmount: true,
      categoryVisibility: true,
    });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse URL parameters
  const parseUrlParams = () => {
    const filters: CategoryReportFilters = {};
    const fieldSelection: CategoryReportFieldSelection = {};

    // Parse filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      filters.dateRange = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
    }

    const lastUpdatedStartDate = searchParams.get("lastUpdatedStartDate");
    const lastUpdatedEndDate = searchParams.get("lastUpdatedEndDate");
    if (lastUpdatedStartDate || lastUpdatedEndDate) {
      filters.lastUpdatedRange = {
        startDate: lastUpdatedStartDate || undefined,
        endDate: lastUpdatedEndDate || undefined,
      };
    }

    const sectionId = searchParams.get("sectionId");
    if (sectionId) filters.sectionId = sectionId;

    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    if (minAmount || maxAmount) {
      filters.amountRange = {
        minAmount: minAmount ? parseInt(minAmount) : undefined,
        maxAmount: maxAmount ? parseInt(maxAmount) : undefined,
      };
    }

    const visibility = searchParams.get("visibility");
    if (visibility) filters.visibility = visibility;

    const createdBy = searchParams.get("createdBy");
    if (createdBy) filters.createdBy = createdBy;

    const minUsageCount = searchParams.get("minUsageCount");
    const maxUsageCount = searchParams.get("maxUsageCount");
    if (minUsageCount || maxUsageCount) {
      filters.usageCount = {
        minCount: minUsageCount ? parseInt(minUsageCount) : undefined,
        maxCount: maxUsageCount ? parseInt(maxUsageCount) : undefined,
      };
    }

    // Parse field selection
    const orderBy = searchParams.get("orderBy");
    const orderDirection = searchParams.get("orderDirection");
    if (orderBy) fieldSelection.orderBy = orderBy;
    if (orderDirection)
      fieldSelection.orderDirection = orderDirection as "asc" | "desc";

    // Parse all boolean fields
    const booleanFields = [
      "includeReportFilters",
      "includeCategorySummary",
      "includeCategoryRecords",
      "summaryTotalCategories",
      "summaryCategoriesBySection",
      "summaryUsageStatistics",
      "categoryName",
      "categorySection",
      "categoryDescription",
      "categoryDefaultAmount",
      "categoryDefaultUnit",
      "categoryCreatedBy",
      "categoryCreatedDate",
      "categoryUsageCount",
      "categoryTotalAmount",
      "categoryVisibility",
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

        const response = await fetchEnhancedCategoryReport(
          filters,
          urlFieldSelection,
          userData.userId,
          userData.activeLocation
        );

        // Convert string fieldSelection values to booleans
        if (response.data?.fieldSelection) {
          const convertedFieldSelection: CategoryReportFieldSelection = {};
          Object.entries(response.data.fieldSelection).forEach(
            ([key, value]) => {
              if (typeof value === "string") {
                (convertedFieldSelection as any)[key] = value === "true";
              } else {
                (convertedFieldSelection as any)[key] = value;
              }
            }
          );
          setFieldSelection(convertedFieldSelection);
        } else {
          setFieldSelection(urlFieldSelection);
        }

        setReportData(response.data);
      } catch (err) {
        console.error("Error fetching category report:", err);
        setError("Failed to load category report. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [searchParams, userData]);

  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Category Report",
    onAfterPrint: () => console.log("Print completed"),
  });

  // Format date
  // const formatDate = (dateString: string) => {
  //   const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  //   return new Date(dateString).toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "long",
  //     day: "numeric",
  //     timeZone: userTimeZone,
  //   });
  // };

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading category report...</p>
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon icon="mdi:arrow-left" className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Category Report
              </h1>
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
        {/* Category Summary Section */}
        {fieldSelection.includeCategorySummary && reportData.summary && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Icon
                icon="mdi:chart-box"
                className="text-green-600 w-6 h-6 mr-3"
              />
              Category Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fieldSelection.summaryTotalCategories && (
                <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {reportData.summary.totalCategories || 0}
                  </div>
                  <p className="text-gray-600 font-medium">Total Categories</p>
                </div>
              )}

              {fieldSelection.summaryUsageStatistics &&
                reportData.summary.usageStatistics && (
                  <>
                    <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {reportData.summary.usageStatistics.totalUsage || 0}
                      </div>
                      <p className="text-gray-600 font-medium">
                        Total Usage Count
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {reportData.summary.usageStatistics.averageUsage?.toFixed(
                          1
                        ) || "0.0"}
                      </div>
                      <p className="text-gray-600 font-medium">
                        Avg Usage per Category
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-green-200 text-center hover:shadow-md transition-shadow">
                      <div
                        className="text-lg font-bold text-green-600 mb-2 truncate"
                        title={
                          reportData.summary.usageStatistics.mostUsed?.name ||
                          "N/A"
                        }
                      >
                        {reportData.summary.usageStatistics.mostUsed?.name ||
                          "N/A"}
                      </div>
                      <p className="text-gray-600 font-medium">
                        Most Used Category
                      </p>
                    </div>
                  </>
                )}
            </div>

            {/* Categories by Section */}
            {fieldSelection.summaryCategoriesBySection &&
              reportData.summary.categoriesBySection && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Icon
                      icon="mdi:chart-pie"
                      className="text-green-600 w-5 h-5 mr-2"
                    />
                    Categories by Section
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(reportData.summary.categoriesBySection).map(
                      ([section, count]) => (
                        <div
                          key={section}
                          className="bg-white rounded-xl p-4 border border-green-200 hover:shadow-md transition-shadow"
                        >
                          <p className="font-semibold text-gray-800 mb-1">
                            {section}
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

            {/* Usage Breakdown */}
            {fieldSelection.summaryUsageStatistics &&
              reportData.summary.usageStatistics?.usageBreakdown && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Icon
                      icon="mdi:chart-bar"
                      className="text-green-600 w-5 h-5 mr-2"
                    />
                    Usage Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-green-200 text-center hover:shadow-md transition-shadow">
                      <p className="font-semibold text-gray-800 mb-1">
                        Assistance Usage
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {
                          reportData.summary.usageStatistics.usageBreakdown
                            .assistanceUsage
                        }
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-green-200 text-center hover:shadow-md transition-shadow">
                      <p className="font-semibold text-gray-800 mb-1">
                        Referral Usage
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {
                          reportData.summary.usageStatistics.usageBreakdown
                            .referralUsage
                        }
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-green-200 text-center hover:shadow-md transition-shadow">
                      <p className="font-semibold text-gray-800 mb-1">
                        Referral Assistance
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {
                          reportData.summary.usageStatistics.usageBreakdown
                            .referralAssistanceUsage
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Category Records Section */}
        {fieldSelection.includeCategoryRecords &&
          reportData.records &&
          reportData.records.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Icon
                  icon="mdi:format-list-bulleted"
                  className="text-purple-600 w-6 h-6 mr-3"
                />
                Category Records ({reportData.records.length})
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
                            {record.categoryName || "Unnamed Category"}
                          </h3>
                          {record.categoryDescription && (
                            <p className="text-gray-600 mt-1">
                              {record.categoryDescription}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                          {record.categorySection || "No Section"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4 md:border-r md:border-purple-100 md:pr-6">
                        <h4 className="font-semibold text-purple text-sm uppercase tracking-wide mb-3 border-b border-purple-100 md:border-b-0">
                          Basic Information
                        </h4>

                        {record.categoryDefaultAmount !== undefined && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">
                              Default Amount:
                            </span>
                            <span className="font-semibold text-gray-800">
                              {record.categoryDefaultAmount > 0
                                ? formatCurrency(record.categoryDefaultAmount)
                                : "No Default Amount"}
                            </span>
                          </div>
                        )}

                        {record.categoryDefaultUnit && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Default Unit:</span>
                            <span className="font-semibold text-gray-800">
                              {record.categoryDefaultUnit}
                            </span>
                          </div>
                        )}

                        {record.categoryVisibility && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Visibility:</span>
                            <span className="font-semibold text-gray-800">
                              {record.categoryVisibility}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Usage Statistics */}
                      <div className="space-y-4 md:border-r md:border-purple-100 md:pr-6">
                        <h4 className="font-semibold text-purple text-sm uppercase tracking-wide mb-3 border-b border-purple-100 md:border-b-0">
                          Usage Statistics
                        </h4>

                        {record.categoryUsageCount !== undefined && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Usage Count:</span>
                            <span className="font-semibold text-gray-800">
                              {record.categoryUsageCount > 0
                                ? record.categoryUsageCount
                                : "No Usage"}
                            </span>
                          </div>
                        )}

                        {record.categoryTotalAmount !== undefined && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-semibold text-gray-800">
                              {record.categoryTotalAmount > 0
                                ? formatCurrency(record.categoryTotalAmount)
                                : "No Amount"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Creation Details */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-purple text-sm uppercase tracking-wide mb-3 border-b border-purple-100 md:border-b-0">
                          Creation Details
                        </h4>

                        {record.categoryCreatedBy && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Created By:</span>
                            <span className="font-semibold text-gray-800">
                              {record.categoryCreatedBy}
                            </span>
                          </div>
                        )}

                        {record.categoryCreatedDate && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Created Date:</span>
                            <span className="font-semibold text-gray-800">
                              {formatDateTime(record.categoryCreatedDate)}
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

export default EnhancedCategoryReport;
