import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import ModalWrapper from "@ui/ModalWrapper";
import type { BulletinFormValues } from "@/types";
import { MAX_FILE_SIZE_MB } from "@/utils/constants";

interface AddBulletinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    title: string;
    description: string;
    expirationDate: string | null;
    sendEmail: boolean;
    file?: File | null;
  };
}

export const AddBulletinModal: React.FC<AddBulletinModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");

  const initialValues: BulletinFormValues = {
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    expirationDate: initialData?.expirationDate ?? "",
    sendEmail: initialData?.sendEmail ?? true,
  };

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: Yup.object({
      title: Yup.string()
        .trim()
        .required("Title is required")
        .min(3, "Title must be at least 3 characters")
        .max(30, "Title can't be longer than 30 characters"),
      description: Yup.string()
        .trim()
        .required("Description is required")
        .min(10, "Description must be at least 10 characters")
        .max(500, "Description can't be longer than 500 characters"),
      expirationDate: Yup.date()
        .min(new Date("1900-01-01"), "Date must be after 1900")
        .max(
          new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          "Date must be within 1 year from today"
        )
        .nullable(),
      sendEmail: Yup.boolean(),
    }),
    onSubmit: () => {
      if (fileError) return;

      onClose();
    },
  });

  useEffect(() => {
    if (isOpen && !initialData) {
      setFile(null);
      setFileError("");
      formik.resetForm();
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`File exceeds ${MAX_FILE_SIZE_MB}MB`);
        setFile(null);
      } else {
        setFileError("");
        setFile(selectedFile);
      }
    }
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="add-bulletin-form"
        className="px-4 py-2 text-sm font-medium text-white bg-purple rounded-lg hover:bg-pink transition-colors"
      >
        {initialData ? "Edit Bulletin" : "Add Bulletin"}
      </button>
    </>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Bulletin" : "Add Bulletin"}
      footer={footer}
      widthClass="max-w-2xl"
    >
      <form
        id="add-bulletin-form"
        onSubmit={formik.handleSubmit}
        className="space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            placeholder="Enter bulletin title"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.title}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none"
          />
          {formik.touched.title && formik.errors.title && (
            <p className="text-sm text-red-600 mt-1">{formik.errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="Enter description"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none"
          />
          {formik.touched.description && formik.errors.description && (
            <p className="text-sm text-red-600 mt-1">
              {formik.errors.description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date
          </label>
          <input
            name="expirationDate"
            type="date"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.expirationDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none"
          />
          {formik.touched.expirationDate && formik.errors.expirationDate && (
            <p className="text-sm text-red-600 mt-1">
              {formik.errors.expirationDate}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            name="sendEmail"
            type="checkbox"
            checked={formik.values.sendEmail}
            onChange={formik.handleChange}
            className="w-4 h-4 text-purple border-gray-300 rounded focus:ring-purple"
          />
          <label htmlFor="sendEmail" className="ml-2 text-sm text-gray-700">
            Send email notification to all agencies
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attach a File
          </label>

          <div className="flex items-center w-full max-w-md overflow-hidden rounded-lg border border-gray-300">
            <label
              htmlFor="bulletin-file"
              className="bg-purpleLight px-4 py-2 text-sm font-medium text-purple cursor-pointer hover:bg-border transition"
            >
              Choose File
            </label>

            <input
              id="bulletin-file"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex-1 px-3 py-2 text-sm text-gray-700 truncate">
              {file ? file.name : "No file selected"}
            </div>
          </div>

          {fileError && (
            <p className="text-sm text-red-600 mt-1">{fileError}</p>
          )}
        </div>
      </form>
    </ModalWrapper>
  );
};
