import Button from "@/components/ui/Button";
import type { IBedCheckInRequestItem } from "@/services/BedManagementApi";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl } from "@/utils/commonFunc";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface BedAssignmentCardProps {
  assignment?: IBedCheckInRequestItem;
  onEdit: (assignment: IBedCheckInRequestItem) => void;
  onDelete: (assignment: IBedCheckInRequestItem) => void;
  canEdit?: (assignment?: IBedCheckInRequestItem) => boolean;
  canDelete?: (assignment?: IBedCheckInRequestItem) => boolean;
}

// Add a date formatting utility
const formatDateTime = (dateString?: string, withTime: boolean = true) => {
  if (!dateString) return "-";

  try {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = parseISO(dateString);
    const zonedDate = toZonedTime(date, userTimeZone);

    if (withTime) {
      return format(zonedDate, "MM/dd/yyyy 'at' hh:mm a");
    } else {
      return format(zonedDate, "MM/dd/yyyy");
    }
  } catch (error) {
    console.warn("Error formatting date:", dateString, error);
    return dateString;
  }
};

const BedAssignmentCard: React.FC<BedAssignmentCardProps> = ({
  assignment,
  onEdit,
  onDelete,
  canEdit = () => true,
  canDelete = () => true,
}) => {
  const navigate = useNavigate();

  const fieldWithValueHor = (label: string, value: string | number) => (
    <div className="text-gray-800 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 text-sm">
      <label className="font-bold text-gray-700 min-w-0 flex-shrink-0">
        {label}:
      </label>
      <span className="font-medium text-gray-500 break-words">{value}</span>
    </div>
  );

  const handleViewRequest = () => {
    navigate("/myAgency/bed-managements");
  };

  return (
    <div className="bg-white ring-1 ring-purple-300 border border-purple/10 shadow-sm p-4 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center shadow-sm bg-gray-50 border border-gray-200 rounded-full overflow-hidden flex-shrink-0">
            {assignment?.caseImage && assignment.caseImage.length > 0 ? (
              <img
                src={getBackendUrl(assignment.caseImage[0])}
                alt={`${assignment?.caseName || "Case"} profile`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <Icon
              icon="mdi:user"
              width={24}
              height={24}
              className={`text-gray-400 ${
                assignment?.caseImage && assignment.caseImage.length > 0
                  ? "hidden"
                  : ""
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-800 truncate">
              {assignment?.caseName || "-"}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {assignment?.createdBy?.userName || "-"}
            </p>
            <p className="text-xs text-purple-600 hover:text-purple-700 underline cursor-pointer truncate">
              {assignment?.createdBy?.companyName || "-"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs text-gray-500 order-2 sm:order-1 text-center sm:text-left">
            {formatDateTime(assignment?.createdAt, true)}
          </span>

          <div className="hidden sm:block border-l border-gray-200 h-4 order-1 sm:order-2"></div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 order-1 sm:order-2">
            {assignment?.status !== "DENIED" && canEdit(assignment) && (
              <Button
                label="Edit"
                icon="mdi:pencil"
                variant="submitStyle"
                className="!px-3 !py-1.5 rounded-md shadow-sm transition-colors duration-150 hover:bg-purple-700 text-sm min-w-[60px]"
                onClick={() => onEdit(assignment!)}
              />
            )}
            {assignment?.status === "REQUESTED" && (
              <Button
                label="View Request"
                icon="mdi:eye-outline"
                variant="submitStyle"
                className="!px-3 !py-1.5 !bg-white !text-purple-500 border !border-purple-300 hover:!bg-purple-50 shadow-sm transition-colors duration-150 text-sm min-w-[100px]"
                onClick={handleViewRequest}
              />
            )}
            {canDelete(assignment) &&
              (assignment?.status === "REQUESTED" ? (
                <Button
                  label="Deny/Delete"
                  icon="ic:round-not-interested"
                  variant="dangerStyle"
                  className="!px-3 !py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-md shadow-sm transition-colors duration-150 text-sm min-w-[60px]"
                  onClick={() => onDelete(assignment!)}
                />
              ) : (
                <Button
                  label="Delete"
                  icon="mdi:close"
                  variant="dangerStyle"
                  className="!px-3 !py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-md shadow-sm transition-colors duration-150 text-sm min-w-[100px]"
                  onClick={() => onDelete(assignment!)}
                />
              ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex flex-col gap-4">
          {/* REQUESTED STATUS */}
          {(assignment?.status === "REQUESTED" ||
            assignment?.status === "DENIED") && (
            <div className="flex flex-col gap-4">
              <div className="flex">
                <div
                  className={`${
                    assignment?.status === "DENIED"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  } px-3 py-1 rounded-full text-xs font-medium`}
                >
                  {assignment?.status === "DENIED"
                    ? "REQUESTED - DENIED"
                    : "REQUESTED - PENDING"}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 'denialReason' is not in IBedCheckInRequestItem, so fallback to '-' */}
                {assignment?.status === "DENIED" && (
                  <div>{fieldWithValueHor("Denial Reason", "-")}</div>
                )}
                <div>
                  {fieldWithValueHor("Case", assignment?.caseName || "-")}
                </div>
                <div>
                  <div className="text-gray-600 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 text-sm">
                    <label className="font-bold text-gray-700 min-w-0 flex-shrink-0">
                      Requested Agency:
                    </label>
                    <span className="font-medium text-purple-600 underline cursor-pointer break-words">
                      {assignment?.agencyName || "-"}
                    </span>
                  </div>
                </div>
                <div>
                  {fieldWithValueHor(
                    "Requested Site",
                    assignment?.siteName || "-"
                  )}
                </div>
                <div>
                  {fieldWithValueHor(
                    "Date of Arrival",
                    formatDateTime(assignment?.dateOfArrival, false)
                  )}
                </div>
                <div>
                  {fieldWithValueHor(
                    "Notes",
                    assignment?.notes || "No notes provided"
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE OCCUPANT STATUS */}
          {assignment?.status === "ACTIVE OCCUPANT" && (
            <div className="flex flex-col gap-4">
              <div className="flex">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                  ACTIVE OCCUPANT
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2">
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.CASE,
                    assignment?.caseName || "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.CHECK_IN,
                    formatDateTime(
                      assignment?.checkInDetails?.checkInDate ||
                        assignment?.checkInDate,
                      false
                    ) || "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.CHECK_OUT,
                    formatDateTime(
                      assignment?.checkOutDetails?.checkOutDate ||
                        assignment?.checkOutDate,
                      false
                    ) || "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.AGENCY,
                    assignment?.agencyName || "-"
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:col-span-1 xl:col-span-2">
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.BED_NAME,
                    assignment?.checkInDetails?.bedName ||
                      assignment?.bedName ||
                      "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.BED_ROOM,
                    assignment?.checkInDetails?.room || assignment?.room || "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.BED_TYPE,
                    assignment?.checkInDetails?.bedTypeName ||
                      assignment?.bedTypeName ||
                      "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.SITE,
                    assignment?.siteName || "-"
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-1">
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.NOTES,
                    assignment?.notes || "-"
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CHECKEDIN-OUT STATUS */}
          {(assignment?.status === "CHECKEDIN-OUT" ||
            assignment?.status === "SCHEDULED CHECKOUT") && (
            <div className="flex flex-col gap-4">
              <div className="flex">
                <div className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-xs font-medium">
                  {assignment?.status === "CHECKEDIN-OUT"
                    ? "CHECKED IN & OUT"
                    : "SCHEDULED CHECKOUT"}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="flex flex-col gap-2">
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.CASE,
                    assignment?.caseName || "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.CHECK_IN,
                    formatDateTime(
                      assignment?.checkInDetails?.checkInDate ||
                        assignment?.checkInDate,
                      false
                    ) || "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.CHECK_OUT,
                    formatDateTime(
                      assignment?.checkOutDetails?.checkOutDate ||
                        assignment?.checkOutDate,
                      false
                    ) || "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.AGENCY,
                    assignment?.agencyName || "-"
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.BED_NAME,
                    assignment?.checkInDetails?.bedName ||
                      assignment?.bedName ||
                      "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.BED_ROOM,
                    assignment?.checkInDetails?.room || assignment?.room || "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.BED_TYPE,
                    assignment?.checkInDetails?.bedTypeName ||
                      assignment?.bedTypeName ||
                      "-"
                  )}
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.SITE,
                    assignment?.siteName || "-"
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2 xl:col-span-2">
                  {fieldWithValueHor(
                    STATIC_TEXTS.BED_ASSIGNMENTS.NOTES,
                    assignment?.notes || "-"
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BedAssignmentCard;
