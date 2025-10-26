import React, { useState, useEffect, useCallback } from "react";
import AssistanceCard from "@/components/AssistanceCard";
import Footer from "@/components/PageFooter";
import CaseDetailsFilter from "@/components/CaseDetailsFilter";
import Button from "@/components/ui/Button";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import type { CaseNote, FilterKeys } from "@/types/case";
import AddNoteModal from "@/components/modals/AddNoteModal";
import {
  createCaseNote,
  fetchCaseNotes,
  updateCaseNote,
  deleteCaseNote,
} from "@/services/CaseNotesApi";
import type { ApiResponse } from "@/types/api";
import DeleteCaseModal from "@/components/modals/DeleteCaseModal";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import Loader from "@/components/ui/Loader";
import { handleFilterChange } from "@/utils/commonFunc";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { updateCaseCount } from "@/redux/caseCountSlice";

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [totalNotes, setTotalNotes] = useState(0);
  const [editNote, setEditNote] = useState<CaseNote | null>(null);
  const [isDeleteNoteModalOpen, setIsDeleteNoteModalOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);
  const { canEditDeleteAssistance } = useRoleAccess();
  const dispatch = useDispatch();

  if (!caseData) {
    toast.error(STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
  }

  const [filters, setFilters] = useState<Record<FilterKeys, boolean>>({
    caseName: true,
    live_with: false,
    related: false,
  });

  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

  const fetchNotes = async () => {
    if (!caseData?._id) return;

    try {
      setLoading(true);
      const selectedTypes = Object.entries(filters)
        .filter(([key, value]) => value && key !== "caseName")
        .map(([key]) => key);

      const relationshipType =
        selectedTypes.length > 0 ? selectedTypes.join(",") : undefined;

      const response = await fetchCaseNotes(
        caseData._id,
        currentPage,
        limit,
        relationshipType,
        userData?.userId,
        userData?.activeLocation
      );

      setNotes(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalNotes(response.data.pagination.total);
    } catch (error: any) {
      console.error("Error fetching notes:", error);
      toast.error(error.message || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [caseData?._id, currentPage, limit, filters]);

  const handleAddNote = () => {
    setIsAddNoteModalOpen(true);
  };

  const handleCloseAddNoteModal = () => {
    setIsAddNoteModalOpen(false);
    setEditNote(null);
    fetchNotes();
  };

  const handleSubmitNewNote = async (newNoteData: any, noteId?: string) => {
    if (!caseData?._id || !userData?.userId) {
      toast.error(STATIC_TEXTS.NOTES.MISSING_DATA);
      return;
    }

    try {
      let response: ApiResponse<CaseNote>;
      if (noteId) {
        response = await updateCaseNote(
          noteId,
          {
            description: newNoteData.description,
            visibleTo: newNoteData.visibleTo,
            attachment: newNoteData.file,
          },
          userData.userId,
          userData.activeLocation
        );
        toast.success(
          response?.message || STATIC_TEXTS.NOTES.NOTE_UPDATED_SUCCESS
        );
      } else {
        response = await createCaseNote(
          caseData?._id,
          {
            description: newNoteData.description,
            visibleTo: newNoteData.visibleTo,
            attachment: newNoteData.file,
          },
          userData.userId,
          userData.activeLocation
        );
        toast.success(
          response?.message || STATIC_TEXTS.NOTES.NOTE_ADDED_SUCCESS
        );
      }
      handleCloseAddNoteModal();
    } catch (error: any) {
      console.error("Error saving note:", error);
      toast.error(error.message || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    }
  };

  const handleEditNote = (id: string) => {
    const noteToEdit = notes.find((note) => note._id === id);
    if (!userData?.userId) {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
      return;
    }

    if (noteToEdit && canEditDeleteAssistance(noteToEdit.createdBy.userId)) {
      setEditNote(noteToEdit);
      setIsAddNoteModalOpen(true);
    } else {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
  };

  const handleDeleteNote = (id: string) => {
    const noteToDelete = notes.find((note) => note._id === id);
    if (!userData?.userId) {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
      return;
    }

    if (
      noteToDelete &&
      canEditDeleteAssistance(noteToDelete.createdBy.userId)
    ) {
      setNoteToDeleteId(id);
      setIsDeleteNoteModalOpen(true);
    } else {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
  };

  const handleConfirmDeleteNote = async () => {
    if (!noteToDeleteId || !userData?.userId) {
      toast.error(STATIC_TEXTS.NOTES.MISSING_DATA);
      return;
    }

    try {
      await deleteCaseNote(
        noteToDeleteId,
        userData.userId,
        userData.activeLocation
      );
      toast.success(STATIC_TEXTS.NOTES.NOTE_DELETED_SUCCESS);
      fetchNotes();
      setIsDeleteNoteModalOpen(false);
      setNoteToDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting note:", error);
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
  const endItem = Math.min(currentPage * limit, totalNotes);
  const footerLabel = `${startItem}-${endItem} of ${totalNotes} ${STATIC_TEXTS.NOTES.NOTES}`;

  const mapNoteRecord = useCallback((note: CaseNote) => {
    let receivedBy = null;
    if (typeof note.caseId === "string") {
      receivedBy = note.caseId;
    } else if (
      note.caseId &&
      typeof note.caseId === "object" &&
      "firstName" in note.caseId &&
      "lastName" in note.caseId
    ) {
      const caseObj = note.caseId as {
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
    if (note.createdBy) {
      if ("name" in note.createdBy && note.createdBy.name) {
        createdByName = note.createdBy.name;
      } else if (
        "firstName" in note.createdBy ||
        "lastName" in note.createdBy
      ) {
        createdByName = `${(note.createdBy as any).firstName || ""} ${
          (note.createdBy as any).lastName || ""
        }`.trim();
      }
    }

    return {
      id: note._id,
      author: note.createdBy.name,
      date: note.createdAt,
      content: note.description,
      attachment: note.attachment,
      relatedPerson: note.caseName,
      caseId: note.caseId,
      isPrivate: note.visibleTo === "Agency Only",
      provider: {
        name: createdByName,
        organization: note.visibleTo,
        agencyName:
          note.company?.companyName || note.company?.locationName || "",
      },
      createdBy: note.createdBy,
      receivedBy: receivedBy,
      agency: {
        _id: note.company?.companyId
          ? note.company.companyId
          : note.company?.locationId,
        name: note.company?.companyName
          ? note.company.companyName
          : note.company?.locationName,
      },
    };
  }, []);
  useEffect(() => {
    dispatch(updateCaseCount({ key: "notes", value: totalNotes }));
  }, [totalNotes]);
  return (
    <div className="flex flex-col h-full ">
      <div className="flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
        <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4 pr-10">
          <h1 className="text-2xl font-bold text-pink">
            Notes for {caseData?.firstName + " " + caseData?.lastName}
          </h1>

          <Button
            variant="submitStyle"
            label={STATIC_TEXTS.NOTES.ADD_NOTES}
            icon="mdi:plus"
            className="hover:bg-purple/90 transition-colors duration-200"
            onClick={handleAddNote}
          />
        </div>
        <CaseDetailsFilter
          filters={filters}
          onFilterChange={(key) =>
            handleFilterChange(key, setFilters, setCurrentPage)
          }
          caseName={caseData?.firstName + " " + caseData?.lastName}
          label="Notes for..."
        />
        {loading ? (
          <div className="flex justify-center items-center p-6">
            <Loader />
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {notes.length === 0 ? (
              <p className="text-center text-gray-500">
                {STATIC_TEXTS.COMMON.NO_DATA}
              </p>
            ) : (
              notes?.map((note) => (
                <AssistanceCard
                  key={note._id}
                  record={mapNoteRecord(note) as any}
                  type="Note"
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                  currentUser={userData}
                />
              ))
            )}
          </div>
        )}
      </div>
      {notes && notes.length > 0 && (
        <Footer
          count={notes.length}
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
        isOpen={isAddNoteModalOpen}
        onClose={handleCloseAddNoteModal}
        onSubmit={handleSubmitNewNote}
        editNote={editNote}
      />

      <DeleteCaseModal
        isOpen={isDeleteNoteModalOpen}
        onClose={() => setIsDeleteNoteModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteNote}
        title={STATIC_TEXTS.NOTES.CONFIRM_DELETE_TITLE}
        message={STATIC_TEXTS.NOTES.CONFIRM_DELETE_MESSAGE}
        confirmLabel={STATIC_TEXTS.COMMON.DELETE}
        confirmButtonLabel={STATIC_TEXTS.NOTES.DELETE_NOTE_BUTTON}
      />
    </div>
  );
};

export default NotesPage;
