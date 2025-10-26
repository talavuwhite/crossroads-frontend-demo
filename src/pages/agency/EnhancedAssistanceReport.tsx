import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { fetchEnhancedAssistanceReport } from "@/services/ReportsApi";
import type {
  EnhancedAssistanceReport,
  AssistanceReportFilters,
  AssistanceReportFieldSelection,
} from "@/types";
import Button from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

const EnhancedAssistanceReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const printRef = useRef<HTMLDivElement>(null);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Assistance Report - ${formatDate(
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
      if (!userData) return;

      try {
        setLoading(true);
        setError(null);

        // Parse filters from URL params
        const filters: AssistanceReportFilters = {};

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        if (startDate || endDate) {
          filters.dateRange = {};
          if (startDate) filters.dateRange.startDate = startDate;
          if (endDate) filters.dateRange.endDate = endDate;
        }

        const minAmount = searchParams.get("minAmount");
        const maxAmount = searchParams.get("maxAmount");
        if (minAmount || maxAmount) {
          filters.amountRange = {};
          if (minAmount) filters.amountRange.minAmount = parseFloat(minAmount);
          if (maxAmount) filters.amountRange.maxAmount = parseFloat(maxAmount);
        }

        const minAge = searchParams.get("minAge");
        const maxAge = searchParams.get("maxAge");
        const gender = searchParams.get("gender");
        if (minAge || maxAge || gender) {
          filters.demographics = {};
          if (minAge) filters.demographics.minAge = parseInt(minAge);
          if (maxAge) filters.demographics.maxAge = parseInt(maxAge);
          if (gender) filters.demographics.gender = gender;
        }

        const county = searchParams.get("county");
        const zipCode = searchParams.get("zipCode");
        const city = searchParams.get("city");
        if (county || zipCode || city) {
          filters.location = {};
          if (county) filters.location.county = county;
          if (zipCode) filters.location.zipCode = zipCode;
          if (city) filters.location.city = city;
        }

        const createdBy = searchParams.get("createdBy");
        if (createdBy) filters.createdBy = createdBy;

        const categoryId = searchParams.get("categoryId");
        if (categoryId) filters.categoryId = categoryId;

        // Parse field selection from URL params
        const fieldSelection: AssistanceReportFieldSelection = {
          orderBy: searchParams.get("orderBy") || "createdAt",
          orderDirection:
            (searchParams.get("orderDirection") as "asc" | "desc") || "desc",
          includeAssistanceSummary:
            searchParams.get("includeAssistanceSummary") === "true",
          includeAssistanceRecord:
            searchParams.get("includeAssistanceRecord") === "true",
          summaryAssistanceAmount:
            searchParams.get("summaryAssistanceAmount") === "true",
          summaryAssistanceCount:
            searchParams.get("summaryAssistanceCount") === "true",
          summaryCaseCount: searchParams.get("summaryCaseCount") === "true",
          summaryHouseholdCount:
            searchParams.get("summaryHouseholdCount") === "true",
          summaryAgeRanges: searchParams.get("summaryAgeRanges") === "true",
          summaryHouseholdAgeRanges:
            searchParams.get("summaryHouseholdAgeRanges") === "true",
          caseNumber: searchParams.get("caseNumber") === "true",
          caseFullName: searchParams.get("caseFullName") === "true",
          caseCounty: searchParams.get("caseCounty") === "true",
          caseStreetAddress: searchParams.get("caseStreetAddress") === "true",
          caseDateOfBirth: searchParams.get("caseDateOfBirth") === "true",
          casePhoneNumbers: searchParams.get("casePhoneNumbers") === "true",
          caseEntryDate: searchParams.get("caseEntryDate") === "true",
          casePersonalIncome: searchParams.get("casePersonalIncome") === "true",
          assistanceDate: searchParams.get("assistanceDate") === "true",
          assistanceAgentName:
            searchParams.get("assistanceAgentName") === "true",
          assistanceAgencyName:
            searchParams.get("assistanceAgencyName") === "true",
          assistanceCategory: searchParams.get("assistanceCategory") === "true",
          assistanceAmount: searchParams.get("assistanceAmount") === "true",
          assistanceUnit: searchParams.get("assistanceUnit") === "true",
          assistanceDescription:
            searchParams.get("assistanceDescription") === "true",
          assistanceOtherFields:
            searchParams.get("assistanceOtherFields") === "true",
        };

        const response = await fetchEnhancedAssistanceReport(
          filters,
          fieldSelection,
          userData.userId,
          userData.activeLocation
        );

        setReportData(response.data);
      } catch (err) {
        console.error("Error loading enhanced assistance report:", err);
        setError("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [searchParams, userData]);

  const handleBack = () => {
    navigate("/myAgency/reports");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPhoneNumbers = (phoneNumbers: any[]) => {
    if (!phoneNumbers || phoneNumbers.length === 0) return "-";
    return phoneNumbers
      .map((phone) => `${phone.description}: ${phone.number}`)
      .join(", ");
  };

  const formatStreetAddress = (addressObj: any) => {
    if (!addressObj) return "-";

    // If it's already a string, return as is
    if (typeof addressObj === "string") return addressObj;

    // If it's an object, format it
    if (typeof addressObj === "object") {
      const parts = [];
      if (addressObj.address) parts.push(addressObj.address);
      if (addressObj.apt) parts.push(`Apt ${addressObj.apt}`);
      if (addressObj.city) parts.push(addressObj.city);
      if (addressObj.state) parts.push(addressObj.state);
      if (addressObj.zip) parts.push(addressObj.zip);

      return parts.join(", ");
    }

    return "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <Button label="Go Back" onClick={handleBack} variant="default" />
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-4">
            No report data available
          </div>
          <Button label="Go Back" onClick={handleBack} variant="default" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 print:bg-white print:p-0">
      <div ref={printRef} className="max-w-7xl mx-auto relative">
        {/* Page numbering for print */}
        <div className="hidden print:block page-info"></div>
        <div className="hidden print:block page-number"></div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 print:shadow-none print:border-b-4 print:border-purple-600 print:mb-6 print:page-break-after-avoid">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent print:text-purple-800 print:bg-none">
                Assistance Report
              </h1>
              <p className="text-gray-600 mt-3 text-lg print:text-base">
                Generated on {formatDate(new Date().toISOString())}
              </p>
            </div>
            <div className="flex gap-3 print:hidden">
              <Button label="Back" onClick={handleBack} variant="default" />
              <Button
                label="Print"
                onClick={handlePrint}
                variant="submitStyle"
              />
            </div>
          </div>
        </div>

        {/* Summary Section */}
        {reportData.summary &&
          reportData.fieldSelection?.includeAssistanceSummary && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 print:shadow-none print:border-2 print:border-purple-200 print:mb-6 print:page-break-after-avoid">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 print:text-2xl">
                📊 Summary Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {reportData.fieldSelection.summaryAssistanceAmount &&
                  reportData.summary.totalAssistanceAmount !== undefined && (
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-emerald-500 print:to-teal-600 print:text-white print:border-2 print:border-emerald-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        {formatCurrency(
                          reportData.summary.totalAssistanceAmount
                        )}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Total Assistance Amount
                      </div>
                    </div>
                  )}
                {reportData.fieldSelection.summaryAssistanceCount &&
                  reportData.summary.totalAssistanceCount !== undefined && (
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-blue-500 print:to-indigo-600 print:text-white print:border-2 print:border-blue-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        {reportData.summary.totalAssistanceCount}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Total Assistance Count
                      </div>
                    </div>
                  )}
                {reportData.fieldSelection.summaryCaseCount &&
                  reportData.summary.uniqueCaseCount !== undefined && (
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-purple-500 print:to-violet-600 print:text-white print:border-2 print:border-purple-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        {reportData.summary.uniqueCaseCount}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Unique Cases
                      </div>
                    </div>
                  )}
                {reportData.fieldSelection.summaryHouseholdCount &&
                  reportData.summary.uniqueHouseholdCount !== undefined && (
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-orange-500 print:to-red-500 print:text-white print:border-2 print:border-orange-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        {reportData.summary.uniqueHouseholdCount}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Unique Households
                      </div>
                    </div>
                  )}
              </div>

              {/* Age Ranges */}
              {reportData.fieldSelection.summaryAgeRanges &&
                reportData.summary.ageRanges && (
                  <div className="mb-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 print:text-xl">
                      👥 Age Distribution
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {Object.entries(reportData.summary.ageRanges).map(
                        ([range, count]) => (
                          <div
                            key={range}
                            className="bg-gradient-to-br from-gray-100 to-gray-200 p-5 rounded-xl text-center print:bg-gradient-to-br print:from-gray-100 print:to-gray-200 print:border-2 print:border-gray-300"
                          >
                            <div className="text-3xl font-bold text-gray-800 print:text-2xl">
                              {count as number}
                            </div>
                            <div className="text-sm font-medium text-gray-600 mt-2 print:text-xs">
                              {range}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Household Age Ranges */}
              {reportData.fieldSelection.summaryHouseholdAgeRanges &&
                reportData.summary.householdAgeRanges && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 print:text-xl">
                      🏠 Household Size Distribution
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(
                        reportData.summary.householdAgeRanges
                      ).map(([size, count]) => (
                        <div
                          key={size}
                          className="bg-gradient-to-br from-gray-100 to-gray-200 p-5 rounded-xl text-center print:bg-gradient-to-br print:from-gray-100 print:to-gray-200 print:border-2 print:border-gray-300"
                        >
                          <div className="text-3xl font-bold text-gray-800 print:text-2xl">
                            {count as number}
                          </div>
                          <div className="text-sm font-medium text-gray-600 mt-2 print:text-xs">
                            {size === "5+"
                              ? "5+ members"
                              : `${size} member${size === "1" ? "" : "s"}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

        {/* Records Section */}
        {reportData.records &&
          reportData.records.length > 0 &&
          reportData.fieldSelection?.includeAssistanceRecord && (
            <div className="bg-white rounded-2xl shadow-xl p-8 print:shadow-none print:border-2 print:border-purple-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 print:text-2xl print:page-break-after-avoid">
                📋 Assistance Records ({reportData.records.length} records)
              </h2>
              <div className="space-y-8">
                {reportData.records.map((record: any, index: number) => (
                  <div
                    key={index}
                    className={`bg-gradient-to-br from-gray-50 to-white border-2 border-purple-200 rounded-2xl p-6 print:bg-gradient-to-br print:from-gray-50 print:to-white print:border-2 print:border-purple-300 print:break-inside-avoid print:page-break-inside-avoid print:mb-6 ${
                      index > 0 ? "print:page-break-before-always" : ""
                    }`}
                  >
                    {/* Record number indicator */}
                    <div className="hidden print:block mb-4 pb-2 border-b border-purple-300">
                      <span className="text-sm font-bold text-purple-700">
                        Record #{index + 1} of {reportData.records.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Case Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl print:bg-gradient-to-br print:from-blue-50 print:to-indigo-50 print:border print:border-blue-200">
                        <h3 className="text-xl font-bold text-blue-800 border-b-2 border-blue-300 pb-3 mb-4 print:text-lg">
                          👤 Case Information
                        </h3>
                        <div className="space-y-4">
                          {reportData.fieldSelection.caseNumber && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Case Number:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseNumber || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseFullName && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Full Name:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseFullName || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseCounty && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                County:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseCounty || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseStreetAddress && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Street Address:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatStreetAddress(record.caseStreetAddress)}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseDateOfBirth && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Date of Birth:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseDateOfBirth
                                  ? formatDate(record.caseDateOfBirth)
                                  : "-"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Case Information */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl print:bg-gradient-to-br print:from-green-50 print:to-emerald-50 print:border print:border-green-200">
                        <h3 className="text-xl font-bold text-green-800 border-b-2 border-green-300 pb-3 mb-4 print:text-lg">
                          📞 Additional Case Info
                        </h3>
                        <div className="space-y-4">
                          {reportData.fieldSelection.casePhoneNumbers && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-green-700 print:text-xs">
                                Phone Numbers:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatPhoneNumbers(record.casePhoneNumbers)}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseEntryDate && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-green-700 print:text-xs">
                                Entry Date:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseEntryDate
                                  ? formatDate(record.caseEntryDate)
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.casePersonalIncome && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-green-700 print:text-xs">
                                Personal Income:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.casePersonalIncome
                                  ? formatCurrency(record.casePersonalIncome)
                                  : "-"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assistance Information */}
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl print:bg-gradient-to-br print:from-purple-50 print:to-violet-50 print:border print:border-purple-200">
                        <h3 className="text-xl font-bold text-purple-800 border-b-2 border-purple-300 pb-3 mb-4 print:text-lg">
                          💰 Assistance Information
                        </h3>
                        <div className="space-y-4">
                          {reportData.fieldSelection.assistanceDate && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Assistance Date:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.assistanceDate
                                  ? formatDate(record.assistanceDate)
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.assistanceAgentName && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Created By:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.assistanceAgentName || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.assistanceAgencyName && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Agency Name:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.assistanceAgencyName || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.assistanceCategory && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Category:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.assistanceCategory || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.assistanceAmount && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Amount:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.assistanceAmount
                                  ? formatCurrency(record.assistanceAmount)
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.assistanceUnit && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Unit:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.assistanceUnit || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.assistanceDescription && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Description:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.assistanceDescription || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.assistanceOtherFields && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Visible To:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.assistanceVisibleTo || "-"}
                              </p>
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

        {/* No Records */}
        {(!reportData.records || reportData.records.length === 0) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center print:shadow-none print:border-2 print:border-purple-200">
            <div className="text-gray-500 text-xl">
              No assistance records found matching the criteria
            </div>
          </div>
        )}
      </div>

      {/* Print-specific CSS to ensure exact same appearance */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          
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
          
          .print\\:bg-gradient-to-br {
            background: linear-gradient(to bottom right, var(--tw-gradient-stops)) !important;
          }
          
          .print\\:from-emerald-500 {
            --tw-gradient-from: #10b981 !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(16, 185, 129, 0)) !important;
          }
          
          .print\\:to-teal-600 {
            --tw-gradient-to: #0d9488 !important;
          }
          
          .print\\:from-blue-500 {
            --tw-gradient-from: #3b82f6 !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0)) !important;
          }
          
          .print\\:to-indigo-600 {
            --tw-gradient-to: #4f46e5 !important;
          }
          
          .print\\:from-purple-500 {
            --tw-gradient-from: #8b5cf6 !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(139, 92, 246, 0)) !important;
          }
          
          .print\\:to-violet-600 {
            --tw-gradient-to: #7c3aed !important;
          }
          
          .print\\:from-orange-500 {
            --tw-gradient-from: #f97316 !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 115, 22, 0)) !important;
          }
          
          .print\\:to-red-500 {
            --tw-gradient-to: #ef4444 !important;
          }
          
          .print\\:from-gray-100 {
            --tw-gradient-from: #f3f4f6 !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(243, 244, 246, 0)) !important;
          }
          
          .print\\:to-gray-200 {
            --tw-gradient-to: #e5e7eb !important;
          }
          
          .print\\:from-blue-50 {
            --tw-gradient-from: #eff6ff !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(239, 246, 255, 0)) !important;
          }
          
          .print\\:to-indigo-50 {
            --tw-gradient-to: #eef2ff !important;
          }
          
          .print\\:from-green-50 {
            --tw-gradient-from: #f0fdf4 !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(240, 253, 244, 0)) !important;
          }
          
          .print\\:to-emerald-50 {
            --tw-gradient-to: #ecfdf5 !important;
          }
          
          .print\\:from-purple-50 {
            --tw-gradient-from: #faf5ff !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(250, 245, 255, 0)) !important;
          }
          
          .print\\:to-violet-50 {
            --tw-gradient-to: #f5f3ff !important;
          }
          
          .print\\:from-gray-50 {
            --tw-gradient-from: #f9fafb !important;
            --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 250, 251, 0)) !important;
          }
          
          .print\\:to-white {
            --tw-gradient-to: #ffffff !important;
          }
          
          .print\\:text-white {
            color: #ffffff !important;
          }
          
          .print\\:text-blue-700 {
            color: #1d4ed8 !important;
          }
          
          .print\\:text-green-700 {
            color: #15803d !important;
          }
          
          .print\\:text-purple-700 {
            color: #7c3aed !important;
          }
          
          .print\\:text-blue-800 {
            color: #1e40af !important;
          }
          
          .print\\:text-green-800 {
            color: #166534 !important;
          }
          
          .print\\:text-purple-800 {
            color: #5b21b6 !important;
          }
          
          .print\\:border-purple-600 {
            border-color: #9333ea !important;
          }
          
          .print\\:border-purple-200 {
            border-color: #e9d5ff !important;
          }
          
          .print\\:border-purple-300 {
            border-color: #d8b4fe !important;
          }
          
          .print\\:border-emerald-300 {
            border-color: #6ee7b7 !important;
          }
          
          .print\\:border-blue-300 {
            border-color: #93c5fd !important;
          }
          
          .print\\:border-orange-300 {
            border-color: #fdba74 !important;
          }
          
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          
          .print\\:border-blue-200 {
            border-color: #bfdbfe !important;
          }
          
          .print\\:border-green-200 {
            border-color: #bbf7d0 !important;
          }
          
          .print\\:border-gray-200 {
            border-color: #e5e7eb !important;
          }
          
          .print\\:rounded-2xl {
            border-radius: 1rem !important;
          }
          
          .print\\:rounded-xl {
            border-radius: 0.75rem !important;
          }
          
          .print\\:rounded-lg {
            border-radius: 0.5rem !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:p-8 {
            padding: 2rem !important;
          }
          
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          
          .print\\:p-5 {
            padding: 1.25rem !important;
          }
          
          .print\\:p-3 {
            padding: 0.75rem !important;
          }
          
          .print\\:mb-8 {
            margin-bottom: 2rem !important;
          }
          
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          
          .print\\:mb-10 {
            margin-bottom: 2.5rem !important;
          }
          
          .print\\:gap-6 {
            gap: 1.5rem !important;
          }
          
          .print\\:gap-4 {
            gap: 1rem !important;
          }
          
          .print\\:gap-8 {
            gap: 2rem !important;
          }
          
          .print\\:space-y-8 > * + * {
            margin-top: 2rem !important;
          }
          
          .print\\:space-y-4 > * + * {
            margin-top: 1rem !important;
          }
          
          .print\\:text-4xl {
            font-size: 2.25rem !important;
            line-height: 2.5rem !important;
          }
          
          .print\\:text-3xl {
            font-size: 1.875rem !important;
            line-height: 2.25rem !important;
          }
          
          .print\\:text-2xl {
            font-size: 1.5rem !important;
            line-height: 2rem !important;
          }
          
          .print\\:text-xl {
            font-size: 1.25rem !important;
            line-height: 1.75rem !important;
          }
          
          .print\\:text-lg {
            font-size: 1.125rem !important;
            line-height: 1.75rem !important;
          }
          
          .print\\:text-base {
            font-size: 1rem !important;
            line-height: 1.5rem !important;
          }
          
          .print\\:text-sm {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }
          
          .print\\:text-xs {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
          }
          
          .print\\:font-bold {
            font-weight: 700 !important;
          }
          
          .print\\:font-semibold {
            font-weight: 600 !important;
          }
          
          .print\\:font-medium {
            font-weight: 500 !important;
          }
          
          .print\\:grid {
            display: grid !important;
          }
          
          .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          
          .print\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          
          .print\\:grid-cols-5 {
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }
          
          .print\\:grid-cols-6 {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
          }
          
          .print\\:grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
          
          .print\\:lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          
          .print\\:text-center {
            text-align: center !important;
          }
          
          .print\\:border-b-4 {
            border-bottom-width: 4px !important;
          }
          
          .print\\:border-b-2 {
            border-bottom-width: 2px !important;
          }
          
          .print\\:border-2 {
            border-width: 2px !important;
          }
          
          .print\\:border {
            border-width: 1px !important;
          }
          
          .print\\:pb-3 {
            padding-bottom: 0.75rem !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          .print\\:mt-3 {
            margin-top: 0.75rem !important;
          }
          
          .print\\:mt-2 {
            margin-top: 0.5rem !important;
          }
          
          .print\\:mt-1 {
            margin-top: 0.25rem !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
          
          .print\\:page-break-inside-avoid {
            page-break-inside: avoid !important;
          }
          
          .print\\:page-break-after-avoid {
            page-break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedAssistanceReport;
