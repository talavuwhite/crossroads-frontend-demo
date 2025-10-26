import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { STATIC_TEXTS } from "@/utils/textConstants";
import type { DashboardStatsResponse } from "@/types";

interface DashboardQuickAccessProps {
  dashboardData?: DashboardStatsResponse;
}

const DashboardQuickAccess: React.FC<DashboardQuickAccessProps> = ({
  dashboardData,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div
        // to="/applications"
        className="bg-purpleLight rounded-xl p-6 hover:shadow-lg transition-shadow border border-border"
      >
        <div className="flex items-center gap-2 mb-2">
          <Icon
            icon="mdi:account-group"
            className="text-purple"
            width="24"
            height="24"
          />
          <h3 className="text-lg font-semibold">
            {STATIC_TEXTS.DASHBOARD.AGENTS}
          </h3>
        </div>
        <p className="text-3xl font-bold text-purple">
          {dashboardData?.agentCount || 0}
        </p>
        <p className="text-sm text-gray-600">{STATIC_TEXTS.DASHBOARD.ACCESS}</p>
      </div>

      <div className="bg-purpleLight rounded-xl p-6 hover:shadow-lg transition-shadow border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Icon
            icon="mdi:folder"
            className="text-pink"
            width="24"
            height="24"
          />
          <h3 className="text-lg font-semibold">
            {STATIC_TEXTS.DASHBOARD.CASES}
          </h3>
        </div>
        <p className="text-3xl font-bold text-pink">
          {dashboardData?.caseCount || 0}
        </p>
        <p className="text-sm text-gray-600">{STATIC_TEXTS.DASHBOARD.ENGAGE}</p>
      </div>

      <div className="bg-purpleLight rounded-xl p-6 hover:shadow-lg transition-shadow border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Icon
            icon="mdi:account-service"
            className="text-purple"
            width="24"
            height="24"
          />
          <h3 className="text-lg font-semibold">
            {STATIC_TEXTS.DASHBOARD.SERVICES}
          </h3>
        </div>
        <p className="text-3xl font-bold text-purple">
          {dashboardData?.serviceCount || 0}
        </p>
        <p className="text-sm text-gray-600">{STATIC_TEXTS.DASHBOARD.TRACK}</p>
      </div>

      <div className="bg-purpleLight rounded-xl p-6 hover:shadow-lg transition-shadow border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Icon
            icon="mdi:calendar-clock"
            className="text-green-600"
            width="24"
            height="24"
          />
          <h3 className="text-lg font-semibold">Appointments</h3>
        </div>
        <p className="text-3xl font-bold text-green-600">
          {dashboardData?.appointmentStats?.total || 0}
        </p>
        <p className="text-sm text-gray-600">
          {dashboardData?.appointmentStats?.today || 0} today
        </p>
      </div>
    </div>
  );
};

export default DashboardQuickAccess;
