import React, { useState, lazy, Suspense, memo, useEffect } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import Loader from "@ui/Loader";
import { ERROR_MESSAGES, STATIC_TEXTS } from "@/utils/textConstants";
import type {
  AddEventModalProps,
  EventActivity,
  EventData,
  EventLocation,
  EventTypeData,
} from "@/types";
import * as Yup from "yup";
import { FormikProvider, useFormik, type FormikTouched } from "formik";
import type { UserData } from "@/types/user";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { errorMsg } from "@/utils/formikHelpers";
import {
  ALLOWED_FILE_TYPES,
  BLOCKED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_MB,
} from "@/utils/constants";
import { toZonedTime } from "date-fns-tz";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

type OnSubmitType = ((id: string, data: any) => void) | ((data: any) => void);

interface EventModalProps extends AddEventModalProps {
  eventData?: EventData | null;
  locationsData: EventLocation[];
  eventTypes: EventTypeData[];
  agents: UserData[];
  activities: EventActivity[];
  onSubmit: OnSubmitType;
}

const TABS = ["Event Info", "Activities"];
const EventInfoForm = lazy(() => import("@/components/addEvent/EventInfoForm"));
const EventActivitiesForm = lazy(
  () => import("@/components/addEvent/EventActivitiesForm")
);

const MemoizedEventInfoForm = memo(EventInfoForm);
const MemoizedEventActivitiesForm = memo(EventActivitiesForm);

const tabFieldMap = {
  0: [
    "location",
    "eventType",
    "title",
    "description",
    "dateTime",
    "facilitator",
    "attachment",
  ],
  1: ["donateItems", "donateMonetary", "testEvent", "volunteer"],
};

export interface EventFile {
  filename: string;
  url: string;
  fileSize?: number;
}

export interface DynamicFieldValues {
  [key: string]: string | number | boolean | File | EventFile | Date | null;
}

export interface EventFormValues extends DynamicFieldValues {
  location: string;
  eventType: string;
  title: string;
  description: string;
  dateTime: string | Date | null;
  facilitator: string;
  attachment: File | string | EventFile | null;
}

