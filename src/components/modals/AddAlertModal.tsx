import React, { useEffect } from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { useFormik } from "formik";
import { STATIC_TEXTS } from "@/utils/textConstants";
import FormTextarea from "@/components/ui/FormTextarea";
import { alertValidationSchema } from "@/utils/constants";
import type { CaseAlert } from "@/types/case";

interface AddAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: { description: string; sendEmail: boolean },
    alertId?: string
  ) => void;
  editAlert?: CaseAlert | null;
}

const AddAlertModal: React.FC<AddAlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editAlert = null,
}) => {
  const formik = useFormik({
    initialValues: {
      description: editAlert?.description || "",
      sendEmail: editAlert?.emailSent || false,
    },
    validationSchema: alertValidationSchema,
    onSubmit: (values, { resetForm }) => {
      onSubmit(values, editAlert?._id);
      onClose();
      resetForm();
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    if (isOpen) {
      formik.setValues({
        description: editAlert?.description || "",
        sendEmail: editAlert?.emailSent || false,
      });
    } else {
      formik.resetForm();
    }
  }, [isOpen, editAlert]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        editAlert
          ? STATIC_TEXTS.ALERTS.EDIT_ALERT
          : STATIC_TEXTS.ALERTS.ADD_ALERT
      }
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label={
              editAlert
                ? STATIC_TEXTS.ALERTS.SAVE_CHANGES
                : STATIC_TEXTS.ALERTS.ADD_ALERT
            }
            icon={editAlert ? "mdi:content-save" : "mdi:plus"}
            variant="submitStyle"
            onClick={() => formik.handleSubmit()}
          />
          <Button
            label={STATIC_TEXTS.COMMON.CANCEL}
            onClick={onClose}
            variant="default"
          />
        </div>
      }
    >
      <div className="mb-4">
        <FormTextarea
          name="description"
          label={STATIC_TEXTS.ALERTS.DESCRIPTION_LABEL}
          formik={formik}
          required
          rows={6}
        />
      </div>
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="sendEmail"
          name="sendEmail"
          checked={formik.values.sendEmail}
          onChange={formik.handleChange}
          className="mr-2 accent-purple"
        />
        <label htmlFor="sendEmail" className="text-sm">
          {STATIC_TEXTS.ALERTS.SEND_EMAIL_LABEL}
        </label>
      </div>
    </ModalWrapper>
  );
};

export default AddAlertModal;
