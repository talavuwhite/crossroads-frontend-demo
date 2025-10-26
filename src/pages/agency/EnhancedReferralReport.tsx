import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { fetchEnhancedReferralReport } from "@/services/ReportsApi";
import type {
  EnhancedReferralReport,
  ReferralReportFilters,
  ReferralReportFieldSelection,
} from "@/types";
import Button from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

const EnhancedReferralReport: React.FC = () => {
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
    documentTitle: `Referral Report - ${formatDate(new Date().toISOString())}`,
  });

  useEffect(() => {
    const loadReport = async () => {
      if (!userData) return;

      try {
        setLoading(true);
        setError(null);

        // Parse filters from URL params
        const filters: ReferralReportFilters = {};

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        if (startDate || endDate) {
          filters.dateRange = {};
          if (startDate) filters.dateRange.startDate = startDate;
          if (endDate) filters.dateRange.endDate = endDate;
        }

        const deadlineStartDate = searchParams.get("deadlineStartDate");
        const deadlineEndDate = searchParams.get("deadlineEndDate");
        if (deadlineStartDate || deadlineEndDate) {
          filters.deadlineRange = {};
          if (deadlineStartDate)
            filters.deadlineRange.startDate = deadlineStartDate;
          if (deadlineEndDate) filters.deadlineRange.endDate = deadlineEndDate;
        }

        const status = searchParams.get("status");
        if (status) filters.status = status;

        const minAmount = searchParams.get("minAmount");
        const maxAmount = searchParams.get("maxAmount");
        if (minAmount || maxAmount) {
          filters.amountRange = {};
          if (minAmount) filters.amountRange.minAmount = parseInt(minAmount);
          if (maxAmount) filters.amountRange.maxAmount = parseInt(maxAmount);
        }

        const minRequestedAmount = searchParams.get("minRequestedAmount");
        const maxRequestedAmount = searchParams.get("maxRequestedAmount");
        if (minRequestedAmount || maxRequestedAmount) {
          filters.requestedAmountRange = {};
          if (minRequestedAmount)
            filters.requestedAmountRange.minAmount =
              parseInt(minRequestedAmount);
          if (maxRequestedAmount)
            filters.requestedAmountRange.maxAmount =
              parseInt(maxRequestedAmount);
        }

        const serviceType = searchParams.get("serviceType");
        if (serviceType) filters.serviceType = serviceType;

        const categoryId = searchParams.get("categoryId");
        if (categoryId) filters.categoryId = categoryId;

        const unitId = searchParams.get("unitId");
        if (unitId) filters.unitId = unitId;

        const createdBy = searchParams.get("createdBy");
        if (createdBy) filters.createdBy = createdBy;

        const agencyId = searchParams.get("agencyId");
        if (agencyId) filters.agencyId = agencyId;

        const locationId = searchParams.get("locationId");
        if (locationId) filters.locationId = locationId;

        // Parse field selection from URL params
        const fieldSelection: ReferralReportFieldSelection = {
          orderBy: searchParams.get("orderBy") || "createdAt",
          orderDirection:
            (searchParams.get("orderDirection") as "asc" | "desc") || "desc",
          includeReportFilters:
            searchParams.get("includeReportFilters") === "true",
          includeReferralSummary:
            searchParams.get("includeReferralSummary") === "true",
          includeReferralRecords:
            searchParams.get("includeReferralRecords") === "true",
          summaryTotalReferrals:
            searchParams.get("summaryTotalReferrals") === "true",
          summaryReferralsByStatus:
            searchParams.get("summaryReferralsByStatus") === "true",
          summaryAmountStatistics:
            searchParams.get("summaryAmountStatistics") === "true",
          summaryServiceDistribution:
            searchParams.get("summaryServiceDistribution") === "true",
          summaryDeadlineStatistics:
            searchParams.get("summaryDeadlineStatistics") === "true",
          referralCase: searchParams.get("referralCase") === "true",
          referralAmount: searchParams.get("referralAmount") === "true",
          referralUnit: searchParams.get("referralUnit") === "true",
          referralService: searchParams.get("referralService") === "true",
          referralCategory: searchParams.get("referralCategory") === "true",
          referralDescription:
            searchParams.get("referralDescription") === "true",
          referralStatus: searchParams.get("referralStatus") === "true",
          referralStatusNotes:
            searchParams.get("referralStatusNotes") === "true",
          referralDeadline: searchParams.get("referralDeadline") === "true",
          referralCreatedBy: searchParams.get("referralCreatedBy") === "true",
          referralCreatedDate:
            searchParams.get("referralCreatedDate") === "true",
          referralStatusHistory:
            searchParams.get("referralStatusHistory") === "true",
          referralRequestedAssistance:
            searchParams.get("referralRequestedAssistance") === "true",
        };

        const response = await fetchEnhancedReferralReport(
          filters,
          fieldSelection,
          userData.userId,
          userData.activeLocation
        );

        setReportData(response.data);
      } catch (err) {
        console.error("Error loading enhanced referral report:", err);
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
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent print:text-purple-800 print:bg-none">
                  Referral Report
                </h1>
                {reportData.summary?.companyInfo?.agencyName && (
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-lg border border-purple-200">
                    <p className="text-lg font-semibold text-purple-700 print:text-base">
                      {reportData.summary.companyInfo.agencyName}
                    </p>
                  </div>
                )}
              </div>
              {reportData.summary?.locationInfo?.locationName && (
                <p className="text-lg font-medium text-purple mt-1 print:text-base">
                  {reportData.summary.locationInfo.locationName}
                </p>
              )}
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
          reportData.fieldSelection?.includeReferralSummary && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 print:shadow-none print:border-2 print:border-purple-200 print:mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 print:text-2xl">
                📊 Referral Summary Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {reportData.fieldSelection.summaryTotalReferrals &&
                  reportData.summary.totalReferrals !== undefined && (
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-blue-500 print:to-indigo-600 print:text-white print:border-2 print:border-blue-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        {reportData.summary.totalReferrals}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Total Referrals
                      </div>
                    </div>
                  )}
                {reportData.fieldSelection.summaryAmountStatistics &&
                  reportData.summary.amountStatistics?.totalAmount !==
                    undefined && (
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-green-500 print:to-emerald-600 print:text-white print:border-2 print:border-green-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        $
                        {reportData.summary.amountStatistics.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Total Amount
                      </div>
                    </div>
                  )}
                {reportData.fieldSelection.summaryAmountStatistics &&
                  reportData.summary.amountStatistics?.totalRequestedAmount !==
                    undefined && (
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-purple-500 print:to-violet-600 print:text-white print:border-2 print:border-purple-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        $
                        {reportData.summary.amountStatistics.totalRequestedAmount.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Total Requested Amount
                      </div>
                    </div>
                  )}
                {reportData.fieldSelection.summaryDeadlineStatistics &&
                  reportData.summary.deadlineStatistics?.overdueReferrals !==
                    undefined && (
                    <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl text-white print:bg-gradient-to-br print:from-red-500 print:to-pink-600 print:text-white print:border-2 print:border-red-300">
                      <div className="text-4xl font-bold print:text-3xl">
                        {reportData.summary.deadlineStatistics.overdueReferrals}
                      </div>
                      <div className="text-sm font-medium mt-3 print:text-xs">
                        Overdue Referrals
                      </div>
                    </div>
                  )}
              </div>

              {/* Additional Summary Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Referrals by Status */}
                {reportData.fieldSelection.summaryReferralsByStatus &&
                  reportData.summary.referralsByStatus && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-200 print:bg-gradient-to-br print:from-orange-50 print:to-amber-50 print:border-2 print:border-orange-300">
                      <h3 className="text-lg font-bold text-orange-800 mb-4 print:text-base">
                        📊 Referrals by Status
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(
                          reportData.summary.referralsByStatus
                        ).map(([status, count]) => (
                          <div
                            key={status}
                            className="flex justify-between items-center bg-white p-3 rounded-lg print:bg-white print:border print:border-orange-200"
                          >
                            <span className="text-sm font-medium text-orange-700 print:text-xs">
                              {status}
                            </span>
                            <span className="text-sm font-bold text-orange-800 print:text-xs">
                              {count as number}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Service Distribution */}
                {reportData.fieldSelection.summaryServiceDistribution &&
                  reportData.summary.serviceDistribution && (
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200 print:bg-gradient-to-br print:from-pink-50 print:to-rose-50 print:border-2 print:border-pink-300">
                      <h3 className="text-lg font-bold text-pink-800 mb-4 print:text-base">
                        🔧 Service Distribution
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(
                          reportData.summary.serviceDistribution
                        ).map(([service, count]) => (
                          <div
                            key={service}
                            className="flex justify-between items-center bg-white p-3 rounded-lg print:bg-white print:border print:border-pink-200"
                          >
                            <span className="text-sm font-medium text-pink-700 print:text-xs">
                              {service}
                            </span>
                            <span className="text-sm font-bold text-pink-800 print:text-xs">
                              {count as number}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Deadline Statistics */}
                {reportData.fieldSelection.summaryDeadlineStatistics &&
                  reportData.summary.deadlineStatistics && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 sm:p-6 rounded-xl border-2 border-teal-200 print:bg-gradient-to-br print:from-teal-50 print:to-cyan-50 print:border-2 print:border-teal-300">
                      <h3 className="text-lg sm:text-xl font-bold text-teal-800 mb-4 print:text-base flex items-center  gap-2">
                        <Icon icon="twemoji:alarm-clock" className="text-xl" />
                        Deadline Statistics
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2  gap-3 sm:gap-4 mb-6">
                        {/* Overdue Referrals */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 print:bg-red-50 print:border-red-300 hover:shadow-md transition-shadow duration-200">
                          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 print:text-xl text-center">
                            {reportData.summary.deadlineStatistics
                              .overdueReferrals || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-red-700 print:text-xs text-center mt-1">
                            Overdue Referrals
                          </div>
                        </div>

                        {/* Upcoming Deadlines */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 print:bg-orange-50 print:border-orange-300 hover:shadow-md transition-shadow duration-200">
                          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 print:text-xl text-center">
                            {reportData.summary.deadlineStatistics
                              .upcomingDeadlines || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-orange-700 print:text-xs text-center mt-1">
                            Upcoming (≤7 days)
                          </div>
                        </div>

                        {/* Total With Deadlines */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 print:bg-blue-50 print:border-blue-300 hover:shadow-md transition-shadow duration-200">
                          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 print:text-xl text-center">
                            {reportData.summary.deadlineStatistics
                              .totalWithDeadlines || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-blue-700 print:text-xs text-center mt-1">
                            Total With Deadlines
                          </div>
                        </div>

                        {/* Average Days */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 print:bg-gray-50 print:border-gray-300 hover:shadow-md transition-shadow duration-200">
                          <div
                            className={`text-xl sm:text-2xl lg:text-3xl font-bold print:text-xl text-center ${
                              (reportData.summary.deadlineStatistics
                                .averageDaysUntilDeadline || 0) > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {(() => {
                              const days = Math.round(
                                reportData.summary.deadlineStatistics
                                  .averageDaysUntilDeadline || 0
                              );
                              if (days === 0) return "Today";
                              if (days > 0) return `${days}`;
                              return `${Math.abs(days)}`;
                            })()}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-700 print:text-xs text-center mt-1">
                            {(() => {
                              const days = Math.round(
                                reportData.summary.deadlineStatistics
                                  .averageDaysUntilDeadline || 0
                              );
                              if (days === 0) return "Today";
                              if (days > 0) return "days remaining";
                              return "days overdue";
                            })()}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-700 print:text-xs text-center mt-1">
                            Average Days
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar for Overdue vs On Track */}
                      {reportData.summary.deadlineStatistics
                        .totalWithDeadlines > 0 && (
                        <div className="mt-4 sm:mt-6">
                          <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm mb-2 print:text-xs gap-1 sm:gap-0">
                            <span className="text-gray-700 font-medium">
                              Overdue:{" "}
                              {reportData.summary.deadlineStatistics
                                .overdueReferrals || 0}
                            </span>
                            <span className="text-gray-700 font-medium">
                              On Track:{" "}
                              {(reportData.summary.deadlineStatistics
                                .totalWithDeadlines || 0) -
                                (reportData.summary.deadlineStatistics
                                  .overdueReferrals || 0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 print:border print:border-gray-300 overflow-hidden">
                            <div
                              className="bg-red-500 h-full rounded-full transition-all duration-300 ease-in-out"
                              style={{
                                width: `${
                                  ((reportData.summary.deadlineStatistics
                                    .overdueReferrals || 0) /
                                    (reportData.summary.deadlineStatistics
                                      .totalWithDeadlines || 1)) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Records Section */}
        {reportData.records &&
          reportData.records.length > 0 &&
          reportData.fieldSelection?.includeReferralRecords && (
            <div className="bg-white rounded-2xl shadow-xl p-8 print:shadow-none print:border-2 print:border-purple-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 print:text-2xl">
                📋 Referral Records ({reportData.records.length} records)
              </h2>
              <div className="space-y-8">
                {reportData.records.map((record: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-white border-2 border-purple-200 rounded-2xl p-6 print:bg-gradient-to-br print:from-gray-50 print:to-white print:border-2 print:border-purple-300 print:break-inside-avoid print:page-break-inside-avoid print:mb-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Basic Referral Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl print:bg-gradient-to-br print:from-blue-50 print:to-indigo-50 print:border print:border-blue-200">
                        <h3 className="text-xl font-bold text-blue-800 border-b-2 border-blue-300 pb-3 mb-4 print:text-lg">
                          📋 Basic Referral Information
                        </h3>
                        <div className="space-y-4">
                          {reportData.fieldSelection.referralCase &&
                            record.referralCase && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                  Case:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {record.referralCase.fullName} (
                                  {record.referralCase.caseId})
                                </p>
                              </div>
                            )}
                          {reportData.fieldSelection.referralAmount &&
                            record.referralAmount !== undefined && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                  Amount:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {formatCurrency(record.referralAmount)}
                                </p>
                              </div>
                            )}
                          {reportData.fieldSelection.referralUnit &&
                            record.referralUnit && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                  Unit:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {record.referralUnit}
                                </p>
                              </div>
                            )}
                          {reportData.fieldSelection.referralService &&
                            record.referralService && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                  Service:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {record.referralService}
                                </p>
                              </div>
                            )}
                          {reportData.fieldSelection.referralCategory &&
                            record.referralCategory && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-blue-700 print:text-xs">
                                  Category:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {record.referralCategory}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Status and Timeline Information */}
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl print:bg-gradient-to-br print:from-purple-50 print:to-violet-50 print:border print:border-purple-200">
                        <h3 className="text-xl font-bold text-purple-800 border-b-2 border-purple-300 pb-3 mb-4 print:text-lg">
                          📊 Status & Timeline
                        </h3>
                        <div className="space-y-4">
                          {reportData.fieldSelection.referralStatus &&
                            record.referralStatus && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                  Status:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {record.referralStatus}
                                </p>
                              </div>
                            )}
                          {reportData.fieldSelection.referralDeadline &&
                            record.referralDeadline && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                  Deadline:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {formatDate(record.referralDeadline)}
                                </p>
                              </div>
                            )}
                          {reportData.fieldSelection.referralCreatedBy &&
                            record.referralCreatedBy && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                  Created By:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {record.referralCreatedBy}
                                </p>
                              </div>
                            )}
                          {reportData.fieldSelection.referralCreatedDate &&
                            record.referralCreatedDate && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-purple-700 print:text-xs">
                                  Created Date:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {formatDate(record.referralCreatedDate)}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Description and Notes */}
                    {(reportData.fieldSelection.referralDescription ||
                      reportData.fieldSelection.referralStatusNotes) && (
                      <div className="mt-6 bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl print:bg-gradient-to-br print:from-orange-50 print:to-red-50 print:border print:border-orange-200">
                        <h3 className="text-xl font-bold text-orange-800 border-b-2 border-orange-300 pb-3 mb-4 print:text-lg">
                          📝 Description & Notes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {reportData.fieldSelection.referralDescription &&
                            record.referralDescription && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                  Description:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {record.referralDescription}
                                </p>
                              </div>
                            )}
                          {reportData.fieldSelection.referralStatusNotes &&
                            record.referralStatusNotes && (
                              <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                                <span className="text-sm font-semibold text-orange-700 print:text-xs">
                                  Status Notes:
                                </span>
                                <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                  {record.referralStatusNotes}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Status History */}
                    {reportData.fieldSelection.referralStatusHistory &&
                      record.referralStatusHistory &&
                      record.referralStatusHistory.length > 0 && (
                        <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl print:bg-gradient-to-br print:from-indigo-50 print:to-purple-50 print:border print:border-indigo-200">
                          <h3 className="text-xl font-bold text-indigo-800 border-b-2 border-indigo-300 pb-3 mb-4 print:text-lg">
                            📈 Status History
                          </h3>
                          <div className="space-y-3">
                            {record.referralStatusHistory.map(
                              (history: any, historyIndex: number) => (
                                <div
                                  key={historyIndex}
                                  className="bg-white p-4 rounded-lg print:bg-white print:border print:border-gray-200"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-semibold text-indigo-700 print:text-xs">
                                      {history.statusName}
                                    </span>
                                    <span className="text-xs text-gray-500 print:text-xs">
                                      {history.updatedAt
                                        ? formatDate(history.updatedAt)
                                        : ""}
                                    </span>
                                  </div>
                                  {history.statusNotes && (
                                    <p className="text-sm text-gray-700 print:text-xs">
                                      Status Notes: {history.statusNotes}
                                    </p>
                                  )}
                                  {history.updatedBy && (
                                    <p className="text-xs text-gray-500 mt-1 print:text-xs">
                                      Updated by: {history.updatedByName}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Requested Assistance */}
                    {reportData.fieldSelection.referralRequestedAssistance &&
                      record.referralRequestedAssistance &&
                      record.referralRequestedAssistance.length > 0 && (
                        <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl print:bg-gradient-to-br print:from-green-50 print:to-emerald-50 print:border print:border-green-200">
                          <h3 className="text-xl font-bold text-green-800 border-b-2 border-green-300 pb-3 mb-4 print:text-lg">
                            🆘 Requested Assistance
                          </h3>
                          <div className="space-y-4">
                            {record.referralRequestedAssistance.map(
                              (assistance: any, assistanceIndex: number) => (
                                <div
                                  key={assistanceIndex}
                                  className="bg-white p-4 rounded-lg print:bg-white print:border print:border-gray-200"
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <span className="text-sm font-semibold text-green-700 print:text-xs">
                                        Amount:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 print:text-xs">
                                        {formatCurrency(assistance.amount)}{" "}
                                        {assistance.unit}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-semibold text-green-700 print:text-xs">
                                        Category:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 print:text-xs">
                                        {assistance.category}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-semibold text-green-700 print:text-xs">
                                        Created By:
                                      </span>
                                      <p className="text-sm font-medium text-gray-900 print:text-xs">
                                        {assistance.createdBy}
                                      </p>
                                    </div>
                                  </div>
                                  {assistance.description && (
                                    <div className="mt-2">
                                      <span className="text-sm font-semibold text-green-700 print:text-xs">
                                        Description:
                                      </span>
                                      <p className="text-sm text-gray-700 mt-1 print:text-xs">
                                        {assistance.description}
                                      </p>
                                    </div>
                                  )}
                                  {assistance.createdAt && (
                                    <p className="text-xs text-gray-500 mt-2 print:text-xs">
                                      Created:{" "}
                                      {formatDate(assistance.createdAt)}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Other Information */}
                    {reportData.fieldSelection.referralOtherFields &&
                      record.referralOtherInfo && (
                        <div className="mt-6 bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl print:bg-gradient-to-br print:from-yellow-50 print:to-amber-50 print:border print:border-yellow-200">
                          <h3 className="text-xl font-bold text-yellow-800 border-b-2 border-yellow-300 pb-3 mb-4 print:text-lg">
                            📋 Other Information
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-yellow-700 print:text-xs">
                                Visibility:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.referralOtherInfo.visibleTo}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-yellow-700 print:text-xs">
                                Deadline Status:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.referralOtherInfo.deadlineStatus}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-yellow-700 print:text-xs">
                                Total Requested Amount:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {formatCurrency(
                                  record.referralOtherInfo.totalRequestedAmount
                                )}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-yellow-700 print:text-xs">
                                Total Requested Assistance Count:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {
                                  record.referralOtherInfo
                                    .totalRequestedAssistanceCount
                                }
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-yellow-700 print:text-xs">
                                Has Attachments:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.referralOtherInfo.hasAttachments
                                  ? "Yes"
                                  : "No"}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-yellow-700 print:text-xs">
                                Is Urgent:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.referralOtherInfo.isUrgent
                                  ? "Yes"
                                  : "No"}
                              </p>
                            </div>
                          </div>
                          {record.referralOtherInfo.attachedFile && (
                            <div className="mt-4 bg-white p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                              <span className="text-sm font-semibold text-yellow-700 print:text-xs">
                                Attached File:
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1 print:text-xs">
                                {record.referralOtherInfo.attachedFile.filename}
                              </p>
                            </div>
                          )}
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
              No referral records found matching the criteria
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedReferralReport;
