import BedAssignmentCard from "@/components/bed-management/BedAssignmentCard";
import BedCheckOutModal from "@/components/bed-management/BedCheckOutModal";
import AddBedRequestModal from "@/components/modals/AddBedRequestModal";
import AssignBedModal from "@/components/modals/AssignBedModal";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import DenyDeleteBedRequestModal from "@/components/modals/DenyDeleteBedRequestModal";
import PageFooter from "@/components/PageFooter";
import Button from "@/components/ui/Button";
import type { RootState } from "@/redux/store";
import type { IBedCheckInRequestItem } from "@/services/BedManagementApi";
import {
  deleteBedRequest,
  fetchBedRequestsByCase,
} from "@/services/BedManagementApi";
import { HEADINGS, STATIC_TEXTS } from "@/utils/textConstants";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { Pagination } from "@/types/case";
import type { IBedListItem } from "@/types/bedManagement";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const BedAssignments = () => {
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const { id: caseId } = useParams<{ id: string }>();

  // Use the centralized role access hook
  const {
    canCreateBedRequest,
    canAssignBed,
    canEditBedRequest,
    canDeleteBedRequest,
  } = useRoleAccess();

  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
  const [isAssignBedModalOpen, setIsAssignBedModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

  // --- API assignments state ---
  const [assignments, setAssignments] = useState<IBedCheckInRequestItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Pagination state ---
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalItems: 0,
    totalPages: 1,
  });

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDenyDeleteModalOpen, setIsDenyDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<IBedCheckInRequestItem | null>(null);

  // Check if case is already checked in
  const isCaseCheckedIn = assignments.some(
    (assignment) =>
      assignment.status === "ACTIVE OCCUPANT" ||
      assignment.status === "SCHEDULED CHECKOUT"
  );

  // Convert assignment to bed list item for check-out modal
  const convertAssignmentToBedItem = (
    assignment: IBedCheckInRequestItem
  ): IBedListItem => {
    // Map assignment status to bed status
    const getBedStatus = (
      status: string
    ): "Available" | "Occupied" | "Unavailable" => {
      switch (status) {
        case "ACTIVE OCCUPANT":
          return "Occupied";
        case "CHECKEDIN-OUT":
          return "Available";
        default:
          return "Unavailable";
      }
    };

    // Use checkInDetails if available, otherwise fall back to legacy fields
    const checkInDetails = assignment.checkInDetails;
    const checkOutDetails = assignment.checkOutDetails;

    return {
      checkInId: checkInDetails?.checkInId || assignment._id,
      case: assignment.caseName,
      bedName: checkInDetails?.bedName || assignment.bedName || "",
      room: checkInDetails?.room || assignment.room || "",
      bedTypeName: checkInDetails?.bedTypeName || assignment.bedTypeName || "",
      checkIn: checkInDetails?.checkInDate || assignment.checkInDate || "",
      notes: assignment.notes || "",
      bedId: checkInDetails?.bedId || "",
      bedTypeId: checkInDetails?.bedTypeId || "",
      status: assignment?.bedStatus || getBedStatus(assignment.status),
      type: checkInDetails?.bedTypeName || "",
      checkOut: checkOutDetails?.checkOutDate || assignment.checkOutDate || "",
      checkOutId: checkOutDetails?.checkOutId || "",
    };
  };

  // Type guard for error with message
  function isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as Record<string, unknown>).message === "string"
    );
  }

  // --- Fetch assignments handler ---
  const handleFetchAssignments = useCallback(
    async (page = 1) => {
      if (!userData?.userId || !caseId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchBedRequestsByCase(
          userData.userId,
          caseId,
          page,
          pagination.limit
        );

        setAssignments(res?.data?.data || []);
        if (res?.data?.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
            totalItems: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          });
        }
      } catch (err: unknown) {
        let message = "Failed to fetch assignments";
        if (isErrorWithMessage(err)) {
          message = err.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [userData?.userId, caseId, pagination.limit]
  );

  // Add the handler function
  const handleDeleteAssignment = async () => {
    if (!selectedAssignment || !userData?.userId) return;
    try {
      const result = await deleteBedRequest(
        userData.userId,
        selectedAssignment._id
      );
      if (result.success) {
        toast.success(result.message || "Operation completed.");
        setIsConfirmDeleteOpen(false);
        setSelectedAssignment(null);
        handleFetchAssignments(pagination.page);
      } else {
        toast.error(result.message || "Operation completed.");
      }
    } catch {
      toast.error("An error occurred while deleting.");
    }
  };

  // Handle delete/deny action based on status
  const handleDeleteDenyAction = (assignment: IBedCheckInRequestItem) => {
    setSelectedAssignment(assignment);

    if (
      assignment.status === "ACTIVE OCCUPANT" ||
      assignment.status === "CHECKEDIN-OUT" ||
      assignment.status === "SCHEDULED CHECKOUT" ||
      assignment.status === "DENIED"
    ) {
      // For active occupants, show simple delete confirmation
      setIsConfirmDeleteOpen(true);
    } else {
      // For pending/requested status, show deny/delete modal
      setIsDenyDeleteModalOpen(true);
    }
  };

  // Handle edit/view request based on status
  const handleEditRequest = (assignment: IBedCheckInRequestItem) => {
    setSelectedAssignment(assignment);

    if (
      assignment.status === "ACTIVE OCCUPANT" ||
      assignment.status === "CHECKEDIN-OUT" ||
      assignment.status === "SCHEDULED CHECKOUT"
    ) {
      // Open check-out modal for active occupants
      setIsCheckOutModalOpen(true);
    } else if (assignment.status === "REQUESTED") {
      // Open edit modal for pending/denied requests
      setIsAddBedModalOpen(true);
    }
  };

  // Handle assign bed with check for already checked in
  const handleAssignBed = () => {
    if (isCaseCheckedIn) {
      toast.warning(
        "This case is already checked in. Cannot assign another bed."
      );
      return;
    }
    setIsAssignBedModalOpen(true);
  };

  // --- Pagination handlers ---
  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      handleFetchAssignments(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      handleFetchAssignments(pagination.page + 1);
    }
  };

  // --- Fetch on mount and when user/case changes ---
  useEffect(() => {
    handleFetchAssignments(1);
  }, [handleFetchAssignments]);

  // Calculate start and end indices for display
  const startIndex =
    assignments.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endIndex =
    assignments.length > 0 ? startIndex + assignments.length - 1 : 0;

  return (
    <>
      <div className="flex flex-col h-full ">
        <div className="flex flex-col flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
          <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-pink break-words">
                {HEADINGS.BED_ASSIGNMENTS.TITLE} for{" "}
                {caseData?.firstName + " " + caseData?.lastName}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {canCreateBedRequest && (
                <Button
                  variant="submitStyle"
                  icon="mdi:plus"
                  label={STATIC_TEXTS.BED_ASSIGNMENTS.ADD_BED_REQUEST}
                  onClick={() => setIsAddBedModalOpen(true)}
                  className="flex-1 sm:flex-none"
                />
              )}
              {canAssignBed && (
                <Button
                  variant="submitStyle"
                  icon="mdi:plus"
                  label={STATIC_TEXTS.BED_ASSIGNMENTS.ASSIGN_BED}
                  onClick={handleAssignBed}
                  className={`flex-1 sm:flex-none`}
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-5">
            {/* Show loading, error, or assignments */}
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                Loading assignments...
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : assignments.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No assignments found.
              </div>
            ) : (
              assignments.map((assignment, idx) => (
                <BedAssignmentCard
                  key={assignment._id + idx}
                  assignment={assignment}
                  onEdit={handleEditRequest}
                  onDelete={handleDeleteDenyAction}
                  canEdit={canEditBedRequest}
                  canDelete={canDeleteBedRequest}
                />
              ))
            )}
          </div>
        </div>

        {/* Pagination Footer */}
        {assignments.length !== 0 && (
          <div className="bg-white border-t border-[#E5E7EB]">
            <PageFooter
              count={pagination.total ?? 0}
              label={`${startIndex}–${endIndex} of ${
                pagination.totalPages ?? 0
              } Bed Assignments`}
              hasPrevious={pagination.page > 1}
              hasNext={pagination.page < pagination.totalPages}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
            />
          </div>
        )}
      </div>

      {/* Add Bed Request Modal - for new requests and editing pending/denied requests */}
      <AddBedRequestModal
        isOpen={isAddBedModalOpen}
        onClose={() => setIsAddBedModalOpen(false)}
        initialStep={3}
        caseData={caseData}
        editRequest={selectedAssignment || undefined}
        onSuccess={() => {
          handleFetchAssignments(pagination.page);
          setIsAddBedModalOpen(false);
          setSelectedAssignment(null);
        }}
      />

      {/* Assign Bed Modal - for assigning beds to cases */}
      <AssignBedModal
        isOpen={isAssignBedModalOpen}
        onClose={() => setIsAssignBedModalOpen(false)}
        caseData={caseData}
        onSuccess={() => handleFetchAssignments(pagination.page)}
      />

      {/* Check Out Modal - for active occupants */}
      {selectedAssignment && (
        <BedCheckOutModal
          isOpen={isCheckOutModalOpen}
          onClose={() => {
            setIsCheckOutModalOpen(false);
            setSelectedAssignment(null);
          }}
          selectedBed={convertAssignmentToBedItem(selectedAssignment)}
          onSuccess={() => {
            handleFetchAssignments(pagination.page);
            setSelectedAssignment(null);
            setIsCheckOutModalOpen(false);
          }}
        />
      )}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteAssignment}
        title="Delete Bed Assignment"
        message="Are you sure you want to delete this bed assignment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Deny/Delete Bed Request Modal */}
      {selectedAssignment && (
        <DenyDeleteBedRequestModal
          isOpen={isDenyDeleteModalOpen}
          onClose={() => {
            setIsDenyDeleteModalOpen(false);
            setSelectedAssignment(null);
          }}
          bedRequest={selectedAssignment}
          userId={userData?.userId || ""}
          onSuccess={() => {
            handleFetchAssignments(pagination.page);
            setSelectedAssignment(null);
            setIsDenyDeleteModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default BedAssignments;
