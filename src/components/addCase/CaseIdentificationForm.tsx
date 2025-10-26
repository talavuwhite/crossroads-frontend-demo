import React from "react";
import type { FormikProps } from "formik";
import { FormikProvider, FieldArray } from "formik";
import type {
  AddCaseFormValues,
  CaseType,
  IdNumber,
  PhoneNumber,
} from "@/types/case";
import { Select } from "@/components/ui/Select";
import {
  countyOptions,
  dataQualityOptions,
  nameDataQualityOptions,
  ssnDataQualityOptions,
  visibleTo,
} from "@/utils/constants";
import { LABELS } from "@/utils/textConstants";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from "date-fns";
import "@/styles/datepicker-fixes.css";

interface Props {
  formik: FormikProps<AddCaseFormValues>;
  caseData?: CaseType | null;
  inputClass: (field: keyof AddCaseFormValues | string) => string;
  arrayInputClass: (field: keyof AddCaseFormValues | string) => string;
  errorMsg: (field: keyof AddCaseFormValues | string) => React.ReactNode;
}

const CaseIdentificationForm: React.FC<Props> = ({
  formik,
  caseData,
  inputClass,
  arrayInputClass,
  errorMsg,
}) => {
  const isSameAgencyOrSubAgency = caseData?.isSameAgencyOrSubAgency;

  // Helper function to parse MM-dd-yyyy string to Date object
  const parseDobString = (dobString: string) => {
    if (!dobString || typeof dobString !== "string") return null;

    try {
      // Try parsing MM-dd-yyyy format
      const date = parse(dobString, "MM-dd-yyyy", new Date());
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date;
      }

      // Try parsing yyyy-MM-dd format (fallback)
      const date2 = parse(dobString, "yyyy-MM-dd", new Date());
      if (date2 instanceof Date && !isNaN(date2.getTime())) {
        return date2;
      }

      return null;
    } catch (error) {
      console.warn("Error parsing DOB string:", dobString, error);
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <label className="font-semibold">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            className={inputClass("firstName")}
            {...formik.getFieldProps("firstName")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("firstName")}
        </div>
        <div className="md:col-span-1">
          <label className="font-semibold">Middle Name</label>
          <input
            className={inputClass("middleName")}
            {...formik.getFieldProps("middleName")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("middleName")}
        </div>
        <div className="md:col-span-1">
          <label className="font-semibold">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            className={inputClass("lastName")}
            {...formik.getFieldProps("lastName")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("lastName")}
        </div>
        <div className="md:col-span-1">
          <label className="font-semibold">Suffix</label>
          <input
            className={inputClass("suffix")}
            {...formik.getFieldProps("suffix")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("suffix")}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold">Maiden Name</label>
          <input
            className={inputClass("maidenName")}
            {...formik.getFieldProps("maidenName")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("maidenName")}
        </div>
        <div>
          <label className="font-semibold">Nickname</label>
          <input
            className={inputClass("nickname")}
            {...formik.getFieldProps("nickname")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("nickname")}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="font-semibold">Date Of Birth</label>
          <DatePicker
            selected={parseDobString(formik.values.dob)}
            onChange={(date) => {
              formik.setFieldValue(
                "dob",
                date ? format(date, "MM-dd-yyyy") : ""
              );
            }}
            onBlur={formik.handleBlur}
            dateFormat="MM-dd-yyyy"
            className={inputClass("dob")}
            placeholderText="MM-DD-YYYY"
            maxDate={new Date()}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            popperClassName="datepicker-modal-fix"
            popperPlacement="bottom-start"
          />
          {errorMsg("dob")}
        </div>
        <div>
          <label className="font-semibold">Social Security Number</label>
          <input
            className={inputClass("ssn")}
            placeholder="XXX-XX-XXXX"
            {...formik.getFieldProps("ssn")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("ssn")}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="headOfHousehold"
          checked={formik.values.headOfHousehold}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
        <label className="font-semibold">Head Of Household</label>
        {errorMsg("headOfHousehold")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          name="dobDataQuality"
          label="DOB Data Quality"
          options={dataQualityOptions}
          formik={formik}
          inputClass={inputClass}
          errorMsg={errorMsg}
        />
        <Select
          name="nameDataQuality"
          label="Name Data Quality"
          options={nameDataQualityOptions}
          formik={formik}
          inputClass={inputClass}
          errorMsg={errorMsg}
        />
        <div>
          <label className="font-semibold">Children</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="children"
                value="yes"
                checked={formik.values.children === "yes"}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />{" "}
              Yes
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="children"
                value="no"
                checked={formik.values.children === "no"}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />{" "}
              No
            </label>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          name="ssnDataQuality"
          label="SSN Data Quality"
          options={ssnDataQualityOptions}
          formik={formik}
          inputClass={inputClass}
          errorMsg={errorMsg}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold">Street Address</label>
          <input
            className={inputClass("streetAddress")}
            {...formik.getFieldProps("streetAddress")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("streetAddress")}
          <input
            className={inputClass("streetApt")}
            placeholder="Apt #"
            {...formik.getFieldProps("streetApt")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("streetApt")}
          <div className="flex gap-2 mt-1">
            <div className="flex-1">
              <input
                className={inputClass("streetCity")}
                placeholder="City"
                {...formik.getFieldProps("streetCity")}
                onBlur={formik.handleBlur}
              />
              {errorMsg("streetCity")}
            </div>
            <div className="flex-1">
              <input
                className={inputClass("streetState")}
                placeholder="State"
                {...formik.getFieldProps("streetState")}
                onBlur={formik.handleBlur}
              />
              {errorMsg("streetState")}
            </div>
            <div className="flex-1">
              <input
                className={inputClass("streetZip")}
                placeholder="Zip"
                {...formik.getFieldProps("streetZip")}
                onBlur={formik.handleBlur}
              />
              {errorMsg("streetZip")}
            </div>
          </div>
          <select
            className={inputClass("streetCounty")}
            {...formik.getFieldProps("streetCounty")}
            onBlur={formik.handleBlur}
          >
            {countyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errorMsg("streetCounty")}
        </div>
        <div>
          <label className="font-semibold">Mailing Address</label>
          <input
            className={inputClass("mailingAddress")}
            {...formik.getFieldProps("mailingAddress")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("mailingAddress")}
          <input
            className={inputClass("mailingApt")}
            placeholder="Apt #"
            {...formik.getFieldProps("mailingApt")}
            onBlur={formik.handleBlur}
          />
          {errorMsg("mailingApt")}
          <div className="flex gap-2 mt-1">
            <div className="flex-1">
              <input
                className={inputClass("mailingCity")}
                placeholder="City"
                {...formik.getFieldProps("mailingCity")}
                onBlur={formik.handleBlur}
              />
              {errorMsg("mailingCity")}
            </div>
            <div className="flex-1">
              <input
                className={inputClass("mailingState")}
                placeholder="State"
                {...formik.getFieldProps("mailingState")}
                onBlur={formik.handleBlur}
              />
              {errorMsg("mailingState")}
            </div>
            <div className="flex-1">
              <input
                className={inputClass("mailingZip")}
                placeholder="Zip"
                {...formik.getFieldProps("mailingZip")}
                onBlur={formik.handleBlur}
              />
              {errorMsg("mailingZip")}
            </div>
          </div>
          <button
            type="button"
            className="text-xs text-purple mt-1 underline"
            onClick={() => {
              formik.setFieldValue(
                "mailingAddress",
                formik.values.streetAddress
              );
              formik.setFieldValue("mailingApt", formik.values.streetApt);
              formik.setFieldValue("mailingCity", formik.values.streetCity);
              formik.setFieldValue("mailingState", formik.values.streetState);
              formik.setFieldValue("mailingZip", formik.values.streetZip);
            }}
          >
            COPY FROM STREET ADDRESS
          </button>
        </div>
      </div>
      <FormikProvider value={formik}>
        <FieldArray name="phoneNumbers">
          {({ push, remove }) => (
            <div>
              <label className="font-semibold">Phone Numbers</label>
              {formik.values.phoneNumbers.map(
                (phone: PhoneNumber, idx: number) => (
                  <div key={idx} className="flex gap-2 items-start mt-2">
                    <div className="flex-1">
                      <input
                        name={`phoneNumbers[${idx}].description`}
                        className={arrayInputClass(
                          `phoneNumbers[${idx}].description`
                        )}
                        placeholder="Description"
                        value={phone.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {errorMsg(`phoneNumbers[${idx}].description`)}
                    </div>
                    <div className="flex-1">
                      <input
                        name={`phoneNumbers[${idx}].number`}
                        className={arrayInputClass(
                          `phoneNumbers[${idx}].number`
                        )}
                        placeholder="Number"
                        value={phone.number}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {errorMsg(`phoneNumbers[${idx}].number`)}
                    </div>
                    <div className="w-20">
                      <input
                        name={`phoneNumbers[${idx}].ext`}
                        className={arrayInputClass(`phoneNumbers[${idx}].ext`)}
                        placeholder="Ext."
                        value={phone.ext}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {errorMsg(`phoneNumbers[${idx}].ext`)}
                    </div>
                    {idx === 0 ? (
                      <button
                        type="button"
                        className="text-green-600 font-bold text-xl"
                        onClick={() =>
                          push({ description: "", number: "", ext: "" })
                        }
                      >
                        +
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-red-600 font-bold text-xl"
                        onClick={() => remove(idx)}
                      >
                        -
                      </button>
                    )}
                  </div>
                )
              )}
              {typeof formik.errors.phoneNumbers === "string" &&
                formik.touched.phoneNumbers && (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.phoneNumbers}
                  </div>
                )}
            </div>
          )}
        </FieldArray>
        <FieldArray name="idNumbers">
          {({ push, remove }) => (
            <div className="mt-4">
              <label className="font-semibold">Identification Numbers</label>
              {formik.values.idNumbers.map((id: IdNumber, idx: number) => (
                <div key={idx} className="flex gap-2 items-start mt-2">
                  <div className="flex-1">
                    <input
                      name={`idNumbers[${idx}].description`}
                      className={arrayInputClass(
                        `idNumbers[${idx}].description`
                      )}
                      placeholder="Description"
                      value={id.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {errorMsg(`idNumbers[${idx}].description`)}
                  </div>
                  <div className="flex-1">
                    <input
                      name={`idNumbers[${idx}].number`}
                      className={arrayInputClass(`idNumbers[${idx}].number`)}
                      placeholder="Number"
                      value={id.number}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {errorMsg(`idNumbers[${idx}].number`)}
                  </div>
                  {idx === 0 ? (
                    <button
                      type="button"
                      className="text-green-600 font-bold text-xl"
                      onClick={() => push({ description: "", number: "" })}
                    >
                      +
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-red-600 font-bold text-xl"
                      onClick={() => remove(idx)}
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
              {typeof formik.errors.idNumbers === "string" &&
                formik.touched.idNumbers && (
                  <div className="text-red-500 text-xs mt-1">
                    {formik.errors.idNumbers}
                  </div>
                )}
            </div>
          )}
        </FieldArray>
      </FormikProvider>
      <div className="mt-4">
        <label className="font-semibold">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          className={inputClass("email")}
          {...formik.getFieldProps("email")}
          onBlur={formik.handleBlur}
        />
        {errorMsg("email")}
      </div>
      <div className="mb-4">
        <label className="text-sm font-medium text-red-700 block bg-red-100 px-2 py-1 rounded-t-md">
          {LABELS.FORM.VISIBLE_TO}
        </label>
        <select
          name="visibleTo"
          value={formik.values.visibleTo}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full border border-red-300 p-2 rounded-b-md bg-red-50 ${
            formik.touched.visibleTo && formik.errors.visibleTo
              ? "border-red-500"
              : ""
          }`}
        >
          {visibleTo.map((option, index) => {
            if (
              isSameAgencyOrSubAgency &&
              !isSameAgencyOrSubAgency &&
              option !== formik.values.visibleTo
            )
              return null;
            return (
              <option key={index} value={option}>
                {option === "Agency Only" ? "My Agency" : option}
              </option>
            );
          })}
        </select>
        {formik.touched.visibleTo && formik.errors.visibleTo ? (
          <div className="text-red-500 text-xs mt-1">
            {formik.errors.visibleTo}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CaseIdentificationForm;
