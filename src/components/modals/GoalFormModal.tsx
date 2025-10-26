// ========================= Imports =========================
import type {
  IOutcomeSection,
  IUpdateOutcomeGoalResponse,
} from "@/services/OutcomesApi";
import {
  createOutcomeGoal,
  getOutcomeSections,
  updateOutcomeGoal,
} from "@/services/OutcomesApi";
import type { AddEventModalProps as IAddEventModalProps } from "@/types";
import { errorMsg } from "@/utils/formikHelpers";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import Button from "@ui/Button";
import ModalWrapper from "@ui/ModalWrapper";
import { FormikProvider, useFormik } from "formik";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

// ========================= Types =========================
export interface GoalFormValues {
  outcomeSection: string;
  name: string;
}

interface IAddGoalModalProps extends IAddEventModalProps {
  onGoalCreated?: () => void;
  // -> Add props for edit mode
  goalToEdit?: {
    _id: string;
    name: string;
    section: string;
  } | null;
}

// ========================= Validation =========================
const validationSchema = Yup.object({
  outcomeSection: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  name: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
});

// ========================= Component =========================
const UpsertGoalForm: React.FC<IAddGoalModalProps> = ({
  isOpen,
  onClose,
  onGoalCreated,
  goalToEdit,
}) => {
  // -> Get userId from Redux store
  const user = useSelector(
    (state: { user: { data: { userId: string } } }) => state.user.data
  );

  // -> State for outcome sections dropdown
  const [sections, setSections] = useState<IOutcomeSection[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  // -> Fetch outcome sections
  const fetchSections = useCallback(async () => {
    if (!user?.userId) return;
    setIsLoadingSections(true);
    setSectionsError(null);
    try {
      const data = await getOutcomeSections(user.userId);
      setSections(data ?? []);
    } catch {
      setSectionsError("Failed to load outcome sections.");
    } finally {
      setIsLoadingSections(false);
    }
  }, [user?.userId]);

  // -> Fetch outcome sections on mount or when userId changes
  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // -> Initial form values
  const initialValues: GoalFormValues = {
    outcomeSection: goalToEdit?.section ?? "",
    name: goalToEdit?.name ?? "",
  };

  // -> Formik setup for form state and validation
  const [isSaving, setIsSaving] = useState(false); // -> For create loading
  const formik = useFormik<GoalFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // -> Only run if userId and section are present
      if (!user?.userId || !values.outcomeSection) return;
      setIsSaving(true);
      try {
        let res;

        if (goalToEdit?._id) {
          // -> Edit mode: Update existing goal
          res = (await updateOutcomeGoal(
            goalToEdit._id,
            values.name,
            values.outcomeSection,
            user.userId
          )) as IUpdateOutcomeGoalResponse;
        } else {
          // -> Add mode: Create new goal
          res = await createOutcomeGoal(
            values.name,
            values.outcomeSection,
            user.userId
          );
        }

        if (!res?.success) {
          toast.error(
            res?.message ??
              (goalToEdit
                ? "Failed to update outcome goal."
                : "Failed to create outcome goal.")
          );
          setIsSaving(false);
          return;
        }

        toast.success(
          res?.message ??
            (goalToEdit ? "Outcome goal updated." : "Outcome goal created.")
        );
        formik.resetForm();
        onGoalCreated?.();
        onClose();
      } catch {
        toast.error(
          goalToEdit
            ? "Failed to update outcome goal."
            : "Failed to create outcome goal."
        );
      } finally {
        setIsSaving(false);
      }
    },
  });

  // -> Handle form submit event
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formik.handleSubmit();
  };

  // -> Modal footer buttons
  const footerContent = (
    <>
      <Button
        icon="mdi:plus-circle"
        variant="submitStyle"
        label={
          goalToEdit
            ? STATIC_TEXTS.OUTCOMES.SAVE_GOAL
            : STATIC_TEXTS.OUTCOMES.ADD_GOAL
        }
        type="submit"
        form="add-goals-form"
        disabled={isSaving}
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
        goalToEdit
          ? STATIC_TEXTS.OUTCOMES.EDIT_OUTCOME_GOAL
          : STATIC_TEXTS.OUTCOMES.ADD_OUTCOME_GOAL
      }
      footer={footerContent}
      widthClass="max-w-xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <FormikProvider value={formik}>
            <form
              id="add-goals-form"
              onSubmit={handleSubmit}
              autoComplete="off"
              className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto"
            >
              <div className="bg-purpleLight rounded-lg p-2 md:p-6">
                <div className="space-y-4">
                  {/* -> Outcome section dropdown (dynamic) */}
                  <div>
                    <label className="font-semibold block mb-1">
                      {LABELS.FORM.OUTCOMES_SECTION}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    {isLoadingSections ? (
                      <div className="text-sm text-gray-500">
                        Loading sections...
                      </div>
                    ) : sectionsError ? (
                      <div className="text-sm text-red-500">
                        {sectionsError}
                      </div>
                    ) : (
                      <div>
                        <select
                          name="outcomeSection"
                          className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                          value={values.outcomeSection}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          <option value="">-------</option>
                          {sections?.length > 0 ? (
                            sections.map((option) => (
                              <option key={option._id} value={option._id}>
                                {option.name}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              No sections available
                            </option>
                          )}
                        </select>
                        {errorMsg("outcomeSection", formik)}
                      </div>
                    )}
                  </div>

                  {/* -> Goal name input */}
                  <div>
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
                </div>
              </div>
            </form>
          </FormikProvider>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default memo(UpsertGoalForm);
