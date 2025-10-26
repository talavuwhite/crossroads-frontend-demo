import React from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { MAX_COMMENT_LENGTH, MIN_COMMENT_LENGTH } from "@/utils/constants";
import { STATIC_TEXTS, ERROR_MESSAGES } from "@/utils/textConstants";

interface AddAssasmentCommentsProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  commentText: string;
  setCommentText: (text: string) => void;
  commentError: string;
  setCommentError: (err: string) => void;
  isEdit?: boolean;
}

const AddAssasmentComments: React.FC<AddAssasmentCommentsProps> = ({
  open,
  onClose,
  onSubmit,
  commentText,
  setCommentText,
  commentError,
  setCommentError,
  isEdit = false,
}) => {
  return (
    <ModalWrapper
      isOpen={open}
      onClose={() => {
        onClose();
        setCommentText("");
        setCommentError("");
      }}
      title={isEdit ? "Edit Comment" : "Add Comment"}
      widthClass="max-w-md"
      footer={
        <div className="flex gap-2">
          <Button
            type="button"
            label={isEdit ? "Save Changes" : STATIC_TEXTS.COMMON.ADD_COMMENT}
            icon="mdi:check-circle"
            variant="submitStyle"
            onClick={() => {
              if (!commentText.trim()) {
                setCommentError(ERROR_MESSAGES.FORM.REQUIRED);
                return;
              }
              if (commentText.trim().length < MIN_COMMENT_LENGTH) {
                setCommentError(
                  ERROR_MESSAGES.FORM.MIN_LENGTH(
                    MIN_COMMENT_LENGTH,
                    STATIC_TEXTS.COMMON.COMMENT
                  )
                );
                return;
              }
              if (commentText.length > MAX_COMMENT_LENGTH) {
                setCommentError(
                  ERROR_MESSAGES.FORM.MAX_LENGTH(
                    MAX_COMMENT_LENGTH,
                    STATIC_TEXTS.COMMON.COMMENT
                  )
                );
                return;
              }
              onSubmit(commentText);
              setCommentText("");
              setCommentError("");
            }}
          />
          <Button
            type="button"
            label={STATIC_TEXTS.COMMON.CANCEL}
            icon="mdi:close"
            variant="dangerStyle"
            onClick={() => {
              onClose();
              setCommentText("");
              setCommentError("");
            }}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-medium text-gray-700">
          {STATIC_TEXTS.COMMON.COMMENT} <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 resize-none rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple min-h-[100px]"
          value={commentText}
          onChange={(e) => {
            const value = e.target.value;
            setCommentText(value);
            if (value.length > MAX_COMMENT_LENGTH) {
              setCommentError(
                ERROR_MESSAGES.FORM.MAX_LENGTH(
                  MAX_COMMENT_LENGTH,
                  STATIC_TEXTS.COMMON.COMMENT
                )
              );
            } else {
              setCommentError("");
            }
          }}
          required
          autoFocus
        />
        {commentError && (
          <div className="text-red-500 text-xs mt-1">{commentError}</div>
        )}
      </div>
    </ModalWrapper>
  );
};

export default AddAssasmentComments;
