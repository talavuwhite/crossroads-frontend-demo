import type { RootState } from "@/redux/store";
import { fetchBedTypesBySite, upsertBeds } from "@/services/BedManagementApi";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import type { FormikErrors } from "formik";
import { Field, FieldArray, FormikProvider, useFormik } from "formik";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import Button from "../ui/Button";
import ModalWrapper from "../ui/ModalWrapper";

// --- Types ---
import type {
  IBedForm,
  IBedsFormValues,
  IBedType,
} from "@/types/bedManagement";

const defaultInitialValues: IBedsFormValues = {
  beds: [],
};

const validationSchema = Yup.object({
  beds: Yup.array().of(
    Yup.object({
      bedId: Yup.string(),
      bedName: Yup.string().required("Bed name is required"),
      room: Yup.string().required("Room is required"),
      bedTypeId: Yup.string().required("Bed type is required"),
      isArchived: Yup.boolean(),
    })
  ),
});

interface IManageSiteBedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManageBedTypes?: () => void;
  initialValues?: IBedsFormValues;
  siteId?: string;
  onSuccess?: () => void;
}

const ManageSiteBedsModal = ({
  isOpen,
  onClose,
  onManageBedTypes,
  initialValues,
  siteId,
  onSuccess,
}: IManageSiteBedsModalProps) => {
  // Get userId from Redux
  const userData = useSelector((state: RootState) => state.user.data);

  // State for site-specific bed types
  const [siteBedTypes, setSiteBedTypes] = useState<IBedType[]>([]);
  const [isLoadingBedTypes, setIsLoadingBedTypes] = useState(false);

  const fetchSiteBedTypes = useCallback(async () => {
    if (!siteId || !userData?.userId) return;

    setIsLoadingBedTypes(true);
    try {
      const response = await fetchBedTypesBySite(userData.userId, siteId);
      setSiteBedTypes(response);
    } catch (error) {
      console.error("Error fetching site bed types:", error);
      // Fallback to default types
      setSiteBedTypes([]);
    } finally {
      setIsLoadingBedTypes(false);
    }
  }, [siteId, userData?.userId]);

  // Fetch bed types for the specific site when modal opens
  useEffect(() => {
    if (isOpen && siteId) {
      fetchSiteBedTypes();
    }
  }, [isOpen, siteId, fetchSiteBedTypes]);

  // Move normalizedInitialValues logic above useFormik
  const normalizedInitialValues = initialValues
    ? {
        beds: initialValues.beds.map((bed) => ({
          ...bed,
          isArchived: Boolean(bed.isArchived),
          delete: bed.delete ?? false,
          siteId: siteId ?? "",
          // Map status to availability for legacy support, but use only availability in the form
          availability: bed.status ?? bed.availability ?? "Available",
        })),
      }
    : defaultInitialValues;

  const bedsFormik = useFormik<IBedsFormValues>({
    initialValues: normalizedInitialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!userData?.userId) {
        console.error("No userId found in Redux state");
        return;
      }
      // Only 'availability' is sent to the backend API
      const payload: IBedForm[] = values.beds.map((bed) => {
        const isNew = !bed.bedId || bed.bedId.length < 20;
        return {
          ...(isNew ? {} : { bedId: bed.bedId }),
          bedName: bed.bedName,
          room: bed.room,
          bedTypeId: bed.bedTypeId,
          siteId: siteId ?? "",
          availability: bed.availability,
          isArchived: bed.isArchived,
          ...(bed.delete ? { delete: true } : {}),
        };
      });
      try {
        const response = await upsertBeds(userData?.userId, payload);
        if (response?.success) {
          onSuccess?.();
          onClose();
        }
      } catch (error) {
        console.error("Error upserting beds:", error);
      }
    },
  });

  const { values, errors, touched } = bedsFormik;

  const handleManageBedTypes = () => {
    if (onManageBedTypes) {
      onManageBedTypes();
    }
  };

  const footerContent = (
    <>
      <Button
        icon="mdi:check"
        variant="submitStyle"
        label="Save Changes"
        type="submit"
        form="manage-site-beds-form"
      />
      <Button
        onClick={() => {
          bedsFormik.resetForm();
          onClose();
        }}
        label="Cancel"
      />
    </>
  );

  const renderBedsView = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <FormikProvider value={bedsFormik}>
          <form
            id="manage-site-beds-form"
            autoComplete="off"
            className="bg-white max-h-[60vh] overflow-y-auto"
            onSubmit={bedsFormik.handleSubmit}
          >
            <table className="w-full min-w-[300px] overflow-x-auto table-auto border border-purple">
              <thead>
                <tr className="bg-purple-100">
                  <th className="text-start px-3 py-2 uppercase text-xs border-r border-purple font-bold tracking-wide">
                    Bed Name
                  </th>
                  <th className="px-3 py-2 uppercase text-xs border-r border-purple font-bold tracking-wide">
                    Room
                  </th>
                  <th className="px-3 py-2 uppercase text-xs border-r border-purple font-bold tracking-wide">
                    <div className="flex items-center gap-2">
                      <span>Type</span>
                      <button
                        type="button"
                        onClick={handleManageBedTypes}
                        className="text-blue-700 text-xs underline ml-2 font-normal hover:text-blue-900"
                      >
                        Manage Bed Types
                      </button>
                    </div>
                  </th>
                  <th className="px-3 py-2 uppercase text-xs border-r border-purple font-bold tracking-wide">
                    Availability
                  </th>
                  <th className="px-3 py-2 uppercase text-xs font-bold tracking-wide">
                    Archive / Delete
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-800">
                <FieldArray name="beds">
                  {({ push }) => (
                    <>
                      {values.beds.map((bed, index) => (
                        <tr
                          key={`${bed.bedId || "bed"}-${index}`}
                          className="border-t border-purple"
                        >
                          {/* Bed Name */}
                          <td className="px-3 py-2 border-r border-purple align-middle">
                            <Field
                              name={`beds[${index}].bedName`}
                              className="w-full h-8 px-2 border border-gray-300 rounded bg-gray-50 font-bold text-xs focus:border-purple-500"
                              value={bed.bedName ?? ""}
                              placeholder="Bed Name"
                            />
                            {Array.isArray(errors.beds) &&
                              Array.isArray(touched.beds) &&
                              typeof errors.beds[index] === "object" &&
                              errors.beds[index] !== null &&
                              "bedName" in errors.beds[index] &&
                              errors.beds[index]?.bedName &&
                              touched.beds[index]?.bedName && (
                                <div className="text-xs text-red-500">
                                  {
                                    (
                                      errors.beds[
                                        index
                                      ] as FormikErrors<IBedForm>
                                    ).bedName
                                  }
                                </div>
                              )}
                          </td>
                          {/* Room */}
                          <td className="px-3 py-2 border-r border-purple align-middle">
                            <Field
                              name={`beds[${index}].room`}
                              className="w-full h-8 px-2 border border-gray-300 rounded bg-gray-50 font-bold text-xs focus:border-purple-500"
                              value={bed.room ?? ""}
                              placeholder="Room"
                            />
                            {Array.isArray(errors.beds) &&
                              Array.isArray(touched.beds) &&
                              typeof errors.beds[index] === "object" &&
                              errors.beds[index] !== null &&
                              "room" in errors.beds[index] &&
                              errors.beds[index]?.room &&
                              touched.beds[index]?.room && (
                                <div className="text-xs text-red-500">
                                  {
                                    (
                                      errors.beds[
                                        index
                                      ] as FormikErrors<IBedForm>
                                    ).room
                                  }
                                </div>
                              )}
                          </td>
                          {/* Type */}
                          <td className="px-3 py-2 border-r border-purple align-middle">
                            <Field
                              as="select"
                              name={`beds[${index}].bedTypeId`}
                              className="w-full h-8 px-2 border border-gray-300 rounded bg-gray-50 text-xs focus:border-purple-500"
                              value={bed.bedTypeId}
                              disabled={isLoadingBedTypes}
                            >
                              {isLoadingBedTypes ? (
                                <option value="">Loading bed types...</option>
                              ) : (
                                siteBedTypes.map((option) => (
                                  <option key={option._id} value={option._id}>
                                    {option.name}
                                  </option>
                                ))
                              )}
                            </Field>
                            {Array.isArray(errors.beds) &&
                              Array.isArray(touched.beds) &&
                              typeof errors.beds[index] === "object" &&
                              errors.beds[index] !== null &&
                              "bedTypeId" in errors.beds[index] &&
                              errors.beds[index]?.bedTypeId &&
                              touched.beds[index]?.bedTypeId && (
                                <div className="text-xs text-red-500">
                                  {
                                    (
                                      errors.beds[
                                        index
                                      ] as FormikErrors<IBedForm>
                                    ).bedTypeId
                                  }
                                </div>
                              )}
                          </td>
                          {/* Availability */}
                          <td className="px-3 py-2 border-r border-gray-200 align-middle">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full shadow ${
                                    bed.availability === "Available"
                                      ? "bg-green-500"
                                      : bed.availability === "Unavailable"
                                      ? "bg-red-500"
                                      : "bg-gray-500"
                                  }`}
                                ></span>
                                <span
                                  className={`font-bold text-xs ${
                                    bed.availability === "Available"
                                      ? "text-green-700"
                                      : bed.availability === "Unavailable"
                                      ? "text-red-700"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {bed.availability}
                                </span>
                              </div>
                              {bed.availability !== "Occupied" && (
                                <label className="flex items-center gap-1 text-xs font-normal mt-1">
                                  <input
                                    type="checkbox"
                                    checked={bed.availability === "Unavailable"}
                                    onChange={() => {
                                      bedsFormik.setFieldValue(
                                        `beds[${index}].availability`,
                                        bed.availability === "Unavailable"
                                          ? "Available"
                                          : "Unavailable"
                                      );
                                    }}
                                    className="w-4 h-4 accent-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                                  />
                                  <span className="ml-1">
                                    Make Bed Unavailable?
                                  </span>
                                </label>
                              )}
                            </div>
                          </td>
                          {/* Archive/Delete */}
                          <td className="px-3 py-2 align-middle">
                            {bed.availability !== "Occupied" && (
                              <div className="flex flex-col gap-1">
                                <label className="flex items-center gap-1 text-xs font-normal">
                                  <Field
                                    name={`beds[${index}].isArchived`}
                                    type="checkbox"
                                    className="w-4 h-4 accent-red-500 focus:ring-2 focus:ring-red-200 transition"
                                    checked={!!bed.isArchived}
                                  />
                                  <span className="ml-1">Archive Bed?</span>
                                </label>
                                <label className="flex items-center gap-1 text-xs font-normal mt-1">
                                  <Field
                                    name={`beds[${index}].delete`}
                                    type="checkbox"
                                    className="w-4 h-4 accent-red-500 focus:ring-2 focus:ring-red-200 transition"
                                    checked={!!bed.delete}
                                  />
                                  <span className="ml-1">Delete Bed?</span>
                                </label>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-purple-100 border-t border-purple">
                        <td colSpan={5} className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              push({
                                // Do not set bedId for new beds
                                bedName: "",
                                room: "",
                                bedTypeId: siteBedTypes[0]?._id || "",
                                availability: "Available",
                                isArchived: false,
                                delete: false,
                                siteId: siteId ?? "",
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
                              Add Bed
                            </span>
                          </button>
                        </td>
                      </tr>
                    </>
                  )}
                </FieldArray>
              </tbody>
            </table>
          </form>
        </FormikProvider>
      </div>
    </div>
  );

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={() => {
          bedsFormik.resetForm();
          onClose();
        }}
        title="Manage Site Beds"
        footer={footerContent}
        widthClass="max-w-4xl"
      >
        {renderBedsView()}
      </ModalWrapper>
    </>
  );
};

export default ManageSiteBedsModal;
