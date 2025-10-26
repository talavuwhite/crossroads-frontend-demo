import React, { useEffect } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormTextarea from "@ui/FormTextarea";
import FileInput from "@ui/FileInput";
import {
  ALLOWED_FILE_TYPES,
  BLOCKED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_MB,
  visibleTo,
} from "@/utils/constants";
import type { CaseDocument, CaseNote } from "@/types/case";
import { STATIC_TEXTS, LABELS, ERROR_MESSAGES } from "@/utils/textConstants";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any, noteId?: string) => void;
  editNote?: CaseNote | null;
  editDocument?: CaseDocument | null;
  type?: string;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editNote = null,
  editDocument = null,
  type = "note",
}) => {
  const isDocument = type === "document";
  const editing = isDocument ? editDocument : editNote;

  const formik = useFormik({
    initialValues: {
      description: editing?.description || "",
      visibleTo: editing?.visibleTo || "All Agencies",
      file: (editing?.attachment?.url as string | null) || null,
    } as { description: string; visibleTo: string; file: File | string | null },
    validationSchema: Yup.object({
      description: isDocument
        ? Yup.string()
        : Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
      visibleTo: Yup.string().required(),
      file: isDocument
        ? Yup.mixed()
            .required(ERROR_MESSAGES.FORM.REQUIRED)
            .test(
              "fileSize",
              ERROR_MESSAGES.FORM.FILE_SIZE_EXCEEDS(MAX_FILE_SIZE_MB),
              (value: any) => {
                if (!value) return false;
                if (typeof value === "string") return true;
                if (!(value instanceof File)) return false;
                return value.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
              }
            )
            .test(
              "fileType",
              ERROR_MESSAGES.FORM.UNSUPPORTED_FILE_TYPE,
              (value: any) => {
                if (!value) return false;
                if (typeof value === "string") return true;
                if (!(value instanceof File)) return false;
                const allowedTypes = ALLOWED_FILE_TYPES;
                const blockedExtensions = BLOCKED_FILE_EXTENSIONS;
                const fileExtension = `.${
                  (value.name || "").split(".").pop() || ""
                }`.toLowerCase();
                if (blockedExtensions.includes(fileExtension)) {
                  return false;
                }
                return allowedTypes.includes(value.type);
              }
            )
        : Yup.mixed()
            .nullable()
            .test(
              "fileSize",
              ERROR_MESSAGES.FORM.FILE_SIZE_EXCEEDS(MAX_FILE_SIZE_MB),
              (value: any) => {
                if (!value) return true;
                if (typeof value === "string") return true;
                if (!(value instanceof File)) return false;
                return value.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
              }
            )
            .test(
              "fileType",
              ERROR_MESSAGES.FORM.UNSUPPORTED_FILE_TYPE,
              (value: any) => {
                if (!value) return true;
                if (typeof value === "string") return true;
                if (!(value instanceof File)) return false;
                const allowedTypes = ALLOWED_FILE_TYPES;
                const blockedExtensions = [".exe", ".sh", ".js", ".html"];
                const fileExtension = `.${
                  (value.name || "").split(".").pop() || ""
                }`.toLowerCase();
                if (blockedExtensions.includes(fileExtension)) {
                  return false;
                }
                return allowedTypes.includes(value.type);
              }
            ),
    }),
    onSubmit: (values, { resetForm }) => {
      onSubmit(
        {
          ...values,
        },
        editing?._id
      );
      onClose();
      resetForm();
    },
  });

  useEffect(() => {
    if (isOpen) {
      formik.setValues({
        description: editing?.description || "",
        visibleTo: editing?.visibleTo || "All Agencies",
        file: (editing?.attachment?.url as string | null) || null,
      });
    } else {
      formik.resetForm();
    }
  }, [isOpen, editing]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        editing
          ? isDocument
            ? STATIC_TEXTS.DOCUMENTS.EDIT_DOCUMENT
            : STATIC_TEXTS.NOTES.EDIT_NOTE
          : isDocument
          ? STATIC_TEXTS.DOCUMENTS.ADD_DOCUMENT
          : STATIC_TEXTS.NOTES.ADD_NOTES
      }
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label={
              editing
                ? isDocument
                  ? STATIC_TEXTS.DOCUMENTS.SAVE_CHANGES
                  : STATIC_TEXTS.NOTES.SAVE_CHANGES
                : isDocument
                ? STATIC_TEXTS.DOCUMENTS.ADD_DOCUMENT
                : STATIC_TEXTS.NOTES.ADD_NOTES
            }
            icon={editing ? "mdi:content-save" : "mdi:plus"}
            variant="submitStyle"
            onClick={() => formik.handleSubmit()}
          />
          <Button
            label={STATIC_TEXTS.COMMON.CANCEL}
            onClick={onClose}
            variant="default"
          />
        </div>
      }
    >
      <div className="">
        <div className="mb-4">
          <FormTextarea
            label={LABELS.FORM.DESCRIPTION}
            name="description"
            formik={formik}
            rows={6}
            required={!isDocument}
          />
        </div>

        <div className="mb-4">
          <FileInput
            label={LABELS.FORM.ATTACH_FILE}
            name="file"
            formik={formik}
            required={isDocument}
          />
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-red-700 block bg-red-100 px-2 py-1 rounded-t-md">
            {LABELS.FORM.VISIBLE_TO}
          </label>
          <select
            name="visibleTo"
            value={formik.values.visibleTo}
            onChange={formik.handleChange}
            className="w-full border border-red-300 p-2 rounded-b-md bg-red-50 focus:outline-none"
          >
            {visibleTo.map((option) => (
              <option key={option} value={option}>
                {option === "Agency Only" ? "My Agency" : option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default AddNoteModal;
