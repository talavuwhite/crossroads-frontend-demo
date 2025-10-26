import React, { useEffect, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import FormInput from "@ui/FormInput";
import FormTextarea from "@ui/FormTextarea";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  STATIC_TEXTS,
  LABELS,
  ERROR_MESSAGES,
  PLACEHOLDERS,
} from "@utils/textConstants";
import { getCategorySections } from "@/services/CategorySectionApi";
import { getUnits } from "@/services/UnitApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  forceVisibleToAllAgencies?: boolean;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  onClose,
  onSave,
  initialData = null,
  forceVisibleToAllAgencies = false,
}) => {
  const isEdit = Boolean(initialData);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [sections, setSections] = useState<{ _id: string; name: string }[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [units, setUnits] = useState<{ _id: string; name: string }[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  useEffect(() => {
    if (open && userData?.userId) {
      (async () => {
        setSectionsLoading(true);
        setUnitsLoading(true);
        try {
          const locationId = userData.activeLocation || "";
          const [sectionsResult, unitsResult] = await Promise.all([
            getCategorySections(userData.userId, locationId).catch(() => []),
            getUnits(userData.userId, locationId).catch(() => []),
          ]);
          setSections(sectionsResult);
          setUnits(unitsResult);
        } catch (err: any) {
          console.error("🚀 ~ err:", err);
          toast.error(err || "Failed to fetch units or sections");
          setSections([]);
          setUnits([]);
        } finally {
          setSectionsLoading(false);
          setUnitsLoading(false);
        }
      })();
    }
  }, [open, userData?.userId]);

  const formik = useFormik({
    initialValues: {
      sectionId: initialData?.sectionId?._id || initialData?.section || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      defaultAmount: initialData?.defaultAmount || "",
      defaultUnit:
        initialData?.defaultUnit?._id || initialData?.defaultUnit || "",
      fixedValue: initialData?.fixedValue || "",
      visibleTo: isEdit
        ? initialData?.visibleTo || "Agency Only"
        : forceVisibleToAllAgencies
        ? "All Agencies"
        : "Agency Only",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      sectionId: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
      name: Yup.string()
        .trim()
        .required(ERROR_MESSAGES.FORM.REQUIRED)
        .max(50, `Name cannot exceed 50 characters.`),

      description: Yup.string()
        .trim()
        .max(100, `Description cannot exceed 100 characters.`)
        .nullable(),
      defaultAmount: Yup.number()
        .min(0, ERROR_MESSAGES.FORM.NUMBER_MIN(0))
        .integer("Only whole numbers are allowed")
        .nullable(),
      fixedValue: Yup.number()
        .min(0, ERROR_MESSAGES.FORM.NUMBER_MIN(0))
        .max(99999999, ERROR_MESSAGES.FORM.NUMBER_MAX(99999999))
        .nullable()
        .test(
          "max-total-digits",
          ERROR_MESSAGES.FORM.NUMBER_MAX_TOTAL_DIGITS(8),
          (value) => {
            if (value === null || value === undefined) return true;
            const stringValue = String(value).replace(/\./g, "");
            return stringValue.length <= 8;
          }
        )
        .test(
          "max-decimal-places",
          ERROR_MESSAGES.FORM.NUMBER_MAX_DECIMALS(2),
          (value) => {
            if (value === null || value === undefined) return true;
            const stringValue = String(value);
            const decimalPart = stringValue.split(".")[1];
            return !decimalPart || decimalPart.length <= 2;
          }
        ),
      visibleTo: Yup.string().required(),
    }),
    onSubmit: (values, { resetForm }) => {
      const payload = {
        ...values,
        sectionId: values.sectionId,
        visibleTo: isEdit
          ? initialData?.visibleTo || "Agency Only"
          : forceVisibleToAllAgencies
          ? "All Agencies"
          : "Agency Only",
      };
      if (
        values.defaultUnit &&
        typeof values.defaultUnit === "string" &&
        values.defaultUnit.trim() !== ""
      ) {
        payload.defaultUnit = values.defaultUnit;
      } else {
        delete payload.defaultUnit;
      }
      onSave(payload);
      onClose();
      resetForm();
    },
  });

  useEffect(() => {
    if (open && initialData) {
      formik.setValues({
        sectionId: initialData?.sectionId?._id || initialData?.section || "",
        name: initialData?.name || "",
        description: initialData?.description || "",
        defaultAmount: initialData?.defaultAmount || "",
        defaultUnit:
          initialData?.defaultUnit?._id || initialData?.defaultUnit || "",
        fixedValue: initialData?.fixedValue || "",
        visibleTo: forceVisibleToAllAgencies ? "All Agencies" : "Agency Only",
      });
    } else {
      formik.resetForm();
    }
  }, [open, initialData]);

  return (
    <ModalWrapper
      isOpen={open}
      onClose={onClose}
      title={
        isEdit
          ? STATIC_TEXTS.CATEGORIES.EDIT_CATEGORY
          : STATIC_TEXTS.CATEGORIES.ADD_CATEGORY
      }
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label={
              isEdit
                ? STATIC_TEXTS.CATEGORIES.SAVE_CHANGES
                : STATIC_TEXTS.CATEGORIES.ADD_CATEGORY
            }
            icon={isEdit ? "mdi:content-save" : "mdi:plus"}
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
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-4"
        autoComplete="off"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {LABELS.CATEGORY.SECTION} <span className="text-red-500">*</span>
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
          </select>
          {formik.touched.sectionId &&
            typeof formik.errors.sectionId === "string" && (
              <div className="text-red-500 mt-1 text-sm">
                {formik.errors.sectionId}
              </div>
            )}
        </div>

        <FormInput
          label={LABELS.CATEGORY.NAME}
          name="name"
          formik={formik}
          required
          placeholder={PLACEHOLDERS.CATEGORY.NAME}
        />

        <FormTextarea
          label={LABELS.CATEGORY.DESCRIPTION}
          name="description"
          formik={formik}
          rows={3}
          placeholder={PLACEHOLDERS.CATEGORY.DESCRIPTION}
        />

        <FormInput
          label={LABELS.CATEGORY.DEFAULT_AMOUNT}
          name="defaultAmount"
          type="number"
          min={0}
          formik={formik}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {LABELS.CATEGORY.DEFAULT_UNIT}
          </label>
          <select
            name="defaultUnit"
            value={formik.values.defaultUnit}
            onChange={formik.handleChange}
            className={`w-full px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple phoneNumber !accent-purple ${
              formik.errors.defaultUnit ? "border-red-500" : "border-gray-300"
            }`}
            disabled={unitsLoading}
          >
            <option value="">---------</option>
            {units.map((unit) => (
              <option key={unit._id} value={unit._id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          label={LABELS.CATEGORY.FIXED_VALUE}
          name="fixedValue"
          type="number"
          min={0}
          value={formik.values.fixedValue}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder={PLACEHOLDERS.CATEGORY.FIXED_VALUE}
          formik={formik}
        />
      </form>
    </ModalWrapper>
  );
};

export default CategoryModal;
