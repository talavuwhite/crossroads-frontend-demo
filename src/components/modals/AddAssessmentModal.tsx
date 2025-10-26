import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import ModalWrapper from "@/components/ui/ModalWrapper";
import { useFormik } from "formik";
import * as Yup from "yup";
import { STATIC_TEXTS, ERROR_MESSAGES } from "@/utils/textConstants";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  fetchAssessmentFieldsForEdit,
  fetchAssessmentFieldsForUser,
  type Assessment,
} from "@/services/AssessmentApi";
import Loader from "@/components/ui/Loader";
import { toast } from "react-toastify";
import { format, parse } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export interface AddAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, any>) => void;
  isEdit: boolean;
  editAssessment?: Assessment | null;
}

const AddAssessmentModal: React.FC<AddAssessmentModalProps> = ({
  open,
  onClose,
  onSubmit,
  isEdit,
  editAssessment,
}) => {
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [fields, setFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  const fetchFields = async () => {
    if (!userData?.userId) {
      toast.error("User data missing. Cannot fetch assessment fields.");
      return;
    }
    if (open) {
      setLoadingFields(true);

      try {
        let response;
        if (isEdit && editAssessment?._id) {
          response = await fetchAssessmentFieldsForEdit(
            editAssessment?._id,
            userData.userId,
            userData.activeLocation
          );
        } else {
          response = await fetchAssessmentFieldsForUser(
            userData.userId,
            userData.activeLocation
          );
        }

        setFields(response.data);
      } catch (err) {
        setFields([]);
      } finally {
        setLoadingFields(false);
      }
    }
  };
  useEffect(() => {
    fetchFields();
  }, [open, userData?.userId, userData?.activeLocation, userData]);

  const initialValues = React.useMemo(() => {
    const values: Record<string, any> = {};

    if (!fields || fields.length === 0) return values;

    fields.forEach((field) => {
      const fieldValue = field.value;

      switch (field.type) {
        case "checkbox":
          values[field._id] =
            typeof fieldValue === "boolean" ? fieldValue : false;
          break;

        case "number_with_decimal":
        case "whole_number":
          values[field._id] = typeof fieldValue === "number" ? fieldValue : 0;
          break;

        default:
          values[field._id] = fieldValue ?? "";
      }
    });

    values.description = editAssessment?.description || "";
    return values;
  }, [fields]);

  const validationSchema = React.useMemo(() => {
    if (!fields || fields.length === 0) return null;

    const shape: Record<string, any> = {};

    fields.forEach((field) => {
      const isRequired = Boolean(field.isRequired);
      const label = field.name || "This field";

      let schema: any;

      switch (field.type) {
        case "checkbox":
          schema = Yup.boolean().typeError(`${label} must be a boolean`);
          break;

        case "date":
          schema = Yup.date().typeError(`${label} must be a valid date`);
          break;

        case "dropdown":
        case "radio":
          schema = Yup.string().oneOf(
            field.options || [],
            `${label} must be a valid option`
          );
          break;

        case "number_with_decimal":
          schema = Yup.number()
            .typeError(`${label} must be a number`)
            .test(
              "is-decimal",
              `${label} must be a valid number`,
              (val) => val === null || val === undefined || !isNaN(val)
            )
            .test(
              "max-decimals",
              `${label} must have at most 3 decimal places`,
              (val) =>
                val === null ||
                val === undefined ||
                Number.isInteger(val) ||
                /^\d+(\.\d{1,3})?$/.test(val.toString())
            )
            .test(
              "max-length",
              `${label} must be at most 10 digits (before and after decimal)`,
              (val) =>
                val === null ||
                val === undefined ||
                val.toString().replace(".", "").length <= 10
            );
          break;

        case "whole_number":
          schema = Yup.number()
            .typeError(`${label} must be a number`)
            .integer(`${label} must be an integer`)
            .test(
              "max-length",
              `${label} must be at most 10 digits`,
              (val) =>
                val === null || val === undefined || val.toString().length <= 10
            );
          break;

        case "text_input":
        case "multi_line_text_input": {
          const maxLength = field.type === "multi_line_text_input" ? 500 : 100;
          schema = Yup.string()
            .typeError(`${label} must be a string`)
            .trim()
            .min(2, ERROR_MESSAGES.FORM.MIN_LENGTH(2, label))
            .max(maxLength, ERROR_MESSAGES.FORM.MAX_LENGTH(maxLength, label));
          break;
        }

        default:
          schema = Yup.mixed();
          break;
      }

      if (isRequired) {
        schema = schema.required(ERROR_MESSAGES.FORM.REQUIRED);
      }

      shape[field._id] = schema;
    });

    return Yup.object().shape(shape);
  }, [fields]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: validationSchema || Yup.object(), // fallback when loading
    onSubmit: (values) => {
      const payload = {
        fields: fields.map((field) => ({
          fieldId: field._id,
          value: values[field._id],
        })),
        description: values.description || "",
      };
      onSubmit(payload);
      onClose();
    },
    validateOnBlur: true,
    validateOnChange: true,
  });

  useEffect(() => {
    if (open) {
      formik.resetForm();
    }
    // eslint-disable-next-line
  }, [open]);

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Helper function to parse date string to Date object
  const parseDateString = (dateString: string) => {
    if (!dateString || typeof dateString !== "string") return null;

    try {
      // Try parsing MM-dd-yyyy format first
      let date = parse(dateString, "MM-dd-yyyy", new Date());
      if (date instanceof Date && !isNaN(date.getTime())) {
        return toZonedTime(date, userTimeZone);
      }

      // Try parsing yyyy-MM-dd format
      date = parse(dateString, "yyyy-MM-dd", new Date());
      if (date instanceof Date && !isNaN(date.getTime())) {
        return toZonedTime(date, userTimeZone);
      }

      // Try parsing as ISO string
      date = new Date(dateString);
      if (date instanceof Date && !isNaN(date.getTime())) {
        return toZonedTime(date, userTimeZone);
      }

      return null;
    } catch (error) {
      console.warn("Error parsing date string:", dateString, error);
      return null;
    }
  };

  return (
    <ModalWrapper
      isOpen={open}
      onClose={onClose}
      title={
        isEdit ? "Edit Assessment" : STATIC_TEXTS.ASSESSMENT.ADD_ASSESSMENT
      }
      widthClass="max-w-2xl"
      footer={
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            label={
              isEdit ? "Save Changes" : STATIC_TEXTS.ASSESSMENT.ADD_ASSESSMENT
            }
            icon="mdi:plus-circle"
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
      {loadingFields ? (
        <div className="py-8 text-center">
          <Loader />
        </div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          {fields.map((field) => (
            <div className="flex flex-col" key={field._id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.name}
                {field.isRequired && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {field.type === "text_input" ||
              field.type === "multi_line_text_input" ? (
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                  name={field._id}
                  value={formik.values[field._id]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  // required={field.isRequired}
                />
              ) : field.type === "number_with_decimal" ||
                field.type === "whole_number" ? (
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                  type="number"
                  name={field._id}
                  value={formik.values[field._id]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    const input = e.currentTarget;
                    if (field.type === "whole_number") {
                      input.value = input.value.replace(/[^0-9]/g, "");
                    } else if (field.type === "number_with_decimal") {
                      input.value = input.value.replace(/[^0-9.]/g, "");
                    }
                  }}
                />
              ) : field.type === "date" ? (
                <DatePicker
                  selected={parseDateString(formik.values[field._id])}
                  onChange={(date: Date | null) => {
                    formik.setFieldValue(
                      field._id,
                      date ? format(date, "MM-dd-yyyy") : ""
                    );
                    formik.setFieldTouched(field._id, true);
                  }}
                  dateFormat="MM-dd-yyyy"
                  placeholderText="MM-dd-yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                  wrapperClassName="w-full"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  popperProps={{
                    strategy: "absolute",
                    placement: "bottom-start",
                  }}
                />
              ) : field.type === "dropdown" ? (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                  name={field._id}
                  value={formik.values[field._id]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  // required={field.isRequired}
                >
                  <option value="">Select...</option>
                  {field.options.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === "radio" ? (
                <div className="flex gap-4">
                  {field.options.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={field._id}
                        value={opt}
                        checked={formik.values[field._id] === opt}
                        onChange={formik.handleChange}
                        required={field.isRequired}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : field.type === "checkbox" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={field._id}
                    checked={formik.values[field._id]}
                    onChange={formik.handleChange}
                    className="h-4 w-4 text-purple border-gray-300 rounded !accent-purple"
                  />
                  <span className="text-sm">{field.name}</span>
                </div>
              ) : null}
              {formik.touched[field._id] && formik.errors[field._id] && (
                <div className="text-red-500 text-xs mt-1">
                  {formik.errors[field._id] as string}
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
              name="description"
              value={formik.values.description || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rows={3}
            />
          </div>
        </form>
      )}
    </ModalWrapper>
  );
};

export default AddAssessmentModal;
