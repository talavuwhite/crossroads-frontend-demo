import React, { useEffect } from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormInput from "@/components/ui/FormInput";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format as formatDate, parse } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const paymentStatusOptions = ["Paid", "Unpaid", "Partial", "Overdue"];
const subsidyTypeOptions = ["Government", "Private", "None"];
const subsidyStatusOptions = ["Active", "Inactive", "Pending"];

interface AddEditRentalSubsidyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

const validationSchema = Yup.object({
  propertyAddress: Yup.string().required("Property Address is required"),
  rentAmount: Yup.number()
    .typeError("Must be a number")
    .required("Rent Amount is required"),
  dueAmount: Yup.number().typeError("Must be a number"),
  subsidyAmount: Yup.number()
    .typeError("Must be a number")
    .required("Subsidy Amount is required"),
  rentDueDate: Yup.string().required("Rent Due Date is required"),
  lastPaymentDate: Yup.string().required("Last Payment Date is required"),
  paymentStatus: Yup.string().oneOf(paymentStatusOptions).required(),
  subsidyType: Yup.string().oneOf(subsidyTypeOptions).required(),
  subsidyStatus: Yup.string().oneOf(subsidyStatusOptions).required(),
  leaseStartDate: Yup.string().required("Lease Start Date is required"),
  leaseEndDate: Yup.string().required("Lease End Date is required"),
});

const defaultForm = {
  propertyAddress: "",
  rentAmount: "",
  dueAmount: "",
  payableAmount: "",
  rentDueDate: "",
  lastPaymentDate: "",
  paymentStatus: "Paid",
  subsidyType: "Government",
  subsidyAmount: "",
  subsidyStatus: "Active",
  leaseStartDate: "",
  leaseEndDate: "",
};

// Helper to parse date from either 'yyyy-MM-dd' or 'MM-dd-yyyy' to Date object
function parseDateFlexible(dateString: string) {
  if (!dateString || typeof dateString !== "string") return null;

  try {
    // Try MM-dd-yyyy first
    let parsed = parse(dateString, "MM-dd-yyyy", new Date());
    if (parsed instanceof Date && !isNaN(parsed.getTime())) {
      return toZonedTime(parsed, userTimeZone);
    }

    // Try yyyy-MM-dd
    parsed = parse(dateString, "yyyy-MM-dd", new Date());
    if (parsed instanceof Date && !isNaN(parsed.getTime())) {
      return toZonedTime(parsed, userTimeZone);
    }

    // Try native Date parsing
    parsed = new Date(dateString);
    if (parsed instanceof Date && !isNaN(parsed.getTime())) {
      return toZonedTime(parsed, userTimeZone);
    }

    return null;
  } catch (error) {
    console.warn("Error parsing date:", dateString, error);
    return null;
  }
}

// In useFormik initialValues, convert all date fields to MM-dd-yyyy for UI
const toUiDate = (dateString: string) => {
  if (!dateString || typeof dateString !== "string") return "";

  try {
    const d = parseDateFlexible(dateString);
    return d ? formatDate(d, "MM-dd-yyyy") : "";
  } catch (error) {
    console.warn("Error converting date to UI format:", dateString, error);
    return "";
  }
};

