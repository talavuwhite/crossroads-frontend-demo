import React from "react";
import type { FormikProps } from "formik";
import type { AddCaseFormValues } from "@/types/case";

interface Props {
  formik: FormikProps<AddCaseFormValues>;
  errorMsg: (field: keyof AddCaseFormValues | string) => React.ReactNode;
}

const CaseDemographicsForm: React.FC<Props> = ({ formik }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="font-semibold block mb-3">Gender</label>
        <div className="grid grid-cols-1 md:grid-cols-2  gap-3">
          {[
            "Woman (Girl, or Child)",
            "Man (Boy, or Child)",
            "Culturally Specific Identity (e.g., Two-Spirit)",
            "Different Identity",
            "Non-binary",
            "Transgender",
            "Questioning",
            "Client Doesn't Know",
            "Client Prefers Not To Answer",
            "Data Not Collected",
          ].map((g) => (
            <label
              key={g}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
            >
              <input
                type="checkbox"
                value={g}
                checked={formik.values.gender.includes(g)}
                onChange={(e) => {
                  const newValue = e.target.checked
                    ? [...formik.values.gender, g]
                    : formik.values.gender.filter((v) => v !== g);
                  formik.setFieldValue("gender", newValue);
                }}
                onBlur={formik.handleBlur}
                className="w-4 h-4 text-purple"
              />
              <span className="text-sm">{g}</span>
            </label>
          ))}
        </div>
        {formik.touched.gender && formik.errors.gender && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.gender as string}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="font-semibold block mb-3">Other</label>
        <div className="grid grid-cols-1 md:grid-cols-2  gap-3">
          {["Disabled", "Homeless", "At Risk or Being Homeless"].map((o) => (
            <label
              key={o}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
            >
              <input
                type="checkbox"
                value={o}
                checked={formik.values.other.includes(o)}
                onChange={(e) => {
                  const newValue = e.target.checked
                    ? [...formik.values.other, o]
                    : formik.values.other.filter((v) => v !== o);
                  formik.setFieldValue("other", newValue);
                }}
                onBlur={formik.handleBlur}
                className="w-4 h-4 text-purple"
              />
              <span className="text-sm">{o}</span>
            </label>
          ))}
        </div>
        {formik.touched.other && formik.errors.other && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.other as string}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="font-semibold block mb-3">Race And Ethnicity</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "American Indian/Alaska Native/Or Indigenous",
            "Asian or Asian American",
            "Black/African American/Or African",
            "Native Hawaiian Or Pacific Islander",
            "White",
            "Hispanic/Latinx",
            "Middle Eastern Or North African",
            "Client Doesn't Know",
            "Client Prefers Not To Answer",
            "Data Not Collected",
            "Other",
          ].map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
            >
              <input
                type="checkbox"
                value={r}
                checked={formik.values.race.includes(r)}
                onChange={(e) => {
                  const newValue = e.target.checked
                    ? [...formik.values.race, r]
                    : formik.values.race.filter((v) => v !== r);
                  formik.setFieldValue("race", newValue);
                }}
                onBlur={formik.handleBlur}
                className="w-4 h-4 text-purple"
              />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>
        {formik.touched.race && formik.errors.race && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.race as string}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="font-semibold block mb-3">Education</label>
        <div className="flex flex-col md:flex-row gap-2">
          {["College", "Highschool-Incomplete", "Highschool/GED"].map((e) => (
            <label
              key={e}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
            >
              <input
                type="radio"
                value={e}
                checked={formik.values.education === e}
                onChange={() => formik.setFieldValue("education", e)}
                onBlur={formik.handleBlur}
                className="w-4 h-4 text-purple"
              />
              <span className="text-sm">{e}</span>
            </label>
          ))}
        </div>
        {formik.touched.education && formik.errors.education && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.education as string}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="font-semibold block mb-3">Employment</label>
        <div className="flex flex-col md:flex-row gap-2">
          {["Full Time", "Part Time", "Unemployed"].map((e) => (
            <label
              key={e}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
            >
              <input
                type="radio"
                value={e}
                checked={formik.values.employment === e}
                onChange={() => formik.setFieldValue("employment", e)}
                onBlur={formik.handleBlur}
                className="w-4 h-4 text-purple"
              />
              <span className="text-sm">{e}</span>
            </label>
          ))}
        </div>
        {formik.touched.employment && formik.errors.employment && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.employment as string}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="font-semibold block mb-3">Marital Status</label>
        <div className="flex flex-col md:flex-row gap-2">
          {["Divorced", "Married", "Single"].map((m) => (
            <label
              key={m}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
            >
              <input
                type="radio"
                value={m}
                checked={formik.values.maritalStatus === m}
                onChange={() => formik.setFieldValue("maritalStatus", m)}
                onBlur={formik.handleBlur}
                className="w-4 h-4 text-purple"
              />
              <span className="text-sm">{m}</span>
            </label>
          ))}
        </div>
        {formik.touched.maritalStatus && formik.errors.maritalStatus && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.maritalStatus as string}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="font-semibold block mb-3">Government Benefits</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            "Receives Food Stamps",
            "Receives Medicaid",
            "Receives Medicare",
            "Receives Social Security",
            "Receives Veteran Benefits",
            "Receives WIC",
          ].map((b) => (
            <label
              key={b}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
            >
              <input
                type="checkbox"
                value={b}
                checked={formik.values.benefits.includes(b)}
                onChange={(e) => {
                  const newValue = e.target.checked
                    ? [...formik.values.benefits, b]
                    : formik.values.benefits.filter((v) => v !== b);
                  formik.setFieldValue("benefits", newValue);
                }}
                onBlur={formik.handleBlur}
                className="w-4 h-4 text-purple"
              />
              <span className="text-sm">{b}</span>
            </label>
          ))}
        </div>
        {formik.touched.benefits && formik.errors.benefits && (
          <div className="text-red-500 text-sm mt-1">
            {formik.errors.benefits as string}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDemographicsForm;
