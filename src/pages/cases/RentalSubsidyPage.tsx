import React, { useState, useEffect } from "react";
import Footer from "@/components/PageFooter";
import Button from "@/components/ui/Button";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import {
  createRentalSubsidy,
  fetchRentalSubsidyByCase,
  updateRentalSubsidy,
  deleteRentalSubsidy,
} from "@/services/rentalSubsidyApi";
import Loader from "@/components/ui/Loader";
import AddEditRentalSubsidyModal from "@/components/modals/AddEditRentalSubsidyModal";
import { uploadRentalSubsidyDocument } from "@/services/rentalSubsidyApi";
import RentalSubsidyCard from "@/components/RentalSubsidyCard";
import { DocumentUploadModal } from "@/components/modals/DocumentUploadModal";
import { deleteRentalSubsidyDocument } from "@/services/rentalSubsidyApi";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { months } from "@/utils/constants";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { toZonedTime } from "date-fns-tz";
import { updateCaseCount } from "@/redux/caseCountSlice";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface RentalSubsidyRecord {
  _id: string;
  caseId: string;
  companyId: string;
  locationId: string;
  propertyAddress: string;
  agencyName: string;
  rentAmount: number;
  dueAmount: number;
  payableAmount: number;
  rentDueDate: string;
  lastPaymentDate: string;
  paymentStatus: string;
  subsidyType: string;
  subsidyAmount: number;
  subsidyStatus: string;
  leaseStartDate: string;
  leaseEndDate: string;
  documents?: Array<{
    _id: string;
    name: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const RentalSubsidyPage: React.FC = () => {
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [rentalSubsidies, setRentalSubsidies] = useState<RentalSubsidyRecord[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<RentalSubsidyRecord | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteDocumentModalOpen, setDeleteDocumentModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RentalSubsidyRecord | null>(
    null
  );
  const [documentToDelete, setDocumentToDelete] = useState<{
    recordId: string;
    documentId: string;
  } | null>(null);
  const { canManageRentalSubsidyRecord, canViewRentalSubsidy } =
    useRoleAccess();

  const fetchData = async (page = 1) => {
    if (!caseData?._id || !userData?.userId) {
      toast.error("User authentication missing.");
      return;
    }

    if (!canViewRentalSubsidy) {
      toast.error(
        "You don't have permission to view rental & subsidy records."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetchRentalSubsidyByCase(
        caseData._id,
        userData.userId,
        userData.activeLocation,
        page
      );
      // If response.data.results exists, use it; else fallback
      const arr = Array.isArray(response.data?.results)
        ? response.data.results
        : Array.isArray(response.data)
        ? response.data
        : response.data
        ? [response.data]
        : [];
      setRentalSubsidies(arr);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotalItems(response.data?.pagination?.total || arr.length);
      setCurrentPage(response.data?.pagination?.page || page);
      dispatch(updateCaseCount({ key: "rentalSubsidy", value: arr.length }));
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch rental & subsidy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [caseData?._id, currentPage]);

  const handleEdit = (record: any) => {
    setEditData(record);
    setModalOpen(true);
  };

  const handleSubmit = async (form: any, files?: File[]) => {
    if (!caseData?._id || !userData?.userId || !caseData?.caseCompanyInfo) {
      toast.error("User authentication or case data missing.");
      return;
    }

    // For new records, check against case data
    if (
      !editData &&
      !canManageRentalSubsidyRecord({
        companyId: caseData.caseCompanyInfo.companyId,
        locationId: caseData.caseCompanyInfo.locationId,
      })
    ) {
      toast.error(
        "You don't have permission to add rental & subsidy records for this case."
      );
      return;
    }

    // For existing records, check against the record itself
    if (
      editData &&
      !canManageRentalSubsidyRecord({
        companyId: editData.companyId,
        locationId: editData.locationId,
      })
    ) {
      toast.error(
        "You don't have permission to edit this rental & subsidy record."
      );
      return;
    }

    setModalLoading(true);
    try {
      let response;
      if (editData && editData._id) {
        response = await updateRentalSubsidy(
          editData._id,
          form,
          userData.userId,
          userData.activeLocation
        );
      } else {
        response = await createRentalSubsidy(
          caseData._id,
          form,
          userData.userId,
          userData.activeLocation
        );
      }
      if (files && response.data?._id) {
        for (const file of files) {
          await uploadRentalSubsidyDocument(
            response.data._id,
            file,
            userData.userId,
            userData.activeLocation
          );
        }
      }
      toast.success(
        editData && editData._id ? "Updated successfully" : "Added successfully"
      );
      setModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (record: any) => {
    setItemToDelete(record);
    setDeleteModalOpen(true);
  };

  const handleDeleteDocumentClick = (recordId: string, documentId: string) => {
    setDocumentToDelete({ recordId, documentId });
    setDeleteDocumentModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?._id || !userData?.userId) {
      toast.error("User authentication missing.");
      return;
    }

    if (
      !canManageRentalSubsidyRecord({
        companyId: itemToDelete.companyId,
        locationId: itemToDelete.locationId,
      })
    ) {
      toast.error(
        "You don't have permission to delete this rental & subsidy record."
      );
      return;
    }

    setLoading(true);
    try {
      await deleteRentalSubsidy(
        itemToDelete._id,
        userData.userId,
        userData.activeLocation
      );
      toast.success("Deleted successfully");
      fetchData(currentPage);
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleConfirmDocumentDelete = async () => {
    if (!documentToDelete || !userData?.userId) {
      toast.error("User authentication missing.");
      return;
    }

    // Find the parent record to check permissions
    const parentRecord = rentalSubsidies.find(
      (r) => r._id === documentToDelete.recordId
    );
    if (
      !parentRecord ||
      !canManageRentalSubsidyRecord({
        companyId: parentRecord.companyId,
        locationId: parentRecord.locationId,
      })
    ) {
      toast.error(
        "You don't have permission to delete documents from this record."
      );
      return;
    }

    setDocumentLoading(true);
    try {
      await deleteRentalSubsidyDocument(
        documentToDelete.recordId,
        documentToDelete.documentId,
        userData.userId,
        userData.activeLocation
      );
      toast.success("Document deleted successfully");
      fetchData(currentPage);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    } finally {
      setDocumentLoading(false);
      setDeleteDocumentModalOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleUploadDocument = async (file: File, documentName: string) => {
    if (!selectedRecord?._id || !userData?.userId) {
      toast.error("User authentication missing.");
      return;
    }

    setDocumentLoading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentName", documentName);

      await uploadRentalSubsidyDocument(
        selectedRecord._id,
        file,
        userData.userId,
        userData.activeLocation
      );

      toast.success("Document uploaded successfully");
      setDocumentModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleAddDocument = (record: any) => {
    setSelectedRecord(record);
    setDocumentModalOpen(true);
  };

  // Group data by month/year for the current year, but only show months with data
  const year = new Date().getFullYear();
  const monthCards = rentalSubsidies
    .filter((r) => {
      const d = toZonedTime(r.createdAt, userTimeZone);
      return d.getFullYear() === year;
    })
    .sort(
      (a, b) =>
        toZonedTime(a.createdAt, userTimeZone).getTime() -
        toZonedTime(b.createdAt, userTimeZone).getTime()
    )
    .map((record) => {
      const d = toZonedTime(record.createdAt, userTimeZone);
      const month = months[d.getMonth()];
      return (
        <div key={record._id} className="mb-6">
          <RentalSubsidyCard
            title={`Rental & Subsidy Details of ${month} ${year}`}
            data={record}
            onEdit={() => handleEdit(record)}
            onDelete={() => handleDeleteClick(record)}
            onAddDocument={() => handleAddDocument(record)}
            onDeleteDocument={(documentId) =>
              handleDeleteDocumentClick(record._id, documentId)
            }
          />
        </div>
      );
    });

  if (!canViewRentalSubsidy) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You do not have permission to view rental & subsidy records.
          </p>
        </div>
      </div>
    );
  }

  const canManageCurrentCase = () => {
    if (!caseData?.caseCompanyInfo) return false;
    return canManageRentalSubsidyRecord({
      companyId: caseData.caseCompanyInfo.companyId,
      locationId: caseData.caseCompanyInfo.locationId,
    });
  };

  return (
    <div className="flex flex-col h-full ">
      <div className="flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
        <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4 pr-10">
          <h1 className="text-2xl font-bold text-pink">
            Rental & Subsidy for{" "}
            {caseData?.firstName + " " + caseData?.lastName}
          </h1>
          {canManageCurrentCase() && (
            <Button
              variant="submitStyle"
              label={"Add Rental & Subsidy"}
              icon="mdi:plus"
              className="hover:bg-purple/90 transition-colors duration-200"
              onClick={() => {
                setEditData(null);
                setModalOpen(true);
              }}
            />
          )}
        </div>
        <div className="p-6 space-y-4">
          {loading ? <Loader /> : <div>{monthCards}</div>}
        </div>
      </div>
      {totalItems > 0 && (
        <Footer
          count={rentalSubsidies.length}
          label={`Page ${currentPage} of ${totalPages} (${totalItems} total)`}
          currentPage={currentPage}
          totalPages={totalPages}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
      {modalOpen && (
        <AddEditRentalSubsidyModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initialData={editData}
          loading={modalLoading}
        />
      )}
      {documentModalOpen && (
        <DocumentUploadModal
          isOpen={documentModalOpen}
          onClose={() => setDocumentModalOpen(false)}
          onSubmit={handleUploadDocument}
          loading={documentLoading}
        />
      )}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirmDelete={handleConfirmDelete}
        title="Delete Rental & Subsidy"
        message="Are you sure you want to delete this rental & subsidy record? This action cannot be undone."
        confirmLabel="DELETE"
        confirmButtonLabel="Delete Record"
      />
      <DeleteConfirmationModal
        isOpen={deleteDocumentModalOpen}
        onClose={() => {
          setDeleteDocumentModalOpen(false);
          setDocumentToDelete(null);
        }}
        onConfirmDelete={handleConfirmDocumentDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmLabel="DELETE"
        confirmButtonLabel="Delete Document"
      />
    </div>
  );
};

export default RentalSubsidyPage;
