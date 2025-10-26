import React from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormInput from "@ui/FormInput";
import FormTextarea from "@ui/FormTextarea";
import Button from "@ui/Button";
import { ERROR_MESSAGES, STATIC_TEXTS } from "@/utils/textConstants";
import { ORGANIZATION_TYPES, phoneRegex, zipRegex } from "@/utils/constants";
import type {
  AgencyDetailsTypes,
  MailingAddress,
  OfficeHour,
} from "@/types/agency";
import { updateAgency } from "@/services/AgencyApi";
import { buildEditPayload, convertTo24Hour } from "@/utils/commonFunc";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import type { Country } from "@/types";

interface EditAgencyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AgencyFormData) => void;
  agencyData?: AgencyDetailsTypes | null;
  countries: Country[];
}

export interface AgencyFormData {
  name: string;
  phone: string;
  fax?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  type: string;
  mailingAddress: MailingAddress;
  disableLogins: boolean;
  officeHours: OfficeHour[];
  aboutUs: string;
  organizationType: string;
}

const officeHourSchema = Yup.object()
  .shape({
    startTime: Yup.string(),
    endTime: Yup.string(),
    additionalDetails: Yup.string().nullable(),
  })
  .test(
    "start-end-required",
    "Start Time and End Time are both required if either is set",
    (value) => {
      if (!value) return true;
      const { startTime, endTime } = value;
      if ((startTime && !endTime) || (!startTime && endTime)) {
        return false;
      }
      return true;
    }
  );

const baseValidation = {
  name: Yup.string()
    .trim()
    .required("Agency name is required")
    .min(2, "Agency Name must be at least 2 characters")
    .max(50, "Agency Name must be at most 50 characters"),
  address: Yup.string()
    .trim()
    .required("Address is required")
    .max(200, "Maximum 200 characters"),
  country: Yup.string().required("Country is required"),
  organizationType: Yup.string()
    .trim()
    .required("Type Of Organization is required"),
  phone: Yup.string()
    .trim()
    .required()
    .matches(
      phoneRegex,
      "Phone number must be in a valid format (e.g., (123) 456-7890)"
    )
    .max(20, "Phone must be at most 20 characters"),
  fax: Yup.string().nullable().max(20, "Fax must be at most 20 characters"),
  city: Yup.string().nullable().max(50, "City must be at most 50 characters"),
  state: Yup.string().nullable().max(20, "State must be 20 characters"),
  zip: Yup.string()
    .nullable()
    .matches(zipRegex, "Zip must be in format XXXXX or XXXXX-XXXX")
    .max(10, "Zip must be at most 10 characters"),
  website: Yup.string()
    .nullable()
    .max(200, "Website must be at most 200 characters"),
  type: Yup.string().nullable(),
  disableLogins: Yup.boolean().nullable(),
  officeHours: Yup.array().of(officeHourSchema),
  aboutUs: Yup.string().nullable().max(500, "Maximum 500 characters"),
  disableAllLogins: Yup.boolean().nullable(),
  mailingAddress: Yup.object({
    street: Yup.string().nullable().max(50, "Maximum 50 characters"),
    city: Yup.string().nullable().max(20, "Maximum 20 characters"),
    state: Yup.string().nullable().max(20, "Maximum 20 characters"),
    postalCode: Yup.string().nullable().max(10, "Maximum 10 characters"),
  }),
  about: Yup.string().nullable().max(100, "Maximum 100 characters"),
};

const addOnlyValidation = {
  country: Yup.string()
    .nullable()
    .max(50, "Country must be at most 50 characters"),
  postalCode: Yup.string()
    .nullable()
    .matches(zipRegex, "Zip must be in format XXXXX or XXXXX-XXXX")
    .max(10, "Postal code must be at most 10 characters"),
  timezone: Yup.string()
    .nullable()
    .max(50, "Timezone must be at most 50 characters"),
  prospectInfo: Yup.object({
    firstName: Yup.string()
      .trim()
      .required(ERROR_MESSAGES.FORM.REQUIRED)
      .min(2, "First Name must be at least 2 characters")
      .max(50, "First Name must be at most 50 characters"),
    lastName: Yup.string()
      .trim()
      .required(ERROR_MESSAGES.FORM.REQUIRED)
      .min(2, "Last Name must be at least 2 characters")
      .max(50, "Last Name must be at most 50 characters"),
    email: Yup.string()
      .trim()
      .email(ERROR_MESSAGES.FORM.INVALID_EMAIL)
      .max(100, "Email must be at most 100 characters")
      .required(ERROR_MESSAGES.FORM.REQUIRED),
  }),

  disableAllLogins: Yup.boolean().nullable(),
  officeHours: Yup.array().nullable(),
  passwordOption: Yup.string().nullable(),
  password: Yup.string().when("passwordOption", {
    is: "manual",
    then: (schema) =>
      schema
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    otherwise: (schema) => schema.nullable(),
  }),
  confirmPassword: Yup.string().when("passwordOption", {
    is: "manual",
    then: (schema) =>
      schema
        .required("Confirm Password is required")
        .oneOf([Yup.ref("password")], "Passwords must match"),
    otherwise: (schema) => schema.nullable(),
  }),
};

