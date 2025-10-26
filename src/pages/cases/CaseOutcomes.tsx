import AddCommentModal from "@/components/modals/AddCommentModal";
import AddGoalSetModal from "@/components/modals/AddGoalSetModal";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import PrintOutcomesModal from "@/components/modals/PrintOutcomesModal";
import UpdateGoalSetModal from "@/components/modals/UpdateGoalSetModal";
import UpdateOutcomeGoalModal from "@/components/modals/UpdateOutcomeGoalModal";
import OutcomeCard from "@/components/OutcomeCard";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import Footer from "@/components/PageFooter";
import type { RootState } from "@/redux/store";
import {
  createOutcomeComment,
  deleteGoalSet,
  deleteOutcomeComment,
  getCaseOutcomes,
  updateOutcomeComment,
  type ICaseOutcome,
  type ICaseOutcomeComment,
  type ICaseOutcomeSection,
} from "@/services/CaseApi";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CASES_PER_PAGE } from "@/utils/constants";
import { handleNextPage, handlePreviousPage } from "@/utils/commonFunc";

const CaseOutcomes = () => {
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);

  // → Goal sets data state
  const [caseOutcomes, setCaseOutcomes] = useState<ICaseOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // → Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // → Modal states
  const [isAddGoalSetModalOpen, setIsAddGoalSetModalOpen] = useState(false);
  const [isUpdateGoalSetModalOpen, setIsUpdateGoalSetModalOpen] =
    useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = useState(false);
  const [isUpdateOutcomeGoalModalOpen, setIsUpdateOutcomeGoalModalOpen] =
    useState(false);
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] =
    useState(false);

  // → Delete state
  const [outcomeToDelete, setOutcomeToDelete] = useState<ICaseOutcome | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // → Comment and goal state
  const [selectedOutcome, setSelectedOutcome] = useState<ICaseOutcome | null>(
    null
  );
  const [selectedSection, setSelectedSection] =
    useState<ICaseOutcomeSection | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{
    outcomeId: string;
    commentId: string;
  } | null>(null);
  const [commentToEdit, setCommentToEdit] = useState<{
    outcome: ICaseOutcome;
    comment: ICaseOutcomeComment;
  } | null>(null);

  // → UI state for each outcome card
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<string>>(
    new Set()
  );

  // → Fetch case outcomes when component mounts or case changes
  const fetchCaseOutcomes = useCallback(async () => {
    if (!caseData?._id || !userData?.userId || !userData?.activeLocation) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getCaseOutcomes(
        caseData._id,
        currentPage,
        CASES_PER_PAGE,
        userData?.userId,
        userData?.activeLocation
      );
      if (response?.data) {
        setCaseOutcomes(response.data?.data || []);

        if (response.data.pagination) {
          setTotalPages(Number(response.data.pagination.totalPages) || 1);
          setTotalItems(Number(response.data.pagination.totalItems) || 0);
        }
      } else {
        setCaseOutcomes([]);
      }
    } catch (err) {
      setError("Failed to load case outcomes");
      toast.error("Failed to load case outcomes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [caseData?._id, userData?.userId, userData?.activeLocation, currentPage]);

  // → Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchCaseOutcomes();
  }, [fetchCaseOutcomes]);

  // → Handle goal set creation/update
  const handleGoalSetSubmit = useCallback(() => {
    // → Refresh the outcomes list after successful creation/update
    fetchCaseOutcomes();
  }, [fetchCaseOutcomes]);

  // → Handle delete outcome
  const handleDeleteOutcome = useCallback((outcome: ICaseOutcome) => {
    setOutcomeToDelete(outcome);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!outcomeToDelete || !userData?.userId || !userData?.activeLocation) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await deleteGoalSet(
        outcomeToDelete._id,
        userData.userId,
        userData.activeLocation
      );

      if (response?.success) {
        toast.success(response?.message || "Goal set deleted successfully");

        // → Remove the deleted outcome from the list
        setCaseOutcomes((prev) =>
          prev.filter((outcome) => outcome._id !== outcomeToDelete._id)
        );

        // → Close modal and reset state
        setIsDeleteModalOpen(false);
        setOutcomeToDelete(null);
      } else {
        toast.error(response?.message || "Failed to delete goal set");
      }
    } catch {
      toast.error("Failed to delete goal set. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // → Handle print outcome
  const handlePrintOutcome = useCallback(() => {
    setIsPrintModalOpen(true);
  }, []);

  // → Handle edit outcome
  const handleEditOutcome = useCallback((outcome: ICaseOutcome) => {
    setSelectedOutcome(outcome);
    setIsUpdateGoalSetModalOpen(true);
  }, []);

  // → Handle add comment
  const handleAddComment = useCallback((outcome: ICaseOutcome) => {
    setSelectedOutcome(outcome);
    setIsAddCommentModalOpen(true);
  }, []);

  // → Handle update goal
  const handleUpdateGoal = useCallback(
    (outcome: ICaseOutcome, section: ICaseOutcomeSection) => {
      setSelectedOutcome(outcome);
      setSelectedSection(section);
      setIsUpdateOutcomeGoalModalOpen(true);
    },
    []
  );

  // → Handle delete comment
  const handleDeleteComment = useCallback(
    (outcome: ICaseOutcome, commentId: string) => {
      setCommentToDelete({ outcomeId: outcome._id, commentId });
      setIsDeleteCommentModalOpen(true);
    },
    []
  );

  // → Handle edit comment
  const handleEditComment = useCallback(
    (outcome: ICaseOutcome, commentId: string) => {
      const comment = outcome?.comments?.find((c) => c?._id === commentId);
      if (comment) {
        setCommentToEdit({ outcome, comment });
        setIsAddCommentModalOpen(true);
      }
    },
    []
  );

  // → Handle comment submission (both add and edit)
  const handleCommentSubmit = useCallback(
    async (
      data: { text: string; file: File | string | null } | string,
      formData?: { text: string; file: File | string | null }
    ) => {
      // → Handle edit case (when commentId is passed as first parameter)
      if (typeof data === "string" && formData) {
        const commentId = data;
        const commentData = formData;

        if (!commentToEdit?.outcome?._id || !userData?.userId) {
          toast.error("Missing outcome or user information.");
          return;
        }

        try {
          await updateOutcomeComment(
            commentToEdit?.outcome?._id,
            commentId,
            {
              text: commentData?.text,
              file:
                commentData?.file instanceof File
                  ? commentData?.file
                  : undefined,
            },
            userData?.userId
          );
          toast.success("Comment updated successfully");
          setIsAddCommentModalOpen(false);
          setCommentToEdit(null);
          fetchCaseOutcomes();
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update comment";
          toast.error(errorMessage);
        }
        return;
      }

      // → Handle add case (when only form data is passed)
      const commentData = data as { text: string; file: File | string | null };

      if (!selectedOutcome?._id || !userData?.userId) {
        toast.error("Missing outcome or user information.");
        return;
      }

      try {
        await createOutcomeComment(
          selectedOutcome?._id,
          {
            text: commentData?.text,
            file:
              commentData?.file instanceof File ? commentData?.file : undefined,
          },
          userData?.userId
        );
        toast.success("Comment added successfully");
        setIsAddCommentModalOpen(false);
        setSelectedOutcome(null);
        fetchCaseOutcomes();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add comment";
        toast.error(errorMessage);
      }
    },
    [selectedOutcome, commentToEdit, userData, fetchCaseOutcomes]
  );

  // → Handle goal update submission
  const handleGoalUpdateSubmit = useCallback(
    // @ts-ignore
    (id: string, data: unknown) => {
      fetchCaseOutcomes();
      setIsUpdateOutcomeGoalModalOpen(false);
      setSelectedOutcome(null);
      setSelectedSection(null);
    },
    [fetchCaseOutcomes]
  );

  // → Handle comment deletion
  const handleCommentDelete = useCallback(async () => {
    if (!commentToDelete || !userData?.userId) {
      toast.error("Missing comment or user information.");
      return;
    }
    try {
      await deleteOutcomeComment(
        commentToDelete.outcomeId,
        commentToDelete.commentId,
        userData.userId
      );
      toast.success("Comment deleted successfully");
      setIsDeleteCommentModalOpen(false);
      setCommentToDelete(null);
      fetchCaseOutcomes();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete comment";
      toast.error(errorMessage);
    }
  }, [commentToDelete, userData, fetchCaseOutcomes]);

  // → Handle toggle history/comment visibility
  const handleToggleHistoryComment = useCallback((outcomeId: string) => {
    setExpandedOutcomes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(outcomeId)) {
        newSet.delete(outcomeId);
      } else {
        newSet.add(outcomeId);
      }
      return newSet;
    });
  }, []);

  // → Show loading state
  if (loading) {
    return <Loader />;
  }

  // → Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-8 px-4">
        <div className="text-center max-w-sm sm:max-w-md">
          <div className="text-red-500 mx-auto mb-2 text-2xl">⚠️</div>
          <p className="text-red-600 text-sm sm:text-base">{error}</p>
          <button
            onClick={fetchCaseOutcomes}
            className="mt-2 text-sm text-blue-600 hover:text-blue-500 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // → Calculate pagination info
  const startItem = (currentPage - 1) * CASES_PER_PAGE + 1;
  const endItem = Math.min(currentPage * CASES_PER_PAGE, totalItems);
  const paginationLabel = `${startItem}-${endItem} of ${totalItems} Outcomes`;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header Section */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-pink break-words">
              {`${STATIC_TEXTS.OUTCOMES.OUTCOMES_FOR} ${
                caseData?.firstName || ""
              } ${caseData?.lastName || ""}`}
            </h1>
          </div>
          <div className="flex-shrink-0">
            <Button
              variant="submitStyle"
              label={STATIC_TEXTS.OUTCOMES.ADD_GOAL_SET}
              icon="mdi:plus"
              className="!w-full sm:w-auto hover:bg-purple/90 transition-colors flex !justify-center !text-center duration-200 text-sm sm:text-base"
              onClick={() => setIsAddGoalSetModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 bg-gray-100 overflow-y-auto overflow-x-hidden">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* → Show empty state if no outcomes */}
          {!caseOutcomes || caseOutcomes?.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="p-4 sm:p-6 bg-purple-50 border border-purple-400 rounded-lg max-w-md w-full mx-4">
                <h1
                  role="button"
                  onClick={() => setIsAddGoalSetModalOpen(true)}
                  className="text-base sm:text-lg text-purple-600 font-bold underline cursor-pointer text-center"
                >
                  {STATIC_TEXTS.OUTCOMES.EMPTY_OUTCOME_TITLE}
                </h1>
                <div className="flex flex-col gap-3 text-xs sm:text-sm mt-3">
                  <p className="text-center">
                    {STATIC_TEXTS.OUTCOMES.EMPTY_OUTCOME_DESC}
                  </p>
                  <p className="text-center">
                    {STATIC_TEXTS.OUTCOMES.EMPTY_OUTCOME_DESC1}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* → Show outcomes list */
            <div className="flex flex-col gap-4 sm:gap-6 max-w-full">
              {caseOutcomes?.map((outcome, index) => (
                <div key={outcome?._id || index} className="w-full">
                  <OutcomeCard
                    outcome={outcome}
                    onEditGoalSet={handleEditOutcome}
                    onDeleteGoalSet={handleDeleteOutcome}
                    onPrintGoalSet={handlePrintOutcome}
                    onAddComment={handleAddComment}
                    onUpdateGoal={handleUpdateGoal}
                    onDeleteComment={handleDeleteComment}
                    onEditComment={handleEditComment}
                    showHistoryComment={expandedOutcomes?.has(outcome._id)}
                    onToggleHistoryComment={() =>
                      handleToggleHistoryComment(outcome?._id)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* → Pagination Footer */}
      {caseOutcomes && caseOutcomes.length > 0 && (
        <Footer
          count={caseOutcomes.length}
          label={paginationLabel}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={() => {
            handlePreviousPage(setCurrentPage);
          }}
          onNext={() => {
            handleNextPage(setCurrentPage, totalPages);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}

      {/* → Add Goal Set Modal */}
      <AddGoalSetModal
        isOpen={isAddGoalSetModalOpen}
        onClose={() => setIsAddGoalSetModalOpen(false)}
        onSubmit={handleGoalSetSubmit}
      />

      {/* → Update Goal Set Modal */}
      {isUpdateGoalSetModalOpen && selectedOutcome && (
        <UpdateGoalSetModal
          isOpen={isUpdateGoalSetModalOpen}
          onClose={() => {
            setIsUpdateGoalSetModalOpen(false);
            setSelectedOutcome(null);
          }}
          goalSetData={selectedOutcome}
          onSubmit={handleGoalSetSubmit}
        />
      )}

      {/* → Print Modal */}
      <PrintOutcomesModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* → Add/Edit Comment Modal */}
      {isAddCommentModalOpen && (selectedOutcome || commentToEdit) && (
        <AddCommentModal
          isOpen={isAddCommentModalOpen}
          onClose={() => {
            setIsAddCommentModalOpen(false);
            setSelectedOutcome(null);
            setCommentToEdit(null);
          }}
          commentData={
            commentToEdit
              ? {
                  _id: commentToEdit.comment._id,
                  text: commentToEdit.comment.text,
                  file: commentToEdit.comment.file || null,
                }
              : null
          }
          onSubmit={handleCommentSubmit}
        />
      )}

      {/* → Update Outcome Goal Modal */}
      {isUpdateOutcomeGoalModalOpen && selectedOutcome && selectedSection && (
        <UpdateOutcomeGoalModal
          isOpen={isUpdateOutcomeGoalModalOpen}
          onClose={() => {
            setIsUpdateOutcomeGoalModalOpen(false);
            setSelectedOutcome(null);
            setSelectedSection(null);
          }}
          selectedOutcome={selectedOutcome}
          selectedSection={selectedSection}
          onSubmit={handleGoalUpdateSubmit}
        />
      )}

      {/* → Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmationModal
          title={STATIC_TEXTS.OUTCOMES.DELETE_GOAL_SET}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setOutcomeToDelete(null);
          }}
          onConfirm={handleDelete}
          message={`${STATIC_TEXTS.OUTCOMES.DELETE_GOAL_SET_DESC} "${outcomeToDelete?.title}"?`}
          variant="danger"
          loading={isDeleting}
        />
      )}

      {/* → Delete Comment Confirmation Modal */}
      {isDeleteCommentModalOpen && (
        <ConfirmationModal
          title={STATIC_TEXTS.COMMON.DELETE_COMMENT}
          isOpen={isDeleteCommentModalOpen}
          onClose={() => {
            setIsDeleteCommentModalOpen(false);
            setCommentToDelete(null);
          }}
          onConfirm={handleCommentDelete}
          message={STATIC_TEXTS.COMMON.DELETE_COMMENT_DESC}
          variant="danger"
        />
      )}
    </div>
  );
};

export default CaseOutcomes;
