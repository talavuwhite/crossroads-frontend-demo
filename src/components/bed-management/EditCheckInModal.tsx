import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { editBedCheckIn } from "@/services/BedManagementApi";
import type { IBedListItem } from "@/types/bedManagement";
import { errorMsg } from "@/utils/formikHelpers";
import { LABELS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { FormikProvider, useFormik } from "formik";
import React from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toZonedTime } from "date-fns-tz";

interface IEditCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBed: IBedListItem;
  availableBedOptions?: IBedListItem[];
  onSuccess?: () => void;
}

interface IEditCheckInFormValues {
  notes: string;
  bedId: string;
  checkInDate: Date | null;
}

const EditCheckInModal: React.FC<IEditCheckInModalProps> = ({
  isOpen,
  onClose,
  selectedBed,
  availableBedOptions,
  onSuccess,
}) => {
  const [loading, setLoading] = React.useState(false);

  const { data: userData } = useSelector(
    (state: { user: { data: { userId: string } } }) => state.user
  );

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
        date = new Date(dateString);
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

  const initialValues: IEditCheckInFormValues = {
    notes: selectedBed?.notes || selectedBed?.checkOutNotes || "",
    bedId: selectedBed?.bedId ?? "",
    checkInDate: selectedBed?.checkIn
      ? parseDateString(selectedBed.checkIn)
      : toZonedTime(new Date(), userTimeZone),
  };

  const validationSchema = Yup.object().shape({
    notes: Yup.string(),
    bedId: Yup.string(),
    checkInDate: Yup.date()
      .nullable()
      .required("Check-in date is required")
      .typeError("Please select a valid date"),
  });

  const onSubmit = async (values: IEditCheckInFormValues) => {
    setLoading(true);
    const payload = {
      checkInId: selectedBed?.checkInId ?? "",
      caseId: selectedBed?.caseId ?? "",
      caseName: selectedBed?.case ?? "",
      bedId: values.bedId,
      bedName:
        availableBedOptions?.find((b) => b.bedId === values.bedId)?.bedName ||
        selectedBed?.bedName ||
        "",
      room:
        availableBedOptions?.find((b) => b.bedId === values.bedId)?.room ||
        selectedBed?.room ||
        "",
      bedTypeId:
        availableBedOptions?.find((b) => b.bedId === values.bedId)?.bedTypeId ||
        selectedBed?.bedTypeId ||
        "",
      bedTypeName:
        availableBedOptions?.find((b) => b.bedId === values.bedId)
          ?.bedTypeName ||
        selectedBed?.bedTypeName ||
        "",
      checkInDate: values?.checkInDate
        ? values.checkInDate.toISOString().split("T")[0]
        : "",
      notes: values?.notes ?? "",
    };
    try {
      const result = await editBedCheckIn(userData?.userId, payload);
      if (result?.success) {
        toast.success(result?.message || "Bed check-in updated successfully.");
        onSuccess?.();
        onClose();
      } else {
        toast.error(result?.message || "Failed to update bed check-in.");
      }
    } catch (error: unknown) {
      let apiMsg = "";
      if (typeof error === "object" && error !== null && "response" in error) {
        const response = (
          error as { response?: { data?: { message?: string } } }
        ).response;
        apiMsg = response?.data?.message || "";
      }
      toast.error(apiMsg || "Failed to update bed check-in.");
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<IEditCheckInFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit,
  });

  const getInputClass = (field: keyof IEditCheckInFormValues) =>
    `border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm ${
      formik.touched[field] && formik.errors[field]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  const [isChangingBed, setIsChangingBed] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsChangingBed(false);
    }
  }, [isOpen]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Bed Check-In"
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="submitStyle"
            icon="mdi:content-save"
            label={loading ? "Saving..." : "Save Changes"}
            onClick={() => formik.handleSubmit()}
            disabled={loading}
          />
          <Button
            variant="default"
            icon="mdi:close"
            label="Cancel"
            onClick={onClose}
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
                    <div className="flex items-center w-full">
                      {isChangingBed ? (
                        <>
                          <select
                            className="border border-gray-300 bg-white rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent px-3 py-1.5 text-sm flex-grow transition duration-150 ease-in-out"
                            {...formik.getFieldProps("bedId")}
                            onBlur={formik.handleBlur}
                          >
                            <option value="" disabled>
                              Select a bed...
                            </option>
                            {availableBedOptions?.map((bed) => (
                              <option key={bed?.bedId} value={bed?.bedId}>
                                {bed?.bedName} ({bed?.bedTypeName})
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-white transition ml-2"
                            onClick={() => setIsChangingBed(false)} // Cancel button
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold flex-grow">
                            {selectedBed?.bedName}
                          </span>
                          <button
                            type="button"
                            className="px-3 py-2 text-xs font-semibold text-purple border border-purple rounded hover:bg-purple hover:text-white transition ml-2"
                            onClick={() => setIsChangingBed(true)} // Change button
                          >
                            Change
                          </button>
                        </>
                      )}
                    </div>
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

          {/* Check-In Date Field */}
          <div className="flex flex-col gap-2">
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
              )} border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple`}
              maxDate={new Date()}
            />
            {errorMsg("checkInDate", formik)}
          </div>

          {/* Notes Section */}
          <div className="grow mb-4">
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

export default EditCheckInModal;
