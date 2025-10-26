import type { RootState } from "@/redux/store";
import type {
  ICaseOutcome,
  ICaseOutcomeSection,
  IGoalStep,
  IOutcomeGoal,
  IOutcomeGoalsBySectionResponse,
} from "@/services/CaseApi";
import {
  getOutcomeGoalsByOutcomeAndSection,
  updateOutcomeGoalsForSection,
} from "@/services/CaseApi";
import { getOutcomeStatuses } from "@/services/OutcomesApi";
import { getUsersWithoutPagination } from "@/services/UserApi";
import type { AddEventModalProps, EventData } from "@/types";
import type { GHLUserData, UserData } from "@/types/user";
import {
  datePartsToISOString,
  parseDateStringToParts,
} from "@/utils/date-helpers";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { Field, FieldArray, FormikProvider, useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import Button from "../ui/Button";
import GroupedUserSelect from "../ui/GroupedUserSelect";
import Loader from "../ui/Loader";
import ModalWrapper from "../ui/ModalWrapper";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import GoalRemoveCOnfirmationModal from "./GoalRemoveCOnfirmationModal";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface UpdateOutcomeGoalFormValues {
  goals: IOutcomeGoal[];
}

const validationSchema = Yup.object({
  goals: Yup.array().of(
    Yup.object({
      _id: Yup.string(),
      name: Yup.string(),
      status: Yup.string(),
      dueDate: Yup.object({
        day: Yup.string().matches(
          /^(0?[1-9]|[12][0-9]|3[01])$/,
          "Invalid Date"
        ),
        month: Yup.string().matches(/^(0?[1-9]|1[0-2])$/, "Invalid Date"),
        year: Yup.string().matches(
          /^(19\d{2}|20[0-2]\d|203[0-5])$/,
          "Year must be between 1900 and 2035"
        ),
      }).nullable(),
      emailNotification: Yup.string(),
      isCustom: Yup.boolean(),
      steps: Yup.array().of(
        Yup.object({
          _id: Yup.string(),
          name: Yup.string(),
          isComplete: Yup.boolean(),
          dueDate: Yup.object({
            day: Yup.string().matches(
              /^(0?[1-9]|[12][0-9]|3[01])$/,
              "Invalid Date"
            ),
            month: Yup.string().matches(/^(0?[1-9]|1[0-2])$/, "Invalid Date"),
            year: Yup.string().matches(
              /^(19\d{2}|20[0-2]\d|203[0-5])$/,
              "Year must be between 1900 and 2035"
            ),
          }).nullable(),
          emailNotification: Yup.string(),
        })
      ),
    })
  ),
});

// Fix OnSubmitType to avoid 'any'
type OnSubmitType =
  | ((id: string, data: unknown) => void)
  | ((data: unknown) => void);

interface UpdateOutcomeGoalModalProps extends AddEventModalProps {
  outcomeGoalData?: EventData | null;
  selectedOutcome?: ICaseOutcome | null;
  selectedSection?: ICaseOutcomeSection | null;
  onSubmit: OnSubmitType;
}

// Helper: Map Formik values to API payload

function mapUnifiedGoalToApiPayload(
  goal: IOutcomeGoal,
  currentUser: GHLUserData | null
) {
  // Find agent for goal emailNotification
  let emailNotifications = undefined;
  if (goal.emailNotification) {
    if (goal.emailNotification === "myself" && currentUser) {
      emailNotifications = currentUser.userId;
    } else {
      emailNotifications = goal.emailNotification;
    }
  }
  return {
    ...(goal.isCustom ? {} : { goal: goal._id }),
    goalName: goal.name,
    isCustom: goal.isCustom,
    status: goal.status,
    dueDate: goal.dueDate ? datePartsToISOString(goal.dueDate) : null,
    steps: (goal.steps || []).map((step) => {
      let stepEmailNotifications = undefined;
      if (step.emailNotification) {
        if (step.emailNotification === "myself" && currentUser) {
          stepEmailNotifications = currentUser.userId;
        } else {
          stepEmailNotifications = step.emailNotification;
        }
      }
      return {
        stepName: step.name,
        complete: step.isComplete,
        dueDate: step.dueDate ? datePartsToISOString(step.dueDate) : null,
        emailNotifications: stepEmailNotifications,
      };
    }),
    emailNotifications,
  };
}

const UpdateOutcomeGoalModal = ({
  isOpen,
  onClose,
  selectedOutcome,
  selectedSection,
  onSubmit,
}: Omit<UpdateOutcomeGoalModalProps, "outcomeGoalData">) => {
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<UserData[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [statuses, setStatuses] = useState<{ _id: string; name: string }[]>([]);
  const user = useSelector((state: RootState) => state.user.data);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{
    values: UpdateOutcomeGoalFormValues;
    notApplicableGoals: IOutcomeGoal[];
  } | null>(null);

  const initialValues: UpdateOutcomeGoalFormValues = {
    goals: [
      {
        _id: "1",
        name: "Apply for Job Skills Training",
        status: "2",
        dueDate: { day: "12", month: "4", year: "2025" },
        emailNotification: "3",
        isCustom: false,
        steps: [
          {
            _id: "1",
            name: "Demo",
            isComplete: false,
            dueDate: { day: "12", month: "4", year: "2025" },
            emailNotification: "4",
          },
        ],
      },
    ],
  };

  // Helper function to map Formik values to API payload (moved inside component to access statuses)
  const mapFormikToApiPayload = (
    values: UpdateOutcomeGoalFormValues,
    currentUser: GHLUserData | null
  ) => {
    // Filter out goals with "Not Applicable" status
    const applicableGoals = values.goals.filter((goal) => {
      // Find the status object to check if it's "Not Applicable"
      const statusObj = statuses?.find((s) => s._id === goal.status);
      return statusObj?.name !== "Not Applicable";
    });

    return {
      goals: applicableGoals.map((goal) =>
        mapUnifiedGoalToApiPayload(goal as IOutcomeGoal, currentUser)
      ),
    };
  };

  // Helper function to check if a goal is marked as "Not Applicable"
  const isGoalNotApplicable = (goal: IOutcomeGoal) => {
    const statusObj = statuses?.find((s) => s._id === goal.status);
    return statusObj?.name === "Not Applicable";
  };

  // Helper function to check if a custom goal is blank
  const isCustomGoalBlank = (goal: IOutcomeGoal) => {
    return goal.isCustom && (!goal.name || goal.name.trim() === "");
  };

  // Helper function to check if there are any blank custom goals
  const hasBlankCustomGoals = (goals: IOutcomeGoal[]) => {
    return goals.some((goal) => isCustomGoalBlank(goal));
  };

  // Handler for status change - show warning if "Not Applicable" is selected
  const handleStatusChange = (index: number, newStatus: string) => {
    const statusObj = statuses?.find((s) => s._id === newStatus);
    if (statusObj?.name === "Not Applicable") {
      // Show warning instead of immediately removing
      toast.warning(
        "This goal is marked as 'Not Applicable' and will be excluded from the section. Please update the goal details if you want to include it.",
        {
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
        }
      );
      // Update the status to "Not Applicable" but keep the goal in the form
      formik.setFieldValue(`goals[${index}].status`, newStatus);
    } else {
      // Update the status normally
      formik.setFieldValue(`goals[${index}].status`, newStatus);
    }
  };

  // Function to handle actual submission after confirmation
  const handleConfirmedSubmit = async () => {
    if (!pendingSubmit) return;

    const { values, notApplicableGoals } = pendingSubmit;

    // Remove "Not Applicable" goals from the form values
    const filteredGoals = values.goals.filter((goal) => {
      return !notApplicableGoals.includes(goal);
    });

    // Update the form with filtered goals (removing "Not Applicable" goals)
    formik.setFieldValue("goals", filteredGoals);

    // Create payload with filtered goals
    const updatedValues = { ...values, goals: filteredGoals };
    const payload = mapFormikToApiPayload(updatedValues, user);

    if (selectedOutcome?._id && selectedSection?.section && user?.userId) {
      setSubmitLoading(true);
      try {
        await updateOutcomeGoalsForSection(
          selectedOutcome._id,
          selectedSection.section,
          payload as unknown as IOutcomeGoalsBySectionResponse,
          user.userId
        );
        toast.success("Section goals updated successfully");
        onSubmit(selectedOutcome._id, payload);
        onClose();
      } catch (error: unknown) {
        if (typeof error === "object" && error && "toString" in error) {
          toast.error(
            (error as { toString: () => string }).toString() ||
              "Failed to update outcome goals"
          );
        } else {
          toast.error("Failed to update outcome goals");
        }
      } finally {
        setSubmitLoading(false);
      }
    } else if (selectedOutcome?._id) {
      (onSubmit as (id: string, data: unknown) => void)(
        selectedOutcome._id,
        payload
      );
    } else {
      (onSubmit as (data: unknown) => void)(payload);
    }

    // Close the confirmation modal
    setShowConfirmModal(false);
    setPendingSubmit(null);
  };

  // Function to cancel the confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmModal(false);
    setPendingSubmit(null);
  };

  const formik = useFormik<UpdateOutcomeGoalFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // Check if there are any blank custom goals
      if (hasBlankCustomGoals(values.goals)) {
        toast.error(
          "Please fill in the names for all custom goals before saving."
        );
        return;
      }

      // Check if there are any goals marked as "Not Applicable"
      const notApplicableGoals = values.goals.filter(
        (goal) => isGoalNotApplicable(goal) || goal.status === ""
      );

      if (notApplicableGoals.length > 0) {
        setPendingSubmit({ values, notApplicableGoals });
        setShowConfirmModal(true);
        return;
      }

      // If no "Not Applicable" goals, proceed with normal submission
      const payload = mapFormikToApiPayload(values, user);
      if (selectedOutcome?._id && selectedSection?.section && user?.userId) {
        setSubmitLoading(true);
        try {
          await updateOutcomeGoalsForSection(
            selectedOutcome._id,
            selectedSection.section,
            payload as unknown as IOutcomeGoalsBySectionResponse,
            user.userId
          );
          toast.success("Section goals updated successfully");
          onSubmit(selectedOutcome._id, payload);
          onClose();
        } catch (error: unknown) {
          if (typeof error === "object" && error && "toString" in error) {
            toast.error(
              (error as { toString: () => string }).toString() ||
                "Failed to update outcome goals"
            );
          } else {
            toast.error("Failed to update outcome goals");
          }
        } finally {
          setSubmitLoading(false);
        }
      } else if (selectedOutcome?._id) {
        (onSubmit as (id: string, data: unknown) => void)(
          selectedOutcome._id,
          payload
        );
      } else {
        (onSubmit as (data: unknown) => void)(payload);
      }
    },
  });

  const fetchAgents = async () => {
    if (!user?.activeLocation || !user?.userId) return;
    setIsLoading(true);
    try {
      const response = await getUsersWithoutPagination(
        user.userId,
        user.activeLocation
      );
      setAgents(response.data || []);
    } catch (error: unknown) {
      if (typeof error === "object" && error && "data" in error) {
        toast.error(
          (error as { data?: { message?: string } })?.data?.message ||
            "Failed to fetch agents"
        );
      } else {
        toast.error("Failed to fetch agents");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to map API goal to Formik OutcomeGoal
  function mapApiGoalToUnifiedGoal(
    apiGoal: unknown,
    currentUser: GHLUserData | null
  ): IOutcomeGoal {
    const goal = apiGoal as Record<string, unknown>;
    // Safely extract fields with type guards
    const _id =
      typeof goal.goal === "string"
        ? goal.goal
        : typeof goal._id === "string"
        ? goal._id
        : "";
    const name =
      typeof goal.goalName === "string"
        ? goal.goalName
        : typeof goal.name === "string"
        ? goal.name
        : "";
    let status = "";
    if (typeof goal.statusId === "string") {
      status = goal.statusId;
    } else if (
      goal.status &&
      typeof goal.status === "object" &&
      "_id" in goal.status &&
      typeof (goal.status as Record<string, unknown>)._id === "string"
    ) {
      status = (goal.status as Record<string, unknown>)._id as string;
    } else if (typeof goal.status === "string") {
      status = goal.status;
    }
    // if (!status && Array.isArray(statuses)) {
    //   const notApplicable = statuses.find((s) => s.name === "Not Applicable");
    //   if (notApplicable) status = notApplicable._id;
    // }
    const dueDate =
      typeof goal.dueDate === "string"
        ? parseDateStringToParts(goal.dueDate)
        : null;
    let emailNotification = "";
    if (
      goal.emailNotifications &&
      typeof goal.emailNotifications === "object"
    ) {
      const notif = goal.emailNotifications as Record<string, unknown>;
      if (typeof notif.userId === "string") {
        if (currentUser && notif.userId === currentUser.userId) {
          emailNotification = "myself";
        } else {
          emailNotification = notif.userId;
        }
      }
    }
    const isCustom = !!goal.isCustom;
    let steps: IGoalStep[] = [];
    if (Array.isArray(goal.steps)) {
      steps = goal.steps.map((step: unknown, idx: number) => {
        const s = step as Record<string, unknown>;
        const _id = typeof s._id === "string" ? s._id : String(idx);
        const name =
          typeof s.stepName === "string"
            ? s.stepName
            : typeof s.name === "string"
            ? s.name
            : "";
        const isComplete =
          typeof s.complete === "boolean"
            ? s.complete
            : typeof s.isComplete === "boolean"
            ? s.isComplete
            : false;
        const dueDate =
          typeof s.dueDate === "string"
            ? parseDateStringToParts(s.dueDate)
            : null;
        let stepEmailNotification = "";
        if (s.emailNotifications && typeof s.emailNotifications === "object") {
          const notif = s.emailNotifications as Record<string, unknown>;
          if (typeof notif.userId === "string") {
            if (currentUser && notif.userId === currentUser.userId) {
              stepEmailNotification = "myself";
            } else {
              stepEmailNotification = notif.userId;
            }
          }
        }
        return {
          _id,
          name,
          isComplete,
          dueDate,
          emailNotification: stepEmailNotification,
        } as IGoalStep;
      });
    }
    return {
      _id,
      name,
      status,
      dueDate,
      emailNotification,
      isCustom,
      steps,
    } as IOutcomeGoal;
  }

  // Fetch goals by section
  const fetchSectionGoals = async () => {
    if (!selectedSection?.section) {
      toast.error("No section data available");
      return;
    }

    setGoalsLoading(true);

    try {
      if (!selectedOutcome?._id || !selectedSection?.section) return;
      const data = await getOutcomeGoalsByOutcomeAndSection(
        selectedOutcome._id,
        selectedSection.section
      );
      const goals = (data.goals || []).map((goal) =>
        mapApiGoalToUnifiedGoal(goal, user)
      );
      formik.setValues({ goals });
    } catch {
      toast.error("Failed to fetch section goals");
    } finally {
      setGoalsLoading(false);
    }
  };

  // Fetch statuses from API
  const fetchStatuses = async () => {
    if (!user?.userId) return;
    try {
      const data = await getOutcomeStatuses(user?.userId);
      setStatuses(data || []);
    } catch {
      toast.error("Failed to fetch statuses");
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (isOpen && selectedSection) {
      fetchSectionGoals();
      fetchStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedSection]);

  const { values, setFieldValue } = formik;
  const MAX_GOALS_USER_CAN_ADD = 3;

  const footerContent = (
    <>
      <Button
        icon="mdi:plus-circle"
        variant="submitStyle"
        label={STATIC_TEXTS.COMMON.SAVE_CHANGES}
        type="submit"
        form="update-outcome-goal-form"
        disabled={submitLoading || hasBlankCustomGoals(values.goals)}
      />
      <Button
        onClick={() => {
          formik.resetForm();
          onClose();
        }}
        label={STATIC_TEXTS.COMMON.CANCEL}
        disabled={submitLoading}
      />
    </>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      title={STATIC_TEXTS.OUTCOMES.UPDATE_OUTCOME_GOALS}
      footer={footerContent}
      widthClass="max-w-4xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <FormikProvider value={formik}>
            <h1 className="text-2xl text-gray-800 font-bold mb-2">
              {selectedSection?.sectionName || "Outcome Goals"}
            </h1>
            {isLoading || goalsLoading ? (
              <Loader />
            ) : (
              <form
                id="update-outcome-goal-form"
                autoComplete="off"
                className="bg-white max-h-[60vh] overflow-y-auto"
                onSubmit={formik.handleSubmit}
              >
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <table className="w-full min-w-[300px] overflow-x-auto table-auto border border-purple">
                    <thead>
                      <tr className="bg-purple-100">
                        <th className="text-start px-3 py-2 uppercase text-sm border-r border-purple">
                          {STATIC_TEXTS.OUTCOMES.GOALS}
                        </th>
                        <th className="px-3 py-2 uppercase text-sm border-r border-purple">
                          {STATIC_TEXTS.OUTCOMES.STATUS}
                        </th>
                        <th className="px-3 py-2 uppercase text-sm border-r border-purple">
                          {STATIC_TEXTS.OUTCOMES.DUE_DATE}
                        </th>
                        <th className="px-3 py-2 uppercase text-sm border-r border-purple">
                          {STATIC_TEXTS.OUTCOMES.EMAIL_NOTIFICATIONS}
                        </th>
                        <th className="px-3 py-2 uppercase text-sm">
                          {STATIC_TEXTS.OUTCOMES.STEPS}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-800">
                      <FieldArray name="goals">
                        {({ push, remove }) => (
                          <>
                            {values.goals.map((goal, index) => (
                              <React.Fragment
                                key={`${goal._id || "goal"}-${index}`}
                              >
                                <tr
                                  className={`border-t border-purple ${
                                    isGoalNotApplicable(goal)
                                      ? "bg-gray-100 opacity-60"
                                      : ""
                                  }`}
                                >
                                  <td className="px-3 py-2 border-r border-purple">
                                    {goal.isCustom ? (
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <Field
                                            name={`goals[${index}].name`}
                                            className={`w-full h-9 px-2 border-2 rounded text-sm ${
                                              isGoalNotApplicable(goal)
                                                ? "border-gray-400 bg-gray-50 text-gray-500"
                                                : isCustomGoalBlank(goal)
                                                ? "border-red-500 bg-red-50 text-red-700"
                                                : "border-gray-300 focus:border-purple-500"
                                            }`}
                                            value={goal.name ?? ""}
                                            placeholder={"Enter goal name"}
                                          />

                                          {/* Delete custom goal button */}
                                          <button
                                            type="button"
                                            aria-label="Delete custom goal"
                                            className="ml-1 p-1 rounded hover:bg-red-100"
                                            onClick={() => remove(index)}
                                            tabIndex={0}
                                          >
                                            <Icon
                                              icon="mdi:close"
                                              className="text-red-600"
                                              width={20}
                                              height={20}
                                            />
                                          </button>
                                        </div>
                                        {isCustomGoalBlank(goal) && (
                                          <div className="text-xs text-start w-full text-red-600 mt-1">
                                            Goal name is required
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span
                                        className={
                                          isGoalNotApplicable(goal)
                                            ? "text-gray-500"
                                            : ""
                                        }
                                      >
                                        {goal.name}
                                      </span>
                                    )}
                                    {isGoalNotApplicable(goal) && (
                                      <div className="text-xs text-orange-600 mt-1 font-medium">
                                        ⚠️ This goal will be excluded from the
                                        section
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 border-r border-purple">
                                    <Field
                                      as="select"
                                      name={`goals[${index}].status`}
                                      className="w-full h-9 p-2 border-2 border-gray-300 rounded focus:border-purple-500"
                                      value={goal?.status ?? ""}
                                      onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>
                                      ) =>
                                        handleStatusChange(
                                          index,
                                          e.target.value
                                        )
                                      }
                                    >
                                      {statuses?.map((option) => (
                                        <option
                                          key={option?._id}
                                          value={option?._id}
                                        >
                                          {option?.name}
                                        </option>
                                      ))}
                                    </Field>
                                  </td>
                                  <td className="px-3 py-2 border-r border-purple">
                                    <DatePicker
                                      selected={
                                        goal.dueDate &&
                                        goal.dueDate.year &&
                                        goal.dueDate.month &&
                                        goal.dueDate.day
                                          ? (() => {
                                              try {
                                                const dateString = `${
                                                  goal.dueDate.year
                                                }-${goal.dueDate.month.padStart(
                                                  2,
                                                  "0"
                                                )}-${goal.dueDate.day.padStart(
                                                  2,
                                                  "0"
                                                )}`;
                                                const date = toZonedTime(
                                                  dateString,
                                                  userTimeZone
                                                );
                                                return date instanceof Date &&
                                                  !isNaN(date.getTime())
                                                  ? date
                                                  : null;
                                              } catch (error) {
                                                console.warn(
                                                  "Error parsing goal due date:",
                                                  goal.dueDate,
                                                  error
                                                );
                                                return null;
                                              }
                                            })()
                                          : null
                                      }
                                      onChange={(date: Date | null) => {
                                        if (date) {
                                          setFieldValue(
                                            `goals[${index}].dueDate`,
                                            {
                                              day: formatDate(date, "dd"),
                                              month: formatDate(date, "MM"),
                                              year: formatDate(date, "yyyy"),
                                            }
                                          );
                                        } else {
                                          setFieldValue(
                                            `goals[${index}].dueDate`,
                                            null
                                          );
                                        }
                                      }}
                                      dateFormat="MM-dd-yyyy"
                                      placeholderText="MM-DD-YYYY"
                                      className="w-full h-9 p-2 border-2 !border-gray-300 rounded focus:!border-purple"
                                      minDate={new Date()}
                                      wrapperClassName="w-full"
                                      showYearDropdown
                                      dropdownMode="select"
                                      popperProps={{
                                        strategy: "absolute",
                                        placement: "bottom-start",
                                      }}
                                    />
                                  </td>
                                  <td className="px-3 py-2 border-r border-purple">
                                    <GroupedUserSelect
                                      name={`goals[${index}].emailNotification`}
                                      users={agents}
                                      disabled={
                                        !goal.dueDate?.month ||
                                        !goal.dueDate?.day ||
                                        !goal.dueDate?.year
                                      }
                                      className="disabled:bg-gray-100 disabled:text-gray-400 w-full h-9 p-2 border-2 border-gray-300 rounded focus:border-purple-500"
                                      value={goal.emailNotification ?? ""}
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const goalSteps =
                                          values.goals[index].steps || [];
                                        const newStep = {
                                          _id: String(Date.now()),
                                          name: "",
                                          isComplete: false,
                                          dueDate: null,
                                          emailNotification: "",
                                        };
                                        const updatedSteps = [
                                          ...goalSteps,
                                          newStep,
                                        ];
                                        setFieldValue(
                                          `goals[${index}].steps`,
                                          updatedSteps
                                        );
                                      }}
                                    >
                                      <Icon
                                        icon="mdi:plus-circle"
                                        className="text-green-600"
                                        width={22}
                                        height={22}
                                      />
                                    </button>
                                  </td>
                                </tr>
                                <FieldArray name={`goals[${index}].steps`}>
                                  {({ remove }) => (
                                    <>
                                      {(goal.steps || []).map(
                                        (
                                          step: IGoalStep,
                                          stepIndex: number
                                        ) => (
                                          <tr
                                            key={step?._id || stepIndex}
                                            className="border-t border-purple"
                                          >
                                            {/* Step Name */}
                                            <td className="px-3 py-2 border-r border-purple">
                                              <Field
                                                name={`goals[${index}].steps[${stepIndex}].name`}
                                                className="w-full h-9 px-2 border-2 border-gray-300 rounded focus:border-purple-500 text-sm"
                                                value={step.name ?? ""}
                                              />
                                            </td>

                                            {/* Completion Checkbox */}
                                            <td className="px-3 py-2 border-r border-purple">
                                              <label className="flex items-center justify-center gap-1 text-sm">
                                                <Field
                                                  type="checkbox"
                                                  name={`goals[${index}].steps[${stepIndex}].isComplete`}
                                                  className="w-4 h-4"
                                                  checked={!!step.isComplete}
                                                />
                                                Complete
                                              </label>
                                            </td>

                                            {/* Due Date (MM-DD-YYYY) */}
                                            <td className="px-3 py-2 border-r border-purple">
                                              <DatePicker
                                                selected={
                                                  step.dueDate &&
                                                  step.dueDate.year &&
                                                  step.dueDate.month &&
                                                  step.dueDate.day
                                                    ? (() => {
                                                        try {
                                                          const dateString = `${
                                                            step.dueDate.year
                                                          }-${step.dueDate.month.padStart(
                                                            2,
                                                            "0"
                                                          )}-${step.dueDate.day.padStart(
                                                            2,
                                                            "0"
                                                          )}`;
                                                          const date =
                                                            toZonedTime(
                                                              dateString,
                                                              userTimeZone
                                                            );
                                                          return date instanceof
                                                            Date &&
                                                            !isNaN(
                                                              date.getTime()
                                                            )
                                                            ? date
                                                            : null;
                                                        } catch (error) {
                                                          console.warn(
                                                            "Error parsing step due date:",
                                                            step.dueDate,
                                                            error
                                                          );
                                                          return null;
                                                        }
                                                      })()
                                                    : null
                                                }
                                                onChange={(
                                                  date: Date | null
                                                ) => {
                                                  if (date) {
                                                    setFieldValue(
                                                      `goals[${index}].steps[${stepIndex}].dueDate`,
                                                      {
                                                        day: formatDate(
                                                          date,
                                                          "dd"
                                                        ),
                                                        month: formatDate(
                                                          date,
                                                          "MM"
                                                        ),
                                                        year: formatDate(
                                                          date,
                                                          "yyyy"
                                                        ),
                                                      }
                                                    );
                                                  } else {
                                                    setFieldValue(
                                                      `goals[${index}].steps[${stepIndex}].dueDate`,
                                                      null
                                                    );
                                                  }
                                                }}
                                                dateFormat="MM-dd-yyyy"
                                                placeholderText="MM-dd-yyyy"
                                                className="w-full h-9 p-2 border-2 border-gray-300 rounded focus:border-purple-500"
                                                minDate={new Date()}
                                                wrapperClassName="w-full"
                                                showYearDropdown
                                                dropdownMode="select"
                                                popperProps={{
                                                  strategy: "absolute",
                                                  placement: "bottom-start",
                                                }}
                                              />
                                            </td>

                                            {/* Email Notification */}
                                            <td className="px-3 py-2 border-r border-purple">
                                              <GroupedUserSelect
                                                name={`goals[${index}].steps[${stepIndex}].emailNotification`}
                                                users={agents}
                                                disabled={
                                                  !step.dueDate?.month ||
                                                  !step.dueDate?.day ||
                                                  !step.dueDate?.year
                                                }
                                                className="disabled:bg-gray-100 disabled:text-gray-400 w-full h-9 p-2 border-2 border-gray-300 rounded focus:border-purple-500"
                                                value={
                                                  step.emailNotification ?? ""
                                                }
                                              />
                                            </td>

                                            {/* Remove Step */}
                                            <td className="text-center">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  remove(stepIndex)
                                                }
                                              >
                                                <Icon
                                                  icon="mdi:close"
                                                  className="text-red-600"
                                                  width={22}
                                                  height={22}
                                                />
                                              </button>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </>
                                  )}
                                </FieldArray>
                              </React.Fragment>
                            ))}
                            <tr className="bg-purple-100 border-t border-purple">
                              <td colSpan={5} className="px-3 py-2">
                                <>
                                  {values.goals.filter((g) => g.isCustom)
                                    .length < MAX_GOALS_USER_CAN_ADD ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        push({
                                          _id: String(Date.now()),
                                          name: "",
                                          status: "",
                                          dueDate: null,
                                          emailNotification: "",
                                          isCustom: true,
                                          steps: [],
                                        })
                                      }
                                      className="flex items-center gap-1"
                                    >
                                      <Icon
                                        icon="mdi:plus-circle"
                                        width={18}
                                        height={18}
                                        className="text-green-600"
                                      />
                                      <span className="uppercase text-xs underline font-semibold">
                                        {STATIC_TEXTS.OUTCOMES.ADD_CUSTOM_GOALS}
                                      </span>
                                    </button>
                                  ) : (
                                    <span className="text-xs text-red-500 font-semibold">
                                      You can add a maximum of{" "}
                                      {MAX_GOALS_USER_CAN_ADD} custom goals.
                                    </span>
                                  )}
                                </>
                              </td>
                            </tr>
                          </>
                        )}
                      </FieldArray>
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden">
                  <FieldArray name="goals">
                    {({ push, remove }) => (
                      <div className="space-y-4">
                        {values.goals.map((goal, index) => (
                          <div
                            key={`${goal._id || "goal"}-${index}`}
                            className={`border rounded-lg p-4 shadow-sm ${
                              isGoalNotApplicable(goal)
                                ? "bg-gray-50 border-orange-300 opacity-75"
                                : "bg-white border-purple"
                            }`}
                          >
                            {/* Goal Header */}
                            <div className="flex items-center justify-between mb-3">
                              <h3
                                className={`text-lg font-semibold ${
                                  isGoalNotApplicable(goal)
                                    ? "text-gray-600"
                                    : "text-gray-800"
                                }`}
                              >
                                Goal {index + 1}
                                {isGoalNotApplicable(goal) && (
                                  <span className="ml-2 text-sm text-orange-600 font-normal">
                                    (Will be excluded)
                                  </span>
                                )}
                              </h3>
                              {goal.isCustom && (
                                <button
                                  type="button"
                                  aria-label="Delete custom goal"
                                  className="p-1 rounded hover:bg-red-100"
                                  onClick={() => remove(index)}
                                >
                                  <Icon
                                    icon="mdi:close"
                                    className="text-red-600"
                                    width={20}
                                    height={20}
                                  />
                                </button>
                              )}
                            </div>

                            {isGoalNotApplicable(goal) && (
                              <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                                <div className="flex items-center gap-2 text-sm text-orange-700">
                                  <Icon
                                    icon="mdi:alert-circle"
                                    width={16}
                                    height={16}
                                  />
                                  <span className="font-medium">
                                    This goal will be excluded from the section.
                                    Update the status if you want to include it.
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Goal Name */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {STATIC_TEXTS.OUTCOMES.GOALS}
                              </label>
                              {goal.isCustom ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Field
                                    name={`goals[${index}].name`}
                                    className={`w-full h-10 px-3 border-2 rounded text-sm ${
                                      isGoalNotApplicable(goal)
                                        ? "border-gray-400 bg-gray-50 text-gray-500"
                                        : isCustomGoalBlank(goal)
                                        ? "border-red-500 bg-red-50 text-red-700"
                                        : "border-gray-300 focus:border-purple-500"
                                    }`}
                                    value={goal.name ?? ""}
                                    placeholder={"Enter goal name"}
                                  />
                                  {isCustomGoalBlank(goal) && (
                                    <div className="text-xs text-red-600 mt-1">
                                      Goal name is required
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div
                                  className={`w-full h-10 px-3 border-2 rounded flex items-center text-sm ${
                                    isGoalNotApplicable(goal)
                                      ? "border-gray-300 bg-gray-100 text-gray-500"
                                      : "border-gray-200 bg-gray-50 text-gray-700"
                                  }`}
                                >
                                  {goal.name}
                                </div>
                              )}
                            </div>

                            {/* Status */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {STATIC_TEXTS.OUTCOMES.STATUS}
                              </label>
                              <Field
                                as="select"
                                name={`goals[${index}].status`}
                                className="w-full h-10 p-2 border-2 border-gray-300 rounded focus:border-purple-500"
                                value={goal?.status ?? ""}
                                onChange={(
                                  e: React.ChangeEvent<HTMLSelectElement>
                                ) => handleStatusChange(index, e.target.value)}
                              >
                                <option value="">Select status</option>
                                {statuses?.map((option) => (
                                  <option key={option?._id} value={option?._id}>
                                    {option?.name}
                                  </option>
                                ))}
                              </Field>
                            </div>

                            {/* Due Date */}
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {STATIC_TEXTS.OUTCOMES.DUE_DATE}
                              </label>
                              <DatePicker
                                selected={
                                  goal.dueDate &&
                                  goal.dueDate.year &&
                                  goal.dueDate.month &&
                                  goal.dueDate.day
                                    ? (() => {
                                        try {
                                          const dateString = `${
                                            goal.dueDate.year
                                          }-${goal.dueDate.month.padStart(
                                            2,
                                            "0"
                                          )}-${goal.dueDate.day.padStart(
                                            2,
                                            "0"
                                          )}`;
                                          const date = toZonedTime(
                                            dateString,
                                            userTimeZone
                                          );
                                          return date instanceof Date &&
                                            !isNaN(date.getTime())
                                            ? date
                                            : null;
                                        } catch (error) {
                                          console.warn(
                                            "Error parsing goal due date:",
                                            goal.dueDate,
                                            error
                                          );
                                          return null;
                                        }
                                      })()
                                    : null
                                }
                                onChange={(date: Date | null) => {
                                  if (date) {
                                    setFieldValue(`goals[${index}].dueDate`, {
                                      day: formatDate(date, "dd"),
                                      month: formatDate(date, "MM"),
                                      year: formatDate(date, "yyyy"),
                                    });
                                  } else {
                                    setFieldValue(
                                      `goals[${index}].dueDate`,
                                      null
                                    );
                                  }
                                }}
                                dateFormat="MM-dd-yyyy"
                                placeholderText="MM-DD-YYYY"
                                className="w-full h-10 p-2 border-2 !border-gray-300 rounded focus:!border-purple"
                                minDate={new Date()}
                                wrapperClassName="w-full"
                                showYearDropdown
                                dropdownMode="select"
                                popperProps={{
                                  strategy: "absolute",
                                  placement: "bottom-start",
                                }}
                              />
                            </div>

                            {/* Email Notification */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {STATIC_TEXTS.OUTCOMES.EMAIL_NOTIFICATIONS}
                              </label>
                              <GroupedUserSelect
                                name={`goals[${index}].emailNotification`}
                                users={agents}
                                disabled={
                                  !goal.dueDate?.month ||
                                  !goal.dueDate?.day ||
                                  !goal.dueDate?.year
                                }
                                className="disabled:bg-gray-100 disabled:text-gray-400 w-full h-10 p-2 border-2 border-gray-300 rounded focus:border-purple-500"
                                value={goal.emailNotification ?? ""}
                              />
                            </div>

                            {/* Steps Section */}
                            <div className="border-t border-gray-200 pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-md font-medium text-gray-800">
                                  {STATIC_TEXTS.OUTCOMES.STEPS}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const goalSteps =
                                      values.goals[index].steps || [];
                                    const newStep = {
                                      _id: String(Date.now()),
                                      name: "",
                                      isComplete: false,
                                      dueDate: null,
                                      emailNotification: "",
                                    };
                                    const updatedSteps = [
                                      ...goalSteps,
                                      newStep,
                                    ];
                                    setFieldValue(
                                      `goals[${index}].steps`,
                                      updatedSteps
                                    );
                                  }}
                                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                >
                                  <Icon
                                    icon="mdi:plus-circle"
                                    width={18}
                                    height={18}
                                  />
                                  <span className="text-sm font-medium">
                                    Add Step
                                  </span>
                                </button>
                              </div>

                              <FieldArray name={`goals[${index}].steps`}>
                                {({ remove }) => (
                                  <div className="space-y-3">
                                    {(goal.steps || []).map(
                                      (step: IGoalStep, stepIndex: number) => (
                                        <div
                                          key={step?._id || stepIndex}
                                          className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">
                                              Step {stepIndex + 1}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => remove(stepIndex)}
                                              className="p-1 rounded hover:bg-red-100"
                                            >
                                              <Icon
                                                icon="mdi:close"
                                                className="text-red-600"
                                                width={16}
                                                height={16}
                                              />
                                            </button>
                                          </div>

                                          {/* Step Name */}
                                          <div className="mb-2">
                                            <Field
                                              name={`goals[${index}].steps[${stepIndex}].name`}
                                              className="w-full h-9 px-2 border-2 border-gray-300 rounded focus:border-purple-500 text-sm"
                                              value={step.name ?? ""}
                                              placeholder="Enter step name"
                                            />
                                          </div>

                                          {/* Completion Checkbox */}
                                          <div className="mb-2">
                                            <label className="flex items-center gap-2 text-sm">
                                              <Field
                                                type="checkbox"
                                                name={`goals[${index}].steps[${stepIndex}].isComplete`}
                                                className="w-4 h-4"
                                                checked={!!step.isComplete}
                                              />
                                              <span className="font-medium text-gray-700">
                                                Complete
                                              </span>
                                            </label>
                                          </div>

                                          {/* Step Due Date */}
                                          <div className="mb-2">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Due Date
                                            </label>
                                            <DatePicker
                                              selected={
                                                step.dueDate &&
                                                step.dueDate.year &&
                                                step.dueDate.month &&
                                                step.dueDate.day
                                                  ? (() => {
                                                      try {
                                                        const dateString = `${
                                                          step.dueDate.year
                                                        }-${step.dueDate.month.padStart(
                                                          2,
                                                          "0"
                                                        )}-${step.dueDate.day.padStart(
                                                          2,
                                                          "0"
                                                        )}`;
                                                        const date =
                                                          toZonedTime(
                                                            dateString,
                                                            userTimeZone
                                                          );
                                                        return date instanceof
                                                          Date &&
                                                          !isNaN(date.getTime())
                                                          ? date
                                                          : null;
                                                      } catch (error) {
                                                        console.warn(
                                                          "Error parsing step due date:",
                                                          step.dueDate,
                                                          error
                                                        );
                                                        return null;
                                                      }
                                                    })()
                                                  : null
                                              }
                                              onChange={(date: Date | null) => {
                                                if (date) {
                                                  setFieldValue(
                                                    `goals[${index}].steps[${stepIndex}].dueDate`,
                                                    {
                                                      day: formatDate(
                                                        date,
                                                        "dd"
                                                      ),
                                                      month: formatDate(
                                                        date,
                                                        "MM"
                                                      ),
                                                      year: formatDate(
                                                        date,
                                                        "yyyy"
                                                      ),
                                                    }
                                                  );
                                                } else {
                                                  setFieldValue(
                                                    `goals[${index}].steps[${stepIndex}].dueDate`,
                                                    null
                                                  );
                                                }
                                              }}
                                              dateFormat="MM-dd-yyyy"
                                              placeholderText="MM-dd-yyyy"
                                              className="w-full h-9 p-2 border-2 border-gray-300 rounded focus:border-purple-500"
                                              minDate={new Date()}
                                              wrapperClassName="w-full"
                                              showYearDropdown
                                              dropdownMode="select"
                                              popperProps={{
                                                strategy: "absolute",
                                                placement: "bottom-start",
                                              }}
                                            />
                                          </div>

                                          {/* Step Email Notification */}
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Email Notification
                                            </label>
                                            <GroupedUserSelect
                                              name={`goals[${index}].steps[${stepIndex}].emailNotification`}
                                              users={agents}
                                              disabled={
                                                !step.dueDate?.month ||
                                                !step.dueDate?.day ||
                                                !step.dueDate?.year
                                              }
                                              className="disabled:bg-gray-100 disabled:text-gray-400 w-full h-9 p-2 border-2 border-gray-300 rounded focus:border-purple-500"
                                              value={
                                                step.emailNotification ?? ""
                                              }
                                            />
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </FieldArray>
                            </div>
                          </div>
                        ))}

                        {/* Add Custom Goal Button */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          {values.goals.filter((g) => g.isCustom).length <
                          MAX_GOALS_USER_CAN_ADD ? (
                            <button
                              type="button"
                              onClick={() =>
                                push({
                                  _id: String(Date.now()),
                                  name: "",
                                  status: "",
                                  dueDate: null,
                                  emailNotification: "",
                                  isCustom: true,
                                  steps: [],
                                })
                              }
                              className="flex items-center justify-center gap-2 w-full py-3 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                              <Icon
                                icon="mdi:plus-circle"
                                width={20}
                                height={20}
                              />
                              <span className="font-medium">
                                {STATIC_TEXTS.OUTCOMES.ADD_CUSTOM_GOALS}
                              </span>
                            </button>
                          ) : (
                            <div className="text-center text-sm text-red-500 font-medium">
                              You can add a maximum of {MAX_GOALS_USER_CAN_ADD}{" "}
                              custom goals.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </FieldArray>
                </div>
              </form>
            )}
          </FormikProvider>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && pendingSubmit && (
        <GoalRemoveCOnfirmationModal
          isOpen={showConfirmModal}
          onClose={handleCancelConfirmation}
          onConfirm={handleConfirmedSubmit}
          notApplicableGoals={pendingSubmit.notApplicableGoals}
          submitLoading={submitLoading}
        />
      )}
    </ModalWrapper>
  );
};

export default UpdateOutcomeGoalModal;
