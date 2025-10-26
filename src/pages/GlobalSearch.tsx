import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { CaseCard } from "@components/CaseCard";
import PageFooter from "@components/PageFooter";
import Button from "@/components/ui/Button";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import FormInput from "@/components/ui/FormInput";
import {
  ERROR_MESSAGES,
  STATIC_TEXTS,
  PLACEHOLDERS,
  LABELS,
} from "@/utils/textConstants";
import { phoneRegex, zipRegex } from "@/utils/constants";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { toast } from "react-toastify";
import { searchCases } from "@/services/CaseApi";
import type { CaseType, SearchCaseFormValues } from "@/types/case";
import AddCaseModal from "@/components/modals/AddCaseModal";
import { useLocation } from "react-router-dom";
import { fetchRecentSearches } from "@/redux/recentSearchesSlice";

const validationSchema = Yup.object({
  firstName: Yup.string().max(
    50,
    ERROR_MESSAGES.FORM.MAX_LENGTH(50, "First Name")
  ),
  lastName: Yup.string().max(
    50,
    ERROR_MESSAGES.FORM.MAX_LENGTH(50, "Last Name")
  ),
  caseId: Yup.string().max(20, ERROR_MESSAGES.FORM.MAX_LENGTH(20, "Case ID")),
  dateOfBirth: Yup.date()
    .transform((value, originalValue) => {
      if (
        typeof originalValue === "string" &&
        originalValue.match(/^\\d{2}-\\d{2}-\\d{4}$/)
      ) {
        const [month, day, year] = originalValue.split("-");
        return new Date(`${year}-${month}-${day}`);
      }
      return value;
    })
    .nullable()
    .max(
      new Date(),
      ERROR_MESSAGES.FORM.FUTURE_DATE_NOT_ALLOWED("Date of Birth")
    ),
  ssn: Yup.string()
    .matches(/^\\d{3}-\\d{2}-\\d{4}$/, ERROR_MESSAGES.FORM.INVALID_SSN_FORMAT)
    .nullable(),
  address: Yup.string().max(
    100,
    ERROR_MESSAGES.FORM.MAX_LENGTH(100, "Address")
  ),
  city: Yup.string().max(50, ERROR_MESSAGES.FORM.MAX_LENGTH(50, "City")),
  state: Yup.string().max(2, ERROR_MESSAGES.FORM.MAX_LENGTH(2, "State")),
  zip: Yup.string()
    .matches(zipRegex, ERROR_MESSAGES.FORM.INVALID_ZIP_FORMAT)
    .nullable(),
  phoneNumber: Yup.string()
    .matches(phoneRegex, ERROR_MESSAGES.FORM.INVALID_PHONE_FORMAT)
    .nullable(),
  email: Yup.string()
    .email(ERROR_MESSAGES.FORM.INVALID_EMAIL)
    .max(100, ERROR_MESSAGES.FORM.MAX_LENGTH(100, "Email")),
  headOfHousehold: Yup.boolean(),
  general: Yup.string().test(
    "at-least-one-field",
    ERROR_MESSAGES.FORM.AT_LEAST_ONE_FIELD_REQUIRED,
    function (_, context) {
      const {
        firstName,
        lastName,
        caseId,
        dateOfBirth,
        ssn,
        address,
        city,
        state,
        zip,
        phoneNumber,
        email,
      } = context.parent;

      const isAnyFieldFilled = !!(
        firstName ||
        lastName ||
        caseId ||
        dateOfBirth ||
        ssn ||
        address ||
        city ||
        state ||
        zip ||
        phoneNumber ||
        email
      );
      if (!isAnyFieldFilled) {
        return context.createError({
          message: ERROR_MESSAGES.FORM.AT_LEAST_ONE_FIELD_REQUIRED,
          path: "general",
        });
      }
      return true;
    }
  ),
});

const initialValues: SearchCaseFormValues = {
  firstName: "",
  lastName: "",
  caseId: "",
  dateOfBirth: "",
  ssn: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  phoneNumber: "",
  email: "",
  headOfHousehold: false,
  general: undefined,
};

