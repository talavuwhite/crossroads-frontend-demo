import React from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { flagCase } from "@services/CaseApi";
import { toast } from "react-toastify";
import type { ApiResponse } from "@/types/api";
import FormTextarea from "@components/ui/FormTextarea";

interface FlagCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
}

const FlagCaseModal: React.FC<FlagCaseModalProps> = ({
  isOpen,
  onClose,
  caseId,
}) => {
  const userData = useSelector((state: RootState) => state.user);

  const formik = useFormik({
    initialValues: {
      message: "",
    },
    validationSchema: Yup.object({
      message: Yup.string().required("Message is required"),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        setSubmitting(true);
        const response: ApiResponse<null> = await flagCase(
          caseId,
          values.message,
          userData?.data?.userId || "",
          userData?.data?.activeLocation
        );
        toast.success(
          (response as ApiResponse<null>)?.message ||
            "Case flagged successfully!"
        );
        resetForm();
        onClose();
      } catch (error: any) {
        console.error("Error flagging case:", error);
        toast.error(error.message || "Failed to flag case.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Flag Case"
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="submitStyle"
            label="Flag Case"
            type="submit"
            onClick={() => formik.handleSubmit()}
          />
          <Button onClick={onClose} label="Cancel" />
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        <div className="text-sm text-gray-600 mb-4">
          Flagging a case allows you to send the network administrator(s) a
          private message regarding this case.
        </div>

        <div>
          <FormTextarea
            name="message"
            formik={formik}
            required
            rows={5}
            placeholder="Enter your message here..."
          />
        </div>
      </form>
    </ModalWrapper>
  );
};

export default FlagCaseModal;
