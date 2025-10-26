import type { FormikProps } from "formik";
import type React from "react";

interface SelectProps<T = any> {
  name: string;
  label: React.ReactNode;
  options: { value: string; label: string }[];
  formik: FormikProps<T>;
  inputClass: (field: keyof T | string) => string;
  errorMsg: (field: keyof T | string) => React.ReactNode;
}

export const Select = <T extends any = any>({
  name,
  label,
  options,
  formik,
  inputClass,
  errorMsg,
}: SelectProps<T>) => {
  return (
    <div>
      <label className="font-semibold">{label}</label>
      <select
        className={inputClass(name)}
        {...formik.getFieldProps(name)}
        onBlur={formik.handleBlur}
      >
        <option value="">-----</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errorMsg(name)}
    </div>
  );
};
