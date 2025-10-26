import { ERROR_MESSAGES, LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import * as Yup from "yup";
import { useFormik } from "formik";
import type { PrintBedListFormValues } from "@/types/case";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { errorMsg } from "@/utils/formikHelpers";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import {
  printBedList,
  type IPrintBedListPayload,
  fetchBedsByCompany,
  fetchBedTypesForFilter,
} from "@/services/BedManagementApi";
import type { ISiteListItem } from "@/types/bedManagement";

interface PrintBedListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrintBedListModal = ({ isOpen, onClose }: PrintBedListModalProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userData } = useSelector((state: RootState) => state.user);

  const [openSite, setOpenSite] = useState(false);
  const [openBedType, setOpenBedType] = useState(false);
  const [openBedStatus, setOpenBedStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Dynamic data states
  const [sites, setSites] = useState<ISiteListItem[]>([]);
  const [bedTypes, setBedTypes] = useState<
    Array<{
      _id: string;
      name: string;
      description: string;
    }>
  >([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingBedTypes, setLoadingBedTypes] = useState(false);

  const initialValues = {
    listTitle: "",
    description: "",
    siteFilterBy: [] as any[],
    bedTypeFilterBy: [] as string[],
    bedStatusFilterBy: [] as string[],
  };

  const validationSchema = Yup.object().shape({
    listTitle: Yup.string().required(ERROR_MESSAGES.FORM.REQUIRED),
    description: Yup.string(),
    siteFilterBy: Yup.array().of(Yup.object()),
    bedTypeFilterBy: Yup.array().of(Yup.string()),
    bedStatusFilterBy: Yup.array().of(Yup.string()),
  });

  // Fetch dynamic data
  const fetchDynamicData = async () => {
    if (!userData?.userId) return;

    try {
      // Fetch sites
      setLoadingSites(true);
      const sitesData = await fetchBedsByCompany(userData.userId);
      setSites(sitesData || []);

      // Fetch bed types
      setLoadingBedTypes(true);
      const bedTypesData = await fetchBedTypesForFilter(userData.userId);
      setBedTypes(bedTypesData || []);
    } catch (error) {
      console.error("Error fetching dynamic data:", error);
      toast.error("Failed to load filter options. Please try again.");
    } finally {
      setLoadingSites(false);
      setLoadingBedTypes(false);
    }
  };

  const formik = useFormik<PrintBedListFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      if (!userData?.userId) {
        toast.error("User not authenticated");
        return;
      }

      setLoading(true);
      try {
        // Prepare the API payload
        const payload: IPrintBedListPayload = {
          listTitle: values.listTitle,
        };

        // Add description if provided
        if (values.description) {
          payload.description = values.description;
        }

        // Add site filters if selected
        if (values.siteFilterBy.length > 0) {
          payload.siteIds = values.siteFilterBy.map((site) => site.siteId);
        }

        // Add bed type filters if selected
        if (values.bedTypeFilterBy.length > 0) {
          payload.bedTypeIds = values.bedTypeFilterBy;
        }

        // Add bed status filters if selected
        if (values.bedStatusFilterBy.length > 0) {
          payload.bedStatuses = values.bedStatusFilterBy;
        }

        // Call the API
        const response = await printBedList(userData.userId, payload);

        if (response.success) {
          // Navigate to print page with the data
          navigate(`${location.pathname}/print`, {
            state: {
              printData: response.data,
              listTitle: values.listTitle,
              description: values.description,
              filters: {
                sites: values.siteFilterBy.map((site) => site.siteId),
                bedTypes: values.bedTypeFilterBy,
                bedStatuses: values.bedStatusFilterBy,
              },
            },
          });
          onClose();
        } else {
          toast.error(response.message || "Failed to generate print list");
        }
      } catch (error) {
        console.error("Error generating print list:", error);
        toast.error("Failed to generate print list. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Increment reset key to force clean re-render
      setResetKey((prev) => prev + 1);

      // Reset form values
      formik.resetForm();

      // Reset filter section states
      setOpenSite(false);
      setOpenBedType(false);
      setOpenBedStatus(false);

      // Fetch dynamic data
      fetchDynamicData();
    }
  }, [isOpen]); // Remove formik from dependencies to prevent unnecessary re-renders

  const getInputClass = (field: keyof PrintBedListFormValues) =>
    `w-full px-4 py-3 border-2 rounded-lg shadow-sm focus:ring-1 focus:ring-purple/20 focus:border-purple transition-all duration-200 !outline-none ${
      formik.touched[field] && formik.errors[field]
        ? "border-red-300 bg-red-50"
        : "border-gray-300 bg-white hover:border-gray-400"
    }`;

  const FilterSection = ({
    title,
    isOpen,
    onToggle,
    children,
    selectedCount,
  }: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    selectedCount: number;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-4 flex items-center justify-between transition-all duration-200 hover:bg-gray-50 ${
          isOpen ? "bg-purple-50 border-b border-purple-200" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
            <Icon
              icon="mdi:filter-variant"
              width="16"
              height="16"
              className="text-purple"
            />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-800">{title}</div>
            <div className="text-sm text-gray-500">
              {selectedCount > 0
                ? `${selectedCount} selected`
                : "Skip to include all"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="bg-purple-100 text-purple text-xs font-medium px-2 py-1 rounded-full">
              {selectedCount}
            </span>
          )}
          <Icon
            icon={isOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
            width="20"
            height="20"
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  );

  const CheckboxItem = ({
    label,
    isChecked,
    onChange,
  }: {
    label: string;
    isChecked: boolean;
    onChange: () => void;
  }) => (
    <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white transition-colors duration-150">
      <div className="relative">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
            isChecked
              ? "bg-purple border-purple"
              : "border-gray-300 hover:border-purple"
          }`}
        >
          {isChecked && (
            <Icon
              icon="mdi:check"
              width="14"
              height="14"
              className="text-white"
            />
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700 select-none">
        {label}
      </span>
    </label>
  );

  return (
    <ModalWrapper
      key={`print-bed-list-${resetKey}`}
      isOpen={isOpen}
      onClose={onClose}
      title={STATIC_TEXTS.AGENCY.BED_MANAGEMENT.PRINT_BED_LIST}
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-between gap-3">
          <Button
            label={
              loading
                ? "Generating..."
                : STATIC_TEXTS.AGENCY.BED_MANAGEMENT.PRINT_BED_LIST
            }
            icon={loading ? "mdi:loading" : "mdi:printer"}
            onClick={() => formik.handleSubmit()}
            variant="submitStyle"
            disabled={loading}
          />
          <Button
            label="Cancel"
            icon="mdi:close"
            onClick={onClose}
            variant="default"
            disabled={loading}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-1">
        {/* Header Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg flex-shrink-0">
              <Icon
                icon="mdi:information"
                width="16"
                height="16"
                className="text-blue-600"
              />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">
                Print Bed List
              </h3>
              <p className="text-sm text-blue-700">
                Configure your bed list report with custom filters and
                descriptions. Leave filters empty to include all items.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-800 mb-2">
              {LABELS.FORM.LIST_TITLE} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...formik.getFieldProps("listTitle")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={getInputClass("listTitle")}
              placeholder="Enter a title for your bed list report"
              disabled={loading}
            />
            {errorMsg("listTitle", formik)}
          </div>

          <div>
            <label className="block font-semibold text-gray-800 mb-2">
              {LABELS.FORM.DESCRIPTION2}
            </label>
            <textarea
              rows={3}
              {...formik.getFieldProps("description")}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`${getInputClass("description")} resize-none`}
              placeholder="Add a description or notes for this report (optional)"
              disabled={loading}
            />
          </div>
        </div>

        {/* Filter Sections */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg">Filters</h3>

          <FilterSection
            title="Filter by Site"
            isOpen={openSite}
            onToggle={() => setOpenSite(!openSite)}
            selectedCount={formik.values.siteFilterBy.length}
          >
            {loadingSites ? (
              <div className="text-center py-4">Loading sites...</div>
            ) : sites.length === 0 ? (
              <div className="text-center py-4">No sites found.</div>
            ) : (
              sites.map((site) => {
                const isChecked = formik.values.siteFilterBy.some(
                  (item) => item.siteId === site.siteId
                );
                const handleToggle = () => {
                  const current = formik.values.siteFilterBy;
                  const newValue = isChecked
                    ? current.filter((item) => item.siteId !== site.siteId)
                    : [...current, site];
                  formik.setFieldValue("siteFilterBy", newValue);
                };
                return (
                  <CheckboxItem
                    key={site.siteId}
                    label={site.siteName || "Unnamed Site"}
                    isChecked={isChecked}
                    onChange={handleToggle}
                  />
                );
              })
            )}
          </FilterSection>

          <FilterSection
            title="Filter by Bed Type"
            isOpen={openBedType}
            onToggle={() => setOpenBedType(!openBedType)}
            selectedCount={formik.values.bedTypeFilterBy.length}
          >
            {loadingBedTypes ? (
              <div className="text-center py-4">Loading bed types...</div>
            ) : bedTypes.length === 0 ? (
              <div className="text-center py-4">No bed types found.</div>
            ) : (
              bedTypes.map((bedType) => {
                const isChecked = formik.values.bedTypeFilterBy.includes(
                  bedType._id
                );
                const handleToggle = () => {
                  const current = formik.values.bedTypeFilterBy;
                  const newValue = isChecked
                    ? current.filter((item) => item !== bedType._id)
                    : [...current, bedType._id];
                  formik.setFieldValue("bedTypeFilterBy", newValue);
                };
                return (
                  <CheckboxItem
                    key={bedType._id}
                    label={bedType.name}
                    isChecked={isChecked}
                    onChange={handleToggle}
                  />
                );
              })
            )}
          </FilterSection>

          <FilterSection
            title="Filter by Bed Status"
            isOpen={openBedStatus}
            onToggle={() => setOpenBedStatus(!openBedStatus)}
            selectedCount={formik.values.bedStatusFilterBy.length}
          >
            {["Available", "Occupied", "Unavailable"].map((label) => {
              const isChecked = formik.values.bedStatusFilterBy.includes(label);
              const handleToggle = () => {
                const current = formik.values.bedStatusFilterBy;
                const newValue = isChecked
                  ? current.filter((item) => item !== label)
                  : [...current, label];
                formik.setFieldValue("bedStatusFilterBy", newValue);
              };
              return (
                <CheckboxItem
                  key={label}
                  label={label}
                  isChecked={isChecked}
                  onChange={handleToggle}
                />
              );
            })}
          </FilterSection>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Icon
              icon="mdi:clipboard-text"
              width="18"
              height="18"
              className="text-gray-600"
            />
            <span className="font-semibold text-gray-800">Report Summary</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              • Sites:{" "}
              {formik.values.siteFilterBy.length > 0
                ? formik.values.siteFilterBy
                    .map((site) => site.siteName)
                    .join(", ")
                : "All sites"}
            </div>
            <div>
              • Bed Types:{" "}
              {formik.values.bedTypeFilterBy.length > 0
                ? formik.values.bedTypeFilterBy.length + " selected"
                : "All types"}
            </div>
            <div>
              • Status:{" "}
              {formik.values.bedStatusFilterBy.length > 0
                ? formik.values.bedStatusFilterBy.join(", ")
                : "All statuses"}
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default PrintBedListModal;
