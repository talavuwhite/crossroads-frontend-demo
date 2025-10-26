import React from "react";
import { MAX_FILE_SIZE_MB } from "@/utils/constants";

interface FileInputProps {
  label?: string;
  name: string;
  formik: any;
  className?: string;
  allowedTypes?: string[];
  showPreview?: boolean;
  required?: boolean;
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  name,
  formik,
  className,
  allowedTypes,
  showPreview,
  required = false,
}) => {
  const file = formik.values[name];
  const fieldMeta = formik.getFieldMeta(name);

  const isFile = file instanceof File;

  const fileName = (() => {
    if (!file) return "No file selected";

    if (!isFile && typeof file === "object" && file.url && file.filename) {
      return file.filename;
    }

    if (isFile) {
      return file.name || "No file selected";
    }

    if (typeof file === "string") {
      return file.split("/").pop() || "No file selected";
    }

    return "No file selected";
  })();

  const imagePreview = (() => {
    if (!file) return null;

    if (isFile && file instanceof File) {
      return URL.createObjectURL(file);
    }

    if (typeof file === "string") {
      return file;
    }

    if (typeof file === "object" && file.url) {
      return file.url;
    }

    return null;
  })();

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-primary">*</span>}
        </label>
      )}

      <div
        className={`flex items-center border border-gray-300 rounded-md shadow-sm ${className}`}
      >
        <label
          htmlFor={name}
          className="bg-purpleLight px-4 py-2 text-sm font-medium text-purple cursor-pointer hover:bg-border transition rounded-md"
        >
          Choose File
        </label>

        <input
          id={name}
          name={name}
          type="file"
          accept={allowedTypes?.join(",")}
          onChange={(event) => {
            const selectedFile = event.currentTarget.files?.[0];
            formik.setFieldTouched(name, true, false);

            if (selectedFile) {
              if (allowedTypes && !allowedTypes.includes(selectedFile.type)) {
                formik.setFieldError(name, "File type not allowed.");
                return;
              }

              if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                formik.setFieldError(
                  name,
                  `File size exceeds ${MAX_FILE_SIZE_MB}MB`
                );
                return;
              }

              formik.setFieldValue(name, selectedFile);
            } else {
              formik.setFieldValue(name, null);
            }
          }}
          className="hidden"
        />

        <span className="text-sm text-gray-500 ml-2 truncate max-w-[100px] sm:max-w-[200px] md:max-w-[250px] overflow-hidden whitespace-nowrap">
          {fileName}
        </span>
      </div>

      {imagePreview && !fieldMeta.error && showPreview && (
        <img
          src={imagePreview}
          alt="Preview"
          className="mt-2 w-24 h-24 object-cover rounded"
        />
      )}

      {fieldMeta.touched && fieldMeta.error && (
        <p
          className="text-red-500 text-xs mt-1"
          style={{
            zIndex: 9999,
            position: "relative",
            backgroundColor: "white",
          }}
        >
          {fieldMeta.error}
        </p>
      )}
    </div>
  );
};

export default FileInput;
