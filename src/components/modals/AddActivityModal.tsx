import React, { memo } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import type { AddEventModalProps, EventActivity } from "@/types";
import * as Yup from "yup";
import { FormikProvider, useFormik } from "formik";
import { ACIVITY_TYPE } from "@/utils/constants";
import { errorMsg } from "@/utils/formikHelpers";

type OnSubmitType = ((id: string, data: any) => void) | ((data: any) => void);

interface ActivityModalProps extends AddEventModalProps {
  onSubmit: OnSubmitType;
  activityData?: EventActivity | null;
}

export interface LocationFormValues {
  name: string;
  type: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  type: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
});

const AddActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  activityData,
  onSubmit,
}) => {
  const initialValues: LocationFormValues = {
    name: activityData?.name || "",
    type: activityData?.type || ACIVITY_TYPE[0].value || "",
  };

  const formik = useFormik<LocationFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (activityData?._id) {
        await (onSubmit as (id: string, data: any) => void)(
          activityData?._id,
          values
        );
      } else {
        await (onSubmit as (data: any) => void)(values);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formik.handleSubmit();
  };

  const footerContent = (
    <>
      <Button
        variant="submitStyle"
        label={activityData ? "Save Changes" : STATIC_TEXTS.COMMON.ADD}
        type="submit"
        form="add-activity-form"
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
        activityData
          ? `${STATIC_TEXTS.COMMON.EDIT} Activity`
          : `${STATIC_TEXTS.COMMON.ADD} Activity`
      }
      footer={footerContent}
      widthClass="max-w-xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <FormikProvider value={formik}>
            <form
              id="add-activity-form"
              onSubmit={handleSubmit}
              autoComplete="off"
              className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto"
            >
              <div className="bg-purpleLight rounded-lg p-2 md:p-6">
                <div className="space-y-4">
                  {/* activity name */}
                  <div className="">
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.NAME} <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                    />
                    {errorMsg("name", formik)}
                  </div>

                  {/* activity type */}
                  <div className="">
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.TYPE} <span className="text-red-500">*</span>
                    </label>
                    {ACIVITY_TYPE && (
                      <div>
                        <select
                          name="type"
                          className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                          value={values.type}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          {ACIVITY_TYPE.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {errorMsg("type", formik)}
                      </div>
                    )}
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

export default memo(AddActivityModal);
