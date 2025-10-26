import React from "react";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { IconButton } from "@components/ui/IconButton";
import type { Appointment } from "@/services/AppointmentApi";

export interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onEdit,
  onDelete,
}) => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formattedStart = appointment.startTime
    ? formatDate(
        toZonedTime(appointment.startTime, userTimeZone),
        "MM-dd-yyyy 'at' hh:mm a"
      )
    : "-";
  const formattedEnd = appointment.endTime
    ? formatDate(
        toZonedTime(appointment.endTime, userTimeZone),
        "MM-dd-yyyy 'at' hh:mm a"
      )
    : "-";
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 border border-gray-200">
      <div className="flex justify-between items-center">
        <div className="font-bold text-lg text-purple">
          {appointment.appointmentName || "Appointment"}
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <IconButton
              icon="mdi:pencil"
              label="Save Changes"
              aria-label="Edit"
              onClick={() => onEdit(appointment._id)}
            />
          )}
          {onDelete && (
            <IconButton
              icon="mdi:delete"
              label="Delete"
              aria-label="Delete"
              onClick={() => onDelete(appointment._id)}
            />
          )}
        </div>
      </div>
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
        {appointment?.status}
      </div>
      <div className="text-gray-600 text-sm">
        {formattedStart} - {formattedEnd}
      </div>
      {appointment.note && (
        <div className="text-gray-700">
          <span className="font-medium">Note:</span> {appointment.note}
        </div>
      )}
      <div className="flex flex-wrap gap-4 mt-2">
        <div className="text-xs text-gray-500">
          <span>Created By :</span> {appointment.createdBy?.name} from{" "}
          <span className="text-purple">{appointment.companyName}</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
