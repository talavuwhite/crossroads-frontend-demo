import React, { useState, useEffect, lazy, Suspense, memo } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { format as formatDate, parse } from "date-fns";
import type {
  AddCaseFormValues,
  AddCaseModalProps,
  IncomeSource,
  Expense,
  CaseType,
} from "@/types/case";
import { createCase, fetchCaseById, updateCase } from "@/services/CaseApi";
import { toast } from "react-toastify";
import Button from "@ui/Button";
import Loader from "@ui/Loader";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { ERROR_MESSAGES, STATIC_TEXTS } from "@/utils/textConstants";
import { setCurrentCaseData } from "@/redux/caseSlice";
import { getNestedFieldState } from "@/utils/commonFunc";
import { phoneRegex, visibleTo, zipRegex } from "@/utils/constants";
import { markForRefresh } from "@/redux/caseListSlice";

// Helper function to convert yyyy-MM-dd to MM-dd-yyyy for DOB
const formatDobForUI = (dateString: string) => {
  if (!dateString || typeof dateString !== "string") return "";

  try {
    // Parse the yyyy-MM-dd format
    const date = parse(dateString, "yyyy-MM-dd", new Date());
    if (date instanceof Date && !isNaN(date.getTime())) {
      return formatDate(date, "MM-dd-yyyy");
    }
    return "";
  } catch (error) {
    console.warn("Error parsing DOB:", dateString, error);
    return "";
  }
};

// Helper function to convert MM-dd-yyyy back to yyyy-MM-dd for API
const formatDobForAPI = (dateString: string) => {
  if (!dateString || typeof dateString !== "string") return "";

  try {
    // Parse the MM-dd-yyyy format
    const date = parse(dateString, "MM-dd-yyyy", new Date());
    if (date instanceof Date && !isNaN(date.getTime())) {
      return formatDate(date, "yyyy-MM-dd");
    }
    return "";
  } catch (error) {
    console.warn("Error parsing DOB for API:", dateString, error);
    return "";
  }
};

interface CaseModalProps extends AddCaseModalProps {
  caseData?: CaseType | null;
}

const initialValues: AddCaseFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  maidenName: "",
  nickname: "",
  dob: "",
  ssn: "",
  headOfHousehold: false,
  dobDataQuality: "",
  nameDataQuality: "",
  children: "",
  ssnDataQuality: "",
  streetAddress: "",
  streetApt: "",
  streetCity: "",
  streetState: "MS",
  streetZip: "",
  streetCounty: "Hinds",
  mailingAddress: "",
  mailingApt: "",
  mailingCity: "",
  mailingState: "MS",
  mailingZip: "",
  phoneNumbers: [{ description: "", number: "", ext: "" }],
  idNumbers: [{ description: "", number: "" }],
  email: "",
  visibleTo: visibleTo[0],
  incomeSources: [{ name: "", phone: "", amount: "", interval: "" }],
  expenses: [{ name: "", phone: "", amount: "", interval: "" }],
  gender: [],
  other: [],
  race: [],
  education: "",
  employment: "",
  maritalStatus: "",
  benefits: [],
  playGroups: [],
  playGroupsOther: "",
};

const incomeSourceSchema = Yup.object()
  .shape({
    name: Yup.string(),
    phone: Yup.string()
      .matches(phoneRegex, "Phone must be in format (XXX) XXX-XXXX")
      .nullable(),
    amount: Yup.string().matches(
      /^\d+(\.\d{1,2})?$/,
      "Amount must be a valid number"
    ),
    interval: Yup.string()
      .oneOf([
        "Weekly",
        "Monthly",
        "Yearly",
        "Bi-Weekly",
        "Bi-Monthly",
        "Quarterly",
        "Bi-Yearly",
      ])
      .nullable(),
  })
  .test(
    "income-source-required-fields",
    "Name, Amount, and Interval are required if any are provided",
    function (value) {
      const { name, amount, interval } = value as IncomeSource;
      if (name || amount || interval) {
        if (!name)
          return this.createError({
            path: `${this.path}.name`,
            message: "Name is required",
          });
        if (!amount)
          return this.createError({
            path: `${this.path}.amount`,
            message: "Amount is required",
          });
        if (!interval)
          return this.createError({
            path: `${this.path}.interval`,
            message: "Interval is required",
          });
      }
      return true;
    }
  );

