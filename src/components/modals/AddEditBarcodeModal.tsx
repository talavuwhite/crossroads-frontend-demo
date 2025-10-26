import React, { useEffect, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@components/ui/Button";
import FormInput from "@ui/FormInput";
import FormTextarea from "@ui/FormTextarea";
import { useFormik } from "formik";
import * as Yup from "yup";
import { groupCategoriesBySection } from "@/utils/commonFunc";
import { getUnits } from "@/services/UnitApi";
import { fetchCategories } from "@/utils/commonFunc";
import { toast } from "react-toastify";
import type { SimplifiedCategory, Unit } from "@/types";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { ERROR_MESSAGES } from "@/utils/textConstants";

interface AddEditBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  initialData?: any;
  categories?: SimplifiedCategory[]; // optional if fetched here
  loadingCategories?: boolean;
  userId?: string;
  locationId?: string;
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Barcode Name is required"),
  category: Yup.string().required("Assistance Category is required"),
  amount: Yup.number()
    .typeError("Must be a number")
    .required("Assistance Amount is required")
    .min(0, ERROR_MESSAGES.FORM.NUMBER_MIN(0))
    .max(99999999, ERROR_MESSAGES.FORM.NUMBER_MAX(99999999)),
  unit: Yup.string().required("Assistance Unit is required"),
});

const AddEditBarcodeModal: React.FC<AddEditBarcodeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [categoryOptions, setCategoryOptions] = useState<SimplifiedCategory[]>(
    []
  );
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: userData } = useSelector((state: RootState) => state?.user);

  const formik = useFormik({
    initialValues: {
      name: initialData?.barcodeName || "",
      category: initialData?.assistanceCategory?._id || "",
      amount: initialData?.assistanceAmount || "",
      allowEditAmount: initialData?.allowEditAmount || false,
      unit: initialData?.assistanceUnit?._id || "",
      description: initialData?.assistanceDescription || "",
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      onSubmit(values);
    },
    enableReinitialize: true,
  });
  useEffect(() => {
    if (!initialData) {
      if (categoryOptions[0]?._id) {
        formik.setFieldValue("category", categoryOptions[0]._id);
      }
      if (units[0]?._id) {
        formik.setFieldValue("unit", units[0]._id);
      }
    }
  }, [categoryOptions, units, initialData]);

  useEffect(() => {
    if (isOpen) {
      formik.resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!userData?.userId) {
          toast.error("User authentication data missing.");
          return;
        }
        await fetchCategories(userData, setLoading, setCategoryOptions);
        const unitRes = await getUnits(
          userData?.userId,
          userData?.activeLocation
        );
        setUnits(unitRes);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form options");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, userData]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Assistance Barcode" : "Add Assistance Barcode"}
      widthClass="max-w-lg"
      footer={
        <>
          <Button
            label={initialData ? "Save Changes" : "Add Barcode"}
            variant="submitStyle"
            onClick={formik.submitForm}
          />
          <Button label="Cancel" variant="dangerStyle" onClick={onClose} />
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <FormInput
          label="Barcode Name"
          name="name"
          required
          formik={formik}
          placeholder="Enter barcode name"
        />

        {/* CATEGORY SELECT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assistance Category <span className="text-primary">*</span>
          </label>
          <select
            name="category"
            value={formik.values.category}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple border-gray-300"
            disabled={loading}
          >
            <option value="">Select category</option>
            {Object.entries(groupCategoriesBySection(categoryOptions)).map(
              ([section, cats]) => (
                <optgroup key={section} label={section}>
                  {cats.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              )
            )}
          </select>
          {formik.touched.category && formik.errors.category && (
            <div className="text-red-500 text-xs mt-1">
              {typeof formik.errors.category === "string" &&
                formik.errors.category}
            </div>
          )}
        </div>

        <FormInput
          label="Assistance Amount"
          name="amount"
          type="number"
          required
          formik={formik}
          placeholder="Enter amount"
        />

        {/* CHECKBOX */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowEditAmount"
            name="allowEditAmount"
            checked={formik.values.allowEditAmount}
            onChange={formik.handleChange}
            className="accent-purple"
          />
          <label htmlFor="allowEditAmount" className="text-sm text-gray-700">
            Allow Editing Assistance Amount In Barcode Mode
          </label>
        </div>

        {/* UNIT SELECT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assistance Unit <span className="text-primary">*</span>
          </label>
          <select
            name="unit"
            value={formik.values.unit}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple border-gray-300"
            disabled={loading}
          >
            <option value="">Select unit</option>
            {units.map((unit) => (
              <option key={unit._id} value={unit._id}>
                {unit.name}
              </option>
            ))}
          </select>
          {formik.touched.unit && formik.errors.unit && (
            <div className="text-red-500 text-xs mt-1">
              {typeof formik.errors.unit === "string" && formik.errors.unit}
            </div>
          )}
        </div>

        <FormTextarea
          label="Assistance Description"
          name="description"
          formik={formik}
          placeholder="Enter description"
          rows={3}
        />
      </form>
    </ModalWrapper>
  );
};

export default AddEditBarcodeModal;