const AddEditRentalSubsidyModal: React.FC<AddEditRentalSubsidyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
}) => {
  const formik = useFormik({
    initialValues: initialData
      ? {
          ...initialData,
          rentDueDate: toUiDate(initialData.rentDueDate),
          lastPaymentDate: toUiDate(initialData.lastPaymentDate),
          leaseStartDate: toUiDate(initialData.leaseStartDate),
          leaseEndDate: toUiDate(initialData.leaseEndDate),
        }
      : defaultForm,
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      // Calculate final payableAmount
      const payableAmount =
        Number(values.rentAmount || 0) +
        Number(values.dueAmount || 0) -
        Number(values.subsidyAmount || 0);
      onSubmit({
        ...values,
        payableAmount,
      });
    },
  });

  // Calculate payableAmount whenever dependent values change
  useEffect(() => {
    const rentAmount = Number(formik.values.rentAmount || 0);
    const dueAmount = Number(formik.values.dueAmount || 0);
    const subsidyAmount = Number(formik.values.subsidyAmount || 0);
    const payableAmount = rentAmount + dueAmount - subsidyAmount;
    formik.setFieldValue("payableAmount", payableAmount);
  }, [
    formik.values.rentAmount,
    formik.values.dueAmount,
    formik.values.subsidyAmount,
  ]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Rental & Subsidy" : "Add Rental & Subsidy"}
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
            label={initialData ? "Update" : "Add"}
            disabled={loading}
            onClick={() => formik.handleSubmit()}
          />
        </div>
      }
    >
      <form className="space-y-4" onSubmit={formik.handleSubmit}>
        <FormInput
          label="Property Address"
          name="propertyAddress"
          formik={formik}
          required
        />
        <FormInput
          label="Rent Amount"
          name="rentAmount"
          type="number"
          formik={formik}
          required
        />
        <FormInput
          label="Past Due Amount"
          name="dueAmount"
          type="number"
          formik={formik}
        />
        <FormInput
          label="Subsidy Amount"
          name="subsidyAmount"
          type="number"
          formik={formik}
          required
        />
        <FormInput
          label="Payable Amount (Auto)"
          name="payableAmount"
          type="number"
          formik={formik}
          disabled
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rent Due Date <span className="text-primary">*</span>
          </label>
          <DatePicker
            selected={parseDateFlexible(formik.values.rentDueDate)}
            onChange={(date: Date | null) => {
              formik.setFieldValue(
                "rentDueDate",
                date ? formatDate(date, "MM-dd-yyyy") : ""
              );
              formik.setFieldTouched("rentDueDate", true);
            }}
            dateFormat="MM-dd-yyyy"
            placeholderText="MM-DD-YYYY"
            className="w-full h-9 p-2 border-2 !border-gray-300 rounded focus:!border-purple"
            wrapperClassName="w-full"
            minDate={new Date()}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            popperProps={{
              strategy: "absolute",
              placement: "bottom-start",
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Payment Date <span className="text-primary">*</span>
          </label>
          <DatePicker
            selected={parseDateFlexible(formik.values.lastPaymentDate)}
            onChange={(date: Date | null) => {
              formik.setFieldValue(
                "lastPaymentDate",
                date ? formatDate(date, "MM-dd-yyyy") : ""
              );
              formik.setFieldTouched("lastPaymentDate", true);
            }}
            dateFormat="MM-dd-yyyy"
            placeholderText="MM-DD-YYYY"
            maxDate={new Date()}
            className="w-full h-9 p-2 border-2 !border-gray-300 rounded focus:!border-purple"
            wrapperClassName="w-full"
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            popperProps={{
              strategy: "absolute",
              placement: "bottom-start",
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status <span className="text-primary">*</span>
          </label>
          <select
            name="paymentStatus"
            value={formik.values.paymentStatus}
            onChange={formik.handleChange}
            className={`w-full px-3 py-2 border ${
              formik.errors.paymentStatus ? "border-red-500" : "border-gray-300"
            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple`}
          >
            {paymentStatusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {typeof formik.touched.paymentStatus === "boolean" &&
            typeof formik.errors.paymentStatus === "string" &&
            formik.touched.paymentStatus && (
              <p className="text-red-500 text-xs mt-1">
                {formik.errors.paymentStatus}
              </p>
            )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subsidy Type <span className="text-primary">*</span>
          </label>
          <select
            name="subsidyType"
            value={formik.values.subsidyType}
            onChange={formik.handleChange}
            className={`w-full px-3 py-2 border ${
              formik.errors.subsidyType ? "border-red-500" : "border-gray-300"
            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple`}
          >
            {subsidyTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {typeof formik.touched.subsidyType === "boolean" &&
            typeof formik.errors.subsidyType === "string" &&
            formik.touched.subsidyType && (
              <p className="text-red-500 text-xs mt-1">
                {formik.errors.subsidyType}
              </p>
            )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subsidy Status <span className="text-primary">*</span>
          </label>
          <select
            name="subsidyStatus"
            value={formik.values.subsidyStatus}
            onChange={formik.handleChange}
            className={`w-full px-3 py-2 border ${
              formik.errors.subsidyStatus ? "border-red-500" : "border-gray-300"
            } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple`}
          >
            {subsidyStatusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {typeof formik.touched.subsidyStatus === "boolean" &&
            typeof formik.errors.subsidyStatus === "string" &&
            formik.touched.subsidyStatus && (
              <p className="text-red-500 text-xs mt-1">
                {formik.errors.subsidyStatus}
              </p>
            )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lease Start Date <span className="text-primary">*</span>
          </label>
          <DatePicker
            selected={parseDateFlexible(formik.values.leaseStartDate)}
            onChange={(date: Date | null) => {
              formik.setFieldValue(
                "leaseStartDate",
                date ? formatDate(date, "MM-dd-yyyy") : ""
              );
              formik.setFieldTouched("leaseStartDate", true);
            }}
            dateFormat="MM-dd-yyyy"
            placeholderText="MM-DD-YYYY"
            className="w-full h-9 p-2 border-2 !border-gray-300 rounded focus:!border-purple"
            wrapperClassName="w-full"
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            popperProps={{
              strategy: "absolute",
              placement: "bottom-start",
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lease End Date <span className="text-primary">*</span>
          </label>
          <DatePicker
            selected={parseDateFlexible(formik.values.leaseEndDate)}
            onChange={(date: Date | null) => {
              formik.setFieldValue(
                "leaseEndDate",
                date ? formatDate(date, "MM-dd-yyyy") : ""
              );
              formik.setFieldTouched("leaseEndDate", true);
            }}
            dateFormat="MM-dd-yyyy"
            placeholderText="MM-DD-YYYY"
            className="w-full h-9 p-2 border-2 !border-gray-300 rounded focus:!border-purple"
            wrapperClassName="w-full"
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            popperProps={{
              strategy: "absolute",
              placement: "bottom-start",
            }}
          />
        </div>
      </form>
    </ModalWrapper>
  );
};

export default AddEditRentalSubsidyModal;
