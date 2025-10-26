import { useState, useEffect, useRef } from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import { useFormik } from "formik";
import type { FormikHelpers, FormikProps } from "formik";
import * as Yup from "yup";
import FormInput from "@/components/ui/FormInput";
import FileInput from "@/components/ui/FileInput";
import {
  addressAutocompleteOptions,
  inactivityTimeoutOptions,
  primaryAdminOptions,
} from "@/utils/mockData";
import {
  getCountries,
  createCountry,
  deleteCountry,
  updateCountry,
} from "@/services/CountryApi";
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from "@/services/UnitApi";
import {
  getRequestStatuses,
  createRequestStatus,
  updateRequestStatus,
  deleteRequestStatus,
} from "@/services/RequestStatusApi";
import type { Country, RequestStatus, Unit } from "@/types/index";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import Loader from "@/components/ui/Loader";
import { NetworkSettingsTabs as TABS } from "@/utils/constants";
import { Formik } from "formik";
import {
  getAgeRanges,
  createAgeRange,
  updateAgeRange,
  deleteAgeRange,
  type AgeRange,
} from "@/services/AgeRangeApi";

interface NetworkSettings {
  networkName: string;
  primaryAdmin: string;
  inactivityTimeout: string;
  addressAutocomplete: string;
  ageRanges: { label: string }[];
  roi: any;
  units: string[];
  requestStatuses: string[];
}

const initialNetworkSettings: NetworkSettings = {
  networkName: "Jackson Resource Center CCS",
  primaryAdmin: "Putalamus White at Jackson Resource Center",
  inactivityTimeout: "1 hour",
  addressAutocomplete: "Off",
  ageRanges: [
    { label: "children (0-17)" },
    { label: "adults (18-59)" },
    { label: "seniors (60+)" },
  ],
  roi: null,
  units: ["Dollars", "Boxes/Bags", "Meal", "Night", "Pounds", "Shower"],
  requestStatuses: ["Pending", "Approved", "Denied"],
};

const validationSchemas = {
  network: Yup.object({
    networkName: Yup.string().required("Network Name is required"),
    primaryAdmin: Yup.string().required("Primary Admin is required"),
    inactivityTimeout: Yup.string().required("Inactivity Timeout is required"),
    addressAutocomplete: Yup.string().required(
      "Address Autocomplete is required"
    ),
    roi: Yup.mixed().nullable(),
  }),
  ageRange: Yup.object({
    label: Yup.string()
      .trim()
      .required("Age range name is required")
      .max(30, "Max 30 characters"),
    min: Yup.number()
      .typeError("Enter a valid number")
      .min(1, "Min age must be 1 or more")
      .required("Min age is required"),
    max: Yup.number()
      .typeError("Enter a valid number")
      .moreThan(Yup.ref("min"), "Max age must be greater than min age")
      .required("Max age is required"),
  }),
  item: Yup.object({
    name: Yup.string()
      .trim()
      .required("Name is required")
      .max(20, "Max 20 characters"),
  }),
};

