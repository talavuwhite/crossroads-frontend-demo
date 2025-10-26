import React from "react";
import type {
  DynamicFieldValues,
  EventFormValues,
} from "@/components/modals/AddEventModal";
import type { FormikProps } from "formik";
import type { EventLocation, EventTypeData } from "@/types";
import type { UserData } from "@/types/user";
import type { Form } from "@/utils/formikHelpers";
import { LABELS } from "@/utils/textConstants";
import FileInput from "@/components/ui/FileInput";
import { ALLOWED_FILE_TYPES } from "@/utils/constants";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toZonedTime } from "date-fns-tz";

interface Props {
  formik: FormikProps<EventFormValues | DynamicFieldValues>;
  errorMsg: (field: string, formik: Form) => React.ReactNode;
  locationsData: EventLocation[];
  eventTypes: EventTypeData[];
  agents: UserData[];
}

const EventInfoForm: React.FC<Props> = ({
  formik,
  errorMsg,
  locationsData,
  eventTypes,
  agents,
}) => {
  const { values, handleChange, handleBlur } = formik;
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="space-y-4">
      {/* Location */}
      <div className="">
        <label className="font-semibold block mb-2">
          {LABELS.FORM.LOCATION} <span className="text-red-500">*</span>
        </label>
        <select
          name="location"
          value={typeof values.location === "string" ? values.location : ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full p-2 border-2 border-gray-300 rounded focus:border-purple-500"
        >
          <option value="">------</option>
          {locationsData.map((option) => (
            <option key={option._id} value={option._id}>
              {option.name}
            </option>
          ))}
        </select>
        {errorMsg("location", formik)}
      </div>

      {/* Event Type */}
      <div className="">
        <label className="font-semibold block mb-2">
          {LABELS.FORM.EVENT_TYPE} <span className="text-red-500">*</span>
        </label>
        <select
          name="eventType"
          value={typeof values.eventType === "string" ? values.eventType : ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full p-2 border-2 border-gray-300 rounded focus:border-purple-500"
        >
          <option value="">------</option>
          {eventTypes.map((option) => (
            <option key={option._id} value={option._id}>
              {option.name}
            </option>
          ))}
        </select>
        {errorMsg("eventType", formik)}
      </div>

      {/* Event Title */}
      <div className="">
        <label className="font-semibold block mb-2">
          {LABELS.FORM.EVENT_TITLE} <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          value={typeof values.title === "string" ? values.title : ""}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
          placeholder="Enter event title"
        />
        {errorMsg("title", formik)}
      </div>

      {/* Event Description */}
      <div className="">
        <label className="font-semibold block mb-2">
          {LABELS.FORM.EVENT_DESC}
        </label>
        <textarea
          name="description"
          value={
            typeof values.description === "string" ? values.description : ""
          }
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
          placeholder="Enter event description"
          style={{ height: "120px" }}
        />
        {errorMsg("description", formik)}
      </div>

      {/* DateTime */}
      <div className="">
        <label className="font-semibold block mb-2">
          {LABELS.FORM.DATE_TIME} <span className="text-red-500">*</span>
        </label>
        <DatePicker
          name="dateTime"
          selected={
            values.dateTime instanceof Date
              ? (() => {
                  try {
                    const date = toZonedTime(values.dateTime, userTimeZone);
                    return date instanceof Date && !isNaN(date.getTime())
                      ? date
                      : null;
                  } catch (error) {
                    console.warn(
                      "Error parsing dateTime:",
                      values.dateTime,
                      error
                    );
                    return null;
                  }
                })()
              : null
          }
          onChange={(date: Date | null) => {
            formik.setFieldValue("dateTime", date);
            formik.setFieldTouched("dateTime", true);
          }}
          onBlur={handleBlur}
          dateFormat="MM/dd/yyyy h:mm aa"
          showTimeInput
          placeholderText="Enter event date and time"
          className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
          wrapperClassName="w-full"
          minDate={new Date()}
          showYearDropdown
          dropdownMode="select"
          popperProps={{
            strategy: "absolute",
            placement: "bottom-start",
          }}
        />
        {errorMsg("dateTime", formik)}
      </div>

      {/* Facilitator */}
      <div className="">
        <label className="font-semibold block mb-2">
          {LABELS.FORM.FACILITATOR} <span className="text-red-500">*</span>
        </label>
        <select
          name="facilitator"
          value={
            typeof values.facilitator === "string" ? values.facilitator : ""
          }
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
        >
          {Object.entries(
            agents.reduce<Record<string, any>>((acc, user) => {
              const companyName =
                user.company?.locationName || "Unknown Company";
              if (!acc[companyName]) acc[companyName] = [];
              acc[companyName].push(user);
              return acc;
            }, {})
          ).map(([company, users]) => (
            <optgroup key={company} label={company} className="text-purple">
              {users.map((option: any) => (
                <option
                  key={option._id}
                  value={option._id}
                  className="text-black"
                >
                  {option.firstName} {option.lastName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errorMsg("facilitator", formik)}
      </div>

      {/* File Upload */}
      <div className="">
        <FileInput
          label={LABELS.FORM.ATTACH_FILE}
          allowedTypes={ALLOWED_FILE_TYPES}
          name="attachment"
          formik={formik}
          showPreview={false}
        />
      </div>
    </div>
  );
};

export default EventInfoForm;
