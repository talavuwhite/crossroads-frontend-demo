import Button from "@/components/ui/Button";
import FileInput from "@/components/ui/FileInput";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormInput from "@/components/ui/FormInput";
import ModalWrapper from "@/components/ui/ModalWrapper";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, name: string) => Promise<void>;
  loading?: boolean;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const formik = useFormik({
    initialValues: {
      document: null,
      documentName: "",
    },
    validationSchema: Yup.object({
      document: Yup.mixed().required("Document is required"),
      documentName: Yup.string().required("Document name is required"),
    }),
    onSubmit: async (values) => {
      if (values.document) {
        await onSubmit(values.document as File, values.documentName);
      }
    },
  });

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Document"
      footer={
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            onClick={onClose}
            variant="default"
            label="Cancel"
          />
          <Button
            type="submit"
            variant="submitStyle"
            label="Upload"
            disabled={loading}
            onClick={() => formik.handleSubmit()}
          />
        </div>
      }
    >
      <form className="space-y-4" onSubmit={formik.handleSubmit}>
        <FileInput
          label="Document"
          name="document"
          formik={formik}
          allowedTypes={["application/pdf", "image/jpeg", "image/png"]}
          required
        />
        <FormInput
          label="Document Name"
          name="documentName"
          formik={formik}
          required
        />
      </form>
    </ModalWrapper>
  );
};
