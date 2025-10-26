// ============================================================================
// 📦 IMPORTS
// ============================================================================
import type { RootState } from "@/redux/store";
import type { ICaseOutcome } from "@/services/CaseApi";
import { updateGoalSet, type IGoalSetRequestPayload } from "@/services/CaseApi";
import type { AddEventModalProps } from "@/types";
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

// → Props interface for the modal component
interface UpdateGoalSetModalProps extends AddEventModalProps {
    onSubmit: (id: string, data: UpdateGoalSetFormValues) => void;
    goalSetData: ICaseOutcome; // → Existing goal set data for edit mode (required)
}

// → Form values interface for the update form
export interface UpdateGoalSetFormValues {
    title: string;
    status: string;
    visibleTo: string;
}

// ============================================================================
// ✅ VALIDATION SCHEMAS
// ============================================================================
const updateGoalSetValidationSchema = Yup.object({
    title: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    status: Yup.string(),
    visibleTo: Yup.string(),
});

// ============================================================================
// 🎯 MAIN COMPONENT
// ============================================================================
const UpdateGoalSetModal: React.FC<UpdateGoalSetModalProps> = ({
    isOpen,
    onClose,
    goalSetData,
    onSubmit,
}) => {
    // ============================================================================
    // 🎛️ STATE MANAGEMENT
    // ============================================================================

    // → UI State
    const [loading, setLoading] = useState(false); // → Loading state for API calls

    // → Redux State
    const user = useSelector((state: RootState) => state.user.data);
    const { data: caseData } = useSelector((state: RootState) => state.case);

    // ============================================================================
    // 🔄 SIDE EFFECTS (useEffect)
    // ============================================================================

    // → Reset form when modal opens with new data
    useEffect(() => {
        if (isOpen && goalSetData) {
            // → Update form with existing goal set data
            formik.setValues({
                title: goalSetData.title || "",
                status: goalSetData.status || GOAL_SET_STATUS?.[0]?.value || "",
                visibleTo: goalSetData.visibleTo || GOAL_SET_VISIBLE_TO?.[0]?.value || "",
            });
        }
    }, [isOpen, goalSetData]);

    // ============================================================================
    // 📝 FORM HANDLERS
    // ============================================================================

    // → Form submission handler
    const handleSubmit = useCallback(async (values: UpdateGoalSetFormValues) => {
        if (!user?.userId || !caseData?._id || !user?.activeLocation || !goalSetData?._id) {
            toast.error('Required data not available. Please try again.');
            return;
        }

        setLoading(true);

        try {
            // → Transform data to match API format
            const apiPayload: IGoalSetRequestPayload = {
                title: values.title,
                status: values.status,
                visibleTo: values.visibleTo,
                caseId: caseData._id,
                sections: goalSetData.sections?.map(section => ({
                    section: section.section,
                    sectionName: section.sectionName,
                    goals: section.goals?.map(goal => ({
                        goal: goal._id,
                        goalName: goal.name || goal.goalName || ''
                    })) || [],
                    comments: [] // → Add empty comments array as required by API
                })) || []
            };

            // → Update existing goal set
            const response = await updateGoalSet(
                goalSetData._id,
                apiPayload,
                user.userId,
                user.activeLocation
            );

            // → Handle API response
            if (response?.success) {
                // → Show success message from API or fallback
                const successMessage = response?.message || 'Goal set updated successfully!';
                toast.success(successMessage);

                // → Close modal
                handleModalClose();

                // → Call parent onSubmit if provided (for any additional handling)
                if (onSubmit) {
                    await onSubmit(goalSetData._id, values);
                }
            } else {
                // → Show error message from API or fallback
                const errorMessage = response?.message || 'Failed to update goal set. Please try again.';
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error updating goal set:', error);

            // → Show user-friendly error message
            toast.error('Failed to update goal set. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, [goalSetData, onSubmit, user?.userId, caseData?._id]);

    // ============================================================================
    // 🎯 FORMIK SETUP
    // ============================================================================

    // → Initial form values
    const initialValues: UpdateGoalSetFormValues = {
        title: goalSetData?.title || "",
        status: goalSetData?.status || GOAL_SET_STATUS?.[0]?.value || "",
        visibleTo: goalSetData?.visibleTo || GOAL_SET_VISIBLE_TO?.[0]?.value || "",
    };

    // → Formik configuration
    const formik = useFormik<UpdateGoalSetFormValues>({
        initialValues,
        validationSchema: updateGoalSetValidationSchema,
        validateOnBlur: true,
        validateOnChange: true,
        enableReinitialize: false, // → Don't reinitialize to preserve user changes
        onSubmit: handleSubmit,
    });

    // ============================================================================
    // 🎮 EVENT HANDLERS
    // ============================================================================

    // → Form submission handler
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        formik.handleSubmit();
    };

    // → Reset modal state
    const handleModalClose = () => {
        formik.resetForm();
        onClose();
    };

    // ============================================================================
    // 🎨 UI COMPONENTS & RENDERING
    // ============================================================================

    // → Footer buttons
    const footerContent = (
        <>
            <Button
                type="submit"
                variant="submitStyle"
                label={STATIC_TEXTS.COMMON.SAVE_CHANGES}
                icon="mdi:content-save"
                form="update-goal-set-form"
                disabled={loading}
            />
            <Button
                onClick={handleModalClose}
                label={STATIC_TEXTS.COMMON.CANCEL}
            />
        </>
    );

    // → Destructure formik values for easier access
    const { values, handleChange, handleBlur } = formik;

    // ============================================================================
    // 🎨 MAIN RENDER
    // ============================================================================

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={handleModalClose}
            title={STATIC_TEXTS.OUTCOMES.EDIT_GOAL_SET}
            footer={footerContent}
            widthClass="max-w-xl"
        >
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-hidden">
                    <FormikProvider value={formik}>
                        <form
                            id="update-goal-set-form"
                            onSubmit={handleFormSubmit}
                            autoComplete="off"
                            className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto"
                        >
                            <div className="bg-purpleLight rounded-lg p-2 md:p-6">
                                <div className="space-y-4">
                                    {/* → Goal Set Title Field */}
                                    <div className="">
                                        <label className="font-semibold block mb-1">
                                            {LABELS.FORM.TITLE} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="title"
                                            type="text"
                                            value={values.title}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                                        />
                                        {errorMsg("title", formik)}
                                    </div>

                                    {/* → Goal Set Status Field */}
                                    <div className="">
                                        <label className="font-semibold block mb-1">
                                            {LABELS.FORM.STATUS}
                                        </label>
                                        {GOAL_SET_STATUS && (
                                            <div>
                                                <select
                                                    name="status"
                                                    className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
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
                                                {errorMsg("status", formik)}
                                            </div>
                                        )}
                                    </div>

                                    {/* → Warning Message (Role-based) */}
                                    <div className="bg-red-50 border border-red-400 p-2 rounded-sm flex items-center gap-2 justify-between">
                                        <div className="text-sm text-red-600 max-w-80">
                                            {`${STATIC_TEXTS.OUTCOMES.ADD_GOAL_SET_WARNING} Jakson Resource Center`}
                                        </div>
                                        <Icon
                                            icon="mdi:lock"
                                            width="18"
                                            height="18"
                                            className="text-red-600"
                                        />
                                    </div>

                                    {/* → Visibility Settings (Role-based) */}
                                    <div className="bg-red-50 border border-red-400 p-2 rounded-sm flex items-center gap-2 justify-between">
                                        <div className="grow flex items-center gap-3">
                                            <div className="text-sm text-red-600 whitespace-nowrap">
                                                {STATIC_TEXTS.OUTCOMES.VISIBLE_TO}
                                            </div>
                                            <select
                                                name="visibleTo"
                                                className="w-60 p-2 bg-white border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
                                                value={values.visibleTo}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                            >
                                                {GOAL_SET_VISIBLE_TO.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <Icon
                                            icon="mdi:lock"
                                            width="18"
                                            height="18"
                                            className="text-red-600"
                                        />
                                    </div>

                                    {/* → Information Banner */}
                                    <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-400 rounded-md">
                                        <Icon
                                            icon="mdi:information"
                                            width="18"
                                            height="18"
                                            className="text-blue-300"
                                        />
                                        <div className="text-sm text-blue-600">
                                            <p>You can only edit the title, status, and visibility settings. Goals and sections cannot be modified in this view.</p>
                                        </div>
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

// ============================================================================
// 🚀 EXPORT
// ============================================================================
export default memo(UpdateGoalSetModal); 