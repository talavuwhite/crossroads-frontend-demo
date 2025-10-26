import Button from "@/components/ui/Button";
import ModalWrapper from "@/components/ui/ModalWrapper";
import "react-datepicker/dist/react-datepicker.css";
import type {
  IAvailableBedOfSiteForCheckIn,
  IBedCheckInRequestItem,
} from "@/services/BedManagementApi";
import { errorMsg } from "@/utils/formikHelpers";
import { formatArrivalDate } from "@/utils/getSmartRelativeTime";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { FormikProvider, useFormik } from "formik";
import * as Yup from "yup";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import DatePicker from "react-datepicker";

export interface BedCheckInFormValues {
  bed: IAvailableBedOfSiteForCheckIn | null;
  checkInDate: Date | null;
  notes: string;
}

interface ICheckInFromBedRequestProps {
  isOpen: boolean;
  onClose: () => void;
  request: IBedCheckInRequestItem;
  availableBeds: IAvailableBedOfSiteForCheckIn[];
  loadingAvailableBeds: boolean;
  onCheckIn: (values: BedCheckInFormValues) => void | Promise<void>;
}

const CheckInFromBedRequestModal: React.FC<ICheckInFromBedRequestProps> = ({
  isOpen,
  onClose,
  request,
  availableBeds,
  loadingAvailableBeds,
  onCheckIn,
}) => {
  // Formik initial values and validation
  const initialValues: BedCheckInFormValues = {
    bed: null,
    checkInDate: toZonedTime(
      new Date(),
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ),
    notes: request?.notes || "",
  };

  const validationSchema = Yup.object().shape({
    bed: Yup.object().nullable().required(ERROR_MESSAGES.FORM.REQUIRED),
    checkInDate: Yup.date().nullable().required(ERROR_MESSAGES.FORM.REQUIRED),
    notes: Yup.string(),
  });

  const formik = useFormik<BedCheckInFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: onCheckIn,
  });

  const inputClass = (field: string) =>
    `border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm ${
      formik.touched[field as keyof BedCheckInFormValues] &&
      formik.errors[field as keyof BedCheckInFormValues]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  // Helper fields
  const caseName = request?.caseName ?? "—";
  const siteName = request?.siteName ?? "—";
  const requester = request?.createdBy?.userName ?? "—";

  // Format arrival date with user timezone
  const formatDateWithTimezone = (dateString: string) => {
    if (!dateString) return "—";
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const date = parseISO(dateString);
      const zonedDate = toZonedTime(date, userTimeZone);
      return format(zonedDate, "MM/dd/yyyy");
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return formatArrivalDate(dateString);
    }
  };

  const arrivalDate = formatDateWithTimezone(request?.dateOfArrival ?? "");

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={STATIC_TEXTS.AGENCY.BED_MANAGEMENT.ADD_BED_CHECK_IN}
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-between gap-3">
          <Button
            label="Add"
            icon="mdi:plus"
            onClick={() => formik.handleSubmit()}
            variant="submitStyle"
          />
          <Button
            label="Cancel"
            icon="mdi:close"
            className="hover:bg-red-600 hover:text-white"
            onClick={onClose}
            variant="default"
          />
        </div>
      }
    >
      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="flex items-start gap-3 text-sm p-2 bg-yellow-50 border border-yellow-400 rounded-md">
            <Icon
              icon="mdi:warning"
              width="18"
              height="18"
              className="text-yellow-300"
            />
            <p className="text-sm text-gray-700">
              For HUD data accuracy, it's required that you enroll{" "}
              <span className="font-medium text-black whitespace-nowrap">
                "{caseName}"
              </span>{" "}
              into a Ouecomes before or after check-in.
            </p>
          </div>
          <div className="border border-gray-300 rounded-md overflow-hidden w-full">
            <table className="w-full table-auto text-sm text-gray-800 border-collapse">
              <tbody>
                <tr className="border-b border-gray-300">
                  <th className="text-left bg-purple-50 px-4 py-3 w-1/3">
                    Case
                  </th>
                  <td className="px-4 py-2">
                    <span className="font-bold">{caseName}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="text-left bg-purple-50 px-4 py-3">
                    Date of Arrival
                  </th>
                  <td className="px-4 py-2">
                    <span className="font-bold">{arrivalDate}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <th className="text-left bg-purple-50 px-4 py-3">Site</th>
                  <td className="px-4 py-2">
                    <span className="font-bold">{siteName}</span>
                  </td>
                </tr>
                <tr>
                  <th className="text-left bg-purple-50 px-4 py-3">
                    Requester
                  </th>
                  <td className="px-4 py-2">
                    <span className="font-bold">{requester}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col justify-center gap-2">
              <label className="font-semibold">
                {LABELS.FORM.BED}
                <span className="text-red-600">*</span>
              </label>
              <div>
                <select
                  className={
                    inputClass("bed") +
                    " disabled:bg-gray-300 disabled:text-gray-800 disabled:cursor-not-allowed rounded-lg"
                  }
                  value={formik.values.bed?.bedId || ""}
                  name="bed"
                  data-testid="bed-select"
                  onChange={(e) => {
                    const selectedBed =
                      availableBeds.find(
                        (bed) => bed.bedId === e.target.value
                      ) || null;
                    formik.setFieldValue("bed", selectedBed);
                  }}
                  onBlur={formik.handleBlur}
                  disabled={loadingAvailableBeds || !availableBeds.length}
                >
                  <option
                    value=""
                    disabled
                    className="text-gray-500 cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-500"
                  >
                    {loadingAvailableBeds
                      ? "Loading beds..."
                      : availableBeds.length
                      ? "Select a bed"
                      : "No beds available add beds in any site"}
                  </option>
                  {availableBeds.map((bed) => (
                    <option key={bed.bedId} value={bed.bedId}>
                      {`${bed.bedName} - Room ${bed.room} - ${
                        bed.bedType?.name || ""
                      }`}
                    </option>
                  ))}
                </select>
                {errorMsg("bed", formik)}
              </div>
            </div>
            <div className="flex flex-col w-full justify-center gap-2">
              <label className="font-semibold">
                {LABELS.FORM.CHECKED_IN_DATE}{" "}
                <span className="text-red-600">*</span>
              </label>

              <DatePicker
                selected={formik.values.checkInDate}
                onChange={(date: Date | null) =>
                  formik.setFieldValue("checkInDate", date)
                }
                onBlur={() => formik.setFieldTouched("checkInDate", true)}
                dateFormat="MM/dd/yyyy"
                placeholderText="Select check-in date"
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none text-sm ${
                  formik.touched.checkInDate && formik.errors.checkInDate
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                maxDate={new Date()}
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={15}
                popperPlacement="bottom-start"
              />
              {errorMsg("checkInDate", formik)}
            </div>
          </div>
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

export default CheckInFromBedRequestModal;
