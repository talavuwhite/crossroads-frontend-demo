import type { FormikErrors, FormikTouched } from "formik";
import { getNestedFieldState } from "@/utils/commonFunc";
import type { JSX } from "react";

export type Form = {
  touched: FormikTouched<any>;
  errors: FormikErrors<any>;
};

export function errorMsg(field: string, formik: Form): JSX.Element | null {
  const touched =
    typeof field === "string"
      ? getNestedFieldState(formik.touched, field)
      : formik.touched[field];
  const error =
    typeof field === "string"
      ? getNestedFieldState(formik.errors, field)
      : formik.errors[field];

  if (touched && error) {
    return <div className="text-red-500 text-xs mt-1">{error as string}</div>;
  }

  return null;
}
