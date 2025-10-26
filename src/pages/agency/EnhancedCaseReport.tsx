import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { fetchEnhancedCaseReport } from "@/services/ReportsApi";
import type {
  EnhancedCaseReport,
  CaseReportFilters,
  CaseReportFieldSelection,
} from "@/types";
import Button from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { getBackendUrl } from "@/utils/commonFunc";

const EnhancedCaseReport: React.FC = () => {
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
    documentTitle: `Case Report - ${formatDate(new Date().toISOString())}`,
  });

  useEffect(() => {
    const loadReport = async () => {
      if (!userData) return;

      try {
        setLoading(true);
        setError(null);

        // Parse filters from URL params
        const filters: CaseReportFilters = {};

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        if (startDate || endDate) {
          filters.dateRange = {};
          if (startDate) filters.dateRange.startDate = startDate;
          if (endDate) filters.dateRange.endDate = endDate;
        }

        const minAge = searchParams.get("minAge");
        const maxAge = searchParams.get("maxAge");
        const gender = searchParams.get("gender");
        const maritalStatus = searchParams.get("maritalStatus");
        if (minAge || maxAge || gender || maritalStatus) {
          filters.demographics = {};
          if (minAge) filters.demographics.minAge = parseInt(minAge);
          if (maxAge) filters.demographics.maxAge = parseInt(maxAge);
          if (gender) filters.demographics.gender = gender;
          if (maritalStatus) filters.demographics.maritalStatus = maritalStatus;
        }

        const county = searchParams.get("county");
        const zipCode = searchParams.get("zipCode");
        const city = searchParams.get("city");
        const state = searchParams.get("state");
        if (county || zipCode || city || state) {
          filters.location = {};
          if (county) filters.location.county = county;
          if (zipCode) filters.location.zipCode = zipCode;
          if (city) filters.location.city = city;
          if (state) filters.location.state = state;
        }

        const createdBy = searchParams.get("createdBy");
        if (createdBy) filters.createdBy = createdBy;

        // Parse field selection from URL params
        const fieldSelection: CaseReportFieldSelection = {
          orderBy: searchParams.get("orderBy") || "createdAt",
          orderDirection:
            (searchParams.get("orderDirection") as "asc" | "desc") || "desc",
          includeReportFilters:
            searchParams.get("includeReportFilters") === "true",
          includeCaseSummary: searchParams.get("includeCaseSummary") === "true",
          includeCaseRecords: searchParams.get("includeCaseRecords") === "true",
          summaryTotalCases: searchParams.get("summaryTotalCases") === "true",
          summaryTotalAssistanceAmount:
            searchParams.get("summaryTotalAssistanceAmount") === "true",
          summaryTotalAssistanceCount:
            searchParams.get("summaryTotalAssistanceCount") === "true",
          summaryAgeRanges: searchParams.get("summaryAgeRanges") === "true",
          summaryGenderDistribution:
            searchParams.get("summaryGenderDistribution") === "true",
          summaryHouseholdSizes:
            searchParams.get("summaryHouseholdSizes") === "true",
          caseNumber: searchParams.get("caseNumber") === "true",
          caseEntryDate: searchParams.get("caseEntryDate") === "true",
          caseEntryAgent: searchParams.get("caseEntryAgent") === "true",
          caseEntryAgency: searchParams.get("caseEntryAgency") === "true",
          caseFullName: searchParams.get("caseFullName") === "true",
          caseMaidenName: searchParams.get("caseMaidenName") === "true",
          caseNickname: searchParams.get("caseNickname") === "true",
          caseDateOfBirth: searchParams.get("caseDateOfBirth") === "true",
          caseAge: searchParams.get("caseAge") === "true",
          caseSSNumber: searchParams.get("caseSSNumber") === "true",
          caseStreetAddress: searchParams.get("caseStreetAddress") === "true",
          caseCounty: searchParams.get("caseCounty") === "true",
          caseMailingAddress: searchParams.get("caseMailingAddress") === "true",
          casePersonalIncome: searchParams.get("casePersonalIncome") === "true",
          caseHouseholdIncome:
            searchParams.get("caseHouseholdIncome") === "true",
          casePersonalExpenses:
            searchParams.get("casePersonalExpenses") === "true",
          caseHouseholdExpenses:
            searchParams.get("caseHouseholdExpenses") === "true",
          casePhoneNumbers: searchParams.get("casePhoneNumbers") === "true",
          caseEmail: searchParams.get("caseEmail") === "true",
          caseIdentificationNumbers:
            searchParams.get("caseIdentificationNumbers") === "true",
          caseDemographics: searchParams.get("caseDemographics") === "true",
          caseAssistanceCount:
            searchParams.get("caseAssistanceCount") === "true",
          caseAssistanceAmount:
            searchParams.get("caseAssistanceAmount") === "true",
          caseLastAssistanceDate:
            searchParams.get("caseLastAssistanceDate") === "true",
          caseHouseholdSize: searchParams.get("caseHouseholdSize") === "true",
          caseOtherInfo: searchParams.get("caseOtherInfo") === "true",
        };

        const response = await fetchEnhancedCaseReport(
          filters,
          fieldSelection,
          userData.userId,
          userData.activeLocation
        );

        setReportData(response.data);
      } catch (err) {
        console.error("Error loading enhanced case report:", err);
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
      .map((phone) =>
        phone.number && phone.number.length > 0
          ? `${phone.description}: ${phone.number}`
          : "-"
      )
      .filter((phone) => phone !== "")
      .join(", ");
  };

  const formatIdentificationNumbers = (idNumbers: any[]) => {
    if (!idNumbers || idNumbers.length === 0) return "-";
    return idNumbers
      .map((id) =>
        id.number && id.number.length > 0
          ? `${id.description}: ${id.number}`
          : "-"
      )
      .filter((id) => id !== "")
      .join(", ");
  };

  const formatExpenses = (expenses: any[]) => {
    if (!expenses || expenses.length === 0) return "-";
    return expenses
      .map(
        (expense) =>
          `${expense.name}: ${formatCurrency(expense.amount)}/${
            expense.interval
          }`
      )
      .join(", ");
  };

  const formatStreetAddress = (addressObj: any) => {
    if (!addressObj) return "-";

    if (typeof addressObj === "string") return addressObj;

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
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 print:shadow-none print:border-b-4 print:border-purple-600 print:mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent print:text-purple-800 print:bg-none">
                  Case Report
                </h1>
                {reportData.summary?.companyInfo?.agencyName && (
                  <p className="text-lg font-semibold text-purple-600 mt-2 print:text-lg">
                    {reportData.summary?.companyInfo?.agencyName}
                  </p>
                )}
              </div>

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
          reportData.fieldSelection?.includeCaseSummary && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 print:shadow-none print:border-2 print:border-purple-200 print:mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 print:text-2xl">
                📊 Summary Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {reportData.fieldSelection.summaryTotalCases &&
                  reportData.summary.totalCases !== undefined && (
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-blue-500 print:to-indigo-600 print:text-white print:border-2 print:border-blue-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        {reportData.summary.totalCases}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Total Cases
                      </div>
                    </div>
                  )}
                {reportData.fieldSelection.summaryTotalAssistanceAmount &&
                  reportData.summary.totalAssistanceAmount !== undefined && (
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-green-500 print:to-emerald-600 print:text-white print:border-2 print:border-green-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        $
                        {reportData.summary.totalAssistanceAmount.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Total Assistance Amount
                      </div>
                    </div>
                  )}
                {reportData.fieldSelection.summaryTotalAssistanceCount &&
                  reportData.summary.totalAssistanceCount !== undefined && (
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-purple-500 print:to-violet-600 print:text-white print:border-2 print:border-purple-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        {reportData.summary.totalAssistanceCount}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Total Assistance Count
                      </div>
                    </div>
                  )}
              </div>

              {/* Additional Summary Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Age Ranges */}
                {reportData.fieldSelection.summaryAgeRanges &&
                  reportData.summary.ageRanges && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-200 print:bg-gradient-to-br print:from-orange-50 print:to-amber-50 print:border-2 print:border-orange-300">
                      <h3 className="text-lg font-bold text-orange-800 mb-4 print:text-base">
                        📊 Age Distribution
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(reportData.summary.ageRanges).map(
                          ([range, count]) => (
                            <div
                              key={range}
                              className="flex justify-between items-center bg-white p-3 rounded-lg print:bg-white print:border print:border-orange-200"
                            >
                              <span className="text-sm font-medium text-orange-700 print:text-xs">
                                {range}
                              </span>
                              <span className="text-sm font-bold text-orange-800 print:text-xs">
                                {count as number}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Gender Distribution */}
                {reportData.fieldSelection.summaryGenderDistribution &&
                  reportData.summary.genderDistribution && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200 print:bg-gradient-to-br print:from-pink-50 print:to-rose-50 print:border-2 print:border-pink-300">
                      <h3 className="text-lg font-bold text-pink-800 mb-4 print:text-base">
                        👥 Gender Distribution
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(
                          reportData.summary.genderDistribution
                        ).map(([gender, count]) => (
                          <div
                            key={gender}
                            className="flex justify-between items-center bg-white p-3 rounded-lg print:bg-white print:border print:border-pink-200"
                          >
                            <span className="text-sm font-medium text-pink-700 print:text-xs">
                              {gender}
                            </span>
                            <span className="text-sm font-bold text-pink-800 print:text-xs">
                              {count as number}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Household Sizes */}
                {reportData.fieldSelection.summaryHouseholdSizes &&
                  reportData.summary.householdSizes && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border-2 border-teal-200 print:bg-gradient-to-br print:from-teal-50 print:to-cyan-50 print:border-2 print:border-teal-300">
                      <h3 className="text-lg font-bold text-teal-800 mb-4 print:text-base">
                        🏠 Household Sizes
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(reportData.summary.householdSizes).map(
                          ([size, count]) => (
                            <div
                              key={size}
                              className="flex justify-between items-center bg-white p-3 rounded-lg print:bg-white print:border print:border-teal-200"
                            >
                              <span className="text-sm font-medium text-teal-700 print:text-xs">
                                {size === "5+"
                                  ? "5+ People"
                                  : `${size} Person${size === "1" ? "" : "s"}`}
                              </span>
                              <span className="text-sm font-bold text-teal-800 print:text-xs">
                                {count as number}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Records Section */}
        {reportData.records &&
          reportData.records.length > 0 &&
          reportData.fieldSelection?.includeCaseRecords && (
            <div className="bg-white rounded-2xl shadow-xl p-8 print:shadow-none print:border-2 print:border-purple-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 print:text-2xl">
                📋 Case Records ({reportData.records.length} records)
              </h2>
              <div className="space-y-8">
                {reportData.records.map((record: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-white border-2 border-purple-200 rounded-2xl p-6 print:bg-gradient-to-br print:from-gray-50 print:to-white print:border-2 print:border-purple-300 print:break-inside-avoid print:page-break-inside-avoid print:mb-6"
                  >
                    {/* Case Entry Agency Header */}
                    {reportData.fieldSelection.caseEntryAgency &&
                      record.caseEntryAgency && (
                        <div className="mb-6 bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl border-2 border-purple-300 print:bg-gradient-to-r print:from-purple-100 print:to-blue-100 print:border-2 print:border-purple-400">
                          <h4 className="text-lg font-bold text-purple-800 text-center print:text-base">
                            🏢 {record.caseEntryAgency}
                          </h4>
                        </div>
                      )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Basic Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl print:bg-gradient-to-br print:from-blue-50 print:to-indigo-50 print:border print:border-blue-200">
                        <div className="flex items-center gap-3 border-b-2 border-blue-300 mb-4 py-2">
                          {/* Images or fallback */}
                          {reportData.fieldSelection.caseOtherInfo &&
                          record.caseOtherInfo?.caseImage &&
                          record.caseOtherInfo.caseImage.length > 0 ? (
                            <div className="w-10 h-10 flex items-center justify-center shadow-sm bg-gray-50 border border-gray-200 rounded-full overflow-hidden flex-shrink-0">
                              <img
                                src={getBackendUrl(
                                  record.caseOtherInfo?.caseImage[0]
                                )}
                                alt={`Case Image 1`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  // Show fallback icon
                                  const fallback =
                                    target.parentElement?.querySelector(
                                      ".fallback-icon"
                                    );
                                  if (fallback) {
                                    fallback.classList.remove("hidden");
                                  }
                                }}
                              />
                              <div className="fallback-icon hidden w-full h-full flex items-center justify-center bg-gray-100">
                                <span className="text-lg text-gray-500">
                                  👤
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center shadow-sm bg-gray-50 border border-gray-200 rounded-full overflow-hidden flex-shrink-0">
                              <span className="text-lg text-gray-500">👤</span>
                            </div>
                          )}
                          {/* Section Title */}
                          <h3 className="text-xl font-bold text-blue-800 pb-1 print:text-lg">
                            Basic Information
                          </h3>
                        </div>

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
                          {reportData.fieldSelection.caseMaidenName && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Maiden Name:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseMaidenName || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseNickname && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Nickname:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseNickname || "-"}
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
                          {reportData.fieldSelection.caseAge && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Age:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseAge || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseSSNumber && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                SS Number:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseSSNumber || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseEntryDate && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Entry Date:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseEntryDate
                                  ? formatDate(record.caseEntryDate)
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseEntryAgent && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Entry Agent:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseEntryAgent || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseEntryAgency && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                Entry Agency:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseEntryAgency || "-"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location Information */}
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl print:bg-gradient-to-br print:from-purple-50 print:to-violet-50 print:border print:border-purple-200">
                        <h3 className="text-xl font-bold text-purple-800 border-b-2 border-purple-300 pb-3 mb-4 print:text-lg">
                          📍 Location Information
                        </h3>
                        <div className="space-y-4">
                          {reportData.fieldSelection.caseStreetAddress && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Street Address:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatStreetAddress(record.caseStreetAddress)}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseCounty && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                County:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseCounty || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseMailingAddress && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                Mailing Address:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatStreetAddress(record.caseMailingAddress)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact & Financial Information */}
                    {(reportData.fieldSelection.casePhoneNumbers ||
                      reportData.fieldSelection.caseEmail ||
                      reportData.fieldSelection.caseIdentificationNumbers ||
                      reportData.fieldSelection.casePersonalIncome ||
                      reportData.fieldSelection.caseHouseholdIncome ||
                      reportData.fieldSelection.casePersonalExpenses ||
                      reportData.fieldSelection.caseHouseholdExpenses ||
                      reportData.fieldSelection.caseHouseholdSize) && (
                      <div className="mt-6 bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl print:bg-gradient-to-br print:from-orange-50 print:to-red-50 print:border print:border-orange-200">
                        <h3 className="text-xl font-bold text-orange-800 border-b-2 border-orange-300 pb-3 mb-4 print:text-lg">
                          💰 Contact & Financial Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {reportData.fieldSelection.casePhoneNumbers && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Phone Numbers:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatPhoneNumbers(record.casePhoneNumbers)}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseEmail && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Email:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseEmail || "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection
                            .caseIdentificationNumbers && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Identification Numbers:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatIdentificationNumbers(
                                  record.caseIdentificationNumbers
                                )}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.casePersonalIncome && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Personal Income:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.casePersonalIncome
                                  ? formatCurrency(record.casePersonalIncome)
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseHouseholdIncome && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Household Income:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseHouseholdIncome
                                  ? formatCurrency(record.caseHouseholdIncome)
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.casePersonalExpenses && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Personal Expenses:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatExpenses(record.casePersonalExpenses)}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseHouseholdExpenses && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Household Expenses:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatExpenses(record.caseHouseholdExpenses)}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseHouseholdSize && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Household Size:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseHouseholdSize || "-"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Assistance Information */}
                    {(reportData.fieldSelection.caseAssistanceCount ||
                      reportData.fieldSelection.caseAssistanceAmount ||
                      reportData.fieldSelection.caseLastAssistanceDate) && (
                      <div className="mt-6 bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl print:bg-gradient-to-br print:from-orange-50 print:to-red-50 print:border print:border-orange-200">
                        <h3 className="text-xl font-bold text-orange-800 border-b-2 border-orange-300 pb-3 mb-4 print:text-lg">
                          🆘 Assistance Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {reportData.fieldSelection.caseAssistanceCount && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Assistance Count:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseAssistanceCount || "0"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseAssistanceAmount && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Total Assistance Amount:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseAssistanceAmount
                                  ? formatCurrency(record.caseAssistanceAmount)
                                  : "-"}
                              </p>
                            </div>
                          )}
                          {reportData.fieldSelection.caseLastAssistanceDate && (
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                Last Assistance Date:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.caseLastAssistanceDate
                                  ? formatDate(record.caseLastAssistanceDate)
                                  : "-"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Case Other Information */}
                    {reportData.fieldSelection.caseOtherInfo &&
                      record.caseOtherInfo && (
                        <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl print:bg-gradient-to-br print:from-indigo-50 print:to-purple-50 print:border print:border-indigo-200">
                          <h3 className="text-xl font-bold text-indigo-800 border-b-2 border-indigo-300 pb-3 mb-4 print:text-lg">
                            📋 Additional Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Visible To - Highlighted */}
                            {record.caseOtherInfo.visibleTo && (
                              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg border-2 border-yellow-300 print:bg-gradient-to-r print:from-yellow-100 print:to-orange-100 print:border-2 print:border-yellow-400">
                                <span className="text-sm font-bold text-yellow-800 print:text-xs">
                                  🔒 Visibility:
                                </span>
                                <p className="text-sm font-bold text-yellow-900 mt-1 print:text-xs">
                                  {record.caseOtherInfo.visibleTo}
                                </p>
                              </div>
                            )}

                            {/* Other Information */}
                            <div className="md:col-span-2 space-y-3">
                              {record.caseOtherInfo.suffix && (
                                <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                  <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                    Suffix:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                    {record.caseOtherInfo.suffix}
                                  </p>
                                </div>
                              )}
                              {record.caseOtherInfo.gender && (
                                <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                  <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                    Gender:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                    {record.caseOtherInfo.gender?.length > 0
                                      ? record.caseOtherInfo.gender.join(", ")
                                      : "-"}
                                  </p>
                                </div>
                              )}

                              {record.caseOtherInfo.headOfHousehold !==
                                undefined && (
                                <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                  <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                    Head of Household:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                    {record.caseOtherInfo.headOfHousehold
                                      ? "Yes"
                                      : "No"}
                                  </p>
                                </div>
                              )}

                              {record.caseOtherInfo.children && (
                                <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                  <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                    Children:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                    {record.caseOtherInfo.children}
                                  </p>
                                </div>
                              )}

                              {record.caseOtherInfo.other &&
                                record.caseOtherInfo.other.length > 0 && (
                                  <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                    <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                      Other:
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                      {record.caseOtherInfo.other.join(", ")}
                                    </p>
                                  </div>
                                )}

                              {record.caseOtherInfo.raceAndEthnicity &&
                                record.caseOtherInfo.raceAndEthnicity.length >
                                  0 && (
                                  <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                    <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                      Race & Ethnicity:
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                      {record.caseOtherInfo.raceAndEthnicity.join(
                                        ", "
                                      )}
                                    </p>
                                  </div>
                                )}

                              {record.caseOtherInfo.governmentBenefits &&
                                record.caseOtherInfo.governmentBenefits.length >
                                  0 && (
                                  <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                    <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                      Government Benefits:
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                      {record.caseOtherInfo.governmentBenefits.join(
                                        ", "
                                      )}
                                    </p>
                                  </div>
                                )}

                              {record.caseOtherInfo.wePlayGroups &&
                                record.caseOtherInfo.wePlayGroups.length >
                                  0 && (
                                  <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                    <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                      Play Groups:
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                      {record.caseOtherInfo.wePlayGroups.join(
                                        ", "
                                      )}
                                    </p>
                                  </div>
                                )}

                              {record.caseOtherInfo.wePlayGroupsOther && (
                                <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                  <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                    Other Play Groups:
                                  </span>
                                  <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                    {record.caseOtherInfo.wePlayGroupsOther}
                                  </p>
                                </div>
                              )}

                              {/* Data Quality Information */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {record.caseOtherInfo.dobDataQuality && (
                                  <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                    <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                      DOB Quality:
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                      {record.caseOtherInfo.dobDataQuality}
                                    </p>
                                  </div>
                                )}

                                {record.caseOtherInfo.nameDataQuality && (
                                  <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                    <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                      Name Quality:
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                      {record.caseOtherInfo.nameDataQuality}
                                    </p>
                                  </div>
                                )}

                                {record.caseOtherInfo.ssnDataQuality && (
                                  <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                    <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                      SSN Quality:
                                    </span>
                                    <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                      {record.caseOtherInfo.ssnDataQuality}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* No Records */}
        {(!reportData.records || reportData.records.length === 0) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center print:shadow-none print:border-2 print:border-purple-200">
            <div className="text-gray-500 text-xl">
              No case records found matching the criteria
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCaseReport;
