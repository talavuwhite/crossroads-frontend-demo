import React, { useState, useEffect, useCallback } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import FormInput from "@ui/FormInput";
import FileInput from "@ui/FileInput";
import FormTextarea from "@ui/FormTextarea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useLocation } from "react-router-dom";
import { searchCasesForMerge } from "@services/CaseApi";
import type { SearchMergeCaseResult } from "@/types/case";
import { Icon } from "@iconify-icon/react";
import debounce from "lodash/debounce";
import {
  visibleTo,
  MAX_FILE_SIZE_MB,
  ALLOWED_FILE_TYPES,
  BLOCKED_FILE_EXTENSIONS,
} from "@/utils/constants";
import { toast } from "react-toastify";
import Loader from "@/components/ui/Loader";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import type {
  AssistanceRecord,
  AssistanceReferralResponse,
  RequestStatus,
  Service,
  ServiceOption,
  SimplifiedCategory,
  Unit,
} from "@/types";
import {
  ERROR_MESSAGES,
  STATIC_TEXTS,
  LABELS,
  PLACEHOLDERS,
} from "@utils/textConstants";
import {
  fetchCategories,
  groupCategoriesBySection,
  groupServicesBySection,
} from "@/utils/commonFunc";
import { getServices } from "@/services/ServiceApi";
import { getUnits } from "@/services/UnitApi";
import { getRequestStatuses } from "@/services/RequestStatusApi";
import { toZonedTime } from "date-fns-tz";

type OnSubmitType =
  | ((id: string, data: any, addAnother?: boolean) => void)
  | ((data: any, addAnother?: boolean) => void);
interface AddAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: OnSubmitType;
  caseName: string;
  isAddReq?: boolean;
  isEdit?: boolean;
  selectedRecord?: AssistanceReferralResponse | AssistanceRecord | null;
  referralData?: AssistanceReferralResponse | null;
  prefillAssistance?: boolean;
}

interface FormValues {
  amount: number;
  unit: string;
  category: string;
  description: string;
  visibleTo: string;
  attachment: File | string | null;
  status: string;
  deadlineDate: Date | null;
  referredAgencyService: string;
  _submitActionType: string | null;
}

