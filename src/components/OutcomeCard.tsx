import { useRoleAccess } from "@/hooks/useRoleAccess";
import type { ICaseOutcome, ICaseOutcomeSection } from "@/services/CaseApi";
import { GOAL_SET_STATUS } from "@/utils/constants";
import { LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface IOutcomeCardProps {
  outcome: ICaseOutcome;
  onPrintGoalSet: (outcome: ICaseOutcome) => void;
  onEditGoalSet: (outcome: ICaseOutcome) => void;
  onDeleteGoalSet: (outcome: ICaseOutcome) => void;
  onAddComment: (outcome: ICaseOutcome) => void;
  onUpdateGoal: (outcome: ICaseOutcome, section: ICaseOutcomeSection) => void;
  onDeleteComment: (outcome: ICaseOutcome, commentId: string) => void;
  onEditComment: (outcome: ICaseOutcome, commentId: string) => void;
  showHistoryComment: boolean;
  onToggleHistoryComment: () => void;
}

const OutcomeCard = ({
  outcome,
  onPrintGoalSet,
  onEditGoalSet,
  onDeleteGoalSet,
  onAddComment,
  onUpdateGoal,
  onDeleteComment,
  onEditComment,
  showHistoryComment,
  onToggleHistoryComment,
}: IOutcomeCardProps) => {
  // → Helper function to format date
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formatDateHelper = (
    dateString: string,
    opts?: { dateOnly?: boolean }
  ): string => {
    try {
      const date = toZonedTime(dateString, userTimeZone);
      if (opts?.dateOnly) {
        return formatDate(date, "MM-dd-yyyy");
      }
      return formatDate(date, "MM-dd-yyyy 'at' hh:mm a");
    } catch {
      return "Invalid date";
    }
  };

  // Utility for status color
  const getStatusColor = (status?: string) => {
    if (!status) return "text-gray-500";
    const normalized = status.toLowerCase();
    if (normalized.includes("complete")) return "text-green-600 font-bold";
    if (normalized.includes("enrolled")) return "text-yellow-600 font-bold";
    if (normalized.includes("not applicable")) return "text-gray-500 font-bold";
    if (normalized.includes("pending")) return "text-yellow-600 font-bold";
    return "text-blue-600 font-bold";
  };

  // Helper function to get user-friendly status label
  const getStatusLabel = (statusValue?: string) => {
    if (!statusValue) return "No Status";
    const statusOption = GOAL_SET_STATUS.find(
      (option) => option.value === statusValue
    );
    return statusOption?.label || statusValue;
  };

  // Get user role and permissions
  const { canDeleteOutcome, canDeleteAndEditComments } = useRoleAccess();

  // → Render single case outcome
  return (
    <div className="flex flex-col border border-purple rounded mb-6 shadow-sm overflow-hidden">
      {/* → Header section with title and actions */}
      <div className="px-3 py-2 bg-purple-400 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-t">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold break-words">{outcome?.title}</h1>
          <p className="text-xs break-words">
            {`${STATIC_TEXTS.OUTCOMES.CREATED_BY} ${outcome?.createdBy?.userName} at `}
            <Link to={`/agencies/${outcome?.createdBy?.companyId}`}>
              <span className="underline cursor-pointer">
                {outcome?.createdBy?.companyName}
              </span>
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* → Print */}
          <button
            onClick={() => onPrintGoalSet(outcome)}
            className="text-xs sm:text-sm bg-white text-purple px-2 py-1 flex items-center gap-1 rounded-sm hover:bg-gray-50 transition-colors duration-150 whitespace-nowrap"
          >
            <Icon
              icon="mdi:printer"
              width="16"
              height="16"
              className="sm:w-[18px] sm:h-[18px]"
            />
            <span className="hidden sm:inline">
              {STATIC_TEXTS.COMMON.PRINT}
            </span>
            <span className="sm:hidden">Print</span>
          </button>

          {/* → Edit */}
          <button
            onClick={() => onEditGoalSet(outcome)}
            className="text-xs sm:text-sm bg-white text-purple px-2 py-1 flex items-center gap-1 rounded-sm hover:bg-gray-50 transition-colors duration-150 whitespace-nowrap"
          >
            <Icon
              icon="mdi:pencil"
              width="16"
              height="16"
              className="sm:w-[18px] sm:h-[18px]"
            />
            <span className="hidden sm:inline">{STATIC_TEXTS.COMMON.EDIT}</span>
            <span className="sm:hidden">Save Changes</span>
          </button>

          {/* → Delete (use canDeleteOutcome flag) */}
          {canDeleteOutcome && (
            <button
              onClick={() => onDeleteGoalSet(outcome)}
              className="text-xs sm:text-sm bg-white text-purple px-2 py-1 flex items-center gap-1 rounded-sm hover:bg-gray-50 transition-colors duration-150 whitespace-nowrap"
            >
              <Icon
                icon="mdi:delete"
                width="16"
                height="16"
                className="sm:w-[18px] sm:h-[18px]"
              />
              <span className="hidden sm:inline">
                {STATIC_TEXTS.COMMON.DELETE}
              </span>
              <span className="sm:hidden">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* → Status and progress section */}
      <div className="border-b border-purple p-4 pb-3 flex flex-col gap-3 bg-purple-100">
        {/* → Status and last updated */}
        <div className="bg-white text-center text-gray-800 p-[25px] rounded-sm">
          <h1 className="text-lg font-bold">
            {LABELS.FORM.STATUS}:{" "}
            <span className="text-purple-600">
              {getStatusLabel(outcome?.status)}
            </span>
          </h1>
          <p className="text-sm text-gray-600">
            {LABELS.FORM.LAST_UPDATED}:{" "}
            <span className="font-medium">
              {formatDateHelper(outcome?.lastUpdated ?? outcome?.updatedAt)}
            </span>
          </p>
        </div>

        {/* → Progress bar and percentage */}
        <div className="space-y-2">
          <div className="border-2 border-green-600 h-6 rounded-sm overflow-hidden">
            {/* → Progress bar */}
            <div
              className="bg-green-600 h-full transition-all duration-300"
              style={{ width: `${outcome?.goalStats?.percentComplete ?? 0}%` }}
            ></div>
          </div>

          {/* → Percentage and goals completed */}
          <div className="text-sm text-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
            <p className="font-semibold text-green-600 text-center sm:text-left">
              {outcome?.goalStats?.percentComplete}%{" "}
              {STATIC_TEXTS.OUTCOMES.COMPLETE}
            </p>
            <p className="text-gray-600 text-center sm:text-right">
              {outcome?.goalStats?.label}
            </p>
          </div>
        </div>
      </div>

      {/* → Sections and goals */}
      {outcome?.sections?.map((section, sectionIndex) => (
        <div
          key={`${outcome._id}-section-${sectionIndex}-${section?.section}`}
          className="border-b border-purple px-3 py-8 space-y-2 bg-purple-100"
        >
          {/* → Section name and edit button */}
          <div className="flex items-center gap-3 justify-between">
            <h1 className="text-lg font-bold text-purple break-words flex-1">
              {section?.sectionName}
            </h1>
            <button
              onClick={() => onUpdateGoal(outcome, section)}
              title={STATIC_TEXTS.COMMON.EDIT}
              className="text-sm bg-purple text-white px-1.5 py-1 flex items-center gap-1 rounded-sm hover:bg-purple-600 transition-colors duration-150 flex-shrink-0"
            >
              <Icon icon="mdi:pencil" width="18" height="18" />
            </button>
          </div>

          {/* → Goals list */}
          <div className="flex flex-col gap-1">
            {section?.goals?.length > 0 ? (
              section?.goals?.map((goal) => {
                const isComplete =
                  goal?.statusName?.toLowerCase() === "complete";
                return (
                  <div
                    key={goal?._id}
                    className="bg-white flex flex-col rounded hover:bg-gray-50 transition-colors duration-150 mb-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-between p-2 px-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <p
                          className={`text-sm break-words ${
                            isComplete
                              ? "line-through text-green-600"
                              : "text-gray-700"
                          }`}
                        >
                          {goal?.goalName}
                        </p>
                        {/* Due Date */}
                        {goal?.dueDate && (
                          <p className="text-xs p-1 uppercase bg-purple-100 text-gray-800 whitespace-nowrap flex-shrink-0">
                            DUE{" "}
                            {formatDateHelper(goal.dueDate, { dateOnly: true })}
                          </p>
                        )}
                      </div>
                      {/* Status/Check Mark */}
                      <div className="flex-shrink-0">
                        {isComplete ? (
                          <Icon
                            icon="mdi:check-bold"
                            className="text-green-600"
                            width={18}
                            height={18}
                          />
                        ) : (
                          <p className="text-xs font-bold uppercase text-gray-600 whitespace-nowrap">
                            {goal?.statusName || "No Status"}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Steps (Subgoals) */}
                    {Array.isArray((goal as any).steps) &&
                      (goal as any).steps.length > 0 && (
                        <div className="ml-7 mb-2">
                          {(goal as any).steps.map(
                            (step: any, stepIdx: number) => {
                              const stepComplete =
                                step?.isComplete || step?.complete;
                              return (
                                <div
                                  key={step._id || stepIdx}
                                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-between py-1 px-2 border-l-2 border-purple-200"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                                    <span
                                      className={`text-xs break-words ${
                                        stepComplete
                                          ? "line-through text-green-600"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {step?.stepName || step?.name}
                                    </span>
                                    {step?.dueDate && (
                                      <span className="text-xs p-1 uppercase bg-purple-50 text-gray-800 whitespace-nowrap flex-shrink-0">
                                        DUE{" "}
                                        {formatDateHelper(step.dueDate, {
                                          dateOnly: true,
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    {stepComplete ? (
                                      <Icon
                                        icon="mdi:check-bold"
                                        className="text-green-600"
                                        width={16}
                                        height={16}
                                      />
                                    ) : (
                                      <span className="text-xs font-bold uppercase text-gray-500 whitespace-nowrap">
                                        {step?.isComplete === false ||
                                        step?.complete === false
                                          ? "Incomplete"
                                          : "No Status"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-2 px-3 rounded text-gray-500 text-sm">
                No goals in this section
              </div>
            )}
          </div>
        </div>
      ))}

      {/* → Comments and history section */}
      <div className="bg-purple-100 px-3 py-4 rounded-b">
        <div className="bg-white rounded">
          {/* → Show comments and history section */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-2 text-purple gap-2`}
          >
            <button
              onClick={onToggleHistoryComment}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors duration-150"
            >
              {showHistoryComment ? (
                <Icon icon="mdi:minus-box" width={20} height={20} />
              ) : (
                <Icon icon="mdi:plus-box" width={20} height={20} />
              )}
              <div className="text-xs underline">
                {STATIC_TEXTS.OUTCOMES.SHOW_FILES_COMMENTS}
              </div>
            </button>
            <button
              onClick={() => onAddComment(outcome)}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors duration-150"
            >
              <Icon icon="mdi:comment" width={18} height={18} />
              <div className="text-xs underline">ADD COMMENT / FILE</div>
            </button>
          </div>

          {/* → History and comments content */}
          {showHistoryComment && (
            <div className="text-gray-800 text-xs">
              {/* → Show history items if available */}
              {outcome?.history?.map((historyItem, index) => (
                <div
                  key={`history-${index}`}
                  className="px-3 py-2 border-t border-purple flex items-center gap-2"
                >
                  {/* No avatar for history */}
                  <div className="flex-1 break-words">
                    <span className="font-bold underline mr-1">
                      {historyItem?.goalName}
                    </span>
                    <span>marked as </span>
                    <span className={getStatusColor(historyItem?.status)}>
                      {historyItem?.status}
                    </span>
                    <span> by </span>
                    <span className="font-bold underline mr-1">
                      {historyItem?.userName}
                    </span>
                    <span>from </span>
                    <span className="font-bold underline mr-1">
                      {historyItem?.companyName}
                    </span>
                    <span>on {formatDateHelper(historyItem?.date)}</span>
                  </div>
                </div>
              ))}

              {/* → Show comments if available */}
              {outcome?.comments?.map((comment, index) => (
                <div
                  key={`comment-${comment?._id || index}`}
                  className="px-3 py-2 border-t border-purple flex flex-col sm:flex-row sm:items-start gap-3 justify-between"
                >
                  <div className="flex gap-2 flex-1 min-w-0">
                    {/* Avatar for comments */}
                    <div className="w-[38px] h-[38px] flex items-center justify-center shadow bg-gray-100 border border-primary/10 flex-shrink-0">
                      <Icon icon="mdi:user" width={28} height={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 whitespace-pre-line break-words">
                        {comment?.text}
                      </div>
                      {comment?.file && (
                        <div className="mb-1 break-words">
                          {STATIC_TEXTS.OUTCOMES.ATTACHED_FILE} ---{" "}
                          <Link
                            to={comment?.file}
                            className="underline text-blue-600"
                          >
                            {comment?.file?.split("\\").pop()}
                          </Link>
                        </div>
                      )}
                      <div className="text-gray-500 break-words">
                        {STATIC_TEXTS.OUTCOMES.POSTED_BY}{" "}
                        <span className="font-bold underline mr-1">
                          {comment?.createdBy?.userName}
                        </span>
                        from{" "}
                        <span className="font-bold underline mr-1">
                          {comment?.createdBy?.companyName}
                        </span>
                        on {formatDateHelper(comment?.createdAt)}
                      </div>
                    </div>
                  </div>

                  {canDeleteAndEditComments(comment?.createdBy?.userId) && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onEditComment(outcome, comment._id)}
                        title={STATIC_TEXTS.COMMON.EDIT}
                        className="text-sm bg-purple text-white px-1.5 py-1 flex items-center gap-1 rounded-sm"
                      >
                        <Icon icon="mdi:pencil" width="18" height="18" />
                      </button>
                      <button
                        onClick={() => onDeleteComment(outcome, comment._id)}
                        title={STATIC_TEXTS.COMMON.DELETE}
                        className="text-sm bg-red-600 text-white px-1.5 py-1 flex items-center gap-1 rounded-sm"
                      >
                        <Icon icon="mdi:delete" width="18" height="18" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* → Show message if no history or comments */}
              {!outcome?.history?.length && !outcome?.comments?.length && (
                <div className="px-3 py-2 border-t border-purple text-gray-500">
                  No history or comments available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutcomeCard;
