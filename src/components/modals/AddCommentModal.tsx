import type { AddEventModalProps } from "@/types";
import { errorMsg } from "@/utils/formikHelpers";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "@ui/Button";
import ModalWrapper from "@ui/ModalWrapper";
import { FormikProvider, useFormik } from "formik";
import React, { memo } from "react";
import { Link } from "react-router-dom";
import * as Yup from "yup";

// → Types for comment data
interface ICommentData {
  _id: string;
  text: string;
  file?: string | null;
}

// → Props interface for the modal
interface IAddCommentModalProps extends AddEventModalProps {
  commentData?: ICommentData | null;
  onSubmit: ((data: ICommentFormValues) => Promise<void>) | ((commentId: string, data: ICommentFormValues) => Promise<void>);
}

// → Form values interface
interface ICommentFormValues {
  text: string;
  file: File | string | null;
}

// → Validation schema
const validationSchema = Yup.object({
  text: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
});

const AddCommentModal: React.FC<IAddCommentModalProps> = ({
  isOpen,
  onClose,
  commentData,
  onSubmit,
}) => {
  // → Initialize form values with existing comment data or empty values
  const initialValues: ICommentFormValues = {
    text: commentData?.text || "",
    file: commentData?.file || null,
  };

  // → Formik configuration
  const formik = useFormik<ICommentFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (commentData?._id) {
        // → Editing existing comment
        await (onSubmit as unknown as (commentId: string, data: ICommentFormValues) => Promise<void>)(
          commentData?._id,
          values
        );
      } else {
        // → Adding new comment
        await (onSubmit as unknown as (data: ICommentFormValues) => Promise<void>)(values);
      }
    },
  });

  // → Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formik.handleSubmit();
  };

  // → Footer buttons
  const footerContent = (
    <>
      <Button
        icon={commentData ? "mdi:content-save" : "mdi:plus-circle"}
        variant="submitStyle"
        label={
          commentData
            ? STATIC_TEXTS.COMMON.SAVE_CHANGES
            : STATIC_TEXTS.COMMON.ADD_COMMENT
        }
        type="submit"
        form="add-comment-form"
      />
      <Button
        onClick={() => {
          formik.resetForm();
          onClose?.();
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
        onClose?.();
      }}
      title={
        commentData
          ? STATIC_TEXTS.COMMON.EDIT_COMMENT
          : STATIC_TEXTS.COMMON.ADD_COMMENT
      }
      footer={footerContent}
      widthClass="max-w-xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <FormikProvider value={formik}>
            <form
              id="add-comment-form"
              onSubmit={handleSubmit}
              autoComplete="off"
              className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto"
            >
              <div className="bg-purpleLight rounded-lg p-2 md:p-6">
                <div className="space-y-4">
                  {/* → Comment text field */}
                  <div>
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.COMMENT} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      name="text"
                      value={values?.text || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                      placeholder="Enter your comment..."
                    />
                    {errorMsg("text", formik)}
                  </div>

                  {/* → File attachment field */}
                  <div>
                    <label className="font-semibold block mb-2">
                      {LABELS.FORM.ATTACH_FILE}
                    </label>
                    {typeof values?.file === "string" && values?.file ? (
                      // → Show existing file
                      <div className="p-2 border-2 border-gray-300 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="mdi:file"
                            className="text-purple hover:text-purple-600"
                            width="20"
                            height="20"
                          />
                          <Link
                            to={`${import.meta.env.VITE_APP_BACKEND_URL}/${values?.file}`}
                            className="underline"
                          >
                            {values?.file?.split("/").pop()}
                          </Link>cka
                        </div>
                        <button
                          onClick={() => formik.setFieldValue("file", null)}
                          className="h-5"
                          type="button"
                        >
                          <Icon
                            icon="mdi:close"
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            width="20"
                            height="20"
                          />
                        </button>
                      </div>
                    ) : (
                      // → File upload input
                      <input
                        type="file"
                        name="file"
                        onChange={(e) =>
                          formik.setFieldValue(
                            "file",
                            e.currentTarget.files?.[0] || null
                          )
                        }
                        onBlur={handleBlur}
                        className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    )}
                    {errorMsg("file", formik)}
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

export default memo(AddCommentModal);