const expenseSchema = Yup.object()
  .shape({
    name: Yup.string(),
    phone: Yup.string()
      .matches(phoneRegex, "Phone must be in format (XXX) XXX-XXXX")
      .nullable(),
    amount: Yup.string().matches(
      /^\d+(\.\d{1,2})?$/,
      "Amount must be a valid number"
    ),
    interval: Yup.string()
      .oneOf([
        "Weekly",
        "Monthly",
        "Yearly",
        "Bi-Weekly",
        "Bi-Monthly",
        "Quarterly",
        "Bi-Yearly",
      ])
      .nullable(),
  })
  .test(
    "expense-required-fields",
    "Name, Amount, and Interval are required if any are provided",
    function (value) {
      const { name, amount, interval } = value as Expense;
      if (name || amount || interval) {
        if (!name)
          return this.createError({
            path: `${this.path}.name`,
            message: "Name is required",
          });
        if (!amount)
          return this.createError({
            path: `${this.path}.amount`,
            message: "Amount is required",
          });
        if (!interval)
          return this.createError({
            path: `${this.path}.interval`,
            message: "Interval is required",
          });
      }
      return true;
    }
  );

const validationSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .required(ERROR_MESSAGES.FORM.REQUIRED)
    .min(2, "First Name must be at least 2 characters")
    .max(50, "First Name must be at most 50 characters"),
  middleName: Yup.string().max(50, "Middle Name must be at most 50 characters"),
  lastName: Yup.string()
    .trim()
    .required(ERROR_MESSAGES.FORM.REQUIRED)
    .min(2, "Last Name must be at least 2 characters")
    .max(50, "Last Name must be at most 50 characters"),
  suffix: Yup.string().max(10, "Suffix must be at most 10 characters"),
  maidenName: Yup.string().max(50, "Maiden Name must be at most 50 characters"),
  nickname: Yup.string().max(30, "Nickname must be at most 30 characters"),
  dob: Yup.date()
    .max(new Date(), "Date of Birth cannot be in the future")
    .min(new Date("1900-01-01"), "Date of Birth cannot be before 1900")
    .nullable(),
  ssn: Yup.string()
    .matches(/^\d{3}-\d{2}-\d{4}$/, "SSN must be in the format XXX-XX-XXXX")
    .nullable(),
  streetAddress: Yup.string().max(
    100,
    "Street Address must be at most 100 characters"
  ),
  streetApt: Yup.string().max(20, "Apt/Suite must be at most 20 characters"),
  streetCity: Yup.string().max(50, "City must be at most 50 characters"),
  streetState: Yup.string().max(2, "State must be 2 characters"),
  streetZip: Yup.string()
    .matches(zipRegex, "Zip must be in format XXXXX or XXXXX-XXXX")
    .nullable(),
  streetCounty: Yup.string(),
  mailingAddress: Yup.string().max(
    100,
    "Mailing Address must be at most 100 characters"
  ),
  mailingApt: Yup.string().max(20, "Apt/Suite must be at most 20 characters"),
  mailingCity: Yup.string().max(50, "City must be at most 50 characters"),
  mailingState: Yup.string().max(2, "State must be 2 characters"),
  mailingZip: Yup.string()
    .matches(zipRegex, "Zip must be in format XXXXX or XXXXX-XXXX")
    .nullable(),
  phoneNumbers: Yup.array()
    .of(
      Yup.object()
        .shape({
          number: Yup.string()
            .nullable()
            .matches(
              phoneRegex,
              "Phone number must be in a valid format (e.g., (123) 456-7890)"
            ),
          ext: Yup.string()
            .nullable()
            .matches(/^\d{1,6}$/, "Extension must be 1–6 digits"),
          description: Yup.string().nullable(),
        })
        .test(
          "number-and-description",
          "Both Number and Description are required if either is provided",
          function (value) {
            const number = value?.number?.trim();
            const description = value?.description?.trim();

            if (number && !description) {
              return this.createError({
                path: `${this.path}.description`,
                message: "Description is required if number is provided",
              });
            }

            if (!number && description) {
              return this.createError({
                path: `${this.path}.number`,
                message: "Number is required if description is provided",
              });
            }

            return true;
          }
        )
    )
    .min(1, "At least one phone number is required"),
  idNumbers: Yup.array().of(
    Yup.object()
      .shape({
        description: Yup.string().nullable(),
        number: Yup.string()
          .nullable()
          .matches(
            /^[a-zA-Z0-9]*$/,
            "Number must contain only letters and digits"
          )
          .max(10, "Number must be at most 10 characters"),
      })
      .test(
        "both-or-none",
        "Both Description and Number are required if either is provided",
        function (value) {
          const description = value?.description?.trim();
          const number = value?.number?.trim();

          if (description && !number) {
            return this.createError({
              path: `${this.path}.number`,
              message: "Number is required if Description is provided",
            });
          }

          if (!description && number) {
            return this.createError({
              path: `${this.path}.description`,
              message: "Description is required if Number is provided",
            });
          }

          return true;
        }
      )
  ),
  email: Yup.string()
    .email(ERROR_MESSAGES.FORM.INVALID_EMAIL)
    .max(100, "Email must be at most 100 characters")
    .required(ERROR_MESSAGES.FORM.REQUIRED),
  visibleTo: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
  incomeSources: Yup.array().of(incomeSourceSchema),
  expenses: Yup.array().of(expenseSchema),
  gender: Yup.array(),
  other: Yup.array(),
  race: Yup.array(),
  education: Yup.string(),
  employment: Yup.string(),
  maritalStatus: Yup.string(),
  benefits: Yup.array(),
  playGroups: Yup.array(),
  playGroupsOther: Yup.string().when("playGroups", {
    is: (groups: string[]) => groups?.includes("Other"),
    then: (schema) => schema.required("Please specify other play group"),
  }),
});