const validationSchema = Yup.object({
  location: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  eventType: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  title: Yup.string().required("Event title is required"),
  description: Yup.string(),
  dateTime: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  facilitator: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  attachment: Yup.mixed()
    .nullable()
    .test(
      "fileSize",
      ERROR_MESSAGES.FORM.FILE_SIZE_EXCEEDS(MAX_FILE_SIZE_MB),
      (value: any) => {
        if (!value) return true;
        if (typeof value === "string") return true;
        if (typeof value === "object" && value !== null && "url" in value)
          return true;
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
        if (typeof value === "object" && value !== null && "url" in value)
          return true;
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
    ),
});

const AddEventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventData,
  locationsData,
  eventTypes,
  agents,
  activities,
  onSubmit,
}) => {
  const user = useSelector((state: RootState) => state.user.data);
  const [tab, setTab] = useState(0);
  const [dynamicFields, setDynamicFields] = useState<
    Record<string, number | boolean>
  >({});

  useEffect(() => {
    if (eventData?.activities) {
      const fields = eventData.activities.reduce(
        (acc: Record<string, number | boolean>, activity) => {
          if (activity.activityId?._id) {
            acc[activity.activityId._id] = activity.value;
          }
          return acc;
        },
        {}
      );
      setDynamicFields(fields);
    }
  }, [eventData]);

  const getInitialAttachment = () => {
    if (!eventData?.file) return null;
    if (typeof eventData.file === "object" && "url" in eventData.file) {
      // Do not set as initial value if it's an object (not File)
      return eventData.file;
    }
    return null;
  };

  // Helper function to parse dateTime string to Date object
  const parseDateTimeString = (dateTimeString: string) => {
    if (!dateTimeString || typeof dateTimeString !== "string") return null;

    try {
      const date = new Date(dateTimeString);
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date;
      }
      return null;
    } catch (error) {
      console.warn("Error parsing dateTime string:", dateTimeString, error);
      return null;
    }
  };

  const initialValues: EventFormValues | DynamicFieldValues = {
    location: eventData?.location?._id || "",
    eventType: eventData?.eventType._id || "",
    title: eventData?.title || "",
    description: eventData?.description || "",
    dateTime: eventData?.dateTime
      ? parseDateTimeString(eventData.dateTime)
      : null,
    facilitator:
      eventData?.facilitator?._id ||
      agents.find((a) => a.userId === user?.userId)?._id ||
      "",
    attachment: getInitialAttachment(),
    ...dynamicFields,
  };

  const formik = useFormik<EventFormValues | DynamicFieldValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const activitiesPayload: any = activities.map((activity) => ({
        activityId: activity._id,
        value: (activity.type === "decimal_number"
          ? parseFloat(values[activity._id]?.toString() || "0").toFixed(2)
          : values[activity._id]) as number | boolean,
      }));
      const formData = new FormData();
      formData.append("location", values.location as string);
      formData.append("eventType", values.eventType as string);
      formData.append("title", values.title as string);
      formData.append("description", values.description as string);
      formData.append(
        "dateTime",
        values.dateTime instanceof Date
          ? toZonedTime(values.dateTime, userTimeZone).toISOString()
          : toZonedTime(values.dateTime as string, userTimeZone).toISOString()
      );
      formData.append("facilitator", values.facilitator as string);
      // Only append file if it's a File instance and not an empty object
      if (values.attachment instanceof File) {
        formData.append("file", values.attachment);
      }
      formData.append("activities", JSON.stringify(activitiesPayload));

      if (eventData?._id) {
        await (onSubmit as (id: string, data: any) => void)(
          eventData?._id,
          formData
        );
      } else {
        await (onSubmit as (data: any) => void)(formData);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = await formik.validateForm();

    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];

      for (const [tabIndex, fields] of Object.entries(tabFieldMap)) {
        if (fields.includes(firstErrorField)) {
          setTab(Number(tabIndex));
          break;
        }
      }

      const touchedFields = Object.keys(errors).reduce((acc, key) => {
        acc[key as keyof EventFormValues] = true as any;
        return acc;
      }, {} as FormikTouched<EventFormValues>);

      formik.setTouched(touchedFields, true);
      return;
    }

    formik.handleSubmit();
  };

  const footerContent = (
    <>
      <Button
        variant="submitStyle"
        label={eventData ? "Save Changes" : STATIC_TEXTS.COMMON.ADD}
        type="submit"
        form="add-event-form"
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

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      title={
        eventData
          ? `${STATIC_TEXTS.COMMON.EDIT} Event`
          : `${STATIC_TEXTS.COMMON.ADD} Event`
      }
      footer={footerContent}
      widthClass="max-w-xl"
      noPadding={true}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <FormikProvider value={formik}>
            <form
              id="add-event-form"
              onSubmit={handleSubmit}
              autoComplete="off"
              className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto"
            >
              <div className="bg-purpleLight rounded-lg p-2 md:p-6">
                <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
                  {TABS.map((t, i) => (
                    <button
                      key={t}
                      className={`px-3 md:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer text-sm md:text-base
                       ${
                         tab === i
                           ? "bg-transparent text-purple border-b-2 border-purple"
                           : "bg-purpleLight text-gray-600"
                       }`}
                      onClick={() => setTab(i)}
                      type="button"
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Suspense fallback={<Loader />}>
                  {tab === 0 && (
                    <MemoizedEventInfoForm
                      formik={formik}
                      errorMsg={errorMsg}
                      locationsData={locationsData}
                      eventTypes={eventTypes}
                      agents={agents}
                    />
                  )}
                  {tab === 1 && (
                    <MemoizedEventActivitiesForm
                      formik={formik}
                      activities={activities}
                    />
                  )}
                </Suspense>
              </div>
            </form>
          </FormikProvider>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default memo(AddEventModal);
