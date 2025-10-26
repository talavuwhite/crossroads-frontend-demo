import type { IBedCheckInRequestItem } from "@/services/BedManagementApi";
import { errorMsg } from "@/utils/formikHelpers";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import ConfirmationModal from "@modals/ConfirmationModal";
import Button from "@ui/Button";
import ModalWrapper from "@ui/ModalWrapper";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";

interface DeleteBedRequestModalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: IBedCheckInRequestItem | null;
  onDeny: (reason: string) => Promise<void>;
}

const DeleteBedRequestModal = ({
  isOpen,
  onClose,
  request,
  onDeny,
}: DeleteBedRequestModalModalProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialValues = {
    reason: "",
  };

  const validationSchema = Yup.object().shape({
    reason: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  });

  const handleSubmit = async (
    values: { reason: string },
    { resetForm }: { resetForm: () => void }
  ) => {
    if (!request) return;
    setSubmitting(true);
    await onDeny(values.reason);
    setSubmitting(false);
    resetForm();
  };

  const formik = useFormik<{ reason: string }>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    if (!isOpen) {
      formik.resetForm();
      setSubmitting(false);
    }
  }, [isOpen]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={STATIC_TEXTS.AGENCY.BED_MANAGEMENT.DELETE_BED_REQUEST}
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-between gap-3">
          <Button
            label={submitting ? "Denying..." : "Deny Request"}
            icon="mdi:denied"
            onClick={() => formik.handleSubmit()}
            variant="dangerStyle"
            disabled={submitting}
          />

          <Button
            label="Cancel"
            icon="mdi:close"
            className="hover:bg-red-600 hover:text-white"
            onClick={onClose}
            variant="default"
            disabled={submitting}
          />
        </div>
      }
    >
      <div>
        <div className="grow">
          <label className="font-semibold">
            {LABELS.FORM.DELETE_BED_REQUEST}
          </label>
          <textarea
            rows={3}
            {...formik.getFieldProps("reason")}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none resize-none"
            disabled={submitting}
          />
          {errorMsg("reason", formik)}
        </div>

        {/* KEEP AS IS — hidden by default, not for removal. We Will Show when needed. */}
        <div className="bg-blue-200 rounded-md p-2 items-center gap-2 hidden">
          <Icon
            icon="mdi:info"
            width="18"
            height="18"
            className="text-blue-400"
          />
          <div className="text-sm">
            You can also{" "}
            <span
              role="button"
              onClick={() => setConfirmOpen(true)}
              className="text-red-600 underline cursor-pointer"
            >
              delete this request
            </span>{" "}
            if it was made in error or is a duplicate. Otherwise, it's best to
            deny the request for better data accuracy.
          </div>
        </div>

        <ConfirmationModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {}}
          title="Confirmation"
          message="Are you sure you want to delete this bed request?"
          confirmText="Ok"
          variant="success"
        />
      </div>
    </ModalWrapper>
  );
};

export default DeleteBedRequestModal;