interface EditNetworkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditNetworkSettingsModal = ({
  isOpen,
  onClose,
}: EditNetworkSettingsModalProps) => {
  const [tab, setTab] = useState(0);
  const [networkSettings, setNetworkSettings] = useState<NetworkSettings>(
    initialNetworkSettings
  );
  const [showAddForm, setShowAddForm] = useState({
    ageRange: false,
    unit: false,
    country: false,
    requestStatus: false,
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus[]>([]);
  const [ageRanges, setAgeRanges] = useState<AgeRange[]>([]);
  const [loading, setLoading] = useState({
    countries: false,
    units: false,
    update: false,
    requestStatuses: false,
    ageRanges: false,
  });
  const [error, setError] = useState({
    countries: null as string | null,
    units: null as string | null,
    requestStatuses: null as string | null,
    ageRanges: null as string | null,
  });
  const [editing, setEditing] = useState<
    | {
        id: string | null;
        name: string;
        type: "country" | "unit" | "requestStatus";
      }
    | {
        id: string | null;
        label: string;
        min: string;
        max: string;
        type: "ageRange";
      }
    | { id: null; name: ""; type: null }
  >({ id: null, name: "", type: null });

  const { data: user } = useSelector((state: RootState) => state.user);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editingRowRef = useRef<HTMLLIElement | null>(null);
  const prevIsOpen = useRef(isOpen);

  const formik = useFormik({
    initialValues: networkSettings,
    validationSchema: validationSchemas.network,
    onSubmit: (values) => {
      setNetworkSettings(values);
      onClose();
    },
    enableReinitialize: true,
  });

  const addUnitFormik: FormikProps<{ name: string }> = useFormik<{
    name: string;
  }>({
    initialValues: { name: "" },
    validationSchema: validationSchemas.item,
    onSubmit: async (values, { resetForm }) => {
      if (!user?.userId) return toast.error("User authentication missing");
      try {
        await createUnit(values.name.trim(), user.userId);
        setTimeout(async () => {
          await fetchUnits();
        }, 500);
        toast.success("Unit added successfully");
        setShowAddForm((prev) => ({ ...prev, unit: false }));
        resetForm();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add unit"
        );
      }
    },
  });

  const addCountyFormik: FormikProps<{ name: string }> = useFormik<{
    name: string;
  }>({
    initialValues: { name: "" },
    validationSchema: validationSchemas.item,
    onSubmit: async (values, { resetForm }) => {
      await handleAddCountry(values.name.trim());
      setShowAddForm((prev) => ({ ...prev, country: false }));
      resetForm();
    },
  });

  const addRequestStatusFormik: FormikProps<{ name: string }> = useFormik<{
    name: string;
  }>({
    initialValues: { name: "" },
    validationSchema: validationSchemas.item,
    onSubmit: async (values, { resetForm }) => {
      await handleAddRequestStatus(values.name.trim());
      setShowAddForm((prev) => ({ ...prev, requestStatus: false }));
      resetForm();
    },
  });

  const addAgeRangeFormik: FormikProps<{
    label: string;
    min: string;
    max: string;
  }> = useFormik<{ label: string; min: string; max: string }>({
    initialValues: { label: "", min: "", max: "" },
    validationSchema: validationSchemas.ageRange,
    onSubmit: async (values, { resetForm }) => {
      await handleAddAgeRange(
        values.label,
        Number(values.min),
        Number(values.max)
      );
      setShowAddForm((prev) => ({ ...prev, ageRange: false }));
      resetForm();
    },
  });

  useEffect(() => {
    if (!prevIsOpen.current && isOpen) {
      setTab(0);
      setShowAddForm((prev) => ({
        ...prev,
        country: false,
        unit: false,
        ageRange: false,
        requestStatus: false,
      }));
      if (user?.userId) {
        fetchUnits();
        fetchCountries();
        fetchRequestStatuses();
        fetchAgeRanges();
      }
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, user?.userId]);

  useEffect(() => {
    if (tab === 1 && user?.userId) fetchUnits();
    if (tab === 2) fetchCountries();
    if (tab == 4) fetchRequestStatuses();
    if (tab === 0 && user?.userId) fetchAgeRanges();
  }, [tab, user?.userId]);

  useEffect(() => {
    if (editing.id && inputRef.current) inputRef.current.focus();
  }, [editing.id]);

  useEffect(() => {
    if (!editing.id) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editingRowRef.current &&
        !editingRowRef.current.contains(event.target as Node)
      ) {
        cancelEdit();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelEdit();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editing.id]);

  const fetchCountries = async () => {
    if (!user?.userId) {
      setError((prev) => ({
        ...prev,
        countries: "User authentication missing",
      }));
      return toast.error("User authentication missing");
    }
    setLoading((prev) => ({ ...prev, countries: true }));
    setError((prev) => ({ ...prev, countries: null }));
    try {
      const countryList = await getCountries(user.userId);
      setCountries(countryList);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load countries";
      setError((prev) => ({ ...prev, countries: message }));
      toast.error(message);
    } finally {
      setLoading((prev) => ({ ...prev, countries: false }));
    }
  };

  const fetchUnits = async () => {
    if (!user?.userId) {
      setError((prev) => ({ ...prev, units: "User authentication missing" }));
      return toast.error("User authentication missing");
    }
    setLoading((prev) => ({ ...prev, units: true }));
    setError((prev) => ({ ...prev, units: null }));
    try {
      const data = await getUnits(user.userId);
      setUnits(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch units";
      setError((prev) => ({ ...prev, units: message }));
      toast.error(message);
    } finally {
      setLoading((prev) => ({ ...prev, units: false }));
    }
  };

  const fetchRequestStatuses = async () => {
    if (!user?.userId) {
      setError((prev) => ({
        ...prev,
        requestStatuses: "User authentication missing",
      }));
      return toast.error("User authentication missing");
    }
    setLoading((prev) => ({ ...prev, requestStatuses: true }));
    setError((prev) => ({ ...prev, requestStatuses: null }));
    try {
      const data = await getRequestStatuses(user.userId, user.activeLocation);
      setRequestStatuses(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch request statuses";
      setError((prev) => ({ ...prev, requestStatuses: message }));
      toast.error(message);
    } finally {
      setLoading((prev) => ({ ...prev, requestStatuses: false }));
    }
  };

  const fetchAgeRanges = async () => {
    if (!user?.userId) {
      setError((prev) => ({
        ...prev,
        ageRanges: "User authentication missing",
      }));
      return toast.error("User authentication missing");
    }
    setLoading((prev) => ({ ...prev, ageRanges: true }));
    setError((prev) => ({ ...prev, ageRanges: null }));
    try {
      const data = await getAgeRanges(user.userId);
      setAgeRanges(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch age ranges";
      setError((prev) => ({ ...prev, ageRanges: message }));
      toast.error(message);
    } finally {
      setLoading((prev) => ({ ...prev, ageRanges: false }));
    }
  };

  const handleAddCountry = async (name: string) => {
    if (!name || !user?.userId)
      return toast.error("User authentication or name missing");
    try {
      await createCountry(name, user.userId);
      setTimeout(async () => {
        await fetchCountries();
      }, 500);
      toast.success("Country added successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add country"
      );
    }
  };

  const handleDelete = async (id: string, type: "country" | "unit") => {
    if (!user?.userId) return toast.error("User authentication missing");
    try {
      if (type === "country") {
        await deleteCountry(id, user.userId);
        setTimeout(async () => {
          await fetchCountries();
        }, 500);
        toast.success("Country deleted successfully");
      } else {
        await deleteUnit(id, user.userId);
        setTimeout(async () => {
          await fetchUnits();
        }, 500);
        toast.success("Unit deleted successfully");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to delete ${type}`
      );
    }
  };

  const handleAddRequestStatus = async (name: string) => {
    if (!name || !user?.userId)
      return toast.error("User authentication or name missing");
    try {
      await createRequestStatus(name, user.userId);
      setTimeout(async () => {
        await fetchRequestStatuses();
      }, 500);
      toast.success("Request status added successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add request status"
      );
    }
  };

  const handleDeleteRequestStatus = async (id: string) => {
    if (!user?.userId) return toast.error("User authentication missing");
    try {
      await deleteRequestStatus(id, user.userId);
      setTimeout(async () => {
        await fetchRequestStatuses();
      }, 500);
      toast.success("Request status deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete request status"
      );
    }
  };

  const handleAddAgeRange = async (label: string, min: number, max: number) => {
    if (!label || min === undefined || max === undefined || !user?.userId)
      return toast.error("Missing required fields");
    try {
      await createAgeRange(label, min, max, user.userId);
      await fetchAgeRanges();
      toast.success("Age range added successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add age range"
      );
    }
  };

  const handleUpdateAgeRange = async (
    id: string,
    label: string,
    min: number,
    max: number
  ) => {
    if (
      !id ||
      !label ||
      min === undefined ||
      max === undefined ||
      !user?.userId
    )
      return toast.error("Missing required fields");
    setLoading((prev) => ({ ...prev, update: true }));
    try {
      await updateAgeRange(id, label, min, max, user.userId);
      await fetchAgeRanges();
      toast.success("Age range updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update age range"
      );
    } finally {
      setLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const handleDeleteAgeRange = async (id: string) => {
    if (!user?.userId) return toast.error("User authentication missing");
    try {
      await deleteAgeRange(id, user.userId);
      await fetchAgeRanges();
      toast.success("Age range deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete age range"
      );
    }
  };

  const startEdit = (
    item: Country | Unit | RequestStatus | AgeRange,
    type: "country" | "unit" | "requestStatus" | "ageRange"
  ) => {
    if (type === "ageRange") {
      const age = item as AgeRange;
      setEditing({
        id: age._id,
        label: age.label,
        min: String(age.min),
        max: String(age.max),
        type: "ageRange",
      });
    } else {
      setEditing({ id: (item as any)._id, name: (item as any).name, type });
    }
  };

  const cancelEdit = () => {
    setEditing({ id: null, name: "", type: null });
  };
  const renderSelectField = (
    name: keyof NetworkSettings,
    label: string,
    options: { value: string; label: string }[]
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-primary">*</span>
      </label>
      <select
        name={name}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-400 outline-none"
        value={formik.values[name] as string}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        disabled
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {formik.touched[name] && (formik.errors[name] as string) && (
        <p className="text-red-500 text-xs mt-1">
          {formik.errors[name] as string}
        </p>
      )}
    </div>
  );

  // const renderItemList = (
  //   items: { label: string }[] | string[],
  //   type: keyof typeof showAddForm,
  //   onEdit: () => void,
  //   onDelete: () => void
  // ) => (
  //   <ul className="mb-2">
  //     {items.length === 0 ? (
  //       <li className="text-gray-500">No {type} added yet.</li>
  //     ) : (
  //       items.map((item) => (
  //         <li
  //           key={typeof item === "string" ? item : item.label}
  //           className="flex items-center gap-2 text-gray-700"
  //         >
  //           <span className="flex-1">
  //             • {typeof item === "string" ? item : item.label}
  //           </span>
  //           <Button
  //             label="Rename"
  //             variant="infoStyle"
  //             onClick={onEdit}
  //             className="!bg-transparent !text-blue-600 underline underline-offset-2 !px-0"
  //           />
  //           <Button
  //             label="Delete"
  //             variant="dangerStyle"
  //             onClick={onDelete}
  //             className="!bg-transparent !text-primary !px-0 underline underline-offset-2"
  //           />
  //         </li>
  //       ))
  //     )}
  //   </ul>
  // );

  function renderAddForm<T>(
    type: keyof typeof showAddForm,
    formikInstance: FormikProps<T>
  ) {
    return (
      showAddForm[type] && (
        <form
          onSubmit={formikInstance.handleSubmit}
          className="bg-purple/10 border border-purple/20 rounded-md p-4 mb-4"
        >
          {type === "ageRange" ? (
            <>
              <FormInput
                label="Add report age range called:"
                name="label"
                formik={formikInstance as any}
                required
              />
              <div className="flex items-end gap-2 mt-2">
                <FormInput
                  label="Min Age"
                  name="min"
                  type="number"
                  formik={formikInstance as any}
                  required
                  className="w-20"
                />
                <span className="pb-2">to</span>
                <FormInput
                  label="Max Age"
                  name="max"
                  type="number"
                  formik={formikInstance as any}
                  required
                  className="w-20"
                />
                <span className="pb-2">years old</span>
              </div>
            </>
          ) : (
            <FormInput
              label="Name"
              name="name"
              formik={formikInstance as any}
              required
            />
          )}
          <div className="flex gap-2 mt-4 justify-end">
            <Button
              label="Add"
              variant="submitStyle"
              onClick={() => formikInstance.handleSubmit()}
            />
            <Button
              label="Cancel"
              variant="dangerStyle"
              onClick={() => {
                setShowAddForm((prev) => ({ ...prev, [type]: false }));
                formikInstance.resetForm();
              }}
            />
          </div>
        </form>
      )
    );
  }

  function hasNameProperty(item: any): item is { name: string } {
    return (
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      typeof item.name === "string"
    );
  }

  const renderEditableList = (
    items: (Country | Unit | RequestStatus | AgeRange)[],
    type: "country" | "unit" | "requestStatus" | "ageRange"
  ) => {
    const isLoading =
      loading[
        type === "country"
          ? "countries"
          : type === "unit"
          ? "units"
          : type === "requestStatus"
          ? "requestStatuses"
          : "ageRanges"
      ];

    const errorMessage =
      error[
        type === "country"
          ? "countries"
          : type === "unit"
          ? "units"
          : type === "requestStatus"
          ? "requestStatuses"
          : "ageRanges"
      ];

    return (
      <div className="space-y-4">
        {isLoading ? (
          <Loader width={2} height={2} />
        ) : errorMessage ? (
          <div className="text-red-500">{errorMessage}</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500 py-2">No {type}s found.</div>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {items.map((item, index) => (
              <li
                key={item._id}
                ref={editing.id === item._id ? editingRowRef : undefined}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 px-4 transition ${
                  editing.id === item._id
                    ? "bg-white border-2 border-purple-300 shadow-md"
                    : index % 2 === 0
                    ? "bg-purpleLight"
                    : "bg-white"
                }`}
              >
                {editing.id === item._id ? (
                  <Formik
                    initialValues={
                      type === "ageRange"
                        ? {
                            label: (editing as any).label,
                            min: (editing as any).min,
                            max: (editing as any).max,
                          }
                        : { name: (editing as any).name }
                    }
                    validationSchema={
                      type === "ageRange"
                        ? validationSchemas.ageRange
                        : validationSchemas.item
                    }
                    enableReinitialize
                    onSubmit={async (
                      values: any,
                      { setSubmitting, resetForm }: FormikHelpers<any>
                    ) => {
                      if (!user?.userId) return;
                      setLoading((prev) => ({ ...prev, update: true }));
                      try {
                        if (editing.type === "country") {
                          await updateCountry(
                            editing.id!,
                            values.name.trim(),
                            user.userId
                          );
                          setTimeout(async () => {
                            await fetchCountries();
                          }, 500);
                          toast.success("Country updated successfully");
                        } else if (editing.type === "unit") {
                          await updateUnit(
                            editing.id!,
                            values.name.trim(),
                            user.userId
                          );
                          setTimeout(async () => {
                            await fetchUnits();
                          }, 500);
                          toast.success("Unit updated successfully");
                        } else if (editing.type === "requestStatus") {
                          await updateRequestStatus(
                            editing.id!,
                            values.name.trim(),
                            user.userId
                          );
                          setTimeout(async () => {
                            await fetchRequestStatuses();
                          }, 500);
                          toast.success("Request status updated successfully");
                        } else if (editing.type === "ageRange") {
                          await handleUpdateAgeRange(
                            editing.id!,
                            values.label,
                            Number(values.min),
                            Number(values.max)
                          );
                          toast.success("Age range updated successfully");
                        }
                        cancelEdit();
                        resetForm();
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : `Failed to update ${editing.type}`
                        );
                      } finally {
                        setLoading((prev) => ({ ...prev, update: false }));
                        setSubmitting(false);
                      }
                    }}
                  >
                    {({
                      values,
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      errors,
                      touched,
                    }: FormikProps<any>) => (
                      <form
                        onSubmit={handleSubmit}
                        className="w-full flex flex-wrap items-center gap-3"
                      >
                        {type === "ageRange" ? (
                          <>
                            <input
                              name="label"
                              value={values.label}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Label"
                              className="px-2 py-1 border border-gray-300  flex-1 min-w-[100px] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                              disabled={loading.update}
                            />
                            <input
                              name="min"
                              type="number"
                              value={values.min}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Min"
                              className="px-2 py-1 border border-gray-300  w-[80px] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                              disabled={loading.update}
                            />
                            <input
                              name="max"
                              type="number"
                              value={values.max}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              placeholder="Max"
                              className="px-2 py-1 border border-gray-300  w-[80px] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                              disabled={loading.update}
                            />
                          </>
                        ) : (
                          <input
                            ref={inputRef}
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Enter name"
                            className="px-3 py-2 border border-gray-300  flex-1 min-w-[200px] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
                            disabled={loading.update}
                          />
                        )}
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <Button
                            label={loading.update ? "Saving..." : "Save"}
                            variant="submitStyle"
                            type="submit"
                            disabled={loading.update}
                            className="!px-4 !py-2 !text-xs"
                          />
                          <Button
                            label="Cancel"
                            variant="dangerStyle"
                            onClick={cancelEdit}
                            disabled={loading.update}
                            className="!px-4 !py-2 !text-xs"
                          />
                        </div>
                        <div className="w-full text-xs text-red-500 space-y-1">
                          {type === "ageRange" &&
                            touched.label &&
                            errors.label && <div>{String(errors.label)}</div>}
                          {type === "ageRange" && touched.min && errors.min && (
                            <div>{String(errors.min)}</div>
                          )}
                          {type === "ageRange" && touched.max && errors.max && (
                            <div>{String(errors.max)}</div>
                          )}
                          {type !== "ageRange" &&
                            touched.name &&
                            errors.name && <div>{String(errors.name)}</div>}
                        </div>
                      </form>
                    )}
                  </Formik>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700">
                      {type === "ageRange"
                        ? `${(item as AgeRange).label} (${
                            (item as AgeRange).min
                          }-${(item as AgeRange).max})`
                        : hasNameProperty(item)
                        ? item.name
                        : ""}
                    </span>
                    <div className="flex gap-4 flex-wrap">
                      <Button
                        label="Rename"
                        variant="infoStyle"
                        onClick={() => startEdit(item, type)}
                        className="!bg-transparent !text-blue-600 hover:underline !px-0"
                        disabled={!!editing.id}
                      />
                      <Button
                        label="Delete"
                        variant="dangerStyle"
                        onClick={() =>
                          type === "ageRange"
                            ? handleDeleteAgeRange(item._id)
                            : type === "requestStatus"
                            ? handleDeleteRequestStatus(item._id)
                            : handleDelete(item._id, type as any)
                        }
                        className="!bg-transparent !text-primary hover:underline !px-0"
                        disabled={!!editing.id}
                      />
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add Form and Button */}
        <div className="pt-4 space-y-3">
          {type === "unit" &&
            !editing.id &&
            renderAddForm("unit", addUnitFormik)}
          {type === "country" &&
            !editing.id &&
            renderAddForm("country", addCountyFormik)}
          {type === "requestStatus" &&
            renderAddForm("requestStatus", addRequestStatusFormik)}
          {type === "ageRange" &&
            !editing.id &&
            renderAddForm("ageRange", addAgeRangeFormik)}

          <Button
            label={`Add ${
              type === "ageRange"
                ? "Age Range"
                : type.charAt(0).toUpperCase() + type.slice(1)
            }`}
            variant="submitStyle"
            onClick={() =>
              setShowAddForm((prev) => ({
                ...prev,
                [type]: true,
              }))
            }
            icon="mdi:plus"
            disabled={!!editing.id}
          />
        </div>
      </div>
    );
  };

  const renderGeneralTab = () => (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Network Name"
          name="networkName"
          formik={formik}
          required
          disabled
        />
        {renderSelectField(
          "primaryAdmin",
          "Primary Admin",
          primaryAdminOptions
        )}
        {renderSelectField(
          "inactivityTimeout",
          "Inactivity Timeout",
          inactivityTimeoutOptions
        )}
        {renderSelectField(
          "addressAutocomplete",
          "Address Autocomplete (Pro Only)",
          addressAutocompleteOptions
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Age ranges for reports:
        </label>
        {renderEditableList(ageRanges, "ageRange")}
      </div>
      <FileInput
        label="Click here to change image"
        name="roi"
        showPreview={true}
        formik={formik}
      />
    </form>
  );

  const renderTabContent = () => {
    switch (tab) {
      case 0:
        return renderGeneralTab();
      case 1:
        return renderEditableList(units, "unit");
      case 2:
        return renderEditableList(countries, "country");
      case 3:
        return (
          <div className="space-y-2">
            {renderEditableList(requestStatuses, "requestStatus")}
          </div>
        );
      default:
        return null;
    }
  };

  const handleTabChange = (i: number) => {
    setTab(i);
    setEditing({ id: null, name: "", type: null });
    setShowAddForm({
      ageRange: false,
      unit: false,
      country: false,
      requestStatus: false,
    });
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Network Settings"
      widthClass="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          {tab === 0 && (
            <Button label="Save Changes" variant="submitStyle" type="submit" />
          )}
          <Button label="Cancel" variant="dangerStyle" onClick={onClose} />
        </div>
      }
    >
      <div className="flex flex-col h-full">
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`px-3 md:px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer text-sm md:text-base
                ${
                  tab === i
                    ? "bg-transparent text-purple border-b-2 border-purple"
                    : "text-gray-600"
                }`}
              onClick={() => handleTabChange(i)}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>
        {renderTabContent()}
      </div>
    </ModalWrapper>
  );
};

export default EditNetworkSettingsModal;
