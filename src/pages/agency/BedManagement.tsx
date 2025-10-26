import BedRequestCard from "@/components/bed-management/BedRequestCard";
import CheckInFromBedRequestModal from "@/components/bed-management/CheckInFromBedRequestModal";
import DeleteBedRequestModal from "@/components/bed-management/DeleteBedRequestModal";
import SiteBedManagement from "@/components/bed-management/SiteBedManagement";
import AddBedRequestModal from "@/components/modals/AddBedRequestModal";
import PageFooter from "@/components/PageFooter";
import type { RootState } from "@/redux/store";
import {
  triggerBedsRefetch,
  triggerRequestsRefetch,
} from "@/redux/bedManagementSlice";
import {
  checkInBed,
  denyBedRequest,
  fetchAllBedRequests,
  fetchAvailableBedsBySite,
  type IAvailableBedOfSiteForCheckIn,
  type IBedCheckInRequestItem,
} from "@/services/BedManagementApi";
import type { ApiErrorResponse } from "@/types/api";
import { HEADINGS, STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";

export const BedManagement = () => {
  // Modal States
  const [isAddRequestModalOpen, setIsAddRequestModalOpen] = useState(false);
  const [isBedCheckInModalOpen, setIsBedCheckInModalOpen] = useState(false);
  const [isDeleteBedRequestModalOpen, setIsDeleteBedRequestModalOpen] =
    useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEditRequest, setSelectedEditRequest] =
    useState<IBedCheckInRequestItem | null>(null);

  const [bedRequests, setBedRequests] = useState<IBedCheckInRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for holding which request is being checked-in
  const [selectedCheckInRequest, setCheckInRequest] =
    useState<IBedCheckInRequestItem | null>(null);

  // State for holding which request is being deleted
  const [selectedDeleteRequest, setSelectedDeleteRequest] =
    useState<IBedCheckInRequestItem | null>(null);

  // State for available beds for check-in modal
  const [availableBeds, setAvailableBeds] = useState<
    IAvailableBedOfSiteForCheckIn[]
  >([]);
  const [loadingAvailableBeds, setLoadingAvailableBeds] = useState(false);

  // Get userId from Redux
  const userData = useSelector((state: RootState) => state.user.data);
  const shouldRefetchRequests = useSelector(
    (state: RootState) => state.bedManagement.shouldRefetchRequests
  );
  const dispatch = useDispatch();

  // Handler for fetching beds
  const getAllBedRequests = useCallback(
    async (page: number = currentPage) => {
      if (!userData?.userId) {
        toast.error("Please login to continue");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAllBedRequests(
          userData?.userId,
          page,
          itemsPerPage
        );
        if (res?.success) {
          // Handle new nested data structure
          const responseData = res?.data;
          if (responseData?.data && Array.isArray(responseData.data)) {
            setBedRequests(responseData.data);
            // Set pagination info
            if (responseData.pagination) {
              setTotalPages(responseData.pagination.totalPages || 1);
              setTotalItems(responseData.pagination.total || 0);
              setCurrentPage(responseData.pagination.page || 1);
            }
          } else if (Array.isArray(res?.data)) {
            // Fallback for old structure
            setBedRequests(res?.data || []);
          } else {
            setBedRequests([]);
          }
        } else {
          const msg = res?.message || "Failed to fetch beds";
          setError(msg);
          toast.error(msg);
        }
      } catch (err: unknown) {
        const error = err as ApiErrorResponse;
        const errorMessage =
          error?.response?.data?.message ||
          "Something went wrong while fetching beds. Please try again later.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [userData?.userId, currentPage, itemsPerPage]
  );

  useEffect(() => {
    getAllBedRequests();
  }, [getAllBedRequests, shouldRefetchRequests]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    getAllBedRequests(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    getAllBedRequests(1);
  };

  // Handler for check-in, wrapped in useCallback for stability
  const handleCheckInRequest = useCallback(
    async (request: IBedCheckInRequestItem) => {
      // Check if case is already allocated to a bed
      if (
        request.hasAllocatedBed ||
        request.currentBedAssignment ||
        request.status === "ACTIVE OCCUPANT"
      ) {
        const bedInfo = request.currentBedAssignment
          ? `${request.currentBedAssignment.bedName} in Room ${request.currentBedAssignment.room}`
          : "a bed";

        const agencyInfo = request.currentBedAssignment?.bedId?.companyName
          ? ` at ${request.currentBedAssignment.bedId.companyName}`
          : "";

        toast.warning(
          <div>
            <div className="font-semibold mb-1">Case Already Allocated</div>
            <div className="text-sm">
              <strong>{request.caseName}</strong> is already assigned to{" "}
              <strong>
                {bedInfo}
                {agencyInfo}
              </strong>
              .
            </div>
            <div className="text-xs mt-1 text-gray-600">
              You cannot check in a case that is already allocated to a bed.
            </div>
          </div>,
          {
            position: "top-center",
            autoClose: 6000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              minWidth: "400px",
              maxWidth: "500px",
            },
          }
        );
        return;
      }

      setCheckInRequest(request);
      setIsBedCheckInModalOpen(true);
      // Fetch available beds for the selected request
      if (!userData?.userId || !request?.siteId) {
        setAvailableBeds([]);
        return;
      }
      setLoadingAvailableBeds(true);
      try {
        const res = await fetchAvailableBedsBySite(
          request.siteId,
          userData.userId
        );
        if (res?.success && Array.isArray(res.data?.beds)) {
          setAvailableBeds(res.data.beds);
        } else {
          setAvailableBeds([]);
        }
      } catch (err: unknown) {
        setAvailableBeds([]);
        const error = err as ApiErrorResponse;
        const errorMessage =
          error?.response?.data?.message ||
          "Sorry, we couldn't load the available beds for this site right now. Please try again later.";
        toast.error(errorMessage);
      } finally {
        setLoadingAvailableBeds(false);
      }
    },
    [userData?.userId]
  );

  // Handler for delete request modal
  const handleDeleteRequest = useCallback((request: IBedCheckInRequestItem) => {
    setSelectedDeleteRequest(request);
    setIsDeleteBedRequestModalOpen(true);
  }, []);

  // Handler for edit request modal
  const handleEditRequest = useCallback((request: IBedCheckInRequestItem) => {
    setSelectedEditRequest(request);
    setIsEditModalOpen(true);
  }, []);

  // Reset the selected request when modal closes
  const onCloseCheckInModal = useCallback(() => {
    setCheckInRequest(null);
    setIsBedCheckInModalOpen(false);
  }, []);

  const onCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedEditRequest(null);
  }, []);

  // Handler for denying a bed request
  const handleDenyBedRequest = async (reason: string) => {
    if (!userData?.userId || !selectedDeleteRequest?._id) return;
    try {
      const res = await denyBedRequest(
        userData.userId,
        selectedDeleteRequest._id,
        { denialReason: reason }
      );
      if (res?.success) {
        toast.success(res.message || "Request denied successfully");
        getAllBedRequests();
        // Trigger Redux refetch actions for both bed requests and beds by company
        dispatch(triggerRequestsRefetch());
        dispatch(triggerBedsRefetch());
        setIsDeleteBedRequestModalOpen(false);
        setSelectedDeleteRequest(null);
      } else {
        toast.error(res?.message || "Failed to deny request");
      }
    } catch (err: unknown) {
      const error = err as ApiErrorResponse;
      toast.error(error?.message || "Failed to deny request");
    }
  };

  // Handler for check-in form submit
  const handleCheckIn = async (values: {
    bed: IAvailableBedOfSiteForCheckIn | null;
    checkInDate: Date | null;
    notes: string;
  }) => {
    if (!userData?.userId || !selectedCheckInRequest) {
      toast.error("Missing required data for check-in.");
      return;
    }
    if (!values.bed) {
      toast.error("Please select a bed.");
      return;
    }

    // Convert Date to string format for API
    const checkInDateString = values.checkInDate
      ? values.checkInDate.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Build payload with all bed details
    const payload = {
      caseId: selectedCheckInRequest?.caseId ?? "",
      caseName: selectedCheckInRequest?.caseName ?? "",
      bedId: values?.bed?.bedId,
      bedName: values?.bed?.bedName,
      room: values?.bed?.room,
      bedTypeId: values?.bed?.bedType?.bedTypeId,
      bedTypeName: values?.bed.bedType?.name,
      checkInDate: checkInDateString,
      notes: values?.notes,
    };

    try {
      const result = await checkInBed(userData?.userId, payload);
      if (result?.success) {
        toast.success(result?.message || "Bed checked in successfully.");
        setIsBedCheckInModalOpen(false);
        setCheckInRequest(null);
        // Refetch data on success
        getAllBedRequests();
        // Trigger Redux refetch actions for both bed requests and beds by company
        dispatch(triggerRequestsRefetch());
        dispatch(triggerBedsRefetch());
      } else {
        toast.error(result?.message || "Failed to check in bed.");
        // Refetch data on error too
        getAllBedRequests();
      }
    } catch (err: unknown) {
      const error = err as ApiErrorResponse;
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "An unexpected error occurred. Please try again."
      );
      // Refetch data on error
      getAllBedRequests();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 bg-purpleLight overflow-auto">
        <div className="bg-white shadow p-4 rounded-md mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-purple/10 flex p-2 rounded-full transform transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <Icon
                  icon="mdi:bed-clock"
                  className="text-purple"
                  width="24"
                  height="24"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-pink break-words">
                {HEADINGS.BED_MANAGEMENT.TITLE}
              </h1>
            </div>
            <button
              onClick={() => setIsAddRequestModalOpen(true)}
              className="relative text-white bg-purple hover:bg-purple/90 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 group after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer w-full sm:w-auto justify-center sm:justify-start"
            >
              <Icon icon="mdi:plus" width="18" height="18" />
              <span className="whitespace-nowrap">
                {STATIC_TEXTS.AGENCY.BED_MANAGEMENT.ADD_REQUEST}
              </span>
            </button>
          </div>
          <div className="bg-purple-200 h-[1px] my-4"></div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading bed requests...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : bedRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No bed requests found.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {bedRequests.map((request, index) => (
                  <BedRequestCard
                    key={request?._id || index}
                    request={request}
                    onCheckIn={handleCheckInRequest}
                    onDelete={handleDeleteRequest}
                    onEdit={handleEditRequest}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div className="mt-6">
                  {/* Summary of allocation status */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-800">
                            Allocated:{" "}
                            {
                              bedRequests.filter(
                                (req) =>
                                  req.hasAllocatedBed ||
                                  req.currentBedAssignment !== null ||
                                  req.status === "ACTIVE OCCUPANT"
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="font-medium text-purple-800">
                            Pending:{" "}
                            {
                              bedRequests.filter(
                                (req) =>
                                  !req.hasAllocatedBed &&
                                  req.currentBedAssignment === null &&
                                  req.status !== "ACTIVE OCCUPANT"
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <PageFooter
                    count={totalItems}
                    label={`${(currentPage - 1) * itemsPerPage + 1}–${Math.min(
                      currentPage * itemsPerPage,
                      totalItems
                    )} of ${totalItems} Bed Requests`}
                    hasPrevious={currentPage > 1}
                    hasNext={currentPage < totalPages}
                    onPrevious={() => handlePageChange(currentPage - 1)}
                    onNext={() => handlePageChange(currentPage + 1)}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    // Items per page functionality
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    showItemsPerPage={true}
                  />
                </div>
              )}
            </>
          )}
        </div>
        <SiteBedManagement />
      </div>

      {isAddRequestModalOpen && (
        <AddBedRequestModal
          isOpen={isAddRequestModalOpen}
          onClose={() => setIsAddRequestModalOpen(false)}
        />
      )}

      {/* Pass selected request to the modal */}
      {isBedCheckInModalOpen && selectedCheckInRequest && (
        <CheckInFromBedRequestModal
          key={selectedCheckInRequest._id}
          isOpen={isBedCheckInModalOpen}
          onClose={onCloseCheckInModal}
          request={selectedCheckInRequest}
          availableBeds={availableBeds}
          loadingAvailableBeds={loadingAvailableBeds}
          onCheckIn={handleCheckIn}
        />
      )}

      <DeleteBedRequestModal
        isOpen={isDeleteBedRequestModalOpen}
        onClose={() => {
          setIsDeleteBedRequestModalOpen(false);
          setSelectedDeleteRequest(null);
        }}
        request={selectedDeleteRequest}
        onDeny={handleDenyBedRequest}
      />

      {/* Edit Bed Request Modal */}
      {isEditModalOpen && selectedEditRequest && (
        <AddBedRequestModal
          isOpen={isEditModalOpen}
          onClose={onCloseEditModal}
          initialStep={3}
          editRequest={selectedEditRequest}
        />
      )}
    </div>
  );
};
