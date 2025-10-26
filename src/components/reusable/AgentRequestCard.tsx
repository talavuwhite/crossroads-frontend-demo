import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "@/components/ui/Button";
import { format } from "date-fns";

interface AgentRequest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  agencyId: string;
  agencyName: string;
  subAgencyId?: string;
  subAgencyName?: string;
  requestedBy: {
    userId: string;
    name: string;
    email: string;
  };
  status: "pending" | "approved" | "rejected";
  reason?: string;
  createdAt: string;
  updatedAt: string;
  orgName?: string;
}

interface AgentRequestCardProps {
  request: AgentRequest;
  onViewDetails: () => void;
  onApproveClick: () => void;
  onDenyClick: () => void;

  canApprove: boolean;
  canDeny: boolean;
}

const AgentRequestCard: React.FC<AgentRequestCardProps> = ({
  request,
  onViewDetails,
  onApproveClick,
  onDenyClick,
  canApprove,
  canDeny,
}) => {
  const statusInfo = {
    pending: {
      icon: "mdi:clock-outline",
      color: "text-yellow-600",
      badgeColor: "bg-yellow-100 text-yellow-800",
      label: "Pending",
    },
    approved: {
      icon: "mdi:check-circle",
      color: "text-green-600",
      badgeColor: "bg-green-100 text-green-800",
      label: "Approved",
    },
    rejected: {
      icon: "mdi:close-circle",
      color: "text-red-600",
      badgeColor: "bg-red-100 text-red-800",
      label: "Rejected",
    },
  };

  const currentStatus = statusInfo[request.status];

  return (
    <div className="flex flex-col border border-gray-200 rounded-md overflow-hidden shadow-sm bg-white">
      {/* Header */}
      <div className="bg-purple-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-purple/20 rounded-full flex items-center justify-center">
            <Icon
              icon={currentStatus.icon}
              className={currentStatus.color}
              width={24}
              height={24}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {request.firstName} {request.lastName}
            </h2>
            <p className="text-sm text-gray-500">
              Requested on{" "}
              {format(new Date(request.createdAt), "MMM dd, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${currentStatus.badgeColor}`}
        >
          <Icon
            icon={currentStatus.icon}
            className="mr-1"
            width={14}
            height={14}
          />
          {currentStatus.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Contact and Role Info */}
        <div className="space-y-1 text-sm text-gray-700">
          {request.phone && (
            <p className="flex items-center gap-2">
              <Icon icon="mdi:phone" width="16" height="16" />
              {request.phone}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Icon icon="mdi:account-tie" width="16" height="16" />
            Role: <span className="font-medium">{request.role}</span>
          </p>
        </div>

        {/* Agency Info */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-1">
            <Icon
              icon="mdi:office-building"
              width={16}
              height={16}
              className="text-purple"
            />
            Agency
          </p>
          <p className="text-sm text-gray-600">{request.orgName || "—"}</p>
        </div>

        {/* Requested By Info */}
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-1">
            <Icon
              icon="mdi:account-plus"
              width={16}
              height={16}
              className="text-blue-600"
            />
            Requested By
          </p>
          <p className="text-sm text-gray-700">{request.requestedBy?.name}</p>
        </div>

        {/* Rejection Reason */}
        {request.status === "rejected" && request.reason && (
          <div className="bg-red-50 p-3 rounded-md border border-red-200">
            <p className="flex items-center gap-2 text-sm font-medium text-red-700 mb-1">
              <Icon icon="mdi:close-circle" width={16} height={16} />
              Rejection Reason
            </p>
            <p className="text-sm text-red-600">{request.reason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100 mt-4">
          <Button
            variant="infoStyle"
            label="View Details"
            icon="mdi:eye"
            onClick={onViewDetails}
            className="w-full sm:w-auto"
          />
          {canApprove && (
            <Button
              variant="submitStyle"
              label="Approve"
              icon="mdi:check"
              onClick={onApproveClick}
              className="w-full sm:w-auto"
            />
          )}
          {canDeny && (
            <Button
              variant="dangerStyle"
              label="Deny"
              icon="mdi:close"
              onClick={onDenyClick}
              className="w-full sm:w-auto"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentRequestCard;
