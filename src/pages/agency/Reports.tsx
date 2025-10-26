import React, { useState } from "react";
import ReportPrintModal from "@/components/modals/ReportPrintModal";
import EnhancedAssistanceReportModal from "@/components/modals/EnhancedAssistanceReportModal";
import EnhancedCaseReportModal from "@/components/modals/EnhancedCaseReportModal";
import EnhancedCategoryReportModal from "@/components/modals/EnhancedCategoryReportModal";
import EnhancedEventReportModal from "@/components/modals/EnhancedEventReportModal";
import EnhancedReferralReportModal from "@/components/modals/EnhancedReferralReportModal";
import EnhancedOutcomeReportModal from "@/components/modals/EnhancedOutcomeReportModal";
import EnhancedOutcomeGoalsReportModal from "@/components/modals/EnhancedOutcomeGoalsReportModal";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

const Reports: React.FC = () => {
  // Modal states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEnhancedAssistanceModalOpen, setIsEnhancedAssistanceModalOpen] =
    useState(false);
  const [isEnhancedCaseModalOpen, setIsEnhancedCaseModalOpen] = useState(false);
  const [isEnhancedCategoryModalOpen, setIsEnhancedCategoryModalOpen] =
    useState(false);
  const [isEnhancedEventModalOpen, setIsEnhancedEventModalOpen] =
    useState(false);
  const [isEnhancedReferralModalOpen, setIsEnhancedReferralModalOpen] =
    useState(false);
  const [isEnhancedOutcomeModalOpen, setIsEnhancedOutcomeModalOpen] =
    useState(false);
  const [isEnhancedOutcomeGoalsModalOpen, setIsEnhancedOutcomeGoalsModalOpen] =
    useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>("");

  const handlePrintReport = (reportId: string) => {
    setSelectedReportId(reportId);
    switch (reportId) {
      case "assistance":
        setIsEnhancedAssistanceModalOpen(true);
        break;
      case "cases":
        setIsEnhancedCaseModalOpen(true);
        break;
      case "categories":
        setIsEnhancedCategoryModalOpen(true);
        break;
      case "events":
        setIsEnhancedEventModalOpen(true);
        break;
      case "referrals":
        setIsEnhancedReferralModalOpen(true);
        break;
      case "outcomes":
        setIsEnhancedOutcomeModalOpen(true);
        break;
      case "outcome-goals":
        setIsEnhancedOutcomeGoalsModalOpen(true);
        break;
      default:
        setIsPrintModalOpen(true);
        break;
    }
  };

  const reports = [
    {
      id: "assistance",
      title: "Assistance Reports",
      description:
        "Generate comprehensive assistance reports with detailed filters and analytics",
      icon: "mdi:hand-heart",
    },
    {
      id: "cases",
      title: "Case Reports",
      description:
        "Create detailed case reports with demographic and geographic analysis",
      icon: "mdi:account-group",
    },
    {
      id: "categories",
      title: "Category Reports",
      description:
        "Analyze category usage, performance, and distribution across sections",
      icon: "mdi:tag",
    },
    {
      id: "events",
      title: "Event Reports",
      description:
        "Generate comprehensive event reports with attendance statistics and activity analysis",
      icon: "mdi:calendar-multiple",
    },
    {
      id: "referrals",
      title: "Referral Reports",
      description:
        "Track referral requests, status updates, and service distribution",
      icon: "mdi:share-variant",
    },
    {
      id: "outcomes",
      title: "Outcome Reports",
      description:
        "Track outcome progress, goal completion rates, and performance metrics",
      icon: "mdi:target",
    },
    {
      id: "outcome-goals",
      title: "Outcome Goals Reports",
      description:
        "Analyze goal performance, completion rates, and step-by-step progress tracking",
      icon: "mdi:target-arrow",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto">
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="mdi:file-chart"
                className="text-purple"
                width="24"
                height="24"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-pink">Reports</h1>
              <p className="text-gray-600">
                Generate comprehensive reports for your agency data
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto p-4 sm:p-6">
          <div className="grid grid-cols-1  gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                role="button"
                onClick={() => handlePrintReport(report.id)}
                className="flex items-start bg-white rounded-xl shadow-md p-5 gap-4 min-h-[140px] transition-all duration-300 hover:shadow-lg border border-gray-100 h-full cursor-pointer group"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 bg-purpleLight rounded-lg group-hover:bg-purple/20 transition-colors duration-300">
                  <Icon
                    icon={report.icon}
                    width="32"
                    height="32"
                    className="text-purple group-hover:text-pink transition-colors duration-300"
                  />
                </div>
                <div className="flex flex-col h-full">
                  <div className="text-purple font-semibold text-lg mb-1 group-hover:text-pink transition-colors duration-300">
                    {report.title}
                  </div>
                  <div className="text-gray-600 text-sm leading-snug">
                    {report.description}
                  </div>
                  <div className="mt-auto pt-3">
                    <div className="bg-purpleLight px-3 py-2 rounded-lg inline-block group-hover:bg-purple/20 transition-colors duration-300">
                      <span className="text-sm font-medium text-purple group-hover:text-pink transition-colors duration-300">
                        Generate Report
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportId={selectedReportId}
      />

      <EnhancedAssistanceReportModal
        isOpen={isEnhancedAssistanceModalOpen}
        onClose={() => setIsEnhancedAssistanceModalOpen(false)}
      />

      <EnhancedCaseReportModal
        isOpen={isEnhancedCaseModalOpen}
        onClose={() => setIsEnhancedCaseModalOpen(false)}
      />

      <EnhancedCategoryReportModal
        isOpen={isEnhancedCategoryModalOpen}
        onClose={() => setIsEnhancedCategoryModalOpen(false)}
      />

      <EnhancedEventReportModal
        isOpen={isEnhancedEventModalOpen}
        onClose={() => setIsEnhancedEventModalOpen(false)}
      />

      <EnhancedReferralReportModal
        isOpen={isEnhancedReferralModalOpen}
        onClose={() => setIsEnhancedReferralModalOpen(false)}
      />

      <EnhancedOutcomeReportModal
        isOpen={isEnhancedOutcomeModalOpen}
        onClose={() => setIsEnhancedOutcomeModalOpen(false)}
      />

      <EnhancedOutcomeGoalsReportModal
        isOpen={isEnhancedOutcomeGoalsModalOpen}
        onClose={() => setIsEnhancedOutcomeGoalsModalOpen(false)}
      />
    </div>
  );
};

export default Reports;
