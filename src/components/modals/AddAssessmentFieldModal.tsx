import React, { useEffect } from "react";
import Button from "@/components/ui/Button";
import ModalWrapper from "@/components/ui/ModalWrapper";
import { useFormik } from "formik";
import * as Yup from "yup";
import { STATIC_TEXTS, ERROR_MESSAGES } from "@/utils/textConstants";
import { FIELD_TYPES } from "@/utils/constants";
import type { AssessmentField } from "@/services/AssessmentFieldApi";
import { Icon } from "@iconify-icon/react";

export interface AssessmentFieldModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (field: any) => void;
  initialValues?: Partial<AssessmentField>;
  isEdit?: boolean;
  onDelete?: (id: string) => void;
}

const AssessmentFieldModal: React.FC<AssessmentFieldModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  isEdit = false,
}) => {
  const formik = useFormik({
    initialValues: {
      name: initialValues?.name || "",
      type: initialValues?.type || FIELD_TYPES[0].value,
      isRequired: initialValues?.isRequired || false,
      options: Array.isArray(initialValues?.options)
        ? initialValues.options
        : [""],

      isArchived: initialValues?.isArchived || false,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string()
        .trim()
        .required(ERROR_MESSAGES.ASSESSMENT.FIELD_NAME_REQUIRED)
        .min(2, ERROR_MESSAGES.ASSESSMENT.FIELD_NAME_MIN)
        .max(100, ERROR_MESSAGES.ASSESSMENT.FIELD_NAME_MAX),
      type: Yup.string().required(
        ERROR_MESSAGES.ASSESSMENT.FIELD_TYPE_REQUIRED
      ),
      options: Yup.array().when("type", {
        is: (val: string) => ["dropdown", "radio", "checkbox"].includes(val),
        then: (schema) =>
          schema
            .of(
              Yup.string()
                .required("Option is required")
                .min(2, "Option must be at least 2 characters")
                .max(50, "Option must be at most 50 characters")
            )
            .min(1, "At least one option is required")
            .max(10, "Maximum 10 options allowed"),
        otherwise: (schema) => schema,
      }),
      isArchived: Yup.boolean(),
    }),
    onSubmit: (values, { resetForm }) => {
      const payload = isEdit
        ? { ...values, isArchived: values.isArchived }
        : values;
      onSubmit(payload);
      resetForm();
    },
  });

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      formik.resetForm();
    }
  }, [open]);

  // Helper to add a new option
  const handleAddOption = () => {
    const options = formik.values.options;
    const lastOption = options?.[options.length - 1];

    if (
      options &&
      options.length < 10 &&
      typeof lastOption === "string" &&
      lastOption.trim() !== ""
    ) {
      formik.setFieldValue("options", [...options, ""]);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (formik.values.options.length > 1) {
      const newOptions = formik.values.options.filter((_, i) => i !== idx);
      formik.setFieldValue("options", newOptions);
    }
  };

  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...formik.values.options];
    newOptions[idx] = value;
    formik.setFieldValue("options", newOptions);
  };

  const isOptionsType = ["dropdown", "radio", "checkbox"].includes(
    formik.values.type
  );
  const lastOption = formik.values.options?.[formik.values.options.length - 1];
  const canAddOption =
    isOptionsType &&
    formik.values.options?.length < 10 &&
    typeof lastOption === "string" &&
    lastOption.trim() !== "";

  return (
    <ModalWrapper
      isOpen={open}
      onClose={onClose}
      title={isEdit ? "Edit Form Field" : "Add Form Field"}
      widthClass="max-w-lg"
      footer={
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            label={
              isEdit
                ? "Edit Form Field"
                : STATIC_TEXTS.ASSESSMENT.ADD_FIELD_BUTTON
            }
            icon={isEdit ? "mdi:content-save-edit" : "mdi:plus-circle"}
            variant="submitStyle"
            onClick={() => formik.handleSubmit()}
          />
          <Button
            type="button"
            label={STATIC_TEXTS.COMMON.CANCEL}
            icon="mdi:close"
            variant="dangerStyle"
            onClick={onClose}
          />
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {STATIC_TEXTS.ASSESSMENT.FIELD_NAME_LABEL}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            required
            autoFocus
          />
          {formik.touched.name && formik.errors.name && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.name}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_LABEL}
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple disabled:bg-gray-300 disabled:cursor-not-allowed"
            name="type"
            value={formik.values.type}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={isEdit} // Don't allow type change on edit
          >
            {FIELD_TYPES.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </select>
          {formik.touched.type && formik.errors.type && (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.type}
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="checkbox"
            name="isRequired"
            checked={formik.values.isRequired}
            onChange={formik.handleChange}
            className="accent-purple"
          />
          <label className="block text-sm font-medium text-gray-700">
            Required Field
          </label>
        </div>
        {isEdit && (
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              name="isArchived"
              checked={formik.values.isArchived}
              onChange={formik.handleChange}
              className="accent-red-500"
            />
            <label className="block text-sm font-medium text-gray-700">
              Archived Field here
            </label>
          </div>
        )}
        {isOptionsType && (
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options
            </label>
            {formik.values.options.map((opt: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  onBlur={formik.handleBlur}
                  required
                />
                {formik.values.options.length > 1 && !isEdit && (
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveOption(idx)}
                  >
                    <Icon icon="mdi:delete" width={20} height={20} />
                  </button>
                )}
              </div>
            ))}
            {formik.touched.options &&
              typeof formik.errors.options === "string" && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors.options}
                </div>
              )}
            {formik.touched.options &&
              Array.isArray(formik.errors.options) &&
              formik.errors.options.map((err, idx) =>
                typeof err === "string" && err ? (
                  <div key={idx} className="text-red-500 text-xs mt-1">
                    Option {idx + 1}: {err}
                  </div>
                ) : null
              )}
            {formik.values.options.length < 10 && (
              <button
                type="button"
                className="flex items-center gap-1 text-purple mt-2 text-sm font-medium"
                onClick={handleAddOption}
                disabled={!canAddOption}
              >
                <Icon icon="mdi:plus-circle" width={18} height={18} /> Add
                Option
              </button>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Maximum 10 options allowed. You must fill the last option before
              adding another.
            </div>
          </div>
        )}
      </form>
    </ModalWrapper>
  );
};

export default AssessmentFieldModal;
