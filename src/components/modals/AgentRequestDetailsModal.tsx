import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import ModalWrapper from "@/components/ui/ModalWrapper";
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

interface AgentRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AgentRequest;
  onApprove: () => void;
  onDeny: () => void;
}

const AgentRequestDetailsModal: React.FC<AgentRequestDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onDeny,
}) => {
  const getStatusBadge = () => {
    const baseClasses =
      "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";

    switch (request.status) {
      case "pending":
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Icon
              icon="mdi:clock-outline"
              className="mr-2"
              width="16"
              height="16"
            />
            Pending Review
          </span>
        );
      case "approved":
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <Icon
              icon="mdi:check-circle"
              className="mr-2"
              width="16"
              height="16"
            />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <Icon
              icon="mdi:close-circle"
              className="mr-2"
              width="16"
              height="16"
            />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const canTakeAction = request.status === "pending";

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Agent Request Details"
      widthClass="max-w-2xl"
      footer={
        <div className="flex gap-3">
          {canTakeAction && (
            <div className="flex gap-3">
              <Button
                variant="submitStyle"
                label="Approve Request"
                icon="mdi:check"
                onClick={onApprove}
              />
              <Button
                variant="dangerStyle"
                label="Deny Request"
                icon="mdi:close"
                onClick={onDeny}
              />
            </div>
          )}
          <Button label="Close" icon="mdi:close" onClick={onClose} />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Request Status
            </h3>
            <p className="text-sm text-gray-600">
              Current status of this agent request
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Agent Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon
              icon="mdi:account-plus"
              className="text-purple"
              width="20"
              height="20"
            />
            Proposed Agent Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <p className="text-gray-900 font-medium">{request.firstName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <p className="text-gray-900 font-medium">{request.lastName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <p className="text-gray-900">{request.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <p className="text-gray-900">{request.phone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Role
              </label>
              <p className="text-gray-900 font-medium">{request.role}</p>
            </div>
          </div>
        </div>

        {/* Agency Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon
              icon="mdi:office-building"
              className="text-purple"
              width="20"
              height="20"
            />
            Agency Assignment
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency
              </label>
              <p className="text-gray-900 font-medium">{request?.orgName}</p>
            </div>
          </div>
        </div>

        {/* Request Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon
              icon="mdi:information"
              className="text-purple"
              width="20"
              height="20"
            />
            Request Information
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requested By
              </label>
              <p className="text-gray-900 font-medium">
                {request.requestedBy?.name}
              </p>
              <p className="text-sm text-gray-600">
                {request.requestedBy?.email}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Date
              </label>
              <p className="text-gray-900">
                {format(
                  new Date(request.createdAt),
                  "EEEE, MMMM dd, yyyy 'at' h:mm a"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        {request.status === "rejected" && request.reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <Icon
                icon="mdi:close-circle"
                className="text-red-600"
                width="20"
                height="20"
              />
              Rejection Reason
            </h4>
            <p className="text-red-700">{request.reason}</p>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

export default AgentRequestDetailsModal;
