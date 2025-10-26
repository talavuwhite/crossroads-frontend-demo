import React, { useEffect, useState } from "react";
import { Icon } from "@iconify-icon/react";
import Button from "@/components/ui/Button";
import { IconButton } from "@components/ui/IconButton";
import Footer from "@components/PageFooter";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { STATIC_TEXTS, ERROR_MESSAGES } from "@/utils/textConstants";
import Loader from "@/components/ui/Loader";
import AddAssessmentModal from "@/components/modals/AddAssessmentModal";
import { CASES_PER_PAGE } from "@/utils/constants";
import { toast } from "react-toastify";
import {
  addAssessmentComment,
  createAssessment,
  deleteAssessment,
  deleteAssessmentComment,
  fetchAssessmentFieldsByDate,
  fetchAssessmentsForCase,
  updateAssessment,
  updateAssessmentComment,
  type Assessment,
} from "@/services/AssessmentApi";
import DeleteCaseModal from "@/components/modals/DeleteCaseModal";
import AddAssasmentComments from "@/components/modals/AddAssasmentComments";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Divider } from "@/components/RentalSubsidyCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AssessmentsPage: React.FC = () => {
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<
    string | null
  >(null);
  const [addCommentAssessmentId, setAddCommentAssessmentId] = useState<
    string | null
  >(null);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [addAssessmentOpen, setAddAssessmentOpen] = useState(false);
  const [expandedTableIds, setExpandedTableIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const limit = CASES_PER_PAGE;
  const [editAssessment, setEditAssessment] = useState<Assessment | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAssessmentData, setDeleteAssessmentData] = useState<any | null>(
    null
  );
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [deleteCommentData, setDeleteCommentData] = useState<{
    assessmentId: string;
    commentId: string;
  } | null>(null);
  const [deleteCommentModalOpen, setDeleteCommentModalOpen] = useState(false);
  const {
    canCreateAssessment,
    canEditDeleteAssessmentAddComment,
    canEditDeleteComment,
  } = useRoleAccess();
  const [dateBasedAssessments, setDateBasedAssessments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fetchAssessments = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!caseData || !userData?.userId) {
        toast.error("User data missing.");
        setLoading(false);
        return;
      }
      const res = await fetchAssessmentsForCase(
        caseData._id || caseData.caseId,
        userData.userId,
        userData.activeLocation,
        page,
        limit
      );
      setAssessments(res.data.results || []);
      setTotal(res.data.pagination.total || 0);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err: any) {
      toast.error(err || "User data missing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [page, userData?.userId, userData?.activeLocation, caseData?._id]);
  const handleSubmitAssessment = async (formData: any) => {
    try {
      if (!caseData || !userData?.userId) {
        toast.error("User data missing.");
        return;
      }

      if (editAssessment?._id) {
        await updateAssessment(
          editAssessment._id,
          formData,
          userData.userId,
          userData.activeLocation
        );
        toast.success("Assessment updated!");
      } else {
        await createAssessment(
          caseData._id,
          formData,
          userData.userId,
          userData.activeLocation
        );
        toast.success("Assessment created!");
      }

      setAddAssessmentOpen(false);
      setEditAssessment(null);
      fetchAssessments();
    } catch (err) {
      toast.error(err?.toString() || "Failed to submit assessment");
    }
  };
  const handleOpenDeletModal = (assessment: Assessment) => {
    setDeleteAssessmentData(assessment);
    setDeleteModalOpen(true);
  };
  const hanldeDeleteAssessment = async () => {
    try {
      if (!userData?.userId) {
        toast.error("User data missing.");
        return;
      }

      await deleteAssessment(
        deleteAssessmentData?._id,
        userData.userId,
        userData.activeLocation
      );
      toast.success("Assessment Deleted!");
      setDeleteModalOpen(false);
      setDeleteAssessmentData(null);
      fetchAssessments();
    } catch (err) {
      toast.error(err?.toString() || "Failed to Delete assessment field");
    }
  };
  const handleSubmitComment = async (comment: string) => {
    if (!addCommentAssessmentId || !userData?.userId) {
      toast.error("Missing user or assessment ID");
      return;
    }

    try {
      if (editCommentId) {
        await updateAssessmentComment(
          addCommentAssessmentId,
          editCommentId,
          comment,
          userData.userId,
          userData.activeLocation
        );
        toast.success("Comment updated!");
      } else {
        await addAssessmentComment(
          addCommentAssessmentId,
          comment,
          userData.userId,
          userData.activeLocation
        );
        toast.success("Comment added!");
      }
      setAddCommentAssessmentId(null);
      setEditCommentId(null);
      setCommentText("");
      setCommentError("");
      fetchAssessments();
    } catch (err: any) {
      toast.error(err?.toString() || "Failed to add/edit comment");
    }
  };
  const handleDeleteComment = async () => {
    if (!deleteCommentData || !userData?.userId) {
      toast.error("Missing data to delete comment.");
      return;
    }

    try {
      await deleteAssessmentComment(
        deleteCommentData.assessmentId,
        deleteCommentData.commentId,
        userData.userId,
        userData.activeLocation
      );
      toast.success("Comment deleted!");
      fetchAssessments();
    } catch (err) {
      toast.error(err?.toString() || "Failed to delete comment");
    } finally {
      setDeleteCommentModalOpen(false);
      setDeleteCommentData(null);
    }
  };
  const fetchDateBasedFields = async () => {
    setLoading(true);
    try {
      if (!caseData || !userData?.userId) {
        toast.error("User data missing.");
        return;
      }

      const date = formatDate(selectedDate, "yyyy-MM-dd");
      const res = await fetchAssessmentFieldsByDate(
        caseData._id,
        date,
        userData.userId,
        userData.activeLocation
      );
      setDateBasedAssessments(res.data || []);
    } catch (error: any) {
      toast.error(error.toString() || "Failed to fetch assessment fields");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDateBasedFields();
  }, [
    userData?.userId,
    selectedDate,
    assessments,
    userData?.activeLocation,
    caseData?._id,
  ]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex justify-center p-8 text-red-500">
        {ERROR_MESSAGES.FETCH.ASSESSMENTS || ERROR_MESSAGES.FETCH.GENERIC}
      </div>
    );

  const renderAssessmentCard = (a: any) => {
    const isExpanded = expandedAssessmentId === a._id;
    const isTableExpanded = expandedTableIds.includes(a._id);

    const toggleTable = () => {
      setExpandedTableIds((prev) =>
        prev.includes(a._id)
          ? prev.filter((id) => id !== a._id)
          : [...prev, a._id]
      );
    };

    return (
      <div
        key={a._id}
        className="bg-white border border-border rounded-lg flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        {/* Top Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-purple/10 rounded-full flex items-center justify-center">
              <Icon
                icon="mdi:account"
                width="28"
                height="28"
                className="text-purple"
              />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-lg text-gray-900 truncate">
                {a.createdBy?.firstName} {a.createdBy?.lastName}
              </div>
              <div className="text-sm text-purple font-semibold truncate">
                {a.companyName || a.locationName || ""}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {a.createdAt
                  ? formatDate(
                      toZonedTime(a.createdAt, userTimeZone),
                      "MM-dd-yyyy hh:mm a"
                    )
                  : ""}
              </div>
            </div>
          </div>
          {canEditDeleteAssessmentAddComment(a) && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <IconButton
                icon="mdi:pencil"
                label="Save Changes"
                onClick={() => {
                  setEditAssessment(a);
                  setAddAssessmentOpen(true);
                }}
                colorClass="!p-2 !px-3 sm:!px-2 text-purple hover:text-white hover:bg-purple border !border-purple/40 sm:!border-transparent"
              />
              <IconButton
                icon="mdi:delete"
                label="Delete"
                onClick={() => handleOpenDeletModal(a)}
                colorClass="!p-2 !px-3 sm:!px-2 text-primary hover:text-white hover:bg-primary border !border-primary/40 sm:!border-transparent"
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="text-gray-800 text-base mt-2 px-3">{a.description}</div>
        <div className="text-xs text-gray-500 mt-1 px-3">
          {`${STATIC_TEXTS.ASSESSMENT.ASSESSMENT_FOR} ${
            a.caseId?.firstName || ""
          } ${a.caseId?.lastName || ""}`}
        </div>

        {/* Toggle Field Table */}
        <div className="mt-2 px-3">
          <button
            className="flex items-center justify-center gap-1 text-purple underline text-sm font-medium mb-2 transition-colors duration-150 hover:bg-purple/10 rounded px-2 py-1 select-none"
            onClick={toggleTable}
            type="button"
            aria-expanded={isTableExpanded}
          >
            <span>
              {isTableExpanded
                ? STATIC_TEXTS.ASSESSMENT.HIDE_DETAILS
                : STATIC_TEXTS.ASSESSMENT.SHOW_DETAILS}
            </span>
            <Icon
              icon="mdi:chevron-down"
              width={18}
              height={18}
              className={`transition-transform duration-200 ${
                isTableExpanded ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {isTableExpanded && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden min-w-[350px]">
                <tbody>
                  {a.fields?.map((field: any, idx: number) => (
                    <tr
                      key={field.fieldId}
                      className={idx % 2 === 0 ? "bg-purple/10" : "bg-white"}
                    >
                      <td className="font-medium p-2 w-2/5 align-top break-words text-gray-900 bg-purple/5">
                        {field.name}
                      </td>
                      <td className="p-2 w-3/5 align-top break-words text-gray-700">
                        {field.value !== undefined && field.value !== ""
                          ? typeof field.value === "boolean"
                            ? field.value
                              ? STATIC_TEXTS.ASSESSMENT.YES
                              : STATIC_TEXTS.ASSESSMENT.NO
                            : String(field.value)
                          : STATIC_TEXTS.COMMON.NOT_PROVIDED}
                        {field.isArchived && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                            Archived
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 p-3 bg-purpleLight border-t border-purple/30 rounded-b-lg shadow-sm mt-2">
          <button
            className="text-pink underline underline-offset-2 font-medium text-sm w-full sm:w-auto"
            onClick={() => setExpandedAssessmentId(isExpanded ? null : a._id)}
          >
            {`${STATIC_TEXTS.ASSESSMENT.SHOW} (${a.history?.length || 0}) ${
              STATIC_TEXTS.ASSESSMENT.MODIFICATIONS
            } ${STATIC_TEXTS.COMMON.AND} (${a.comments?.length || 0}) ${
              STATIC_TEXTS.ASSESSMENT.COMMENTS
            }`}
          </button>
          <div className="block sm:hidden border-t border-purple/20 my-1" />
          {canEditDeleteAssessmentAddComment(a) && (
            <button
              className="text-pink underline underline-offset-2 font-medium text-sm w-full sm:w-auto"
              onClick={() => setAddCommentAssessmentId(a._id)}
            >
              {STATIC_TEXTS.COMMON.ADD_COMMENT}
            </button>
          )}
        </div>

        {/* Expand History & Comments */}
        {isExpanded && (
          <div className="w-full border border-gray-200 bg-gray-50 rounded-b-lg overflow-x-auto">
            {a.history?.map((mod: any, idx: number) => (
              <div
                key={`mod-${idx}`}
                className="flex items-center text-sm border-b border-gray-200 px-4 py-2"
              >
                <span className="flex-1 text-gray-800">
                  {mod.changes?.length > 0 && (
                    <>
                      {mod.changes
                        .map(
                          (c: any) =>
                            `${c.oldValue ? `"${c.oldValue}" → ` : ""}"${
                              c.newValue
                            }"`
                        )
                        .join(", ")}{" "}
                      by{" "}
                      <span className="font-semibold">
                        {mod.changedBy?.firstName} {mod.changedBy?.lastName}
                      </span>{" "}
                      at
                      <span className="text-pink font-semibold">
                        {" "}
                        {mod.companyName || mod.locationName}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                  {formatDate(
                    toZonedTime(mod.changedAt, userTimeZone),
                    "MM-dd-yyyy 'at' hh:mm a"
                  )}
                </span>
              </div>
            ))}

            {a.comments?.map((c: any, idx: number) => (
              <div
                key={`comment-${idx}`}
                className="flex items-start gap-3 px-4 py-3 border-b border-gray-200 bg-white relative"
              >
                <div className="w-8 h-8 rounded-full bg-purpleLight flex items-center justify-center">
                  <Icon
                    icon="mdi:account"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-gray-800">{c.comment}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {STATIC_TEXTS.ASSESSMENT.COMMENT_POSTED_BY}{" "}
                    <span className="font-semibold">
                      {c.commentedBy?.firstName} {c.commentedBy?.lastName}
                    </span>{" "}
                    {STATIC_TEXTS.COMMON.AT}{" "}
                    <span className="text-pink font-semibold">
                      {c.companyName || c.locationName}
                    </span>{" "}
                    —{" "}
                    {formatDate(
                      toZonedTime(c.commentedAt, userTimeZone),
                      "MM-dd-yyyy 'at' hh:mm a"
                    )}
                  </div>
                </div>

                {/* Edit & Delete buttons */}
                {canEditDeleteComment(c) && (
                  <div className="absolute top-3 right-3 flex gap-2">
                    <IconButton
                      onClick={() => {
                        setAddCommentAssessmentId(a._id);
                        setEditCommentId(c._id);
                        setCommentText(c.comment);
                      }}
                      title="Edit Comment"
                      icon="mdi:pencil"
                      label="Edit Comment"
                      colorClass="!p-1 !px-2 sm:!px-1 text-purple hover:text-white hover:bg-purple border !border-purple/40 sm:!border-transparent"
                    />
                    <IconButton
                      icon="mdi:delete"
                      label="Delete"
                      onClick={() => {
                        setDeleteCommentData({
                          assessmentId: a._id,
                          commentId: c._id,
                        });
                        setDeleteCommentModalOpen(true);
                      }}
                      title="Delete Comment"
                      colorClass="!p-1 !px-2 sm:!px-1 text-primary hover:text-white hover:bg-primary border !border-primary/40 sm:!border-transparent"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleDateChange = (date: Date | null) => {
    if (date) setSelectedDate(date);
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto !hide-scrollbar">
        <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4 pr-10">
          <h1 className="text-2xl font-bold text-pink">
            {`${STATIC_TEXTS.ASSESSMENT.ASSESSMENTS_FOR} ${
              caseData?.firstName || ""
            } ${caseData?.lastName || ""}`}
          </h1>
          {canCreateAssessment && (
            <Button
              variant="submitStyle"
              label={STATIC_TEXTS.ASSESSMENT.ADD_ASSESSMENT}
              icon="mdi:plus"
              className="!bg-purple hover:!bg-pink"
              onClick={() => setAddAssessmentOpen(true)}
            />
          )}
        </div>
        <div className="p-6 space-y-4">
          <div className="p-2 px-4 rounded-lg bg-white border border-purple/80">
            <div className="my-4">
              <label className="block text-sm font-medium text-purple mb-1">
                Select Date Filter for Questions :
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="MM-dd-yyyy"
                className="border rounded px-3 py-2 border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple transition text-sm text-gray-800 w-full md:w-64"
                placeholderText="MM-DD-YYYY"
                maxDate={new Date()}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
            <Divider />
            {dateBasedAssessments.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow mt-6 mb-4">
                <table className="min-w-[1000px] w-full text-sm">
                  <thead className=" text-purple bg-purple/20">
                    <tr>
                      <th className="p-3 text-left min-w-[250px] max-w-[650px] border-r border-purple-200">
                        Questions
                      </th>
                      {dateBasedAssessments.map((assessment) => (
                        <th
                          key={assessment.assessmentId}
                          className="p-3 text-left min-w-[180px] max-w-[300px]"
                        >
                          {formatDate(
                            toZonedTime(assessment.createdAt, userTimeZone),
                            "MM-dd-yyyy"
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const fieldMap = new Map<string, any[]>();

                      dateBasedAssessments.forEach((assessment, aIndex) => {
                        assessment.fields.forEach((field: any) => {
                          const existing = fieldMap.get(field.name) || [];
                          existing[aIndex] = field.value;
                          fieldMap.set(field.name, existing);
                        });
                      });

                      return Array.from(fieldMap.entries()).map(
                        ([fieldName, values]) => (
                          <tr
                            key={fieldName}
                            className="border-t border-gray-200"
                          >
                            <td className="p-3 font-medium border-r border-purple-100">
                              {fieldName}
                            </td>
                            {dateBasedAssessments.map((_, idx) => (
                              <td key={idx} className="p-3">
                                {(() => {
                                  const val = values[idx];
                                  if (val === undefined || val === "") {
                                    return STATIC_TEXTS.COMMON.NOT_PROVIDED;
                                  }
                                  if (typeof val === "boolean") {
                                    return val
                                      ? STATIC_TEXTS.ASSESSMENT.YES
                                      : STATIC_TEXTS.ASSESSMENT.NO;
                                  }
                                  return String(val);
                                })()}
                              </td>
                            ))}
                          </tr>
                        )
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && dateBasedAssessments.length === 0 && (
              <p className="text-purple/60 my-2 text-center text-xs">
                No Data found for question
              </p>
            )}
          </div>

          {assessments.map((a: any) => (
            <div id={`assessment-card-${a._id}`}>{renderAssessmentCard(a)}</div>
          ))}
        </div>
      </div>
      {assessments.length > 0 && (
        <Footer
          count={total}
          label={`${total} ${STATIC_TEXTS.ASSESSMENT.ASSESSMENTS}`}
          currentPage={page}
          totalPages={totalPages}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage(page - 1)}
          onNext={() => setPage(page + 1)}
        />
      )}
      {/* AddAssessmentModal and AddAssasmentComments can be updated to use real data as well */}
      <AddAssessmentModal
        open={addAssessmentOpen}
        onClose={() => {
          setAddAssessmentOpen(false);
          setEditAssessment(null);
        }}
        onSubmit={handleSubmitAssessment}
        isEdit={!!editAssessment}
        editAssessment={editAssessment}
      />
      <DeleteCaseModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteAssessmentData(null);
        }}
        onConfirmDelete={hanldeDeleteAssessment}
        title="Delete Assessment"
        message={`Are you sure you want to delete this Assessment? This action cannot be undone.`}
        confirmLabel="DELETE"
        confirmButtonLabel="Delete Assessment"
      />
      <DeleteCaseModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteAssessmentData(null);
        }}
        onConfirmDelete={hanldeDeleteAssessment}
        title="Delete Assessment"
        message={`Are you sure you want to delete this Assessment? This action cannot be undone.`}
        confirmLabel="DELETE"
        confirmButtonLabel="Delete Assessment"
      />
      <AddAssasmentComments
        open={!!addCommentAssessmentId}
        onClose={() => {
          setAddCommentAssessmentId(null);
          setEditCommentId(null);
          setCommentText("");
          setCommentError("");
        }}
        onSubmit={handleSubmitComment}
        commentText={commentText}
        setCommentText={setCommentText}
        commentError={commentError}
        isEdit={editCommentId ? true : false}
        setCommentError={setCommentError}
      />
      <DeleteCaseModal
        isOpen={deleteCommentModalOpen}
        onClose={() => {
          setDeleteCommentModalOpen(false);
          setDeleteCommentData(null);
        }}
        onConfirmDelete={handleDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="DELETE"
        confirmButtonLabel="Delete Comment"
      />
    </div>
  );
};

export default AssessmentsPage;
