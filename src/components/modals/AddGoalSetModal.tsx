// ============================================================================
// 📦 IMPORTS
// ============================================================================
import type { RootState } from "@/redux/store";
import {
  createGoalSet,
  updateGoalSet,
  type IGoalSetRequestPayload,
} from "@/services/CaseApi";
import { getOutcomeGoalsList, type IOutcomeGoal } from "@/services/OutcomesApi";
import type { AddEventModalProps, EventActivity } from "@/types";
import { GOAL_SET_STATUS, GOAL_SET_VISIBLE_TO } from "@/utils/constants";
import { errorMsg } from "@/utils/formikHelpers";
import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "@ui/Button";
import ModalWrapper from "@ui/ModalWrapper";
import { FormikProvider, useFormik } from "formik";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";

// ============================================================================
// 🏗️ TYPE DEFINITIONS & INTERFACES
// ============================================================================

// → Union type for submit handler (create vs edit mode)
type OnSubmitType =
  | ((id: string, data: GoalSetFormValues) => void)
  | ((data: GoalSetFormValues) => void);

// → Props interface for the modal component
interface AddGoalSetModalProps extends AddEventModalProps {
  onSubmit: OnSubmitType;
  goalSetData?: EventActivity | null; // → Existing goal set data for edit mode
  initialStep?: 1 | 2; // → Which step to start with
}

// → Form values interface for Formik (Step 1 only)
interface Step1FormValues {
  title: string;
  status: string;
  visibleTo: string;
}

// → Complete form values interface (for final submission)
export interface GoalSetFormValues extends Step1FormValues {
  selectedGoals: string[];
}

// → Interface for goal sections from API
interface IGoalSection {
  section: {
    _id: string;
    name: string;
  };
  goals: IOutcomeGoal[];
}

// ============================================================================
// ✅ VALIDATION SCHEMAS
// ============================================================================
const step1ValidationSchema = Yup.object({
  title: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  status: Yup.string(),
  visibleTo: Yup.string(),
});

