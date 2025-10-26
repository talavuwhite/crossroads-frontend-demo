import { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import Button from "@/components/ui/Button";
import PageFooter from "@components/PageFooter";
import { IconButton } from "@components/ui/IconButton";
import AssessmentFieldModal from "@/components/modals/AddAssessmentFieldModal";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  fetchAssessmentFields,
  updateAssessmentField,
  createAssessmentField,
  updateAssessmentFieldOrder,
  fetchGlobalAssessmentFields,
  deleteAssessmentField,
} from "@/services/AssessmentFieldApi";
import { toast } from "react-toastify";
import Loader from "@/components/ui/Loader";
import DeleteCaseModal from "../modals/DeleteCaseModal";

interface AssessmentFieldsPageProps {
  isGlobal: boolean;
  title?: string;
  contextId?: string; // agencyId, companyId, or whatever is needed for context
  useGlobalApi?: boolean;
}

const CASES_PER_PAGE = 10;

const AssessmentFieldsPage = ({
  isGlobal,
  title,
  contextId,
  useGlobalApi = false,
}: AssessmentFieldsPageProps) => {
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editField, setEditField] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteField, setDeleteField] = useState<any | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const limit = CASES_PER_PAGE;

  const fetchFields = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userData?.userId) {
        toast.error("User data missing.");
        setLoading(false);
        return;
      }
      let res;
      if (useGlobalApi) {
        res = await fetchGlobalAssessmentFields(userData.userId, page, limit);
      } else {
        res = await fetchAssessmentFields(
          contextId || userData.activeLocation || userData.companyId,
          userData.activeLocation,
          userData.userId,
          page,
          limit
        );
      }
      setFields(res.data.data || []);
      setTotal(res.data.pagination.total || 0);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err: any) {
      toast.error(err || "User data missing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [page, userData?.userId, userData?.activeLocation, contextId]);

  const handleAddField = async (formData: any) => {
    try {
      if (!userData?.userId) {
        toast.error("User data missing.");
        return;
      }
      const payload = {
        name: formData.name,
        type: formData.type,
        isRequired: formData.isRequired,
        options: ["dropdown", "radio", "checkbox"].includes(formData.type)
          ? formData.options
          : [],
        isGlobal: isGlobal,
      };
      const newField = await createAssessmentField(
        payload,
        userData.userId,
        userData.activeLocation
      );
      setFields((prev) => [...prev, newField]);
      toast.success("Assessment field created!");
      setAddModalOpen(false);
    } catch (err) {
      toast.error(err?.toString() || "Failed to create assessment field");
    }
  };

  const handleEditField = (field: any) => {
    setEditField(field);
    setEditModalOpen(true);
  };
  const handleOpenDeletModal = (field: any) => {
    setDeleteField(field);
    setDeleteModalOpen(true);
  };

  const handleUpdateField = async (formData: any) => {
    try {
      if (!userData?.userId) {
        toast.error("User data missing.");
        return;
      }
      const payload = {
        name: formData.name,
        isRequired: formData.isRequired,
        options: ["dropdown", "radio", "checkbox"].includes(formData.type)
          ? formData.options
          : [],
        isArchived: formData.isArchived,
      };
      await updateAssessmentField(
        editField._id,
        payload,
        userData.userId,
        userData.activeLocation
      );
      fetchFields();
      toast.success("Assessment field updated!");
      setEditModalOpen(false);
      setEditField(null);
    } catch (err) {
      toast.error(err?.toString() || "Failed to update assessment field");
    }
  };
  const hanldeDeleteField = async () => {
    try {
      if (!userData?.userId) {
        toast.error("User data missing.");
        return;
      }

      await deleteAssessmentField(
        deleteField._id,
        userData.userId,
        userData.activeLocation
      );
      toast.success("Assessment field Deleted!");
      setDeleteModalOpen(false);
      setDeleteField(null);
      fetchFields();
    } catch (err) {
      toast.error(err?.toString() || "Failed to Delete assessment field");
    }
  };

  const moveField = (index: number, direction: "up" | "down") => {
    setFields((prev) => {
      const newFields = [...prev];
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === prev.length - 1)
      ) {
        return prev;
      }
      const swapWith = direction === "up" ? index - 1 : index + 1;
      [newFields[index], newFields[swapWith]] = [
        newFields[swapWith],
        newFields[index],
      ];
      return newFields;
    });
  };

  const handleSaveOrder = async () => {
    try {
      if (!userData?.userId) {
        toast.error("User data missing.");
        return;
      }
      const res = await updateAssessmentFieldOrder(
        fields.map((f) => f._id),
        userData.userId
      );
      if (res.success) toast.success(res?.message || "Order updated!");
      fetchFields();
    } catch (err) {
      toast.error(err?.toString() || "Failed to update order");
    }
  };

  const startIdx = (page - 1) * limit;
  const endIdx = Math.min(startIdx + limit, total);
  const fieldsToShow = fields;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 sm:p-6  bg-purpleLight overflow-auto">
        <div className="bg-white p-6 mb-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="sm:flex items-center gap-3 hidden">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="ic:outline-assessment"
                className="text-purple"
                width="24"
                height="24"
              />
            </div>
            <h1 className="text-2xl font-bold text-pink">
              {title ||
                STATIC_TEXTS.ASSESSMENT.PAGE_TITLE ||
                "Assessment Fields"}
            </h1>
          </div>
          <Button
            icon="mdi:plus"
            label={STATIC_TEXTS.ASSESSMENT.ADD_FIELD_BUTTON}
            variant="submitStyle"
            className="w-full md:w-fit !justify-center py-3 md:py-2"
            onClick={() => setAddModalOpen(true)}
          />
        </div>

        <div className="mx-auto">
          {loading && (
            <div className="text-center py-8">
              <Loader />
            </div>
          )}
          {error && (
            <div className="text-center text-red-500 py-8">{error}</div>
          )}
          {!loading && !error && fieldsToShow.length === 0 && (
            <div className="text-center py-8">No assessment fields found.</div>
          )}
          {!loading &&
            !error &&
            fieldsToShow.map((field: any, index: number) => (
              <div
                key={field._id}
                className="flex flex-col rounded-lg my-2 p-2 sm:p-4  bg-gray-50"
              >
                <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center  gap-y-2">
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-lg font-semibold">
                    <div className="flex items-center min-w-0">
                      <Icon
                        icon="mdi:view-column"
                        className="text-gray-500 mr-2 flex-shrink-0 "
                        width={24}
                        height={24}
                      />
                      <span
                        className="text-pink break-words whitespace-normal sm:whitespace-nowrap overflow-visible sm:truncate align-middle inline-block max-w-full sm:max-w-[200px] md:max-w-[350px] xl:max-w-[900px]"
                        title={field.name}
                      >
                        {field.name}
                      </span>
                    </div>
                    {field.isRequired && (
                      <span className="mt-1 sm:mt-0 ml-2 px-2 py-0.5 bg-green-500/20 text-green-600 text-xs rounded-lg align-middle uppercase w-fit ">
                        {"Required"}
                      </span>
                    )}
                    {field.isArchived && (
                      <span className="mt-1 sm:mt-0 ml-2 px-2 py-0.5 bg-red-500/20 text-red-600 text-xs rounded-lg align-middle uppercase w-fit ">
                        {"Archived"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs flex-shrink-0 mb-4 sm:mb-0 mt-2 sm:mt-0">
                    <IconButton
                      icon="tabler:arrow-up"
                      label={STATIC_TEXTS.ASSESSMENT.MOVE_UP}
                      className={`!p-2 !px-2 border-purple !shadow-sm sm:!shadow-none sm:!border-transparent  !rounded-full !text-purple hover:!text-white hover:!bg-purple${
                        index === 0 ? " opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={
                        index === 0 ? undefined : () => moveField(index, "up")
                      }
                    />
                    <IconButton
                      icon="tabler:arrow-down"
                      label={STATIC_TEXTS.ASSESSMENT.MOVE_DOWN}
                      className={`!p-2 !px-2 border-purple !shadow-sm sm:!shadow-none sm:!border-transparent  !bg-transparent !rounded-full !text-pink hover:!text-white hover:!bg-pink${
                        index === fieldsToShow.length - 1
                          ? " opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      onClick={
                        index === fieldsToShow.length - 1
                          ? undefined
                          : () => moveField(index, "down")
                      }
                    />
                    <IconButton
                      icon="mdi:edit"
                      label={STATIC_TEXTS.COMMON.EDIT}
                      className="!p-2 !px-2 border-purple !shadow-sm sm:!shadow-none sm:!border-transparent !bg-transparent !rounded-full !text-purple hover:!text-white hover:!bg-purple"
                      onClick={() => handleEditField(field)}
                    />
                    {!field.isUsed && (
                      <IconButton
                        icon="mdi:delete"
                        label={STATIC_TEXTS.COMMON.DELETE}
                        className="!p-2 !px-2 border-red-500 !shadow-sm sm:!shadow-none sm:!border-transparent !bg-transparent !rounded-full !text-red-500 hover:!text-white hover:!bg-red-700"
                        onClick={() => handleOpenDeletModal(field)}
                      />
                    )}
                  </div>
                </div>
                <div className="text-gray-500 text-sm pb-2 pl-6 sm:pl-8">
                  {field.description || ""}
                </div>
              </div>
            ))}
        </div>
      </div>
      {fields.length > 0 && (
        <>
          <div className="flex justify-end p-3">
            <Button
              icon="mdi:content-save"
              label="Save Order"
              variant="submitStyle"
              className="w-full md:w-fit !justify-center py-3 md:py-2"
              onClick={handleSaveOrder}
            />
          </div>
          <PageFooter
            count={limit}
            label={`${startIdx + 1}-${endIdx} of ${total} Fields`}
            currentPage={page}
            totalPages={totalPages}
            hasPrevious={page > 1}
            hasNext={page < totalPages}
            onPrevious={() => setPage(page - 1)}
            onNext={() => setPage(page + 1)}
          />
        </>
      )}
      <AssessmentFieldModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddField}
      />
      <AssessmentFieldModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditField(null);
        }}
        onSubmit={handleUpdateField}
        initialValues={editField}
        isEdit
      />
      <DeleteCaseModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteField(null);
        }}
        onConfirmDelete={hanldeDeleteField}
        title="Delete Field"
        message={`Are you sure you want to delete the field "${deleteField?.name}"? This action cannot be undone.`}
        confirmLabel="DELETE"
        confirmButtonLabel="Delete Field"
      />
    </div>
  );
};

export default AssessmentFieldsPage;
