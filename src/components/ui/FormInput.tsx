import React from "react";
import type { FormikProps } from "formik";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  type?: string;
  formik: FormikProps<any>;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = "text",
  formik,
  required = false,
  maxLength,
  placeholder,
  className,
  ...props
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
      <input
        type={type}
        {...fieldProps}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border ${
          isInvalid ? "border-red-500" : "border-gray-300"
        } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple ${className}`}
        {...props}
        onKeyPress={(e) => {
          // Allow only numbers
          if (type === "number") {
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char)) {
              e.preventDefault();
            }
          }
        }}
      />
      {isInvalid && typeof fieldMeta.error === "string" && (
        <p className="text-red-500 text-xs mt-1">{fieldMeta.error}</p>
      )}
    </div>
  );
};

export default FormInput;
