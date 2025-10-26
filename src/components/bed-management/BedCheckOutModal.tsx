import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { bedCheckOut } from "@/services/BedManagementApi";
import type { IBedListItem } from "@/types/bedManagement";
import { errorMsg } from "@/utils/formikHelpers";
import { LABELS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { FormikProvider, useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, toZonedTime } from "date-fns-tz";
import { addYears, parseISO } from "date-fns";

interface IBedCheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBed: IBedListItem | null;
  onSuccess?: () => void;
}

interface IBedCheckOutFormValues {
  notes: string;
  checkInDate: Date | null;
  checkOutDate: Date | null;
}

const BedCheckOutModal: React.FC<IBedCheckOutModalProps> = ({
  isOpen,
  onClose,
  selectedBed,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const { data: userData } = useSelector(
    (state: { user: { data: { userId: string } } }) => state.user
  );

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [initialValues, setInitialValues] = useState<IBedCheckOutFormValues>({
    notes: "",
    checkInDate: null,
    checkOutDate: null,
  });

  // Helper function to parse date strings and convert to zoned time
  const parseDateString = (
    dateString: string | null | undefined
  ): Date | null => {
    if (!dateString) return null;

    try {
      // Handle various date string formats
      let date: Date;
      if (dateString.includes("T")) {
        // ISO format
        date = parseISO(dateString);
      } else if (dateString.includes("-")) {
        // YYYY-MM-DD format
        date = new Date(dateString + "T00:00:00");
      } else if (dateString.includes("/")) {
        // MM/DD/YYYY format
        const [month, day, year] = dateString.split("/");
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Default to current date
        date = new Date();
      }

      // Convert to user's timezone
      return toZonedTime(date, userTimeZone);
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Validation: checkOutDate >= checkInDate
  const validationSchema = Yup.object().shape({
    notes: Yup.string(),
    checkInDate: Yup.date()
      .nullable()
      .required("Check-in date is required")
      .typeError("Please select a valid date"),
    checkOutDate: Yup.date()
      .nullable()
      .required("Check-out date is required")
      .typeError("Please select a valid date")
      .test(
        "checkOutDate-after-checkInDate",
        "Check-out date cannot be before check-in date",
        function (val) {
          const { checkInDate } = this.parent;
          return !val || !checkInDate || val >= checkInDate;
        }
      ),
  });

  // Set/reset initial values
  useEffect(() => {
    if (isOpen && selectedBed) {
      setInitialValues({
        notes: (selectedBed?.notes || selectedBed?.checkOutNotes) ?? "",
        checkInDate:
          parseDateString(selectedBed?.checkIn) ||
          toZonedTime(new Date(), userTimeZone),
        checkOutDate: selectedBed?.checkOut
          ? parseDateString(selectedBed?.checkOut)
          : selectedBed?.checkOutDate
          ? parseDateString(selectedBed?.checkOutDate)
          : toZonedTime(new Date(), userTimeZone), // always today!
      });
    }
  }, [isOpen, selectedBed, userTimeZone]);

  const onSubmit = async (values: IBedCheckOutFormValues) => {
    setLoading(true);

    const payload = {
      checkInId: selectedBed?.checkInId ?? "",
      checkOutDate: values?.checkOutDate
        ? format(values.checkOutDate, "yyyy-MM-dd")
        : "",
      checkOutNotes: values?.notes ?? "",
    };

    try {
      const result = await bedCheckOut(userData?.userId, payload);

      if (result?.success) {
        toast.success(result?.message || "Bed checked out successfully.");
        onSuccess?.();
        onClose();
      } else {
        toast.error(result?.message || "Failed to check out bed.");
      }
    } catch (error) {
      console.error("Error during bed check out:", error);
      toast.error("Something went wrong while checking out the bed.");
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<IBedCheckOutFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit,
  });

  const getInputClass = (field: keyof IBedCheckOutFormValues) =>
    `border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm ${
      formik.touched[field] && formik.errors[field]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  // ---------- Render ----------
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Bed Check-Out"
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="submitStyle"
            icon="mdi:content-save"
            label={loading ? "Saving..." : "Save Changes"}
            onClick={() => formik.handleSubmit()}
            disabled={loading}
            className="!text-xs sm:!text-base"
          />
          <Button
            variant="default"
            icon="mdi:close"
            label="Cancel"
            onClick={onClose}
            className="!text-xs sm:!text-base"
          />
        </div>
      }
    >
      <FormikProvider value={formik}>
        <form
          onSubmit={formik.handleSubmit}
          className="grid grid-cols-1 gap-6 bg-white rounded-md"
        >
          {/* Warning Message */}
          <div className="flex items-start gap-3 text-sm p-4 bg-yellow-50 border border-yellow-400 rounded-md">
            <Icon
              icon="mdi:warning"
              width="18"
              height="18"
              className="text-yellow-600"
            />
            <span className="text-yellow-800">
              For HUD data accuracy, it's required that you enroll{" "}
              <span className="font-bold">"{selectedBed?.case}"</span> into an
              Outcomes before or after check-in.
            </span>
          </div>

          {/* Case Information */}
          <div className="border border-gray-300 rounded-md overflow-hidden w-full shadow-sm">
            <table className="w-full table-auto text-sm text-gray-800 border-collapse">
              <tbody>
                <tr className="border-b border-gray-300">
                  <th className="text-left bg-purple-50 px-4 py-3">Case</th>
                  <td className="px-4 py-2">
                    <span className="font-bold">{selectedBed?.case}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="text-left bg-purple-50 px-4 py-3">Bed</th>
                  <td className="px-4 py-2">
                    <span className="font-bold">{selectedBed?.bedName}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="text-left bg-purple-50 px-4 py-3">Room</th>
                  <td className="px-4 py-2">
                    <span className="font-bold">{selectedBed?.room}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="text-left bg-purple-50 px-4 py-3">Type</th>
                  <td className="px-4 py-2">
                    <span className="font-bold">
                      {selectedBed?.bedTypeName}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Date Fields in Row */}
          <div className="flex-col sm:flex-row flex gap-4">
            {/* Check-In Date Field */}
            <div className="flex flex-col w-full">
              <label className="font-semibold">
                Check-In Date <span className="text-red-600">*</span>
              </label>
              <DatePicker
                selected={formik.values.checkInDate}
                onChange={(date) => {
                  formik.setFieldValue("checkInDate", date);
                  if (date) {
                    formik.setFieldTouched("checkInDate", true);
                  }
                }}
                onBlur={() => formik.setFieldTouched("checkInDate", true)}
                dateFormat="MM/dd/yyyy"
                placeholderText="MM/DD/YYYY"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={10}
                scrollableYearDropdown
                className={`${getInputClass(
                  "checkInDate"
                )} border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple bg-gray-100 text-gray-500 cursor-not-allowed`}
                disabled
              />
              {errorMsg("checkInDate", formik)}
            </div>

            {/* Check-Out Date Field */}
            <div className="flex flex-col w-full">
              <label className="font-semibold">
                Check-Out Date <span className="text-red-600">*</span>
              </label>
              <DatePicker
                selected={formik.values.checkOutDate}
                onChange={(date) => {
                  formik.setFieldValue("checkOutDate", date);
                  if (date) {
                    formik.setFieldTouched("checkOutDate", true);
                  }
                }}
                onBlur={() => formik.setFieldTouched("checkOutDate", true)}
                dateFormat="MM/dd/yyyy"
                placeholderText="MM/DD/YYYY"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={10}
                scrollableYearDropdown
                minDate={formik.values.checkInDate || undefined}
                maxDate={addYears(new Date(), 1)}
                className={`${getInputClass(
                  "checkOutDate"
                )} border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple`}
              />
              {errorMsg("checkOutDate", formik)}
            </div>
          </div>

          {/* Notes Section */}
          <div className="grow">
            <label className="font-semibold">{LABELS.FORM.NOTES}</label>
            <textarea
              rows={3}
              {...formik.getFieldProps("notes")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none resize-none"
            />
          </div>
        </form>
      </FormikProvider>
    </ModalWrapper>
  );
};

export default BedCheckOutModal;