const EditAgencyForm: React.FC<EditAgencyFormProps> = ({
  isOpen,
  onClose,
  onSave,
  agencyData,
  countries,
}) => {
  const isAddMode = !agencyData;
  const validationSchema = isAddMode
    ? Yup.object({ ...baseValidation, ...addOnlyValidation })
    : Yup.object(baseValidation);
  const agencyId = agencyData?.id;
  const { data: user } = useSelector((state: RootState) => state?.user);

  const handleSubmit = async (values: any) => {
    if (isAddMode) {
      onSave(values);
    } else {
      if (!user?.userId || !agencyId || !user.companyId) {
        toast.error(STATIC_TEXTS.NOTES.MISSING_DATA);
        return;
      }
      const payload = buildEditPayload(values, user.companyId);
      try {
        await updateAgency(agencyId, payload, user.userId);
        onSave(values);
        toast.success("Agency updated successfully");
      } catch (err: any) {
        toast.error(err || "Failed to update agency");
      }
    }
  };

  const formik = useFormik<any>({
    initialValues: isAddMode
      ? {
          name: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          postalCode: "",
          website: "",
          timezone: "US/Central",
          prospectInfo: { firstName: "", lastName: "", email: "" },
          fax: "",
          organizationType: "Non-profit",
          about: "",
          mailingAddress: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
          },
          disableAllLogins: false,
          officeHours: [{ startTime: "", endTime: "", additionalDetails: "" }],
          passwordOption: "email",
          password: "",
          confirmPassword: "",
        }
      : {
          name: agencyData?.name || "",
          phone: agencyData?.phone || "",
          fax: agencyData?.fax || "",
          address: agencyData?.address || "",
          city: agencyData?.city || "",
          state: agencyData?.state || "",
          zip: agencyData?.postalCode || "",
          country: agencyData?.country || countries?.[0]?._id || " ",
          website: agencyData?.website || "",
          organizationType: agencyData?.organizationType || "",
          disableAllLogins: agencyData?.disableAllLogins || false,
          mailingAddress: agencyData?.mailingAddress || {
            street: "",
            city: "",
            state: "",
            postalCode: "",
          },
          aboutUs: agencyData?.about || "",
          officeHours: agencyData?.officeHours?.length
            ? agencyData.officeHours.map((h: OfficeHour) => ({
                ...h,
                startTime: convertTo24Hour(h.startTime),
                endTime: convertTo24Hour(h.endTime),
              }))
            : [{ startTime: "", endTime: "", additionalDetails: "" }],
        },
    validationSchema: validationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true,
  });

  const addOfficeHours = () => {
    formik.setFieldValue("officeHours", [
      ...formik.values.officeHours,
      { startTime: "", endTime: "", additionalDetails: "" },
    ]);
  };

  const removeOfficeHours = (indexToRemove: number) => {
    formik.setFieldValue(
      "officeHours",
      formik.values.officeHours.filter(
        (_: any, i: number) => i !== indexToRemove
      )
    );
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={agencyData ? "Edit Agency" : "Add Agency"}
      widthClass="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="submitStyle"
            label={agencyData ? "Save Changes" : "Add Agency"}
            type="submit"
            onClick={() => formik.handleSubmit()}
          />
          <Button
            onClick={() => {
              formik.resetForm();
              onClose();
            }}
            label="Cancel"
          />
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <div className="flex flex-col">
            <FormInput
              label="Agency Name"
              name="name"
              formik={formik}
              required
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <FormInput
              label="Phone"
              name="phone"
              formik={formik}
              required
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <FormInput
              label="Fax"
              name="fax"
              formik={formik}
              className="w-full"
            />
          </div>
          <div className="flex flex-col">
            <FormInput
              label="Address"
              name="address"
              formik={formik}
              required
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:col-span-2">
            <FormInput
              label="City"
              name="city"
              formik={formik}
              className="w-full"
            />
            <FormInput
              label="State"
              name="state"
              formik={formik}
              className="w-full"
            />
            <FormInput
              label="Zip"
              name="zip"
              formik={formik}
              className="w-full"
            />
          </div>
          <div className="flex flex-col md:col-span-2">
            <FormInput
              label="Website"
              name="website"
              formik={formik}
              className="w-full"
            />
          </div>
          <div className={`flex flex-col ${isAddMode ? "md:col-span-2" : ""}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type Of Organization <span className="text-primary">*</span>
            </label>
            <select
              name="organizationType"
              value={formik.values.organizationType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
              required
            >
              <option value="">----------</option>
              {ORGANIZATION_TYPES.map(
                (type: { value: string; label: string }) => (
                  <option value={type?.value}>{type?.label}</option>
                )
              )}
            </select>
            {formik.touched.organizationType &&
            formik.errors.organizationType ? (
              <div className="text-red-500 text-xs mt-1">
                {formik.errors.organizationType as string}
              </div>
            ) : null}
          </div>
          {!isAddMode && (
            <>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County <span className="text-primary">*</span>
                </label>
                <select
                  name="country"
                  value={formik.values.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                >
                  {countries?.map((option) => (
                    <option key={option._id} value={option._id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {formik.touched.country && formik.errors.country && (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.country as string}
                  </div>
                )}
              </div>
              {user?.propertyRole === "Network Administrator" && (
                <div className="md:col-span-2 flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="disableAllLogins"
                    name="disableAllLogins"
                    checked={formik.values.disableAllLogins}
                    onChange={formik.handleChange}
                    className="mr-2"
                  />
                  <label
                    htmlFor="disableAllLogins"
                    className="text-sm text-gray-700"
                  >
                    Disable all logins for this agency?
                  </label>
                </div>
              )}
            </>
          )}
        </div>
        {isAddMode ? (
          <>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Login Information
              </h3>
              <FormInput
                label="First Name"
                name="prospectInfo.firstName"
                formik={formik}
                required
                className="mb-2"
              />
              <FormInput
                label="Last Name"
                name="prospectInfo.lastName"
                formik={formik}
                required
                className="mb-2"
              />
              <FormInput
                label="Email"
                name="prospectInfo.email"
                formik={formik}
                required
                className="mb-2"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="passwordOptionEmail"
                    name="passwordOption"
                    value="email"
                    checked={formik.values.passwordOption === "email"}
                    onChange={formik.handleChange}
                    className="accent-blue-600"
                  />
                  <label
                    htmlFor="passwordOptionEmail"
                    className="text-gray-700"
                  >
                    Send Email With Password Setup Instructions
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="passwordOptionManual"
                    name="passwordOption"
                    value="manual"
                    checked={formik.values.passwordOption === "manual"}
                    onChange={formik.handleChange}
                    className="accent-blue-600"
                  />
                  <label
                    htmlFor="passwordOptionManual"
                    className="text-gray-700"
                  >
                    Enter A Password For The New Agent Now
                  </label>
                </div>
                {formik.values.passwordOption === "manual" && (
                  <div className="space-y-2 mt-2">
                    <FormInput
                      label="New Password"
                      name="password"
                      type="password"
                      formik={formik}
                      required
                    />
                    <FormInput
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      formik={formik}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Mailing Address
              </h3>
              <FormInput
                label="Address"
                name="mailingAddress.street"
                formik={formik}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <FormInput
                  label="City"
                  name="mailingAddress.city"
                  formik={formik}
                />
                <FormInput
                  label="State"
                  name="mailingAddress.state"
                  formik={formik}
                />
                <FormInput
                  label="Zip"
                  name="mailingAddress.postalCode"
                  formik={formik}
                />
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <FormTextarea
                label="About"
                name="aboutUs"
                formik={formik}
                rows={4}
              />
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Office Hours
              </h3>
              {formik.values.officeHours.map((_: OfficeHour, index: number) => {
                const rowError =
                  Array.isArray(formik.errors.officeHours) &&
                  typeof formik.errors.officeHours[index] === "string"
                    ? formik.errors.officeHours[index]
                    : undefined;
                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-3 items-center border-b border-gray-100 pb-3"
                  >
                    <div className="md:col-span-5 col-span-1">
                      <FormInput
                        label="Start Time"
                        name={`officeHours[${index}].startTime`}
                        type="time"
                        formik={formik}
                      />
                    </div>
                    <div className="md:col-span-2 text-xs col-span-1 flex items-center  justify-center">
                      <span className="text-gray-500 mb-2">to</span>
                    </div>
                    <div className="md:col-span-5 col-span-1">
                      <FormInput
                        label="End Time"
                        name={`officeHours[${index}].endTime`}
                        type="time"
                        formik={formik}
                      />
                    </div>

                    <div className="md:col-span-12 col-span-1">
                      <FormInput
                        label="Additional Details"
                        name={`officeHours[${index}].additionalDetails`}
                        formik={formik}
                      />
                      {rowError && (
                        <div className="text-red-500 text-xs mt-1 break-words">
                          {rowError}
                        </div>
                      )}
                    </div>
                    {index > 0 && (
                      <div className="md:col-span-12 col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeOfficeHours(index)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          <Icon
                            icon="mdi:minus-circle"
                            width="20"
                            height="20"
                          />
                          Remove Hours
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addOfficeHours}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 mt-2"
              >
                <Icon icon="mdi:plus-circle" width="20" height="20" />
                Add More Hours
              </button>
            </div>
          </>
        )}
      </form>
    </ModalWrapper>
  );
};

export default EditAgencyForm;