const GlobalSearch: React.FC = () => {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCasesCount, setTotalCasesCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [caseResults, setCaseResults] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);

  const { data: userData } = useSelector((state: RootState) => state.user);
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const handleSearch = async (
    page: number = 1,
    currentSearchParams?: SearchCaseFormValues
  ) => {
    if (!userData?.userId || !userData?.activeLocation) {
      toast.error(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      let response;
      const effectiveSearchParams =
        currentSearchParams ||
        (showAdvancedSearch ? formik.values : { name: searchTerm });

      response = await searchCases(
        effectiveSearchParams,
        userData.userId,
        userData.activeLocation,
        page,
        10,
        location.state?.isRecentClick || false
      );

      setCaseResults(response.results);
      setTotalCasesCount(response.total);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
      dispatch(
        fetchRecentSearches({
          userId: userData.userId,
          locationId: userData.activeLocation,
        })
      );
    } catch (error: any) {
      toast.error(error.message || ERROR_MESSAGES.FETCH.GENERIC);
      setCaseResults([]);
      setTotalCasesCount(0);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik<SearchCaseFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async () => {
      if (!formik.errors.general) {
        await handleSearch();
      }
    },
  });

  useEffect(() => {
    const searchParams = location.state?.searchParams as
      | SearchCaseFormValues
      | undefined;
    if (searchParams) {
      const isAdvanced = Object.keys(searchParams).some(
        (key) =>
          key !== "name" &&
          key !== "general" &&
          searchParams[key as keyof SearchCaseFormValues]
      );

      if (searchParams.name && !isAdvanced) {
        setSearchTerm(searchParams.name);
        setShowAdvancedSearch(false);
      } else if (isAdvanced) {
        formik.setValues(searchParams);
        setShowAdvancedSearch(true);
      } else {
        formik.resetForm();
        setSearchTerm("");
        setShowAdvancedSearch(false);
      }
      handleSearch(1, searchParams);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, formik.setValues]);

  const handleBasicSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      await handleSearch();
    } else {
      toast.error(ERROR_MESSAGES.FORM.REQUIRED);
      setHasSearched(false);
      setCaseResults([]);
      setTotalCasesCount(0);
      setTotalPages(1);
      setCurrentPage(1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      handleSearch(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      handleSearch(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const startItem = (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalCasesCount);
  const paginationLabel = `${startItem}-${endItem} of ${totalCasesCount} Cases`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto">
        <FormikProvider value={formik}>
          <form
            onSubmit={
              showAdvancedSearch ? formik.handleSubmit : handleBasicSearchSubmit
            }
          >
            {!showAdvancedSearch ? (
              <div className="bg-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
                <div className="relative flex-grow mr-4">
                  <input
                    type="text"
                    placeholder={PLACEHOLDERS.SEARCH.CASES}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-2 border-purple text-gray-800 p-2 pl-10 pr-20 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple placeholder-gray-500"
                  />
                  <span
                    onClick={handleBasicSearchSubmit}
                    className="absolute top-1/2 -translate-y-1/2 right-4 text-purple cursor-pointer text-sm font-medium"
                  >
                    {STATIC_TEXTS.COMMON.SEARCH}
                  </span>
                  <Icon
                    icon="line-md:search"
                    className="absolute top-1/2 -translate-y-1/2 left-3 text-purple"
                    width="20"
                    height="20"
                  />
                </div>
                <Button
                  label="Advanced Search"
                  onClick={() => {
                    setShowAdvancedSearch(true);
                    setHasSearched(false);
                  }}
                  icon="mdi:magnify-plus-outline"
                  variant="submitStyle"
                  className="py-3 px-4 font-medium rounded-lg"
                />
              </div>
            ) : (
              <div className="bg-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg text-pink">
                <h2 className="text-xl font-semibold">
                  {STATIC_TEXTS.GLOBAL_SEARCH.ADVANCED_SEARCH_TITLE}
                </h2>
                <div className="flex gap-2">
                  <Button
                    label={STATIC_TEXTS.GLOBAL_SEARCH.BACK_TO_BASIC_SEARCH}
                    onClick={() => {
                      setShowAdvancedSearch(false);
                      formik.resetForm();
                      setSearchTerm("");
                      setCaseResults([]);
                      setTotalCasesCount(0);
                      setTotalPages(1);
                      setCurrentPage(1);
                      setHasSearched(false);
                    }}
                    icon="material-symbols-light:arrow-back-rounded"
                    variant="submitStyle"
                    className="py-3 px-4 font-medium rounded-lg"
                  />
                  <Button
                    label={STATIC_TEXTS.GLOBAL_SEARCH.RESET_SEARCH}
                    onClick={() => {
                      formik.resetForm();
                      setCaseResults([]);
                      setTotalCasesCount(0);
                      setTotalPages(1);
                      setCurrentPage(1);
                      setHasSearched(false);
                    }}
                    icon="mdi:refresh"
                    variant="default"
                    className="py-3 px-4 font-medium rounded-lg !bg-gray-500 hover:bg-gray-600 text-white"
                  />
                </div>
              </div>
            )}

            {showAdvancedSearch && (
              <div className="mx-4 mt-5 p-6 my-3 rounded-lg mb-6 bg-white ">
                {formik.submitCount > 0 && formik.errors.general && (
                  <div className="text-red-500 text-sm mb-4 font-semibold">
                    {formik.errors.general as string}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormInput
                    label={LABELS.FORM.FIRST_NAME}
                    name="firstName"
                    formik={formik}
                    maxLength={50}
                  />
                  <FormInput
                    label={LABELS.FORM.LAST_NAME}
                    name="lastName"
                    formik={formik}
                    maxLength={50}
                  />
                  <FormInput
                    label={LABELS.FORM.CASE_ID}
                    name="caseId"
                    formik={formik}
                    maxLength={20}
                  />
                  <FormInput
                    label={LABELS.FORM.DOB}
                    name="dateOfBirth"
                    type="date"
                    formik={formik}
                    placeholder="MM-DD-YYYY"
                  />
                  <FormInput
                    label={LABELS.FORM.SSN}
                    name="ssn"
                    formik={formik}
                    placeholder="XXX-XX-XXXX"
                  />
                  <FormInput
                    label={LABELS.FORM.ADDRESS}
                    name="address"
                    formik={formik}
                    maxLength={100}
                  />
                  <FormInput
                    label={LABELS.FORM.CITY}
                    name="city"
                    formik={formik}
                    maxLength={50}
                  />
                  <FormInput
                    label={LABELS.FORM.STATE}
                    name="state"
                    formik={formik}
                    maxLength={2}
                  />
                  <FormInput
                    label={LABELS.FORM.ZIP}
                    name="zip"
                    formik={formik}
                    placeholder="XXXXX or XXXXX-XXXX"
                  />
                  <FormInput
                    label={LABELS.FORM.PHONE}
                    name="phoneNumber"
                    formik={formik}
                    placeholder="(XXX) XXX-XXXX"
                  />
                  <FormInput
                    label={LABELS.FORM.EMAIL}
                    name="email"
                    type="email"
                    formik={formik}
                    maxLength={100}
                  />
                </div>
                <div className="flex items-center mt-6">
                  <Button
                    label={STATIC_TEXTS.COMMON.SEARCH}
                    type="submit"
                    variant="submitStyle"
                    icon="mdi:search"
                    className="px-4 py-3"
                    disabled={loading}
                  />
                  {loading && (
                    <div className="ml-4 text-purple">
                      {STATIC_TEXTS.COMMON.LOADING}
                    </div>
                  )}
                  <div className="ml-4 flex items-center">
                    <input
                      type="checkbox"
                      id="headOfHousehold"
                      {...formik.getFieldProps("headOfHousehold")}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded accent-purple"
                    />
                    <label
                      htmlFor="headOfHousehold"
                      className="ml-2 text-sm text-gray-700"
                    >
                      {STATIC_TEXTS.GLOBAL_SEARCH.HEAD_OF_HOUSEHOLD_FILTER}
                    </label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </FormikProvider>

        {hasSearched && (
          <div className="p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {STATIC_TEXTS.GLOBAL_SEARCH.SEARCH_RESULTS_TITLE}
            </h2>
            {caseResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {caseResults.map((caseItem) => (
                  <CaseCard key={caseItem._id} case={caseItem} />
                ))}
              </div>
            ) : (
              hasSearched &&
              !loading && (
                <p className="flex justify-center items-center w-full text-lg text-gray-500">
                  {STATIC_TEXTS.COMMON.NO_DATA}
                </p>
              )
            )}
          </div>
        )}
      </div>

      {hasSearched && (
        <>
          <div className="text-center py-4 text-gray-600">
            {STATIC_TEXTS.GLOBAL_SEARCH.NO_CASE_FOUND_PROMPT}{" "}
            <button
              onClick={() => {
                setIsAddCaseModalOpen(true);
                setHasSearched(false);
                setSearchTerm("");
                formik.resetForm();
              }}
              className="text-purple hover:underline"
            >
              {STATIC_TEXTS.GLOBAL_SEARCH.CREATE_CASE_LINK}
            </button>{" "}
            {STATIC_TEXTS.GLOBAL_SEARCH.FROM_SEARCH_TERMS}
          </div>
          {caseResults.length > 0 && (
            <PageFooter
              count={caseResults.length}
              label={paginationLabel}
              currentPage={currentPage}
              totalPages={totalPages}
              hasPrevious={currentPage > 1}
              hasNext={currentPage < totalPages}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
            />
          )}
        </>
      )}

      <AddCaseModal
        isOpen={isAddCaseModalOpen}
        onClose={() => setIsAddCaseModalOpen(false)}
      />
    </div>
  );
};

export default GlobalSearch;
