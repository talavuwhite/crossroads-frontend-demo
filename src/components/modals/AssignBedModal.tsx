import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import * as Yup from "yup";
import { FormikProvider, useFormik } from "formik";
import type { AssignBedFormValues, CaseType } from "@/types/case";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import AddBedRequestModal from "@modals/AddBedRequestModal";
import { errorMsg } from "@/utils/formikHelpers";
import {
  assignBed,
  fetchCompanySiteBedSummary,
  type IAssignBedPayload,
  type ICompanyBedSummary,
} from "@/services/BedManagementApi";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import DatePicker from "react-datepicker";
import { toast } from "react-toastify";
import { toZonedTime } from "date-fns-tz";

interface AssignBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseType | null;
  onSuccess?: () => void;
}

const AssignBedModal = ({
  isOpen,
  onClose,
  caseData,
  onSuccess,
}: AssignBedModalProps) => {
  const { data: userData } =
    useSelector((state: RootState) => state.user) ?? {};
  const [isRequestBedOpen, setIsRequestBedOpen] = useState(false);
  const [companySiteBedSummary, setCompanySiteBedSummary] = useState<
    ICompanyBedSummary[] | null
  >(null);

  const getCompanySiteBedSummary = useCallback(async () => {
    if (userData?.userId) {
      try {
        const res = await fetchCompanySiteBedSummary(userData?.userId);
        const raw = res?.data as
          | ICompanyBedSummary
          | ICompanyBedSummary[]
          | undefined;
        const data = Array.isArray(raw) ? raw : raw ? [raw] : [];
        setCompanySiteBedSummary(data ?? []);
      } catch {
        // Optionally handle error (e.g., show toast)
      }
    }
  }, [userData?.userId]);

  useEffect(() => {
    getCompanySiteBedSummary();
  }, []);

  const selectedCompany =
    companySiteBedSummary?.find(
      (company) =>
        company?.companyId === userData?.activeLocation || userData?.companyId
    ) ?? null;

  const siteOptions = useMemo(
    () =>
      selectedCompany?.sites?.map((site) => ({
        label: `${site?.siteName ?? ""} (${
          site?.totalAvailableBeds ?? 0
        } Beds Available)`,
        value: site?.siteId ?? "",
      })) ?? [],
    [selectedCompany]
  );

  const handleConfirmAssign = async (values: AssignBedFormValues) => {
    const availableBeds = selectedCompany?.sites
      ?.find((site) => site?.siteId === formik.values.site)
      ?.bedTypes.find((bed) => bed.bedId === formik.values.availableBeds);

    const payload: IAssignBedPayload = {
      caseId: caseData?._id ?? "",
      caseName: caseData?.firstName + " " + caseData?.lastName,
      siteId: values.site,
      bedId: availableBeds?.bedId ?? "",
      bedTypeId: availableBeds?.bedTypeId ?? "",
      bedTypeName: availableBeds?.bedTypeName ?? "",
      checkInDate: values.checkInDate?.toISOString() ?? "",
      notes: values.notes,
    };
    try {
      const res = await assignBed(
        payload,
        userData?.userId,
        userData?.activeLocation
      );
      if (res?.success) {
        toast.success(res?.message);
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to assign bed. Please try again."
      );
    }
  };

  const initialValues: AssignBedFormValues = {
    site: "",
    checkInDate: toZonedTime(
      new Date(),
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ),
    availableBeds: "",
    notes: "",
  };

  const validationSchema = Yup.object().shape({
    site: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    checkInDate: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    availableBeds: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    notes: Yup.string(),
  });

  const formik = useFormik<AssignBedFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: handleConfirmAssign,
  });

  const inputClass = (field: string) =>
    `border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm ${
      formik.touched[field as keyof AssignBedFormValues] &&
      formik.errors[field as keyof AssignBedFormValues]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  const bedOptions = useMemo(
    () =>
      selectedCompany?.sites
        ?.find((site) => site?.siteId === formik.values.site)
        ?.bedTypes?.map((bed) => ({
          label: `${bed?.bedName} - ${bed?.room} - ${bed?.bedTypeName}`,
          value: bed?.bedId ?? "",
        })) ?? [],
    [selectedCompany, formik.values.site]
  );

  useEffect(() => {
    if (siteOptions?.length > 0) {
      formik.setFieldValue("site", siteOptions[0].value);
    }
  }, [siteOptions]);

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        title={STATIC_TEXTS.BED_ASSIGNMENTS.ASSIGN_BED}
        widthClass="max-w-2xl"
        footer={
          <div className="flex justify-between gap-3">
            <>
              <Button
                label={STATIC_TEXTS.BED_ASSIGNMENTS.ASSIGN_BED}
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
            </>
          </div>
        }
      >
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="flex items-start gap-3 text-xs sm:text-sm p-2 bg-yellow-50 border border-yellow-400 rounded-md">
              <Icon
                icon="mdi:warning"
                width="18"
                height="18"
                className="text-yellow-300"
              />
              <span>
                For HUD data accuracy, you must enroll{" "}
                <span className="font-bold">
                  {caseData?.firstName} {caseData?.lastName}
                </span>{" "}
                into an Outcome either before or after check-in.
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-xl text-gray-800">
                Bed For{" "}
                <span className="font-bold text-pink">
                  {caseData?.firstName} {caseData?.lastName}
                </span>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm">
                (Head Of Household - Culturally Specific Identity (e.g.,
                Two-Spirit), Different Identity - age unknown)
              </p>
              <div className="border-b border-gray-200 mt-2 mb-4"></div>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="font-semibold text-sm text-gray-700 mb-1">
                    {LABELS.FORM.SITE}
                    <span className="text-red-600">*</span>
                  </label>
                  {siteOptions && (
                    <div>
                      <select
                        className={inputClass("site")}
                        {...formik.getFieldProps("site")}
                        onBlur={formik.handleBlur}
                      >
                        <option value="" disabled>
                          Select Site
                        </option>
                        {siteOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errorMsg("site", formik)}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Check-In Date */}
                  <div className="flex flex-col min-w-[140px]">
                    <label className="font-semibold text-sm text-gray-700 mb-1">
                      {LABELS.FORM.CHECKED_IN_DATE}{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <DatePicker
                      selected={formik.values.checkInDate}
                      onChange={(date: Date | null) => {
                        formik.setFieldValue("checkInDate", date);
                        formik.setFieldTouched("checkInDate", true);
                      }}
                      dateFormat="MM/dd/yyyy"
                      placeholderText={STATIC_TEXTS.COMMON.SELECT_DEADLINE_DATE}
                      className={inputClass("checkInDate")}
                      wrapperClassName="w-full"
                      minDate={new Date()}
                      maxDate={
                        new Date(new Date().setDate(new Date().getDate() + 30))
                      }
                    />
                    {errorMsg("checkInDate", formik)}
                  </div>

                  {/* Available Beds */}
                  <div className="flex flex-col w-full">
                    <label className="font-semibold text-sm text-gray-700 mb-1">
                      {LABELS.FORM.AVAILABLE_BEDS}{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <select
                      className={inputClass("availableBeds")}
                      {...formik.getFieldProps("availableBeds")}
                      onBlur={formik.handleBlur}
                    >
                      <option value="" disabled>
                        Select Bed
                      </option>
                      {bedOptions?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      {!bedOptions.length && (
                        <option value="" disabled>
                          No beds available
                        </option>
                      )}
                    </select>
                    {errorMsg("availableBeds", formik)}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm p-2 bg-blue-50 border border-blue-400 rounded-md">
                  <Icon
                    icon="mdi:info"
                    width="18"
                    height="18"
                    className="text-blue-300"
                  />
                  <p>
                    TIP — If you're not finding a suitable bed for Test, you can{" "}
                    <span
                      role="button"
                      onClick={() => {
                        onClose();
                        setIsRequestBedOpen(true);
                      }}
                      className="underline hover:text-black/80 cursor-pointer"
                    >
                      search and request a bed
                    </span>{" "}
                    at another agency.
                  </p>
                </div>
                <div className="grow">
                  <label className="font-semibold">{LABELS.FORM.NOTES}</label>
                  <textarea
                    rows={4}
                    {...formik.getFieldProps("notes")}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </form>
        </FormikProvider>
      </ModalWrapper>
      <AddBedRequestModal
        isOpen={isRequestBedOpen}
        onClose={() => setIsRequestBedOpen(false)}
        initialStep={3}
      />
    </>
  );
};

export default AssignBedModal;
