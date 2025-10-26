import React, { memo, useEffect, useRef, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import type { AddEventModalProps, Country, EventLocation } from "@/types";
import * as Yup from "yup";
import { FormikProvider, useFormik } from "formik";
import type { BaseAgency } from "@/types/agency";
import { errorMsg } from "@/utils/formikHelpers";

type OnSubmitType = ((id: string, data: any) => void) | ((data: any) => void);

interface LocationModalProps extends AddEventModalProps {
  locationData?: EventLocation | null;
  countries: Country[];
  agencies: BaseAgency[];
  onSubmit: OnSubmitType;
}

export interface LocationFormValues {
  location: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
  agency: string;
}

const validationSchema = Yup.object({
  location: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  zip: Yup.string(),
  country: Yup.string(),
  contactName: Yup.string(),
  contactPhone: Yup.string(),
  contactEmail: Yup.string().email(ERROR_MESSAGES.FORM.INVALID_EMAIL),
  description: Yup.string(),
  agency: Yup.string(),
});

const AddLocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  locationData,
  countries,
  agencies,
  onSubmit,
}) => {
  const [phonePart1, setPhonePart1] = useState("");
  const [phonePart2, setPhonePart2] = useState("");
  const [phonePart3, setPhonePart3] = useState("");

  const phoneRef2 = useRef<HTMLInputElement>(null);
  const phoneRef3 = useRef<HTMLInputElement>(null);

  const initialValues: LocationFormValues = {
    location: locationData?.name || "",
    address: locationData?.address || "",
    city: locationData?.city || "",
    state: locationData?.state || "",
    zip: locationData?.zipCode || "",
    country:
      (typeof locationData?.country === "object"
        ? locationData.country?._id
        : countries.find((c) => c._id === locationData?.country)?._id) || "",
    contactName: locationData?.contactName || "",
    contactPhone: locationData?.contactPhone || "",
    contactEmail: locationData?.contactEmail || "",
    description: locationData?.description || "",
    agency: locationData?.dedicateToCompany || "",
  };

  const formik = useFormik<LocationFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const formData = {
        name: values.location,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zip,
        ...(values.country && { country: values.country }),
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        contactEmail: values.contactEmail,
        description: values.description,
        ...(values.agency && { dedicateToCompany: values.agency }),
      };
      if (locationData?._id) {
        await (onSubmit as (id: string, data: any) => void)(
          locationData?._id,
          formData
        );
      } else {
        await (onSubmit as (data: any) => void)(formData);
      }
    },
  });

  useEffect(() => {
    formik.setFieldValue(
      "contactPhone",
      `${phonePart1}-${phonePart2}-${phonePart3}`
    );
  }, [phonePart1, phonePart2, phonePart3]);

  useEffect(() => {
    if (locationData?.contactPhone) {
      const phoneParts = locationData.contactPhone.split("-");
      setPhonePart1(phoneParts[0] || "");
      setPhonePart2(phoneParts[1] || "");
      setPhonePart3(phoneParts[2] || "");
    } else {
      setPhonePart1("");
      setPhonePart2("");
      setPhonePart3("");
    }
  }, [locationData?.contactPhone]);

  const autoFocusNext = (
    e: React.ChangeEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null>,
    maxLength: number
  ) => {
    const value = e.target.value;
    if (value.length >= maxLength && nextRef.current) {
      nextRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formik.handleSubmit();
  };

  const footerContent = (
    <>
      <Button
        variant="submitStyle"
        label={locationData ? "Save Changes" : STATIC_TEXTS.COMMON.ADD}
        type="submit"
        form="add-location-form"
      />
      <Button
        onClick={() => {
          formik.resetForm();
          onClose();
        }}
        label={STATIC_TEXTS.COMMON.CANCEL}
      />
    </>
  );

  const { values, handleChange, handleBlur } = formik;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      title={
        locationData
          ? `${STATIC_TEXTS.COMMON.EDIT} Location`
          : `${STATIC_TEXTS.COMMON.ADD} Location`
      }
      footer={footerContent}
      widthClass="max-w-xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <FormikProvider value={formik}>
            <form
              id="add-location-form"
              onSubmit={handleSubmit}
              autoComplete="off"
              className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto"
            >
              <div className="bg-purpleLight rounded-lg p-2 md:p-6">
                <div className="space-y-4">
                  {/* location name */}
                  <div className="">
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.LOCATION_NAME}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="location"
                      type="text"
                      value={values.location}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                    />
                    {errorMsg("location", formik)}
                  </div>
                  {/* address */}
                  <div className="">
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.ADDRESS}
                    </label>
                    <input
                      name="address"
                      type="text"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                    />
                    {errorMsg("address", formik)}
                  </div>
                  {/* city, state, zip */}
                  <div className="flex items-center gap-3">
                    <div className="grow">
                      <label className="font-semibold block mb-1">
                        {LABELS.FORM.CITY}
                      </label>
                      <input
                        name="city"
                        type="text"
                        value={values.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                      />
                      {errorMsg("city", formik)}
                    </div>
                    <div className="max-w-12">
                      <label className="font-semibold block mb-1">
                        {LABELS.FORM.STATE}
                      </label>
                      <input
                        name="state"
                        type="text"
                        value={values.state}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={2}
                        className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500 uppercase"
                      />
                      {errorMsg("state", formik)}
                    </div>
                    <div className="max-w-20">
                      <label className="font-semibold block mb-1">
                        {LABELS.FORM.ZIP}
                      </label>
                      <input
                        name="zip"
                        type="text"
                        value={values.zip}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                      />
                      {errorMsg("zip", formik)}
                    </div>
                  </div>
                  {/* country */}
                  <div className="">
                    <label className="font-semibold block mb-1">County</label>
                    {countries && (
                      <div>
                        <select
                          name="country"
                          className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                          value={values.country}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          <option value="">-----</option>
                          {countries.map((option) => (
                            <option key={option._id} value={option._id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                        {errorMsg("country", formik)}
                      </div>
                    )}
                  </div>
                  {/* contact name */}
                  <div className="">
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.CONTACT_NAME}
                    </label>
                    <input
                      name="contactName"
                      type="text"
                      value={values.contactName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                    />
                    {errorMsg("contactName", formik)}
                  </div>
                  {/* contact number */}
                  <div>
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.CONTACT_PHONE}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={3}
                        value={phonePart1}
                        onChange={(e) => {
                          setPhonePart1(e.target.value.replace(/\D/, ""));
                          autoFocusNext(e, phoneRef2, 3);
                        }}
                        className="max-w-12 w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                      />
                      <span>-</span>
                      <input
                        type="text"
                        maxLength={3}
                        value={phonePart2}
                        ref={phoneRef2}
                        onChange={(e) => {
                          setPhonePart2(e.target.value.replace(/\D/, ""));
                          autoFocusNext(e, phoneRef3, 3);
                        }}
                        className="max-w-12 w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                      />
                      <span>-</span>
                      <input
                        type="text"
                        maxLength={4}
                        value={phonePart3}
                        ref={phoneRef3}
                        onChange={(e) => {
                          setPhonePart3(e.target.value.replace(/\D/, ""));
                        }}
                        className="max-w-14 w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    {errorMsg("contactPhone", formik)}
                  </div>
                  {/* contact email */}
                  <div className="">
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.CONTACT_EMAIL}
                    </label>
                    <input
                      name="contactEmail"
                      type="text"
                      value={values.contactEmail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                    />
                    {errorMsg("contactEmail", formik)}
                  </div>
                  {/* description */}
                  <div className="">
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.DESCRIPTION}
                    </label>
                    <textarea
                      rows={5}
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                    />
                    {errorMsg("description", formik)}
                  </div>
                  {/* agency select */}
                  <div className="">
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.WHICH_AGENCY}
                    </label>

                    <div>
                      <select
                        name="agency"
                        className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                        value={values.agency}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <option value="">{LABELS.FORM.NO_RESTICTIONS}</option>
                        {agencies.map((option) => (
                          <option key={option.id} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      {errorMsg("agency", formik)}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </FormikProvider>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default memo(AddLocationModal);