// ============================================================================
// 🎯 MAIN COMPONENT
// ============================================================================
const AddGoalSetModal: React.FC<AddGoalSetModalProps> = ({
  isOpen,
  onClose,
  goalSetData,
  onSubmit,
  initialStep,
}) => {
  // ============================================================================
  // 🎛️ STATE MANAGEMENT
  // ============================================================================
  const { data: caseDataFormRedux } = useSelector(
    (state: RootState) => state.case
  );
  // → UI State
  const [step, setStep] = useState<1 | 2>(1); // → Current step (1: form, 2: goals selection)
  const [loading, setLoading] = useState(false); // → Loading state for API calls
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]); // → User selected goal IDs
  const [selectAllGoals, setSelectAllGoals] = useState(false); // → Select all toggle state
  const [step1Data, setStep1Data] = useState<Step1FormValues | null>(null); // → Store step 1 data

  // → Data State
  const [goalSections, setGoalSections] = useState<IGoalSection[]>([]); // → Goals data from API

  // → Redux State
  const user = useSelector((state: RootState) => state.user.data);
  const { data: caseData } = useSelector((state: RootState) => state.case);

  // ============================================================================
  // 🔄 SIDE EFFECTS (useEffect)
  // ============================================================================

  // → Handle modal step initialization
  useEffect(() => {
    if (isOpen) {
      if (initialStep) {
        setStep(initialStep);
      } else {
        setStep(1);
      }
      // → Reset step 1 data when modal opens
      setStep1Data(null);
    }
  }, [isOpen, initialStep]);

  // → Fetch goals when modal opens and step is 2
  useEffect(() => {
    if (isOpen && step === 2 && user?.userId) {
      fetchGoals();
    }
  }, [isOpen, step, user?.userId]);

  // ============================================================================
  // 🚀 API FUNCTIONS
  // ============================================================================

  // → Fetch goals from API
  const fetchGoals = useCallback(async () => {
    if (!user?.userId) return;

    setLoading(true);
    try {
      const response = await getOutcomeGoalsList(user?.userId);
      setGoalSections(response?.results || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  // ============================================================================
  // 📝 FORM HANDLERS
  // ============================================================================

  // → Step 1 form submission handler (only validates and moves to step 2)
  const handleStep1Submit = useCallback(async (values: Step1FormValues) => {
    // → Store step 1 data for final submission
    setStep1Data(values);
    // → Move to step 2
    setStep(2);
  }, []);

  // → Final form submission handler (combines step 1 + step 2 data)
  const handleFinalSubmit = useCallback(async () => {
    if (!step1Data) {
      toast.error("Please complete step 1 first.");
      return;
    }

    if (!user?.userId) {
      toast.error("User not authenticated. Please try again.");
      return;
    }

    if (!caseData?._id) {
      toast.error("Case data not available. Please try again.");
      return;
    }

    if (!user?.activeLocation) {
      toast.error("Location data not available. Please try again.");
      return;
    }

    setLoading(true);

    try {
      // → Auto-select all goals if user didn't select any
      let goalsToSubmit = selectedGoals;
      if (selectedGoals.length === 0) {
        goalsToSubmit =
          goalSections?.flatMap(
            (section) => section?.goals?.map((goal) => goal?._id) || []
          ) || [];
      }

      // → Transform data to match API format
      const apiPayload: IGoalSetRequestPayload = {
        title: step1Data.title,
        status: step1Data.status,
        visibleTo: step1Data.visibleTo,
        caseId: caseData._id,
        sections:
          goalSections?.map((section) => ({
            section: section?.section?._id || "",
            sectionName: section?.section?.name || "",
            goals:
              section?.goals
                ?.filter((goal) => goalsToSubmit.includes(goal?._id))
                ?.map((goal) => ({
                  goal: goal?._id || "",
                  goalName: goal?.name || "",
                })) || [],
            comments: [], // → Empty array as per API structure
          })) || [],
      };

      // → Make API call based on create vs edit mode
      let response;
      if (goalSetData?._id) {
        // → Update existing goal set
        response = await updateGoalSet(
          goalSetData._id,
          apiPayload,
          user.userId,
          user.activeLocation
        );
      } else {
        // → Create new goal set
        response = await createGoalSet(
          apiPayload,
          user.userId,
          user.activeLocation
        );
      }

      // → Handle API response
      if (response?.success) {
        // → Show success message from API or fallback
        const successMessage =
          response?.message ||
          (goalSetData?._id
            ? "Goal set updated successfully!"
            : "Goal set created successfully!");

        toast.success(successMessage);

        // → Close modal and reset state
        handleModalClose();

        // → Call parent onSubmit if provided (for any additional handling)
        if (onSubmit) {
          const finalFormValues: GoalSetFormValues = {
            ...step1Data,
            selectedGoals: goalsToSubmit,
          };

          if (goalSetData?._id) {
            await (onSubmit as (id: string, data: GoalSetFormValues) => void)(
              goalSetData._id,
              finalFormValues
            );
          } else {
            await (onSubmit as (data: GoalSetFormValues) => void)(
              finalFormValues
            );
          }
        }
      } else {
        // → Show error message from API or fallback
        const errorMessage =
          response?.message ||
          (goalSetData?._id
            ? "Failed to update goal set. Please try again."
            : "Failed to create goal set. Please try again.");

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error submitting goal set:", error);

      // → Show user-friendly error message
      const errorMessage = goalSetData?._id
        ? "Failed to update goal set. Please check your connection and try again."
        : "Failed to create goal set. Please check your connection and try again.";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    step1Data,
    selectedGoals,
    goalSetData,
    onSubmit,
    goalSections,
    user?.userId,
    caseData?._id,
  ]);

  // ============================================================================
  // 🎯 FORMIK SETUP (Step 1 only)
  // ============================================================================

  // → Initial form values for step 1
  const step1InitialValues: Step1FormValues = {
    title: "",
    status: GOAL_SET_STATUS?.[0]?.value || "",
    visibleTo:
      caseDataFormRedux?.visibleTo === "Agency Only"
        ? "Agency Only"
        : GOAL_SET_VISIBLE_TO?.[0]?.value || "",
  };

  // → Formik configuration for step 1
  const step1Formik = useFormik<Step1FormValues>({
    initialValues: step1InitialValues,
    validationSchema: step1ValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: handleStep1Submit,
  });

  // ============================================================================
  // 🎮 EVENT HANDLERS
  // ============================================================================

  // → Step 1 form submission handler
  const handleStep1FormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    step1Formik.handleSubmit();
  };

  // → Step navigation handler (for Next button)
  const handleNextStep = async () => {
    const errors = await step1Formik.validateForm();

    if (Object.keys(errors).length > 0) {
      step1Formik.setTouched(
        Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>)
      );
      return; // Don't proceed
    }

    // → If validation passes, submit step 1
    step1Formik.handleSubmit();
  };

  // → Individual goal selection handler
  const handleGoalToggle = (goalId: string) => {
    if (!goalId) return; // → Guard against undefined goalId

    setSelectedGoals((prev) => {
      const isSelected = prev.includes(goalId);
      if (isSelected) {
        return prev.filter((id) => id !== goalId);
      } else {
        return [...prev, goalId];
      }
    });
  };

  // → Select/Deselect all goals handler
  const handleSelectAllGoals = () => {
    if (selectAllGoals) {
      setSelectedGoals([]);
      setSelectAllGoals(false);
    } else {
      const allGoalIds =
        goalSections?.flatMap(
          (section) => section?.goals?.map((goal) => goal?._id) || []
        ) || [];
      setSelectedGoals(allGoalIds);
      setSelectAllGoals(true);
    }
  };

  // → Reset modal state
  const handleModalClose = () => {
    step1Formik.resetForm();
    setSelectedGoals([]);
    setSelectAllGoals(false);
    setStep1Data(null);
    onClose();
  };

  // ============================================================================
  // 🎨 UI COMPONENTS & RENDERING
  // ============================================================================

  // → Footer buttons based on current step
  const footerContent =
    step === 1 ? (
      <>
        {goalSetData ? (
          <Button
            type="submit"
            variant="submitStyle"
            label={STATIC_TEXTS.COMMON.SAVE_CHANGES}
            icon="mdi:plus-circle"
            form="step1-form"
          />
        ) : (
          <Button
            onClick={handleNextStep}
            variant="submitStyle"
            label={STATIC_TEXTS.COMMON.NEXT}
            icon="mdi:arrow-right-thin"
          />
        )}
        <Button onClick={handleModalClose} label={STATIC_TEXTS.COMMON.CANCEL} />
      </>
    ) : (
      <>
        <Button
          onClick={handleFinalSubmit}
          variant="submitStyle"
          label={STATIC_TEXTS.OUTCOMES.ADD_GOAL_SET}
          icon="mdi:plus-circle"
          disabled={loading}
        />
        <Button onClick={handleModalClose} label={STATIC_TEXTS.COMMON.CANCEL} />
      </>
    );

  // → Destructure formik values for easier access
  const { values, handleChange, handleBlur } = step1Formik;

  // ============================================================================
  // 🎨 MAIN RENDER
  // ============================================================================

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        step === 1
          ? goalSetData
            ? STATIC_TEXTS.OUTCOMES.EDIT_GOAL_SET
            : STATIC_TEXTS.OUTCOMES.ADD_GOAL_SET
          : STATIC_TEXTS.OUTCOMES.CHOOSE_CUSTOM_GOALS
      }
      footer={footerContent}
      widthClass="max-w-xl w-full"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          {step === 1 ? (
            // ============================================================================
            // 📝 STEP 1: BASIC FORM FIELDS
            // ============================================================================
            <FormikProvider value={step1Formik}>
              <form
                id="step1-form"
                onSubmit={handleStep1FormSubmit}
                autoComplete="off"
                className=" rounded-lg shadow space-y-4 sm:space-y-6 overflow-y-auto "
              >
                <div className="">
                  <div className="space-y-4 sm:space-y-6">
                    {/* → Goal Set Title Field */}
                    <div className="">
                      <label className="font-semibold block mb-2 text-sm sm:text-base">
                        {LABELS.FORM.TITLE}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="title"
                        type="text"
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full p-2 sm:p-3 text-sm sm:text-base border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                        placeholder="Enter goal set title"
                      />
                      {errorMsg("title", step1Formik)}
                    </div>

                    {/* → Goal Set Status Field */}
                    <div className="">
                      <label className="font-semibold block mb-2 text-sm sm:text-base">
                        {LABELS.FORM.STATUS}
                      </label>
                      {GOAL_SET_STATUS && (
                        <div>
                          <select
                            name="status"
                            className="w-full p-2 sm:p-3 text-sm sm:text-base border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                            value={values.status}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          >
                            {GOAL_SET_STATUS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errorMsg("status", step1Formik)}
                        </div>
                      )}
                    </div>

                    {/* → Warning Message (Role-based) */}
                    {caseDataFormRedux?.visibleTo === "Agency Only" && (
                      <div className="bg-red-100 border border-red-400 text-red-600 p-4 rounded-md flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-start gap-2">
                          <Icon
                            icon="mdi:lock"
                            width="20"
                            height="20"
                            className="text-red-600 mt-0.5 flex-shrink-0"
                          />
                          <p className="text-sm font-normal sm:text-base leading-snug">
                            {`${STATIC_TEXTS.OUTCOMES.ADD_GOAL_SET_WARNING}`}{" "}
                            <span className="font-semibold">
                              "
                              {caseDataFormRedux?.caseCompanyInfo
                                ?.locationName ||
                                caseDataFormRedux?.caseCompanyInfo?.companyName}
                              "
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* → Visibility Settings (Role-based) */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-red-700 block bg-red-100 px-2 py-1 rounded-t-md">
                        {LABELS.FORM.VISIBLE_TO}
                      </label>
                      <select
                        name="visibleTo"
                        className="w-full border border-red-300 p-2 rounded-b-md bg-red-50 focus:outline-none disabled:bg-red-50 disabled:border-red-300 disabled:cursor-not-allowed"
                        value={values.visibleTo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={
                          caseDataFormRedux?.visibleTo === "Agency Only"
                        }
                      >
                        {GOAL_SET_VISIBLE_TO.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </FormikProvider>
          ) : (
            // ============================================================================
            // 🎯 STEP 2: GOAL SELECTION
            // ============================================================================
            <div className="">
              <div className="">
                <div className="space-y-4 sm:space-y-6">
                  {/* → Information Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-400 rounded-md">
                    <Icon
                      icon="mdi:info"
                      width="18"
                      height="18"
                      className="text-blue-300 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col gap-2 text-xs sm:text-sm text-blue-600">
                      <p>{STATIC_TEXTS.OUTCOMES.CHOOSE_CUSTOM_GOALS_INFO}</p>
                      <p>{STATIC_TEXTS.OUTCOMES.CHOOSE_CUSTOM_GOALS_INFO1}</p>
                    </div>
                  </div>

                  {/* → Select All Toggle Button */}
                  <button
                    type="button"
                    onClick={handleSelectAllGoals}
                    className="w-full flex justify-end text-xs sm:text-sm text-blue-600 hover:text-blue-500 underline uppercase"
                  >
                    {selectAllGoals
                      ? "Deselect All Goals"
                      : STATIC_TEXTS.OUTCOMES.SELECT_ALL_GOALS}
                  </button>

                  {/* → Goals Display Section */}
                  {loading ? (
                    // → Loading State
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-500"></div>
                      <span className="ml-2 text-sm sm:text-base text-gray-600">
                        Loading goals...
                      </span>
                    </div>
                  ) : goalSections?.length === 0 ? (
                    // → Empty State
                    <div className="text-center py-8 text-sm sm:text-base text-gray-500">
                      No goals available. Please create some goals first.
                    </div>
                  ) : (
                    // → Goals List
                    <div className="space-y-4 sm:space-y-6">
                      {/* → Map through each goal section */}
                      {goalSections?.map((section) => (
                        <div
                          key={section?.section?._id}
                          className="flex flex-col gap-2 sm:gap-3"
                        >
                          {/* → Section Header */}
                          <h1 className="text-base sm:text-lg text-purple font-bold">
                            {section?.section?.name}
                          </h1>

                          {/* → Goals Table - Responsive */}
                          <div className="overflow-x-auto">
                            <table className="w-full table-auto text-xs sm:text-sm rounded-sm border border-purple-400 min-w-[300px]">
                              <thead>
                                <tr className="bg-purple-400 text-white">
                                  <th className="text-left px-2 sm:px-4 py-2 w-3/4 border-r border-white">
                                    {STATIC_TEXTS.OUTCOMES.GOALS}
                                  </th>
                                  <th className="text-center px-2 sm:px-4 py-2 w-1/4">
                                    {STATIC_TEXTS.OUTCOMES.INCLUDE}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* → Map through goals in this section */}
                                {section?.goals?.map((goal) => (
                                  <tr
                                    key={goal?._id}
                                    className="border-b border-purple-400 bg-white transition hover:bg-purple-50"
                                  >
                                    <td className="p-2 sm:p-3 border-r border-purple-400 break-words">
                                      {goal?.name}
                                    </td>
                                    <td className="p-2 sm:p-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedGoals.includes(
                                          goal?._id
                                        )}
                                        onChange={() =>
                                          handleGoalToggle(goal?._id)
                                        }
                                        className="w-3 h-3 sm:w-4 sm:h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple cursor-pointer"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};

// ============================================================================
// 🚀 EXPORT
// ============================================================================
export default memo(AddGoalSetModal);
