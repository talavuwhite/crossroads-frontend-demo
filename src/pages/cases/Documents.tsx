import React, { useState, useEffect, useCallback } from "react";
import AssistanceCard from "@/components/AssistanceCard";
import Footer from "@/components/PageFooter";
import CaseDetailsFilter from "@/components/CaseDetailsFilter";
import Button from "@/components/ui/Button";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import type { CaseDocument, FilterKeys } from "@/types/case";
import {
  createCaseDocument,
  fetchCaseDocuments,
  updateCaseDocument,
  deleteCaseDocument,
} from "@/services/caseDocumentsApi";
import type { ApiResponse } from "@/types/api";
import DeleteCaseModal from "@/components/modals/DeleteCaseModal";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import Loader from "@/components/ui/Loader";
import AddNoteModal from "@/components/modals/AddNoteModal";
import { handleFilterChange } from "@/utils/commonFunc";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { updateCaseCount } from "@/redux/caseCountSlice";

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [editDocument, setEditDocument] = useState<CaseDocument | null>(null);
  const [isDeleteDocumentModalOpen, setIsDeleteDocumentModalOpen] =
    useState(false);
  const [documentToDeleteId, setDocumentToDeleteId] = useState<string | null>(
    null
  );
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);
  const { canEditDeleteDocument } = useRoleAccess();
  const dispatch = useDispatch();

  if (!caseData) {
    toast.error(STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
  }

  const [filters, setFilters] = useState<Record<FilterKeys, boolean>>({
    caseName: true,
    live_with: false,
    related: false,
  });

  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);

  const fetchDocuments = async () => {
    if (!caseData?._id) return;

    try {
      setLoading(true);
      const selectedTypes = Object.entries(filters)
        .filter(([key, value]) => value && key !== "caseName")
        .map(([key]) => key);

      const relationshipType =
        selectedTypes.length > 0 ? selectedTypes.join(",") : undefined;

      const response = await fetchCaseDocuments(
        caseData._id,
        currentPage,
        limit,
        relationshipType,
        userData?.userId,
        userData?.activeLocation
      );

      setDocuments(response.data.data);
      setTotalPages(response.data.pagination?.totalPages ?? 0);
      setTotalDocuments(response.data.pagination?.total ?? 0);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error(error.message || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [caseData?._id, currentPage, limit, filters]);

  const handleAddDocument = () => {
    setIsAddDocumentModalOpen(true);
  };

  const handleCloseAddDocumentModal = () => {
    setIsAddDocumentModalOpen(false);
    setEditDocument(null);
    fetchDocuments();
  };

  const handleSubmitNewDocument = async (
    newDocumentData: any,
    documentId?: string
  ) => {
    if (!caseData?._id || !userData?.userId) {
      toast.error(STATIC_TEXTS.DOCUMENTS.MISSING_DATA);
      return;
    }

    try {
      let response: ApiResponse<CaseDocument>;
      if (documentId) {
        response = await updateCaseDocument(
          documentId,
          {
            description: newDocumentData.description,
            visibleTo: newDocumentData.visibleTo,
            attachment: newDocumentData.file,
          },
          userData.userId,
          userData.activeLocation
        );
        toast.success(
          response?.message || STATIC_TEXTS.DOCUMENTS.DOCUMENT_UPDATED_SUCCESS
        );
      } else {
        response = await createCaseDocument(
          caseData?._id,
          {
            description: newDocumentData.description,
            visibleTo: newDocumentData.visibleTo,
            attachment: newDocumentData.file,
          },
          userData.userId,
          userData.activeLocation
        );
        toast.success(
          response?.message || STATIC_TEXTS.DOCUMENTS.DOCUMENT_ADDED_SUCCESS
        );
      }
      handleCloseAddDocumentModal();
    } catch (error: any) {
      console.error("Error saving document:", error);
      toast.error(error.message || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    }
  };

  const handleEditDocument = (id: string) => {
    const documentToEdit = documents.find((doc) => doc._id === id);
    if (!userData?.userId) {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
      return;
    }

    if (documentToEdit && canEditDeleteDocument()) {
      setEditDocument(documentToEdit);
      setIsAddDocumentModalOpen(true);
    } else {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
  };

  const handleDeleteDocument = (id: string) => {
    const documentToDelete = documents.find((doc) => doc._id === id);
    if (!userData?.userId) {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
      return;
    }

    if (documentToDelete && canEditDeleteDocument()) {
      setDocumentToDeleteId(id);
      setIsDeleteDocumentModalOpen(true);
    } else {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
  };

  const handleConfirmDeleteDocument = async () => {
    if (!documentToDeleteId || !userData?.userId) {
      toast.error(STATIC_TEXTS.DOCUMENTS.MISSING_DATA);
      return;
    }

    try {
      await deleteCaseDocument(
        documentToDeleteId,
        userData.userId,
        userData.activeLocation
      );
      toast.success(STATIC_TEXTS.DOCUMENTS.DOCUMENT_DELETED_SUCCESS);
      fetchDocuments();
      setIsDeleteDocumentModalOpen(false);
      setDocumentToDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error(error.message || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalDocuments);
  const footerLabel = `${startItem}-${endItem} of ${totalDocuments} Documents`;

  const mapNoteRecord = useCallback((doc: CaseDocument) => {
    let receivedBy = null;
    if (typeof doc.caseId === "string") {
      receivedBy = doc.caseId;
    } else if (
      doc.caseId &&
      typeof doc.caseId === "object" &&
      "firstName" in doc.caseId &&
      "lastName" in doc.caseId
    ) {
      const caseObj = doc.caseId as {
        firstName?: string;
        lastName?: string;
        _id?: string;
      };
      receivedBy = {
        _id: caseObj._id,
        name: `${caseObj.firstName || ""} ${caseObj.lastName || ""}`.trim(),
      };
    }

    let createdByName = "";
    if (doc.createdBy) {
      if ("name" in doc.createdBy && doc.createdBy.name) {
        createdByName = doc.createdBy.name;
      } else if ("firstName" in doc.createdBy || "lastName" in doc.createdBy) {
        createdByName = `${(doc.createdBy as any).firstName || ""} ${
          (doc.createdBy as any).lastName || ""
        }`.trim();
      }
    }

    const attachment =
      "attachedFile" in doc
        ? (doc as any).attachedFile || doc.attachment || null
        : doc.attachment || null;

    return {
      id: doc._id,
      author: doc.createdBy.name,
      date: doc.createdAt,
      content: doc.description,
      attachment,
      relatedPerson: doc.caseName,
      caseId: doc.caseId,
      isPrivate: doc.visibleTo === "Agency Only",
      provider: {
        name: createdByName,
        organization: doc.visibleTo,
        agencyName: doc.company?.companyName || doc.company?.locationName || "",
      },
      receivedBy: receivedBy,
      createdBy: doc.createdBy,
      type: doc.type,
      agency: {
        _id: doc.company?.companyId
          ? doc.company.companyId
          : doc.company?.locationId,
        name: doc.company?.companyName
          ? doc.company.companyName
          : doc.company?.locationName,
      },
      category: doc.category,
    };
  }, []);
  useEffect(() => {
    dispatch(updateCaseCount({ key: "documents", value: totalDocuments }));
  }, [totalDocuments]);

  return (
    <div className="flex flex-col h-full ">
      <div className="flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
        <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4 pr-10">
          <h1 className="text-2xl font-bold text-pink">
            {`${STATIC_TEXTS.DOCUMENTS.DOCUMENTS} for ${
              caseData?.firstName || ""
            } ${caseData?.lastName || ""}`}
          </h1>

          <Button
            variant="submitStyle"
            label={STATIC_TEXTS.DOCUMENTS.ADD_DOCUMENT}
            icon="mdi:plus"
            className="hover:bg-purple/90 transition-colors duration-200"
            onClick={handleAddDocument}
          />
        </div>
        <CaseDetailsFilter
          filters={filters}
          onFilterChange={(key) =>
            handleFilterChange(key, setFilters, setCurrentPage)
          }
          caseName={caseData?.firstName + " " + caseData?.lastName}
          label={`${STATIC_TEXTS.DOCUMENTS.DOCUMENTS} for...`}
        />
        {loading ? (
          <div className="flex justify-center items-center p-6">
            <Loader />
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {documents.length === 0 ? (
              <p className="text-center text-gray-500">
                {STATIC_TEXTS.COMMON.NO_DATA}
              </p>
            ) : (
              documents?.map((doc) => (
                <AssistanceCard
                  key={doc._id}
                  record={mapNoteRecord(doc) as any}
                  onEdit={handleEditDocument}
                  onDelete={handleDeleteDocument}
                  type={doc.type || "Document"}
                  comesFrom="document"
                  currentUser={userData}
                />
              ))
            )}
          </div>
        )}
      </div>
      {documents && documents.length > 0 && (
        <Footer
          count={documents.length}
          label={footerLabel}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}

      <AddNoteModal
        isOpen={isAddDocumentModalOpen}
        onClose={handleCloseAddDocumentModal}
        onSubmit={handleSubmitNewDocument}
        editDocument={editDocument}
        type="document"
      />

      <DeleteCaseModal
        isOpen={isDeleteDocumentModalOpen}
        onClose={() => setIsDeleteDocumentModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteDocument}
        title={STATIC_TEXTS.DOCUMENTS.CONFIRM_DELETE_TITLE}
        message={STATIC_TEXTS.DOCUMENTS.CONFIRM_DELETE_MESSAGE}
        confirmLabel={STATIC_TEXTS.COMMON.DELETE}
        confirmButtonLabel={STATIC_TEXTS.DOCUMENTS.DELETE_DOCUMENT_BUTTON}
      />
    </div>
  );
};

export default DocumentsPage;
