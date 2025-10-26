import React from "react";
import type {
  DynamicFieldValues,
  EventFormValues,
} from "@/components/modals/AddEventModal";
import type { FormikProps } from "formik";
import type { EventActivity } from "@/types";

interface Props {
  formik: FormikProps<EventFormValues | DynamicFieldValues>;
  activities: EventActivity[];
}

const EventActivitiesForm: React.FC<Props> = ({ formik, activities }) => {
  const { values, handleBlur, setFieldValue } = formik;

  return (
    <div className="space-y-4">
      {activities.map((field) => {
        const key = field._id;

        return (
          <div key={field._id} className="mb-4">
            {field.type === "checkbox" ? (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name={key}
                  checked={Boolean(values[key])}
                  onChange={(e) => {
                    setFieldValue(key, e.target.checked);
                  }}
                  onBlur={handleBlur}
                  className="w-4 h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple"
                />
                <span className="font-semibold">{field.name}</span>
              </label>
            ) : (
              <>
                <label htmlFor={key} className="font-semibold block mb-2">
                  {field.name}
                </label>
                <input
                  type="number"
                  name={key}
                  min={0}
                  step="any"
                  value={values[key] as number}
                  placeholder={field.type === "decimal_number" ? "0.00" : "0"}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = parseFloat(val);
                    if (val === "") {
                      setFieldValue(key, "");
                      return;
                    }
                    if (num < 0) return;
                    setFieldValue(key, val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") {
                      e.preventDefault();
                    }
                    if (field.type === "whole_number" && e.key === ".") {
                      e.preventDefault();
                    }
                  }}
                  onBlur={handleBlur}
                  className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EventActivitiesForm;
