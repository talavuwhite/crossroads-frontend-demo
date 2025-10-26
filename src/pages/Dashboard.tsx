import React, { useEffect, useState } from "react";
import { AddBulletinModal } from "@/components/modals/AddBulletinModal";
import DashboardQuickAccess from "@/components/DashboardQuickAccess";
import DashboardMeetingsSection from "@/components/DashboardMeetingsSection";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { fetchDashboardStats } from "@/services/DashboardApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import type { DashboardStatsResponse } from "@/types";
import Loader from "@/components/ui/Loader";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Link } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { OVERDUE_TASKS_PER_PAGE } from "@/utils/constants";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const Dashboard: React.FC = () => {
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [isBulletinModalOpen, setIsBulletinModalOpen] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStatsResponse>();
  const [loading, setLoading] = useState(false);
  const [currentOverDueTasksPage, setCurrentOverDueTasksPage] = useState(1);
  const [totalOverDueTasksPages, setTotalOverDueTasksPages] = useState(1);
  const [totalOverDueTasks, setTotalOverDueTasks] = useState(0);

  // const openAddBulletin = () => {
  //   setSelectedBulletin(null);
  //   setIsBulletinModalOpen(true);
  // };

  // const openEditBulletin = (bulletin: any) => {
  //   setSelectedBulletin(bulletin);
  //   setIsBulletinModalOpen(true);
  // };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const stats = await fetchDashboardStats(
          currentOverDueTasksPage,
          OVERDUE_TASKS_PER_PAGE,
          userData?.userId,
          userData?.activeLocation
        );
        setDashboardData(stats);
        setCurrentOverDueTasksPage(stats?.dueOutcomeGoalsPagination?.page || 1);
        setTotalOverDueTasksPages(
          stats?.dueOutcomeGoalsPagination?.totalPages || 1
        );
        setTotalOverDueTasks(stats?.dueOutcomeGoalsPagination?.total || 0);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentOverDueTasksPage, userData?.userId, userData?.activeLocation]);

  if (loading) {
    return <Loader />;
  }

  const startItem = (currentOverDueTasksPage - 1) * OVERDUE_TASKS_PER_PAGE + 1;
  const endItem = Math.min(
    currentOverDueTasksPage * OVERDUE_TASKS_PER_PAGE,
    totalOverDueTasks
  );
  const paginationLabel = `${startItem}-${endItem} of ${totalOverDueTasks} ${STATIC_TEXTS.DASHBOARD.OVERDUE} ${STATIC_TEXTS.DASHBOARD.TASKS}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight p-4 sm:p-6 overflow-auto min-h-screen">
        <div className="bg-white rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2 text-">
            {STATIC_TEXTS.DASHBOARD.WELCOME}
          </h1>
          <p className="text-gray-600">{STATIC_TEXTS.DASHBOARD.WELCOME_DESC}</p>
        </div>

        <h2 className="text-xl font-bold mb-4" style={{ color: "#8f6ed5" }}>
          {STATIC_TEXTS.DASHBOARD.COMMUNITY_DASHBOARD}
        </h2>

        <DashboardQuickAccess dashboardData={dashboardData} />
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-purpleLight rounded-xl border border-border">
            <div className="p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {STATIC_TEXTS.DASHBOARD.TASKS} (
                {dashboardData?.dueOutcomeGoals?.length || 0}{" "}
                {STATIC_TEXTS.DASHBOARD.OVERDUE})
              </h3>
            </div>
            {dashboardData?.dueOutcomeGoals &&
            dashboardData?.dueOutcomeGoals?.length > 0 ? (
              <div className="p-4">
                <div className="flex flex-col gap-4">
                  {dashboardData?.dueOutcomeGoals?.map((goal, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                      aria-label={`Overdue task for ${goal.caseFirstName} ${goal.caseLastName}`}
                    >
                      <div className="flex flex-col items-center">
                        <Icon
                          icon="mdi:alert-circle-outline"
                          className="text-red-500"
                          width="28"
                          height="28"
                          aria-label="Overdue"
                        />
                        <span className="mt-2 text-xs font-semibold text-red-500 bg-red-100 px-2 py-0.5 rounded">
                          {STATIC_TEXTS.DASHBOARD.OVERDUE}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            icon="mdi:calendar"
                            className="text-purple"
                            width="18"
                            height="18"
                          />
                          <span className="text-sm text-gray-700">
                            Due:{" "}
                            <span className="font-bold text-purple">
                              {formatDate(
                                toZonedTime(goal.dueDate, userTimeZone),
                                "EEE, MMM d"
                              )}
                            </span>
                          </span>
                        </div>
                        <Link
                          to={`/cases/${goal.caseId}`}
                          className="block text-lg font-semibold text-purple hover:underline focus:underline transition"
                          aria-label={`Go to case for ${goal.caseFirstName} ${goal.caseLastName}`}
                        >
                          {goal.caseFirstName} {goal.caseLastName}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-gray-600 text-sm">
                          <Icon
                            icon="mdi:folder-outline"
                            width="16"
                            height="16"
                          />
                          <span>{goal.sectionName}</span>
                          <span className="mx-1">•</span>
                          <Icon
                            icon="mdi:flag-outline"
                            width="16"
                            height="16"
                          />
                          <span>{goal.goalName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {dashboardData?.dueOutcomeGoals?.length > 1 && (
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                    <span>{paginationLabel}</span>
                    <div className="flex items-center gap-2">
                      <ReactPaginate
                        pageCount={totalOverDueTasksPages}
                        pageRangeDisplayed={3}
                        marginPagesDisplayed={1}
                        onPageChange={(selectedItem) => {
                          setCurrentOverDueTasksPage(selectedItem.selected + 1);
                        }}
                        containerClassName="flex items-center gap-1"
                        pageClassName="px-2 py-1 rounded cursor-pointer"
                        activeClassName="bg-purple text-white"
                        previousClassName="text-gray-400 hover:text-gray-600 cursor-pointer"
                        nextClassName="text-gray-400 hover:text-gray-600 cursor-pointer"
                        disabledClassName="text-gray-300 cursor-not-allowed"
                        previousLabel={
                          <Icon
                            icon="mdi:chevron-left"
                            width="20"
                            height="20"
                          />
                        }
                        nextLabel={
                          <Icon
                            icon="mdi:chevron-right"
                            width="20"
                            height="20"
                          />
                        }
                        forcePage={currentOverDueTasksPage - 1}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 pb-5">
                {STATIC_TEXTS.DASHBOARD.NO_OVERDUE_TASKS}
              </div>
            )}
          </div>
          <DashboardMeetingsSection
            appointments={dashboardData?.appointmentStats?.latestAppointments}
          />
        </div>
        {/* <DashboardOpenCasesSection />
        <DashboardBulletinSection
          openAddBulletin={openAddBulletin}
          openEditBulletin={openEditBulletin}
        /> */}
      </div>

      <AddBulletinModal
        isOpen={isBulletinModalOpen}
        onClose={() => {
          setIsBulletinModalOpen(false);
          setSelectedBulletin(null);
        }}
        initialData={selectedBulletin}
      />
    </div>
  );
};

export default Dashboard;
