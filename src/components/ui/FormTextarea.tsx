import React from "react";
import type { FormikProps } from "formik";

interface FormTextareaProps {
  label?: string;
  name: string;
  formik: FormikProps<any>;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  name,
  formik,
  required = false,
  maxLength,
  placeholder,
  className,
  rows = 3,
}) => {
  const fieldProps = formik.getFieldProps(name);
  const fieldMeta = formik.getFieldMeta(name);

  const isInvalid = fieldMeta.touched && !!fieldMeta.error;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        {...fieldProps}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border ${
          isInvalid ? "border-red-500" : "border-gray-300"
        } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple resize-none ${className}`}
      />
      {isInvalid && typeof fieldMeta.error === "string" && (
        <p className="text-red-500 text-xs mt-1">{fieldMeta.error}</p>
      )}
    </div>
  );
};

export default FormTextarea;
