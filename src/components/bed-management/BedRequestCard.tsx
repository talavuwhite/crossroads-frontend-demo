import type { IBedCheckInRequestItem } from "@/services/BedManagementApi";
import {
  formatArrivalDate,
  formatCreatedAt,
} from "@/utils/getSmartRelativeTime";
import { LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react";
import { Link } from "react-router-dom";

interface IBedRequestCardProps {
  request: IBedCheckInRequestItem;
  onCheckIn: (request: IBedCheckInRequestItem) => void;
  onEdit: (request: IBedCheckInRequestItem) => void;
  onDelete: (request: IBedCheckInRequestItem) => void;
}

const BedRequestCard: React.FC<IBedRequestCardProps> = ({
  request,
  onCheckIn,
  onEdit,
  onDelete,
}) => {
  // Check if case is already allocated
  const isAlreadyAllocated =
    request.hasAllocatedBed ||
    request.currentBedAssignment !== null ||
    request.status === "ACTIVE OCCUPANT";

  // Check if allocation is at a different agency/subagency
  const isCrossAgencyAllocation =
    request.currentBedAssignment !== null &&
    request.currentBedAssignment?.bedId?.companyId !== request.agencyId;

  const bedInfo = request.currentBedAssignment
    ? `
    ${request.caseName} is already allocated to ${request.currentBedAssignment.bedName} in Room ${request.currentBedAssignment.room} at ${request.currentBedAssignment.bedId.companyName}`
    : `${request.caseName} is already assigned to a bed`;

  // Get the agency name where the bed is currently allocated
  const allocatedAgencyName =
    request.currentBedAssignment?.bedId?.companyName || "Unknown Agency";

  // Provide fallback values for fields
  const caseId = request?.caseId ?? "";
  const caseName = request?.caseName ?? "—";
  const siteName = request?.siteName ?? "—";
  const dateOfArrival = formatArrivalDate(request?.dateOfArrival);
  const createdAt = formatCreatedAt(request?.createdAt);
  const notes = request?.notes ?? "—";
  const createdByName = request?.createdBy?.userName ?? "—";
  const agencyId = request?.agencyId ?? "";
  const agencyName = request?.agencyName ?? "—";

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 transition duration-150 rounded-md p-4 ${
        isAlreadyAllocated
          ? "bg-green-50 border border-green-200 hover:bg-green-100"
          : "bg-purple/5 hover:bg-purple/10"
      }`}
    >
      <div className="text-sm">
        <label className="font-bold text-gray-800">{LABELS.FORM.CASE} : </label>
        <p className="text-gray-600 break-words">
          <Link
            to={caseId ? `/cases/${caseId}` : "#"}
            className="text-pink underline hover:text-pink/80"
          >
            {caseName}
          </Link>
        </p>
      </div>
      <div className="text-sm">
        <label className="font-bold text-gray-800">{LABELS.FORM.SITE} : </label>
        <p className="text-gray-600 break-words">{siteName}</p>
      </div>
      <div className="text-sm">
        <label className="font-bold text-gray-800">
          {LABELS.FORM.DATE_OF_ARRIAVAL_TEXT} :{" "}
        </label>
        <p className="text-gray-600">{dateOfArrival}</p>
      </div>
      <div className="text-sm">
        <label className="font-bold text-gray-800">
          {LABELS.FORM.NOTES} :{" "}
        </label>
        <p className="text-gray-600 break-words">{notes}</p>
      </div>
      <div className="text-sm sm:col-span-1 lg:col-span-1 xl:col-span-1">
        <label className="font-bold text-gray-800">
          {STATIC_TEXTS.AGENCY.BED_MANAGEMENT.REQUESTED_BY} :{" "}
        </label>
        <p className="text-gray-600 break-words">
          {createdByName && createdByName !== "—" ? (
            <>
              {createdByName} at{" "}
              <Link
                to={agencyId ? `/agencies/${agencyId}` : "#"}
                className="text-pink underline hover:text-pink/80"
              >
                {agencyName}
              </Link>
              <br />
              on {createdAt}
            </>
          ) : (
            <span className="text-gray-400 italic">
              No requester information
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {/* Status badges - stacked vertically to avoid overlap */}
        <div className="flex flex-wrap gap-2">
          {/* Show allocation status if already allocated */}
          {isAlreadyAllocated && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              <Icon icon="mdi:check-circle" width="14" height="14" />
              <span>Allocated</span>
            </div>
          )}

          {/* Show cross-agency warning if allocated at different agency */}
          {isCrossAgencyAllocation && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
              <Icon icon="mdi:alert-circle" width="14" height="14" />
              <span>At {allocatedAgencyName}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <button
            onClick={() => onCheckIn(request)}
            disabled={isAlreadyAllocated}
            className={`relative text-white p-2 rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
              isAlreadyAllocated
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-green-700 hover:bg-green-700/90"
            }`}
            title={
              isAlreadyAllocated
                ? isCrossAgencyAllocation
                  ? `${bedInfo}`
                  : `${bedInfo}`
                : "Check In - Assign this case to a bed"
            }
          >
            <Icon icon="mdi:plus" width="18" height="18" />
          </button>
          <button
            onClick={() => onEdit(request)}
            className="relative text-white bg-purple hover:bg-purple/90 p-2 rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105"
            title="Edit bed request details"
          >
            <Icon icon="mdi:pencil" width="18" height="18" />
          </button>
          <button
            onClick={() => onDelete(request)}
            className="relative text-white bg-primary hover:bg-primary/90 p-2 rounded-full flex items-center gap-2 transition-all duration-300 hover:scale-105"
            title="Delete or deny this bed request"
          >
            <Icon icon="ic:round-not-interested" width="18" height="18" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BedRequestCard;