export const AddAssistanceModal: React.FC<AddAssistanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  caseName,
  isAddReq = false,
  isEdit = false,
  selectedRecord = null,
  referralData = null,
  prefillAssistance = false,
}) => {
  const [servicesOptions, setServicesOptions] = useState<ServiceOption[]>([]);
  const location = useLocation();
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMergeCaseResult[]>(
    []
  );
  const [loadingSearchResults, setLoadingSearchResults] = useState(false);
  const [selectedCases, setSelectedCases] = useState<SearchMergeCaseResult[]>(
    []
  );
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [categoryOptions, setCategoryOptions] = useState<SimplifiedCategory[]>(
    []
  );
  const [units, setUnits] = useState<Unit[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [showServiceSelect, setShowServiceSelect] = useState<boolean>(true);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const handleShowServiceSelect = () => {
    if (isEdit && selectedRecord && isAddReq) setShowServiceSelect(true);
    else setShowServiceSelect(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (isEdit && selectedRecord && !prefillAssistance) {
        formik.setValues({
          amount: selectedRecord.amount,
          unit:
            typeof selectedRecord.unit === "string"
              ? selectedRecord.unit
              : selectedRecord.unit?._id,
          category: selectedRecord.category?._id,
          description: selectedRecord.description,
          visibleTo: selectedRecord.visibleTo,
          attachment:
            (selectedRecord.attachment?.url as string | null) ||
            (selectedRecord?.attachedFile?.url as string | null) ||
            null,
          status:
            selectedRecord &&
            "status" in selectedRecord &&
            selectedRecord.status !== undefined
              ? typeof selectedRecord.status === "string"
                ? selectedRecord.status
                : selectedRecord.status?._id || ""
              : "",
          deadlineDate:
            "requestDeadline" in selectedRecord
              ? selectedRecord.requestDeadline
                ? toZonedTime(selectedRecord.requestDeadline, userTimeZone)
                : null
              : null,
          referredAgencyService:
            "service" in selectedRecord && selectedRecord.service
              ? selectedRecord.service._id
              : "",
          _submitActionType: null,
        });
        if (selectedRecord.caseId) {
          setSelectedCases([
            {
              id:
                typeof selectedRecord.caseId === "string"
                  ? selectedRecord.caseId
                  : selectedRecord.caseId?._id ?? "",
              caseId:
                typeof selectedRecord.caseId === "string"
                  ? selectedRecord.caseId
                  : selectedRecord.caseId?._id ?? " ",
              fullName: selectedRecord.caseName || "",
              address: "",
              ssn: "",
            },
          ]);
        }
        if (isAddReq) {
          if ("service" in selectedRecord && selectedRecord.service) {
            setShowServiceSelect(false);
          } else {
            setShowServiceSelect(true);
          }
        }
      } else if (referralData && prefillAssistance) {
        const maybeReferral = referralData as any;
        if (maybeReferral?.type !== "referral") return;

        const prefillAmount =
          typeof maybeReferral.amount === "number"
            ? maybeReferral.amount
            : parseFloat(maybeReferral.amount || "");
        if (!isNaN(prefillAmount)) {
          formik.setFieldValue("amount", prefillAmount, false);
        }

        const prefillUnit =
          typeof maybeReferral.unit === "string"
            ? maybeReferral.unit
            : maybeReferral.unit?._id || "";
        if (prefillUnit) {
          formik.setFieldValue("unit", prefillUnit, false);
        }

        const prefillCategory = maybeReferral.category?._id || "";
        if (prefillCategory) {
          formik.setFieldValue("category", prefillCategory, false);
        }
      } else {
        formik.resetForm();
        setSelectedCases([]);
        setShowServiceSelect(true);
      }
      formik.setFieldValue("_submitActionType", null);
    }
  }, [
    isOpen,
    isEdit,
    selectedRecord,
    categoryOptions,
    prefillAssistance,
    referralData,
  ]);

  const validationSchema = Yup.object().shape({
    amount: Yup.number()
      .required(ERROR_MESSAGES.FORM.REQUIRED)
      .positive(ERROR_MESSAGES.FORM.POSITIVE_NUMBER)
      .max(50000, ERROR_MESSAGES.FORM.NUMBER_MAX(50000)),
    unit: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    category: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    description: Yup.string(),
    visibleTo: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    attachment: Yup.mixed()
      .nullable()
      .test(
        "fileSize",
        ERROR_MESSAGES.FORM.FILE_SIZE_EXCEEDS(MAX_FILE_SIZE_MB),
        (value: any) => {
          if (!value) return true;
          if (typeof value === "string") return true;

          if (!(value instanceof File)) {
            console.error(
              "FileInput: value is not a File object for size check:",
              value
            );
            return false;
          }
          return value.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
        }
      )
      .test(
        "fileType",
        ERROR_MESSAGES.FORM.UNSUPPORTED_FILE_TYPE,
        (value: any) => {
          if (!value) return true;
          if (typeof value === "string") return true;

          if (!(value instanceof File)) {
            console.error(
              "FileInput: value is not a File object for type check:",
              value
            );
            return false;
          }

          if (
            typeof value.name !== "string" ||
            typeof value.type !== "string"
          ) {
            console.error(
              "FileInput: File object missing name or type property:",
              value
            );
            return false;
          }

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
    status: isAddReq
      ? Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED)
      : Yup.string().notRequired(),
    deadlineDate: isAddReq
      ? Yup.date().nullable().required(ERROR_MESSAGES.FORM.REQUIRED)
      : Yup.date().nullable(),
    referredAgencyService: isAddReq
      ? Yup.string().notRequired()
      : Yup.string().notRequired(),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      amount: 0,
      unit: units && units.length !== 0 ? units?.[0]?._id : "",
      category:
        categoryOptions && categoryOptions.length !== 0
          ? categoryOptions[0]?._id
          : "",
      description: "",
      visibleTo: visibleTo[0],
      attachment: (selectedRecord?.attachment?.url as string | null) || null,
      status:
        requestStatuses && requestStatuses.length !== 0
          ? requestStatuses[0]?._id
          : "",
      deadlineDate: null,
      referredAgencyService: "",
      _submitActionType: null,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm, setFieldValue }) => {
      try {
        const shouldAddAnother = values._submitActionType === "addAnother";
        const formData = {
          amount: values.amount.toString(),
          unit: values.unit,
          category: values.category,
          description: values.description || "",
          visibleTo: values.visibleTo,
          attachment:
            values.attachment instanceof File ? values.attachment : null,
          status: values.status,
          deadlineDate: values.deadlineDate,
          referredAgencyService: values.referredAgencyService || "",
          caseIds: isEdit
            ? selectedRecord?.caseId
              ? [selectedRecord.caseId]
              : []
            : selectedCases.map((caseItem) => caseItem.id),
        };

        if (isEdit && selectedRecord) {
          await (
            onSubmit as (id: string, data: any, addAnother?: boolean) => void
          )(selectedRecord._id, formData);
        } else {
          await (onSubmit as (data: any, addAnother?: boolean) => void)(
            formData,
            shouldAddAnother
          );
        }

        if (!shouldAddAnother || isEdit) {
          onClose();
        } else {
          resetForm();
          setSelectedCases([]);
        }
      } catch (error) {
        console.error("Submission error:", error);
        toast.error(ERROR_MESSAGES.SAVE.GENERIC);
      } finally {
        setFieldValue("_submitActionType", null);
      }
    },
  });

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      setLoadingSearchResults(true);
      try {
        const results = await searchCasesForMerge(
          term,
          userData?.userId,
          userData?.activeLocation
        );
        const filteredResults = results.filter(
          (result) =>
            !selectedCases.some((selected) => selected.id === result.id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Error searching cases:", error);
        toast.error(ERROR_MESSAGES.FETCH.CASES);
        setSearchResults([]);
      } finally {
        setLoadingSearchResults(false);
      }
    }, 500),
    [selectedCases, userData?.activeLocation, userData?.userId]
  );

  const handleCaseSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setCaseSearchTerm(term);
    if (term.length > 2) {
      debouncedSearch(term);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectCase = (caseItem: SearchMergeCaseResult) => {
    setSelectedCases((prev) => [...prev, caseItem]);
    setSearchResults([]);
    setCaseSearchTerm("");
  };

  const handleRemoveCase = (caseId: string) => {
    setSelectedCases((prev) => prev.filter((c) => c.id !== caseId));
  };

  const handleSaveAndAddAnother = () => {
    formik.setFieldValue("_submitActionType", "addAnother");
    formik.handleSubmit();
  };

  useEffect(() => {
    if (!userData) return;
    fetchCategories(userData, setLoadingCategories, setCategoryOptions);
  }, [userData?.userId, userData?.activeLocation, isOpen]);

  useEffect(() => {
    if (categoryOptions && categoryOptions?.length !== 0 && !selectedRecord)
      formik.setFieldValue("category", categoryOptions[0]?._id);
  }, [categoryOptions, selectedRecord]);

  useEffect(() => {
    if (units && units?.length !== 0 && !selectedRecord)
      formik.setFieldValue("unit", units[0]?._id);
  }, [units, selectedRecord]);

  useEffect(() => {
    if (requestStatuses && requestStatuses?.length !== 0 && !selectedRecord)
      formik.setFieldValue("status", requestStatuses[0]?._id);
  }, [requestStatuses, selectedRecord]);

  useEffect(() => {
    async function fetchServices() {
      try {
        if (!userData) return;
        const res = await getServices(
          1,
          100,
          userData?.userId,
          userData?.activeLocation,
          undefined,
          undefined,
          false
        );
        setAllServices(res.data.results);
        const grouped = groupServicesBySection(res.data.results);
        setServicesOptions(grouped);
      } catch (e: any) {
        console.error("🚀 ~ fetchServices ~ e:", e);
        toast.error(e || STATIC_TEXTS.REFERRALS.FETCH_SERVICE_ERROR);
      }
    }
    fetchServices();
  }, [userData, isOpen]);

  useEffect(() => {
    if (!userData) return;

    async function fetchUnits() {
      try {
        if (!userData) return;
        const res = await getUnits(userData?.userId, userData?.activeLocation);
        setUnits(res);
      } catch (e: any) {
        console.error("🚀 ~ fetchUnits ~ e:", e);
        toast.error(e || STATIC_TEXTS.REFERRALS.FETCH_UNITS_ERROR);
      }
    }
    fetchUnits();
  }, [userData, isOpen]);

  useEffect(() => {
    if (!userData) return;
    const fetchRequestStatuses = async () => {
      if (!userData?.userId) {
        return toast.error("User authentication missing");
      }
      try {
        const data = await getRequestStatuses(
          userData.userId,
          userData.activeLocation
        );
        setRequestStatuses(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch request statuses";
        toast.error(message);
      }
    };
    fetchRequestStatuses();
  }, [userData, isOpen]);

  const renderCommonFields = () => (
    <>
      {isAddReq && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 text-sm rounded-md mb-4">
          <strong>{STATIC_TEXTS.COMMON.VERIFY_CASE_MESSAGE}</strong>{" "}
          {STATIC_TEXTS.COMMON.VERIFY_CASE_IDENTIFICATION}{" "}
          <strong>{caseName}</strong> {STATIC_TEXTS.COMMON.VERIFY_CASE_USING_ID}
        </div>
      )}
      <FormInput
        label={LABELS.FORM.AMOUNT}
        name="amount"
        formik={formik}
        type="number"
        required
      />
      <div>
        <label className="text-sm font-medium text-gray-700">
          {LABELS.FORM.UNIT}
        </label>
        <select
          name="unit"
          value={formik.values.unit}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple resize-none ${
            formik.touched.unit && formik.errors.unit
              ? "border-red-500"
              : "border-gray-300"
          }`}
        >
          {units.map((unit) => (
            <option key={unit?._id} value={unit?._id}>
              {unit?.name}
            </option>
          ))}
        </select>
        {formik.touched.unit && formik.errors.unit ? (
          <div className="text-red-500 text-xs mt-1">{formik.errors.unit}</div>
        ) : null}
      </div>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {LABELS.FORM.CATEGORY} <span className="text-primary">*</span>
          {loadingCategories && (
            <span className="ml-2 text-gray-500 text-xs">
              <Loader width={3} height={3} />
            </span>
          )}
        </label>
        <select
          name="category"
          value={formik.values.category}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple resize-none ${
            formik.touched.category && formik.errors.category
              ? "border-red-500"
              : "border-gray-300"
          }`}
          disabled={loadingCategories}
        >
          <option value="">{STATIC_TEXTS.CATEGORIES.SECTION}</option>
          {loadingCategories ? (
            <option disabled>{STATIC_TEXTS.COMMON.LOADING}</option>
          ) : (
            Object.entries(groupCategoriesBySection(categoryOptions)).map(
              ([section, cats]) => (
                <optgroup
                  key={section}
                  label={section}
                  className="font-bold text-gray-700"
                >
                  {cats.map((cat: SimplifiedCategory) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </optgroup>
              )
            )
          )}
        </select>
        {formik.touched.category && formik.errors.category ? (
          <div className="text-red-500 text-xs mt-1">
            {formik.errors.category}
          </div>
        ) : null}
      </div>
      {(userData?.propertyRole === "Agency Administrator" ||
        userData?.propertyRole === "Network Administartor") && (
        <Link
          className="text-blue-600 text-xs flex w-full justify-end my-2 \
                hover:underline transition-all duration-200"
          to={"/myAgency/categories"}
        >
          {STATIC_TEXTS.CATEGORIES.MANAGE_CATEGORIES}
        </Link>
      )}
      <div className="mb-4">
        <FormTextarea
          label={LABELS.FORM.DESCRIPTION}
          name="description"
          formik={formik}
          rows={4}
        />
      </div>
      {isAddReq && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {LABELS.FORM.STATUS} <span className="text-primary">*</span>
          </label>
          <select
            name="status"
            value={formik.values.status}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple resize-none ${
              formik.touched.status && formik.errors.status
                ? "border-red-500"
                : "border-gray-300"
            }`}
          >
            {requestStatuses.map((status) => (
              <option key={status._id} value={status._id}>
                {status.name}
              </option>
            ))}
          </select>
          {formik.touched.status && formik.errors.status ? (
            <div className="text-red-500 text-xs mt-1">
              {formik.errors.status}
            </div>
          ) : null}
        </div>
      )}
      {isAddReq && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            {LABELS.FORM.REQUEST_DEADLINE_DATE}{" "}
            <span className="text-primary">*</span>
          </label>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={
                formik.values.deadlineDate
                  ? (() => {
                      try {
                        const date = toZonedTime(
                          formik.values.deadlineDate,
                          userTimeZone
                        );
                        return date instanceof Date && !isNaN(date.getTime())
                          ? date
                          : null;
                      } catch (error) {
                        console.warn(
                          "Error parsing deadline date:",
                          formik.values.deadlineDate,
                          error
                        );
                        return null;
                      }
                    })()
                  : null
              }
              onChange={(date: Date | null) => {
                formik.setFieldValue("deadlineDate", date);
                formik.setFieldTouched("deadlineDate", true);
              }}
              dateFormat="MM/dd/yyyy"
              minDate={new Date()}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple ${
                formik.touched.deadlineDate && formik.errors.deadlineDate
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              wrapperClassName="w-full"
              placeholderText="MM-dd-YYYY"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              popperProps={{
                strategy: "absolute",
                placement: "bottom-start",
              }}
            />
          </div>
          {formik.touched.deadlineDate && formik.errors.deadlineDate ? (
            <p className="mt-2 text-sm text-red-600">
              {formik.errors.deadlineDate}
            </p>
          ) : null}
        </div>
      )}
      {(!(
        location.pathname.startsWith("/agencies") ||
        location.pathname.startsWith("/myAgency")
      ) ||
        (isEdit &&
          (location.pathname.startsWith("/agencies") ||
            location.pathname.startsWith("/myAgency")))) && (
        <div className="mb-4">
          <FileInput
            label={LABELS.FORM.ATTACH_FILE}
            name="attachment"
            formik={formik}
          />
        </div>
      )}
      <div className="mb-4">
        <label className="text-sm font-medium text-red-700 block bg-red-100 px-2 py-1 rounded-t-md">
          {LABELS.FORM.VISIBLE_TO}
        </label>
        <select
          name="visibleTo"
          value={formik.values.visibleTo}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`w-full border border-red-300 p-2 rounded-b-md bg-red-50 ${
            formik.touched.visibleTo && formik.errors.visibleTo
              ? "border-red-500"
              : ""
          }`}
        >
          {visibleTo.map((option) => (
            <option key={option} value={option}>
              {option === "Agency Only" ? "My Agency" : option}
            </option>
          ))}
        </select>
        {formik.touched.visibleTo && formik.errors.visibleTo ? (
          <div className="text-red-500 text-xs mt-1">
            {formik.errors.visibleTo}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        isAddReq && isEdit
          ? "Edit Request/Referral"
          : isEdit
          ? STATIC_TEXTS.ASSISTANCE.EDIT_ASSISTANCE
          : location.pathname.startsWith("/agencies") ||
            location.pathname.startsWith("/myAgency")
          ? STATIC_TEXTS.ASSISTANCE.ADD_MULTIPLE_ASSISTANCE
          : isAddReq
          ? STATIC_TEXTS.ASSISTANCE.ADD_REQUEST
          : STATIC_TEXTS.ASSISTANCE.ADD_ASSISTANCE
      }
      widthClass={`${
        location.pathname.startsWith("/agencies") ||
        location.pathname.startsWith("/myAgency")
          ? isEdit
            ? "max-w-xl"
            : "max-w-4xl"
          : isAddReq
          ? "max-w-4xl"
          : isAddReq && isEdit
          ? "max-w-4xl"
          : "max-w-xl"
      }`}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label={
              isAddReq && isEdit
                ? "Edit Request/Referral"
                : isEdit
                ? STATIC_TEXTS.COMMON.SAVE_CHANGES
                : location.pathname.startsWith("/agencies") ||
                  location.pathname.startsWith("/myAgency")
                ? STATIC_TEXTS.ASSISTANCE.ADD_MULTIPLE_ASSISTANCE
                : isAddReq
                ? STATIC_TEXTS.ASSISTANCE.ADD_REQUEST_REFERRALS_BUTTON
                : STATIC_TEXTS.COMMON.ADD
            }
            variant="submitStyle"
            onClick={() => {
              formik.setFieldValue("_submitActionType", "saveAndClose");
              formik.handleSubmit();
            }}
          />

          {!isAddReq &&
            !isEdit &&
            !location.pathname.startsWith("/agencies") &&
            !location.pathname.startsWith("/myAgency") && (
              <Button
                label={STATIC_TEXTS.COMMON.SAVE_AND_ADD_ANOTHER}
                variant="default"
                onClick={handleSaveAndAddAnother}
                type="button"
              />
            )}
          <Button
            label={STATIC_TEXTS.COMMON.CANCEL}
            onClick={onClose}
            variant="default"
            type="button"
          />
        </div>
      }
    >
      {isAddReq ||
      (!isEdit &&
        (location.pathname.startsWith("/agencies") ||
          location.pathname.startsWith("/myAgency"))) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 order-2 md:order-1">
            {renderCommonFields()}
          </div>
          {isAddReq ? (
            <div className="order-1 md:order-2 bg-purpleLight p-5 rounded-lg">
              <div className="space-y-2">
                {" "}
                <div className="mb-4">
                  {showServiceSelect && (
                    <>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {LABELS.FORM.REFER_REQUEST_TO_AGENCY}
                      </label>
                      <div className="mt-1">
                        <select
                          name="referredAgencyService"
                          value={formik.values.referredAgencyService}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple resize-none ${
                            formik.touched.referredAgencyService &&
                            formik.errors.referredAgencyService
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          <option value="">
                            {STATIC_TEXTS.COMMON.SELECT_SERVICE}
                          </option>
                          {servicesOptions.map((group) => (
                            <optgroup
                              key={group.category}
                              label={group.category}
                            >
                              {group.options.map((service: any) => (
                                <option
                                  key={service.value}
                                  value={service.value}
                                >
                                  {service.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        {formik.touched.referredAgencyService &&
                        formik.errors.referredAgencyService ? (
                          <div className="text-red-500 text-xs mt-1">
                            {formik.errors.referredAgencyService}
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}

                  {formik.values.referredAgencyService &&
                    formik.values.referredAgencyService !== "" &&
                    (() => {
                      const selectedService = allServices.find(
                        (service) =>
                          service._id === formik.values.referredAgencyService
                      );
                      return (
                        <>
                          {selectedService &&
                            isEdit &&
                            isAddReq &&
                            !showServiceSelect && (
                              <div className="text-lg text-gray-700 border-b border-b-gray-200">
                                {
                                  STATIC_TEXTS.REFERRALS
                                    .THIS_REQUEST_REFERRED_TO
                                }
                              </div>
                            )}
                          <div className="mt-4 text-gray-700">
                            <h4 className="font-bold text-xl text-pink">
                              {selectedService?.companyName ||
                                STATIC_TEXTS.COMMON.DUMMY_CONTACT_NAME}
                            </h4>
                            <p>
                              {selectedService?.agencyInfo?.address
                                ? selectedService?.agencyInfo?.address
                                : STATIC_TEXTS.COMMON
                                    .DUMMY_CONTACT_ADDRESS_LINE1}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 mt-2">
                              <Icon
                                icon="mdi:clock"
                                width="16"
                                height="16"
                                className="mr-1"
                              />
                              <span>
                                {selectedService?.agencyInfo?.officeHours?.[0]
                                  ?.startTime &&
                                selectedService?.agencyInfo?.officeHours?.[0]
                                  ?.endTime
                                  ? selectedService?.agencyInfo
                                      ?.officeHours?.[0]?.startTime +
                                    " - " +
                                    selectedService?.agencyInfo
                                      ?.officeHours?.[0]?.endTime
                                  : STATIC_TEXTS.COMMON.NO_HOURS_SPECIFIED}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Icon
                                icon="mdi:phone"
                                width="16"
                                height="16"
                                className="mr-1"
                              />
                              <span>
                                {selectedService?.agencyInfo?.phone
                                  ? selectedService?.agencyInfo?.phone
                                  : STATIC_TEXTS.COMMON.DUMMY_PHONE}
                              </span>
                            </div>
                            <h5 className="font-bold text-purple mt-3">
                              {selectedService?.name ||
                                STATIC_TEXTS.COMMON.DUMMY_SERVICE_TITLE}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {selectedService?.description?.trim() ||
                                STATIC_TEXTS.COMMON.DUMMY_SERVICE_DESCRIPTION}
                            </p>
                            {selectedService &&
                              isEdit &&
                              isAddReq &&
                              !showServiceSelect && (
                                <button
                                  className="text-sm text-blue-700 underline underline-offset-2 hover:text-blue-900"
                                  onClick={handleShowServiceSelect}
                                >
                                  {
                                    STATIC_TEXTS.REFERRALS
                                      .CHOOSE_DIFFERENT_AGENCY
                                  }
                                </button>
                              )}
                          </div>
                        </>
                      );
                    })()}
                </div>
              </div>
            </div>
          ) : (
            !isEdit && (
              <div className="order-1 md:order-2 bg-purpleLight p-5 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {STATIC_TEXTS.ASSISTANCE.ADD_ASSISTANCE_TO_CASES}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-grow relative">
                    <input
                      type="text"
                      value={caseSearchTerm}
                      onChange={handleCaseSearchChange}
                      placeholder={PLACEHOLDERS.SEARCH.CASE_NUMBER_OR_NAME}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple ${
                        caseSearchTerm.length > 2 &&
                        searchResults.length === 0 &&
                        !loadingSearchResults
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {caseSearchTerm.length > 2 && searchResults.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {searchResults.map((caseItem) => (
                          <li
                            key={caseItem.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-800"
                            onClick={() => handleSelectCase(caseItem)}
                          >
                            {caseItem.caseId} - {caseItem.fullName}
                          </li>
                        ))}
                      </ul>
                    )}
                    {loadingSearchResults && caseSearchTerm.length > 2 && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple"></div>
                      </div>
                    )}
                    {caseSearchTerm.length > 2 &&
                      searchResults.length === 0 &&
                      !loadingSearchResults && (
                        <div className="text-red-500 text-xs mt-1">
                          {STATIC_TEXTS.COMMON.NO_CASES_FOUND}
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between bg-purple-100 rounded-md px-3 py-2 text-sm text-gray-800"
                    >
                      <span>
                        {caseItem.caseId} - {caseItem.fullName}
                      </span>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleRemoveCase(caseItem.id)}
                      >
                        <Icon icon="mdi:close" width="16" height="16" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="space-y-4">{renderCommonFields()}</div>
      )}
    </ModalWrapper>
  );
};
