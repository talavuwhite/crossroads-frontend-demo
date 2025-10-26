import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import type { RootState } from "@/redux/store";
import AgentRequestCard from "@/components/reusable/AgentRequestCard";
import AgentRequestDetailsModal from "@/components/modals/AgentRequestDetailsModal";
import Footer from "@/components/PageFooter";
import {
  getAgentRequests,
  approveAgentRequest,
  denyAgentRequest,
} from "@/services/AgentRequestApi";
import { CASES_PER_PAGE } from "@/utils/constants";
import ApproveDenyAgentReqModal from "@/components/modals/ApproveDenyAgentReqModal";

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
}

const AgentRequests: React.FC = () => {
  const { currentRole } = useRoleAccess();
  const { data: userData } = useSelector((state: RootState) => state.user);

  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "" | "pending" | "approved" | "rejected"
  >("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [isApproveFlow, setIsApproveFlow] = useState(true); // true = approve, false = deny

  // Access control
  if (currentRole !== "Network Administrator") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const fetchRequests = async () => {
    if (!userData?.userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getAgentRequests(
        userData.userId,
        currentPage,
        CASES_PER_PAGE,
        statusFilter === "" ? undefined : statusFilter,
        searchTerm
      );

      const raw = response.data.requests || [];
      // Map backend agent-approvals shape to UI shape
      const normalized = raw.map((r: any) => ({
        _id: r._id,
        firstName: r.agentPayload?.firstName || "",
        lastName: r.agentPayload?.lastName || "",
        email: r.agentPayload?.email || "",
        phone: r.agentPayload?.phone || "",
        role: r.agentPayload?.propertyRole || "Agent",
        agencyId: r.targetAgencyId,
        agencyName: r.agentPayload?.companyName || "",
        subAgencyId: Array.isArray(r.targetLocationIds)
          ? r.targetLocationIds[0]
          : undefined,
        subAgencyName: undefined,
        requestedBy: {
          userId: r.requestedByUserId,
          name: r.requestedByName,
          email: r.requestedByEmail,
        },
        status: r.status,
        reason: r.rejectionReason,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        orgName: r.orgName,
      }));

      setRequests(normalized);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.total || normalized.length);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch agent requests");
      toast.error(err?.message || "Failed to fetch agent requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userData?.userId, currentPage, statusFilter, searchTerm]);

  const handleApprove = async (requestId: string) => {
    if (!userData?.userId) return;

    try {
      await approveAgentRequest(requestId, userData.userId);
      toast.success("Agent request approved successfully");
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve request");
    }
  };

  const handleDeny = async (requestId: string, reason: string) => {
    if (!userData?.userId) return;

    try {
      await denyAgentRequest(requestId, reason, userData.userId);
      toast.success("Agent request denied");
      fetchRequests(); // Refresh the list
    } catch (err: any) {
      toast.error(err?.message || "Failed to deny request");
    }
  };

  const handleViewDetails = (request: AgentRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (statusFilter !== "" && request.status !== statusFilter) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          request.firstName.toLowerCase().includes(searchLower) ||
          request.lastName.toLowerCase().includes(searchLower) ||
          request.email.toLowerCase().includes(searchLower) ||
          request.agencyName.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [requests, statusFilter, searchTerm]);

  const getStatusCount = (status: string) => {
    return requests.filter((req) => req.status === status).length;
  };

  const pendingCount = getStatusCount("pending");
  const approvedCount = getStatusCount("approved");
  const deniedCount = getStatusCount("rejected");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto !hide-scrollbar">
        {/* Header */}
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="ph:user-list-bold"
                className="text-purple"
                width="24"
                height="24"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-pink">Agent Requests</h1>
              <p className="text-gray-600">
                Review and manage agent creation requests from agency
                administrators
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="infoStyle"
              label="Refresh"
              icon="mdi:refresh"
              onClick={fetchRequests}
            />
          </div>
        </div>

        <div className="mx-auto p-4 sm:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Icon
                      icon="mdi:clock-outline"
                      className="text-yellow-600"
                      width="20"
                      height="20"
                    />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon
                      icon="mdi:check-circle-outline"
                      className="text-green-600"
                      width="20"
                      height="20"
                    />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {approvedCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Icon
                      icon="mdi:close-circle-outline"
                      className="text-red-600"
                      width="20"
                      height="20"
                    />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Rejected</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {deniedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple focus:border-purple"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 !outline-none rounded-lg focus:ring-2 focus:ring-purple focus:border-purple"
                  />
                  <Icon
                    icon="mdi:magnify"
                    className="absolute left-3 top-2.5 text-gray-400"
                    width="20"
                    height="20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div>
            {loading ? (
              <div className="p-8 text-center">
                <Loader width={4} height={4} />
                <p className="mt-2 text-gray-500">Loading agent requests...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-500 mb-2">
                  <Icon
                    icon="mdi:alert-circle"
                    width="48"
                    height="48"
                    className="mx-auto"
                  />
                </div>
                <p className="text-red-600">{error}</p>
                <Button
                  variant="default"
                  label="Try Again"
                  onClick={fetchRequests}
                  className="mt-4"
                />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Icon
                    icon="mdi:account-group-outline"
                    width="48"
                    height="48"
                    className="mx-auto"
                  />
                </div>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== ""
                    ? "No agent requests match your criteria"
                    : "No agent requests found"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 space-y-4">
                {filteredRequests.map((request) => (
                  <AgentRequestCard
                    key={request._id}
                    request={request}
                    onViewDetails={() => handleViewDetails(request)}
                    onApproveClick={() => {
                      setSelectedRequest(request);
                      setIsApproveFlow(true);
                      setActionModalOpen(true);
                    }}
                    onDenyClick={() => {
                      setSelectedRequest(request);
                      setIsApproveFlow(false);
                      setActionModalOpen(true);
                    }}
                    canApprove={request.status === "pending"}
                    canDeny={request.status === "pending"}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Pagination - same component as other pages */}
      <Footer
        count={filteredRequests?.length}
        label={`Requests: ${totalItems}`}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={() => setCurrentPage(Math.max(1, currentPage - 1))}
        onNext={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
      />
      {/* Request Details Modal */}
      {selectedRequest && (
        <AgentRequestDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onApprove={() => {
            setIsApproveFlow(true);
            setActionModalOpen(true);
          }}
          onDeny={() => {
            setIsApproveFlow(false);
            setActionModalOpen(true);
          }}
        />
      )}
      {selectedRequest && (
        <ApproveDenyAgentReqModal
          isOpen={actionModalOpen}
          onClose={() => setActionModalOpen(false)}
          request={`${selectedRequest.firstName} ${selectedRequest.lastName}`}
          isApprove={isApproveFlow}
          onApprove={async () => {
            await handleApprove(selectedRequest._id);
            setActionModalOpen(false);
            setIsDetailsModalOpen(false);
            setSelectedRequest(null);
          }}
          onDeny={async (reason) => {
            await handleDeny(selectedRequest._id, reason);
            setActionModalOpen(false);
            setIsDetailsModalOpen(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
};

export default AgentRequests;