const TABS = ["Identification", "Income & Expenses", "Demographics"];
const CaseIdentificationForm = lazy(
  () => import("@/components/addCase/CaseIdentificationForm")
);
const CaseIncomeExpensesForm = lazy(
  () => import("@/components/addCase/CaseIncomeExpensesForm")
);
const CaseDemographicsForm = lazy(
  () => import("@/components/addCase/CaseDemographicsForm")
);

const MemoizedCaseIdentificationForm = memo(CaseIdentificationForm);
const MemoizedCaseIncomeExpensesForm = memo(CaseIncomeExpensesForm);
const MemoizedCaseDemographicsForm = memo(CaseDemographicsForm);

const AddCaseModal: React.FC<CaseModalProps> = ({
  isOpen,
  onClose,
  caseData,
}) => {
  const [tab, setTab] = useState(0);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const formik = useFormik<AddCaseFormValues>({
    initialValues: caseData
      ? {
          firstName: caseData.firstName || "",
          middleName: caseData.middleName || "",
          lastName: caseData.lastName || "",
          suffix: caseData.suffix || "",
          maidenName: caseData.maidenName || "",
          nickname: caseData.nickname || "",
          dob: formatDobForUI(caseData.dateOfBirth || ""),
          ssn: caseData.ssn || "",
          headOfHousehold: caseData.headOfHousehold || false,
          dobDataQuality: caseData.dobDataQuality || "",
          nameDataQuality: caseData.nameDataQuality || "",
          children: caseData.children || "",
          ssnDataQuality: caseData.ssnDataQuality || "",
          streetAddress: caseData.streetAddress?.address || "",
          streetApt: caseData.streetAddress?.apt || "",
          streetCity: caseData.streetAddress?.city || "",
          streetState: caseData.streetAddress?.state || "MS",
          streetZip: caseData.streetAddress?.zip || "",
          streetCounty: caseData.streetAddress?.county || "Hinds",
          mailingAddress: caseData.mailingAddress?.address || "",
          mailingApt: caseData.mailingAddress?.apt || "",
          mailingCity: caseData.mailingAddress?.city || "",
          mailingState: caseData.mailingAddress?.state || "MS",
          mailingZip: caseData.mailingAddress?.zip || "",
          phoneNumbers:
            caseData.phoneNumbers && caseData.phoneNumbers?.length > 0
              ? caseData.phoneNumbers
              : [{ description: "", number: "", ext: "" }],
          idNumbers:
            caseData.identificationNumbers &&
            caseData.identificationNumbers?.length > 0
              ? caseData.identificationNumbers
              : [{ description: "", number: "" }],
          email: caseData.email || "",
          visibleTo: caseData.visibleTo || "",
          incomeSources:
            caseData.incomeSources &&
            caseData.incomeSources?.length > 0 &&
            caseData.incomeSources[0]?.name.trim() &&
            caseData.incomeSources[0]?.amount &&
            caseData.incomeSources[0]?.interval.trim()
              ? caseData.incomeSources.map((income) => ({
                  ...income,
                  amount: income.amount.toString(),
                }))
              : [{ name: "", phone: "", amount: "", interval: "" }],
          expenses:
            caseData.expenses &&
            caseData.expenses?.length > 0 &&
            caseData.expenses[0]?.name &&
            caseData.expenses[0]?.amount &&
            caseData.expenses[0]?.interval
              ? caseData.expenses.map((expense) => ({
                  ...expense,
                  amount: expense.amount.toString(),
                }))
              : [{ name: "", phone: "", amount: "", interval: "" }],
          gender: caseData.gender || [],
          other: caseData.other || [],
          race: caseData.raceAndEthnicity || [],
          education: caseData.education || "",
          employment: caseData.employment || "",
          maritalStatus: caseData.maritalStatus || "",
          benefits: caseData.governmentBenefits || [],
          playGroups: caseData.wePlayGroups || [],
          playGroupsOther: caseData.wePlayGroupsOther || "",
        }
      : initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      try {
        const apiPayload = {
          firstName: values.firstName,
          middleName: values.middleName,
          lastName: values.lastName,
          suffix: values.suffix,
          maidenName: values.maidenName,
          nickname: values.nickname,
          dateOfBirth: formatDobForAPI(values.dob),
          ssn: values.ssn,
          headOfHousehold: values.headOfHousehold,
          dobDataQuality: values.dobDataQuality,
          nameDataQuality: values.nameDataQuality,
          children: values.children,
          ssnDataQuality: values.ssnDataQuality,
          streetAddress: {
            address: values.streetAddress,
            apt: values.streetApt,
            city: values.streetCity,
            state: values.streetState,
            zip: values.streetZip,
            county: values.streetCounty,
          },
          mailingAddress: {
            address: values.mailingAddress,
            apt: values.mailingApt,
            city: values.mailingCity,
            state: values.mailingState,
            zip: values.mailingZip,
          },
          phoneNumbers: values.phoneNumbers,
          identificationNumbers: values.idNumbers,
          email: values.email,
          incomeSources: values.incomeSources,
          expenses: values.expenses,
          gender: values.gender,
          other: values.other,
          raceAndEthnicity: values.race,
          education: values.education,
          employment: values.employment,
          maritalStatus: values.maritalStatus,
          governmentBenefits: values.benefits,
          wePlayGroups: values.playGroups,
          wePlayGroupsOther: values.playGroupsOther,
          visibleTo: values.visibleTo,
        };

        let response;
        if (caseData?._id) {
          response = await updateCase(
            caseData._id,
            apiPayload,
            userData?.userId || "",
            userData?.activeLocation || ""
          );
          const data = await fetchCaseById(
            caseData?._id,
            userData?.userId,
            userData?.activeLocation
          );
          dispatch(setCurrentCaseData(data));
        } else {
          response = await createCase(
            apiPayload,
            userData?.userId || "",
            userData?.activeLocation || ""
          );
        }

        if (response) {
          toast.success(
            `Case ${
              caseData?._id ? STATIC_TEXTS.COMMON.EDIT : STATIC_TEXTS.COMMON.ADD
            } successfully!`
          );
          dispatch(markForRefresh());
          formik.resetForm();
          onClose();
        }
      } catch (error: any) {
        console.error("Error submitting form:", error?.response?.data?.message);
        toast.error(
          error?.response?.data?.message || ERROR_MESSAGES.FETCH.GENERIC
        );
      }
    },
  });
  useEffect(() => {
    if (isOpen) {
      formik.resetForm({
        values: caseData
          ? {
              firstName: caseData.firstName || "",
              middleName: caseData.middleName || "",
              lastName: caseData.lastName || "",
              suffix: caseData.suffix || "",
              maidenName: caseData.maidenName || "",
              nickname: caseData.nickname || "",
              dob: formatDobForUI(caseData.dateOfBirth || ""),
              ssn: caseData.ssn || "",
              headOfHousehold: caseData.headOfHousehold || false,
              dobDataQuality: caseData.dobDataQuality || "",
              nameDataQuality: caseData.nameDataQuality || "",
              children: caseData.children || "",
              ssnDataQuality: caseData.ssnDataQuality || "",
              streetAddress: caseData.streetAddress?.address || "",
              streetApt: caseData.streetAddress?.apt || "",
              streetCity: caseData.streetAddress?.city || "",
              streetState: caseData.streetAddress?.state || "MS",
              streetZip: caseData.streetAddress?.zip || "",
              streetCounty: caseData.streetAddress?.county || "Hinds",
              mailingAddress: caseData.mailingAddress?.address || "",
              mailingApt: caseData.mailingAddress?.apt || "",
              mailingCity: caseData.mailingAddress?.city || "",
              mailingState: caseData.mailingAddress?.state || "MS",
              mailingZip: caseData.mailingAddress?.zip || "",
              phoneNumbers:
                caseData.phoneNumbers && caseData.phoneNumbers?.length > 0
                  ? caseData.phoneNumbers
                  : [{ description: "", number: "", ext: "" }],
              idNumbers:
                caseData.identificationNumbers &&
                caseData.identificationNumbers?.length > 0
                  ? caseData.identificationNumbers
                  : [{ description: "", number: "" }],
              email: caseData.email || "",
              visibleTo: caseData.visibleTo || "",
              incomeSources:
                caseData.incomeSources &&
                caseData.incomeSources?.length > 0 &&
                caseData.incomeSources[0]?.name.trim() &&
                caseData.incomeSources[0]?.amount &&
                caseData.incomeSources[0]?.interval.trim()
                  ? caseData.incomeSources.map((income) => ({
                      ...income,
                      amount: income.amount.toString(),
                    }))
                  : [{ name: "", phone: "", amount: "", interval: "" }],
              expenses:
                caseData.expenses &&
                caseData.expenses?.length > 0 &&
                caseData.expenses[0]?.name.trim() &&
                caseData.expenses[0]?.amount &&
                caseData.expenses[0]?.interval.trim()
                  ? caseData.expenses.map((expense) => ({
                      ...expense,
                      amount: expense.amount.toString(),
                    }))
                  : [{ name: "", phone: "", amount: "", interval: "" }],
              gender: caseData.gender || [],
              other: caseData.other || [],
              race: caseData.raceAndEthnicity || [],
              education: caseData.education || "",
              employment: caseData.employment || "",
              maritalStatus: caseData.maritalStatus || "",
              benefits: caseData.governmentBenefits || [],
              playGroups: caseData.wePlayGroups || [],
              playGroupsOther: caseData.wePlayGroupsOther || "",
            }
          : initialValues,
      });
      setTab(0);
    }
  }, [isOpen, caseData, formik.resetForm]);

  const inputClass = (field: string) =>
    `border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm ${
      formik.touched[field as keyof AddCaseFormValues] &&
      formik.errors[field as keyof AddCaseFormValues]
        ? "border-red-500"
        : "border-gray-300"
    }`;

  const arrayInputClass = (field: string) =>
    `border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm ${
      getNestedFieldState(formik.touched, field) &&
      getNestedFieldState(formik.errors, field)
        ? "border-red-500"
        : "border-gray-300"
    }`;

  const errorMsg = (field: keyof AddCaseFormValues | string) => {
    const touched =
      typeof field === "string"
        ? getNestedFieldState(formik.touched, field)
        : formik.touched[field];
    const error =
      typeof field === "string"
        ? getNestedFieldState(formik.errors, field)
        : formik.errors[field];
    return touched && error ? (
      <div className="text-red-500 text-xs mt-1">{error as string}</div>
    ) : null;
  };

  const footerContent = (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
      <div className="flex gap-2 order-2 md:order-1">
        <Button
          variant="submitStyle"
          label={caseData ? "Save Changes" : STATIC_TEXTS.COMMON.ADD}
          type="submit"
          form="add-case-form"
        />
        <Button
          onClick={() => {
            formik.resetForm();
            onClose();
          }}
          label={STATIC_TEXTS.COMMON.CANCEL}
        />
      </div>
      <div className="flex gap-2 order-1 md:order-2 mb-2 md:mb-0 rounded-t-lg">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition
        ${tab === i ? "bg-purple text-white" : "bg-gray-100 text-gray-600"}
      `}
            onClick={() => setTab(i)}
            type="button"
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      noPadding={true}
      title={
        caseData
          ? `${STATIC_TEXTS.COMMON.EDIT} Case - ${
              caseData?.firstName + " " + caseData?.lastName
            }`
          : `${STATIC_TEXTS.COMMON.ADD} Case`
      }
      footer={footerContent}
      widthClass="max-w-3xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <FormikProvider value={formik}>
            <form
              id="add-case-form"
              onSubmit={formik.handleSubmit}
              autoComplete="off"
              className="bg-white border border-gray-200 rounded-lg shadow space-y-8 max-h-[60vh] overflow-y-auto"
            >
              <div className="bg-purpleLight pb-2 sm:pb-6rounded-lg">
                <div className="flex gap-2 mb-6 border-b px-2 sm:px-6 pt-2 shadow-sm border-gray-200 overflow-x-auto sticky top-0 z-20 bg-purpleLight rounded-t-lg">
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
                <div className="px-2  sm:px-6">
                  <Suspense fallback={<Loader />}>
                    {tab === 0 && (
                      <MemoizedCaseIdentificationForm
                        formik={formik}
                        caseData={caseData}
                        inputClass={inputClass}
                        arrayInputClass={arrayInputClass}
                        errorMsg={errorMsg}
                      />
                    )}
                    {tab === 1 && (
                      <MemoizedCaseIncomeExpensesForm
                        formik={formik}
                        arrayInputClass={arrayInputClass}
                        errorMsg={errorMsg}
                      />
                    )}
                    {tab === 2 && (
                      <MemoizedCaseDemographicsForm
                        formik={formik}
                        errorMsg={errorMsg}
                      />
                    )}
                  </Suspense>
                </div>
              </div>
            </form>
          </FormikProvider>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default memo(AddCaseModal);
