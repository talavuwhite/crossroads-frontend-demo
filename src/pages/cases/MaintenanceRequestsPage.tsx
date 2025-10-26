import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  fetchMaintenanceRequestsByCase,
  updateMaintenanceRequestStatus,
  type MaintenanceRequest,
} from "@/services/maintenanceRequestApi";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import Footer from "@/components/PageFooter";
import UpdateMaintenanceStatusModal from "@/components/modals/UpdateMaintenanceStatusModal";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { updateCaseCount } from "@/redux/caseCountSlice";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const statusOptions = [
  { id: "Open", label: "Open" },
  { id: "In Progress", label: "In Progress" },
  { id: "Resolved", label: "Resolved" },
];

const statusColors: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-300",
  Resolved: "bg-green-100 text-green-800 border-green-300",
};

const MaintenanceRequestsPage: React.FC = () => {
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const dispatch = useDispatch();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const { data: userData } = useSelector((state: RootState) => state?.user);

  const fetchData = async (page = 1) => {
    if (!caseData?._id) return;
    setLoading(true);
    try {
      const response = await fetchMaintenanceRequestsByCase(caseData._id, page);
      setRequests(response.data.results);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.total);
      setCurrentPage(response.data.pagination.page);
      dispatch(
        updateCaseCount({
          key: "maintenanceRequests",
          value: response.data.pagination.total,
        })
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch maintenance requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [caseData?._id]);

  const handleOpenStatusModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedRequest) return;
    setStatusLoading(true);
    try {
      await updateMaintenanceRequestStatus(selectedRequest._id, status);
      toast.success("Status updated successfully");
      setStatusModalOpen(false);
      fetchData(currentPage);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-gray-50 overflow-auto">
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-pink flex items-center gap-2">
            <Icon className="iconify text-pink-600" icon="mdi:tools" />
            Maintenance Requests for {caseData?.firstName} {caseData?.lastName}
          </h1>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <Loader />
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-500 text-lg">
              No maintenance requests found.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-lg shadow-sm p-6 border border-purple-200 space-y-4"
              >
                <div className="flex flex-wrap justify-between items-center">
                  <div className="font-semibold text-lg text-purple flex items-center gap-2">
                    <Icon className="iconify" icon="mdi:tools" />
                    {req.requestId}
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${
                      statusColors[req.status] ||
                      "bg-gray-100 text-gray-800 border-gray-300"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <b className="text-pink">Tenant Name :</b>{" "}
                    {caseData?.firstName + " " + caseData?.lastName}
                  </div>
                  <div>
                    <b className="text-pink">Property Address :</b>{" "}
                    {caseData?.streetAddress?.address || "N/A"}
                  </div>
                  <div>
                    <b className="text-pink">Category :</b> {req.categoryId}
                  </div>
                  <div>
                    <b className="text-pink">Priority :</b> {req.priority}
                  </div>
                  <div>
                    <b className="text-pink">Request Date :</b>{" "}
                    {req.dateSubmitted
                      ? formatDate(
                          toZonedTime(req.dateSubmitted, userTimeZone),
                          "MMM dd, yyyy"
                        )
                      : "N/A"}
                  </div>
                  <div>
                    <b className="text-pink">Preferred Visit Time :</b>{" "}
                    {(() => {
                      if (!req.preferredVisitTime) return "N/A";
                      const d = toZonedTime(
                        req.preferredVisitTime,
                        userTimeZone
                      );
                      return d instanceof Date && !isNaN(d.getTime())
                        ? formatDate(d, "MMM dd, yyyy 'at' hh:mm a")
                        : req.preferredVisitTime;
                    })()}
                  </div>
                </div>

                <div>
                  <b className="text-pink">Description :</b>
                  <p className="ml-1 text-gray-700">{req.description}</p>
                </div>

                {req.notes && (
                  <div>
                    <b className="text-pink">Internal Notes :</b>
                    <p className="ml-1 text-gray-700">{req.notes}</p>
                  </div>
                )}

                <div>
                  <b className="text-pink">File Attachments :</b>
                  {Array.isArray(req.document) && req.document.length > 0 ? (
                    <ul className="list-disc ml-6 mt-1 space-y-1">
                      {req.document.map((doc) => (
                        <li key={doc._id}>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline break-all inline-block"
                            download
                          >
                            {doc.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 ml-2">No attachments</span>
                  )}
                </div>

                {userData?.propertyRole !== "Agent" && (
                  <div className="pt-2">
                    <Button
                      label="Update Status"
                      variant="submitStyle"
                      icon="mdi:refresh"
                      onClick={() => handleOpenStatusModal(req)}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {requests.length > 0 && (
        <Footer
          count={requests.length}
          label={`Page ${currentPage} of ${totalPages} (${totalItems} total)`}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={() => fetchData(currentPage - 1)}
          onNext={() => fetchData(currentPage + 1)}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}

      {selectedRequest && (
        <UpdateMaintenanceStatusModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          onSubmit={handleStatusUpdate}
          currentStatus={selectedRequest.status}
          statusOptions={statusOptions}
          loading={statusLoading}
        />
      )}
    </div>
  );
};

export default MaintenanceRequestsPage;
