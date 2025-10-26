import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormTextarea from "@/components/ui/FormTextarea";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import type { RequestStatus } from "@/types";
import { getRequestStatuses } from "@/services/RequestStatusApi";

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: string, notes: string, isEdit: boolean) => void;
  initialStatus?: string;
  initialNotes?: string;
  isEdit?: boolean;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialStatus = "",
  initialNotes = "",
  isEdit = false,
}) => {
  if (!isOpen) return null;

  const { data: userData } = useSelector((state: RootState) => state.user);
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus[]>([]);

  const formik = useFormik({
    initialValues: {
      status: initialStatus,
      notes: initialNotes,
    },
    validationSchema: Yup.object({
      status: Yup.string().required("Status is required"),
      notes: Yup.string(),
    }),
    onSubmit: (values) => {
      onSubmit(values.status, values.notes, isEdit);
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    if (requestStatuses && requestStatuses?.length !== 0 && !initialStatus)
      formik.setFieldValue("status", requestStatuses[0]?._id);
  }, [requestStatuses]);

  useEffect(() => {
    if (!userData) return;
    const fetchRequestStatuses = async () => {
      if (!userData?.userId) {
        return toast.error("User authentication missing");
      }
      try {
        const data = await getRequestStatuses(userData.userId, userData.activeLocation);
        setRequestStatuses(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to fetch request statuses";
        toast.error(message);
      }
    };
    fetchRequestStatuses();
  }, [userData, isOpen]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Update Status"
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="submitStyle"
            label={"Save Changes"}
            type="submit"
            onClick={formik.handleSubmit}
          />
          <Button
            variant="default"
            label="Cancel"
            type="button"
            onClick={onClose}
          />
        </div>
      }
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status <span className="text-primary">*</span>
        </label>
        <select
          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple  !accent-purple"
          name="status"
          value={formik.values.status}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={isEdit}
        >
          {requestStatuses.map((opt) => (
            <option key={opt._id} value={opt._id}>
              {opt.name}
            </option>
          ))}
        </select>
        {formik.touched.status && formik.errors.status && (
          <p className="text-red-500 text-xs mt-1">{formik.errors.status}</p>
        )}
      </div>
      <div className="mb-4">
        <FormTextarea
          name="notes"
          rows={4}
          formik={formik}
          label="Status Notes"
        />
      </div>
    </ModalWrapper>
  );
};

export default UpdateStatusModal;
