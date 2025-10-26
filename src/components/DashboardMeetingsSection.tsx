import React, { useState } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import CalendarModal from "./modals/CalendarModal";

interface Appointment {
  id: string;
  appointmentName: string;
  startTime: string;
  endTime: string;
  status: string;
  caseName: string;
  caseId: string;
}

interface DashboardMeetingsSectionProps {
  appointments?: Appointment[];
}

const DashboardMeetingsSection: React.FC<DashboardMeetingsSectionProps> = ({
  appointments = [],
}) => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Function to check if a date has appointments
  const hasAppointmentsOnDate = (date: Date) => {
    if (!appointments || appointments.length === 0) return false;

    const dateString = formatDate(date, "yyyy-MM-dd");
    return appointments.some((appointment) => {
      const appointmentDate = formatDate(
        new Date(appointment.startTime),
        "yyyy-MM-dd"
      );
      return appointmentDate === dateString;
    });
  };

  // Function to get appointment count for a specific date
  const getAppointmentCountForDate = (date: Date) => {
    if (!appointments || appointments.length === 0) return 0;

    const dateString = formatDate(date, "yyyy-MM-dd");
    return appointments.filter((appointment) => {
      const appointmentDate = formatDate(
        new Date(appointment.startTime),
        "yyyy-MM-dd"
      );
      return appointmentDate === dateString;
    }).length;
  };

  const openCalendarModal = () => {
    setIsCalendarModalOpen(true);
  };

  const closeCalendarModal = () => {
    setIsCalendarModalOpen(false);
  };

  return (
    <>
      <div className="bg-purpleLight rounded-xl border border-border">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">My meetings</h3>
          <div className="flex items-center gap-2">
            <button className="text-pink hover:text-purple cursor-pointer">
              <Icon
                icon="mdi:plus"
                width="20"
                height="20"
                style={{ color: "#b83484" }}
              />
            </button>
            <button
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
              onClick={openCalendarModal}
              title="Open full calendar view"
            >
              <Icon icon="mdi:arrow-expand" width="16" height="16" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex gap-4 overflow-x-auto py-2 relative">
            {Array.from({ length: 12 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const isToday = i === 0;
              const hasAppointments = hasAppointmentsOnDate(date);
              const appointmentCount = getAppointmentCountForDate(date);
              const localDate = toZonedTime(date, userTimeZone);

              return (
                <button
                  key={i}
                  className={`flex flex-col items-center min-w-[60px] p-2 rounded-lg relative ${
                    isToday
                      ? "bg-purple text-white"
                      : hasAppointments
                      ? "bg-pink text-white hover:bg-pink-dark"
                      : "hover:bg-border"
                  } transition-colors`}
                >
                  <span className="text-sm">
                    {formatDate(localDate, "EEE").toUpperCase()}
                  </span>
                  <span className="text-xl font-bold">
                    {formatDate(localDate, "d")}
                  </span>
                  {hasAppointments && appointmentCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 z-50 flex items-center justify-center font-bold">
                      {appointmentCount > 9 ? "9+" : appointmentCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={closeCalendarModal}
        appointments={appointments}
      />
    </>
  );
};

export default DashboardMeetingsSection;
