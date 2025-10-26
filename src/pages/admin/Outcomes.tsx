// =========================
// 1. Imports
// =========================
import UpsertGoalForm from "@/components/modals/GoalFormModal";
import Button from "@/components/ui/Button";
import type { RootState } from "@/redux/store";
import { HEADINGS, STATIC_TEXTS } from "@/utils/textConstants";
import ConfirmationModal from "@components/modals/ConfirmationModal";
import ManageOutcomeSectionsModal from "@components/modals/ManageOutcomeSectionsModal";
import ManageOutcomeStatusModaL from "@components/modals/ManageOutcomeStatusModal";
import PageFooter from "@components/PageFooter";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
// -> Import the API function and types for outcome goals
import type { IOutcomeGoalsApiResponse } from "@/services/OutcomesApi";
import {
  deleteOutcomeGoal,
  getOutcomeGoals,
  type IDeleteOutcomeGoalResponse,
} from "@/services/OutcomesApi";
import { toast } from "react-toastify";

// =========================
// 2. Component
// =========================
const Outcomes = () => {
  // =========================
  // 3. Component State
  // =========================
  const user = useSelector((state: RootState) => state.user.data);
  const [isLoading, setIsLoading] = useState(false);
  // -> State for current page, total pages, all sections (with their goals), total goals count, and error
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sections, setSections] = useState<IOutcomeGoalsApiResponse["results"]>(
    []
  );
  const [goalsCount, setGoalsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [manageSectionModalOpen, setManageSectionModalOpen] = useState(false);
  const [manageStatusModalOpen, setManageStatusModalOpen] = useState(false);
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Add state for selected goal and delete status
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null); // -> Track which goal to delete
  const [goalToEdit, setGoalToEdit] = useState<{
    _id: string;
    name: string;
    section: string;
  } | null>(null); // -> Track which goal to edit
  const [deleteStatus, setDeleteStatus] = useState<{
    loading: boolean;
    error: string | null;
    message: string | null;
  }>({ loading: false, error: null, message: null });

  // =========================
  // 4. Effects (API Calls)
  // =========================

  // -> Extracted fetchGoals so it can be reused (e.g., for manual refresh or other triggers)
  // -> useCallback ensures fetchGoals is stable and can be safely used in useEffect dependencies
  const fetchGoals = useCallback(async () => {
    if (!user?.userId) return; // -> If no user, do nothing
    setIsLoading(true); // -> Show loading spinner
    setError(null); // -> Clear any previous error
    try {
      // -> Call the API to get outcome goals for this page
      const data = await getOutcomeGoals(currentPage, 5, user.userId);
      // -> Use nullish coalescing to provide safe defaults if backend returns null/undefined
      setTotalPages(data.pagination.totalPages ?? 1); // fallback to 1 if undefined
      setGoalsCount(data.pagination.total ?? 0); // fallback to 0 if undefined
      setSections(data.results ?? []); // fallback to [] if undefined
    } catch (err: unknown) {
      console.error("Error in fetchGoals:", err); // -> Debug log
      // -> If error, show a friendly message
      if (typeof err === "object" && err && "message" in err) {
        setError(
          (err as { message?: string }).message || "Failed to load goals"
        );
      } else {
        setError("Failed to load goals");
      }
    } finally {
      setIsLoading(false); // -> Hide loading spinner
    }
  }, [user?.userId, currentPage]);

  // -> useEffect only calls fetchGoals when userId or currentPage changes
  useEffect(() => {
    fetchGoals(); // -> Run the fetch
  }, [fetchGoals]);

  // =========================
  // 5. Handlers
  // =========================
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Update delete handler to use selectedGoalId
  const handleDelete = async () => {
    if (!selectedGoalId || !user?.userId) return; // -> Guard: must have goal and user
    setDeleteStatus({ loading: true, error: null, message: null });
    try {
      const res: IDeleteOutcomeGoalResponse = await deleteOutcomeGoal(
        selectedGoalId,
        user.userId
      );
      if (res?.success) {
        setDeleteStatus({
          loading: false,
          error: null,
          message: res?.message ?? "Goal deleted successfully.",
        });
        fetchGoals(); // -> Refresh list
        toast.success(res?.message ?? "Goal deleted successfully.");
      } else {
        setDeleteStatus({
          loading: false,
          error: res?.message ?? "Failed to delete goal.",
          message: null,
        });
        toast.error(res?.message ?? "Failed to delete goal.");
      }
    } catch (err: unknown) {
      let errorMsg = "Failed to delete goal.";
      const errorObj = err as any;
      if (errorObj?.response?.data?.message) {
        errorMsg = errorObj.response.data.message;
      } else if (errorObj?.message) {
        errorMsg = errorObj.message;
      }
      setDeleteStatus({ loading: false, error: errorMsg, message: null });
      toast.error(errorMsg);
    }
    setSelectedGoalId(null); // -> Reset selected goal
  };

  // Handler to open delete modal for a specific goal
  const handleOpenDeleteModal = (goalId: string | null) => {
    setSelectedGoalId(goalId);
    setIsDeleteModalOpen(true);
  };

  // Handler to open edit modal for a specific goal
  const handleOpenEditModal = (
    goal: { _id: string; name: string; section: string } | null
  ) => {
    setGoalToEdit(goal);
    setAddGoalModalOpen(true);
  };

  // =========================
  // 6. Render Logic
  // =========================
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto">
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold hidden md:block text-pink">
            {HEADINGS.OUTCOMES.TITLE}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setManageSectionModalOpen(true)}
              label={STATIC_TEXTS.OUTCOMES.MANAGE_SECTIONS}
              variant="submitStyle"
              className="w-full md:w-fit !justify-center py-3 md:py-2"
            />
            <Button
              onClick={() => setManageStatusModalOpen(true)}
              label={STATIC_TEXTS.OUTCOMES.MANAGE_STATUSES}
              variant="submitStyle"
              className="w-full md:w-fit !justify-center py-3 md:py-2"
            />
            <Button
              onClick={() => setAddGoalModalOpen(true)}
              icon="mdi:plus"
              label={STATIC_TEXTS.OUTCOMES.ADD_GOAL}
              variant="submitStyle"
              className="w-full md:w-fit !justify-center py-3 md:py-2"
            />
          </div>
        </div>

        <div className="mx-auto p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            {/* -> Show loading, error, or the list of all sections with their goals */}
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : sections?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No goals found.
              </div>
            ) : (
              // -> For each section (like Education, Health, etc.), show the section name and its goals
              sections?.map((section) => {
                return (
                  <div
                    key={section.section?._id ?? Math.random()}
                    className="bg-white rounded-sm px-6 py-4 mb-4"
                  >
                    {/* -> Section heading (e.g., Education, Health) with fallback */}
                    <h1 className="text-2xl font-bold text-purple">
                      {section.section?.name ?? "Unnamed Section"}
                    </h1>
                    <div className="my-4 bg-purple h-[1px]"></div>
                    <div className="flex flex-col text-md leading-5">
                      {/* -> If no goals in this section, show a message */}
                      {section.goals?.length === 0 ? (
                        <div className="text-gray-400 italic">
                          No goals in this section.
                        </div>
                      ) : (
                        // -> For each goal in this section, show the goal name and action icons
                        section.goals?.map((goal) => (
                          <div
                            key={goal?._id ?? Math.random()}
                            className="flex items-center justify-between gap-3 p-2 bg-purple-50 mb-2 last:mb-0"
                          >
                            <div className="flex items-center gap-2">
                              <Icon
                                icon="mdi:check-circle"
                                width="24"
                                height="24"
                                className="text-purple rounded-full"
                              />
                              {/* -> Goal name with fallback */}
                              {goal?.name ?? "Unnamed Goal"}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* -> Edit and Delete icons (open modals on click) */}
                              <div
                                className="bg-purple-100 p-2 rounded-sm flex items-center justify-center cursor-pointer"
                                title={STATIC_TEXTS.COMMON.EDIT}
                              >
                                <Icon
                                  onClick={() =>
                                    handleOpenEditModal({
                                      _id: goal?._id ?? "",
                                      name: goal?.name ?? "",
                                      section: section.section?._id ?? "",
                                    })
                                  }
                                  icon="mdi:edit"
                                  className="text-purple hover:text-purple-600"
                                  width="16"
                                  height="16"
                                />
                              </div>
                              <div
                                className="bg-purple-100 p-2 rounded-sm flex items-center justify-center cursor-pointer"
                                title={STATIC_TEXTS.COMMON.DELETE}
                              >
                                <Icon
                                  onClick={() =>
                                    handleOpenDeleteModal(goal?._id ?? null)
                                  }
                                  icon="mdi:delete"
                                  className="text-purple hover:text-purple-600"
                                  width="16"
                                  height="16"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* =========================
          Footer & Modals
      ========================= */}
      <div className="bg-white border-t border-[#E5E7EB]">
        <PageFooter
          count={goalsCount}
          label={`Page ${currentPage} of ${totalPages}`}
          currentPage={currentPage}
          totalPages={totalPages}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      </div>

      {manageSectionModalOpen && (
        <ManageOutcomeSectionsModal
          isOpen={manageSectionModalOpen}
          onClose={() => setManageSectionModalOpen(false)}
        />
      )}
      {manageStatusModalOpen && (
        <ManageOutcomeStatusModaL
          isOpen={manageStatusModalOpen}
          onClose={() => setManageStatusModalOpen(false)}
        />
      )}

      <UpsertGoalForm
        isOpen={addGoalModalOpen}
        onClose={() => {
          setAddGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        onGoalCreated={fetchGoals}
        goalToEdit={goalToEdit}
      />

      {isDeleteModalOpen && (
        <ConfirmationModal
          title={STATIC_TEXTS.OUTCOMES.DELETE_GOAL}
          message={STATIC_TEXTS.OUTCOMES.DELETE_GOAL_DESC}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedGoalId(null);
            setDeleteStatus((prev) => ({
              ...prev,
              error: null,
              message: null,
            }));
          }}
          onConfirm={handleDelete}
          loading={deleteStatus.loading}
        />
      )}
    </div>
  );
};

export default Outcomes;
