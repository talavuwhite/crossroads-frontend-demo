import React from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormInput from "@ui/FormInput";
import Button from "@ui/Button";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@utils/textConstants";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import FormTextarea from "@/components/ui/FormTextarea";
import type { Service, FilteredService } from "@/types";
import { getCategorySections } from "@/services/CategorySectionApi";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serviceData: {
    sectionId: string;
    name: string;
    description: string;
    taxonomyCode: string;
  }) => Promise<void>;
  serviceData?: Service | FilteredService;
  mode: "add" | "edit";
}

interface ServiceFormData {
  sectionId: string;
  name: string;
  description: string;
  taxonomyCode: string;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  serviceData,
  mode,
}) => {
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [sections, setSections] = React.useState<
    { _id: string; name: string }[]
  >([]);
  const [sectionsLoading, setSectionsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && userData?.userId) {
      (async () => {
        setSectionsLoading(true);
        try {
          const locationId = userData.activeLocation || "";
          const sectionsResult = await getCategorySections(
            userData.userId,
            locationId
          ).catch(() => []);
          setSections(sectionsResult);
        } catch (err: any) {
          setSections([]);
        } finally {
          setSectionsLoading(false);
        }
      })();
    }
  }, [isOpen, userData?.userId]);

  const validationSchema = Yup.object({
    sectionId: Yup.string()
      .required(ERROR_MESSAGES.FORM.REQUIRED)
      .max(50, ERROR_MESSAGES.FORM.MAX_LENGTH(50, "Section")),
    name: Yup.string()
      .required(ERROR_MESSAGES.FORM.REQUIRED)
      .max(50, ERROR_MESSAGES.FORM.MAX_LENGTH(50, "Name")),
    description: Yup.string()
      .notRequired()
      .max(500, ERROR_MESSAGES.FORM.MAX_LENGTH(500, "Description")),
    taxonomyCode: Yup.string()
      .notRequired()
      .matches(/^[A-Za-z0-9-]*$/, ERROR_MESSAGES.FORM.INVALID_TAXONOMY_CODE)
      .max(20, ERROR_MESSAGES.FORM.MAX_LENGTH(20, "Taxonomy code")),
  });

  const formik = useFormik<ServiceFormData>({
    initialValues: {
      sectionId:
        (serviceData &&
          "sectionId" in serviceData &&
          serviceData.sectionId?._id) ||
        (serviceData && "section" in serviceData && serviceData.section) ||
        "",
      name: serviceData?.name || "",
      description: serviceData?.description || "",
      taxonomyCode: serviceData?.taxonomyCode || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!userData?.userId) {
        toast.error("User data missing. Cannot save service.");
        return;
      }

      try {
        await onSubmit({
          sectionId: values.sectionId,
          name: values.name,
          description: values.description,
          taxonomyCode: values.taxonomyCode,
        });
        onClose();
      } catch (error: any) {
        toast.error(error?.data?.message || `Failed to ${mode} service.`);
      }
    },
  });

  const footerContent = (
    <div className="flex justify-end space-x-3">
      <Button
        label={STATIC_TEXTS.COMMON.CANCEL}
        onClick={onClose}
        variant="default"
      />
      <Button
        label={
          mode === "add"
            ? STATIC_TEXTS.COMMON.ADD
            : STATIC_TEXTS.COMMON.SAVE + " Changes"
        }
        onClick={formik.handleSubmit}
        variant="submitStyle"
      />
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "add"
          ? STATIC_TEXTS.SERVICES.ADD_SERVICES
          : `${STATIC_TEXTS.COMMON.EDIT} Service`
      }
      footer={footerContent}
      widthClass="max-w-xl"
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {LABELS.SERVICE.SECTION} <span className="text-red-500">*</span>
          </label>
          <select
            name="sectionId"
            value={formik.values.sectionId}
            onChange={formik.handleChange}
            className={`w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple phoneNumber !accent-purple ${
              formik.errors.sectionId ? "border-red-500" : "border-gray-300"
            }`}
            required
            disabled={sectionsLoading}
          >
            <option value="">---------</option>
            {sections.map((opt) => (
              <option key={opt._id} value={opt._id}>
                {opt.name}
              </option>
            ))}
            {sectionsLoading && <option disabled>Loading...</option>}
          </select>
          {formik.touched.sectionId &&
            typeof formik.errors.sectionId === "string" && (
              <div className="text-red-500 mt-1 text-sm">
                {formik.errors.sectionId}
              </div>
            )}
        </div>

        <FormInput
          label={LABELS.FORM.NAME}
          name="name"
          formik={formik}
          required
        />
        <FormTextarea
          label={LABELS.FORM.DESCRIPTION}
          name="description"
          formik={formik}
        />
        <FormInput
          label={LABELS.SERVICE.OPTIONAL_TAXONOMY_CODE}
          name="taxonomyCode"
          formik={formik}
        />
      </form>
    </ModalWrapper>
  );
};

export default ServiceModal;
