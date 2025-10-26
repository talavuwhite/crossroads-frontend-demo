import { triggerBedsRefetch } from "@/redux/bedManagementSlice";
import type { RootState } from "@/redux/store";
import { createBedType, deleteBedType, fetchBedTypesBySite, updateBedType } from "@/services/BedManagementApi";
import type { IBedType } from "@/types/bedManagement";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { Formik, useFormik, type FormikHelpers, type FormikProps } from "formik";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as Yup from "yup";
import Button from "../ui/Button";
import FormInput from "../ui/FormInput";
import Loader from "../ui/Loader";
import ModalWrapper from "../ui/ModalWrapper";

const validationSchema = Yup.object({
    name: Yup.string()
        .trim()
        .required("Bed type name is required")
        .min(2, "Bed type name must be at least 2 characters")
        .max(50, "Bed type name must be less than 50 characters"),
});

interface IManageBedTypesModalProps {
    isOpen: boolean;
    onClose: () => void;
    siteId?: string;
}

const ManageBedTypesModal = ({ isOpen, onClose, siteId }: IManageBedTypesModalProps) => {
    const userData = useSelector((state: RootState) => state.user?.data);
    const [bedTypes, setBedTypes] = useState<IBedType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<{ id: string | null; name: string } | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const editingRowRef = useRef<HTMLLIElement | null>(null);
    const prevIsOpen = useRef(isOpen);
    const dispatch = useDispatch();

    // Fetch bed types
    const fetchBedTypes = useCallback(async () => {
        if (!siteId || !userData?.userId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchBedTypesBySite(userData?.userId ?? "", siteId ?? "");
            setBedTypes(data ?? []);
        } catch {
            setError("Failed to load bed types");
        } finally {
            setLoading(false);
        }
    }, [siteId, userData?.userId]);

    const handleModalOpen = useCallback(() => {
        if (!prevIsOpen.current && isOpen) {
            setShowAddForm(false);
            setEditing(null);
            setDeleting(null); // Clear deleting state on modal open
            fetchBedTypes();
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, fetchBedTypes]);

    useEffect(() => {
        handleModalOpen();
    }, [handleModalOpen]);

    useEffect(() => {
        if (editing?.id && inputRef.current) inputRef.current.focus();
    }, [editing?.id]);

    // Add Bed Type
    const addFormik: FormikProps<{ name: string }> = useFormik<{ name: string }>({
        initialValues: { name: "" },
        validationSchema,
        onSubmit: async (values, { resetForm, setSubmitting }) => {
            if ((bedTypes ?? []).some(bt => (bt?.name ?? "").trim().toLowerCase() === (values?.name ?? "").trim().toLowerCase())) {
                toast.error("Bed type name already exists");
                setSubmitting(false);
                return;
            }
            if (!userData?.userId || !siteId) {
                toast.error("Missing user or site");
                setSubmitting(false);
                return;
            }
            try {
                setLoading(true);
                const result = await createBedType(userData?.userId ?? "", (values?.name ?? "").trim(), siteId ?? "");
                setBedTypes(prev => [...(prev ?? []), result?.data ?? {}]);
                toast.success(result?.message ?? "Bed type added");
                setShowAddForm(false);
                resetForm();
            } catch (error: unknown) {
                let apiMsg = "";
                if (typeof error === "object" && error !== null && "response" in error) {
                    const response = (error as { response?: { data?: { message?: string } } }).response;
                    apiMsg = response?.data?.message || "";
                }
                toast.error(apiMsg || "Failed to add bed type");
            } finally {
                setLoading(false);
                setSubmitting(false);
            }
        },
    });

    // Edit Bed Type
    const startEdit = (bedType: IBedType) => {
        setDeleting(null);
        setEditing({ id: bedType?._id ?? null, name: bedType?.name ?? "" });
    };

    // Save Edit (with API)
    const handleEditSave = async (values: { name: string }, { setSubmitting }: FormikHelpers<{ name: string }>) => {
        if ((bedTypes ?? []).some(bt => (bt?.name ?? "").trim().toLowerCase() === (values?.name ?? "").trim().toLowerCase() && bt?._id !== editing?.id)) {
            toast.error("Bed type name already exists");
            setSubmitting(false);
            return;
        }
        if (!userData?.userId || !editing?.id || !siteId) {
            toast.error("Missing user, bed type, or site");
            setSubmitting(false);
            return;
        }
        // Find the original bed type before update
        const originalBedType = (bedTypes ?? []).find(bt => bt?._id === editing?.id);
        try {
            setLoading(true);
            const result = await updateBedType(userData?.userId ?? "", editing?.id ?? "", (values?.name ?? "").trim(), siteId ?? "");
            setBedTypes(prev => (prev ?? []).map(bt => bt?._id === editing?.id ? result?.data ?? bt : bt));
            toast.success(result?.message ?? "Bed type updated");
            setEditing(null);
            // Trigger refetch only if the original bed type was inUse and update was successful
            if (result?.success && originalBedType?.inUse) {
                dispatch(triggerBedsRefetch());
            }
        } catch (error: unknown) {
            let apiMsg = "";
            if (typeof error === "object" && error !== null && "response" in error) {
                const response = (error as { response?: { data?: { message?: string } } }).response;
                apiMsg = response?.data?.message || "";
            }
            toast.error(apiMsg || "Failed to update bed type");
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    // Cancel Edit
    const cancelEdit = () => {
        setEditing(null);
    };

    // Update handleDelete to not be called directly from the button, but from confirmation
    const handleDelete = async (bedType: IBedType) => {
        if (!userData?.userId) {
            toast.error("Missing user");
            return;
        }
        if (bedType?.inUse) return;
        try {
            setLoading(true);
            const result = await deleteBedType(userData?.userId ?? "", bedType?._id ?? "");
            setBedTypes(prev => (prev ?? []).filter(bt => bt?._id !== bedType?._id));
            toast.success(result?.message ?? "Bed type deleted");
            setDeleting(null);
        } catch (error: unknown) {
            let apiMsg = "";
            if (typeof error === "object" && error !== null && "response" in error) {
                const response = (error as { response?: { data?: { message?: string } } }).response;
                apiMsg = response?.data?.message || "";
            }
            toast.error(apiMsg || "Failed to delete bed type");
        } finally {
            setLoading(false);
        }
    };

    // Update setDeleting to clear editing state
    const handleStartDelete = (bedTypeId: string) => {
        setEditing(null);
        setDeleting(bedTypeId);
    };

    // When editing or adding, clear deleting state
    useEffect(() => {
        if (editing || showAddForm) setDeleting(null);
    }, [editing, showAddForm]);

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Manage Bed Types"
            widthClass="max-w-2xl"
            footer={
                <div className="flex justify-end gap-2">
                    <Button label="Close" variant="dangerStyle" onClick={onClose} />
                </div>
            }
        >
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Bed Types</h2>
                    {loading ? (
                        <Loader width={2} height={2} />
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        <div className="space-y-4">
                            <ul className="space-y-2">
                                {(bedTypes ?? []).length === 0 ? (
                                    <div className="text-gray-500 py-2">No bed types found.</div>
                                ) : (
                                    (bedTypes ?? []).map((bedType) => (
                                        <li
                                            key={bedType?._id ?? Math.random()}
                                            ref={editing?.id === bedType?._id ? editingRowRef : undefined}
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg mb-2"
                                        >
                                            {editing?.id === bedType?._id ? (
                                                <Formik
                                                    initialValues={{ name: editing?.name ?? "" }}
                                                    validationSchema={validationSchema}
                                                    enableReinitialize
                                                    onSubmit={handleEditSave}
                                                >
                                                    {({ values, handleChange, handleBlur, handleSubmit, errors, touched, isSubmitting }: FormikProps<{ name: string }>) => (
                                                        <form onSubmit={handleSubmit} className="w-full flex flex-wrap items-center">
                                                            <input
                                                                ref={inputRef}
                                                                name="name"
                                                                value={values?.name ?? ""}
                                                                onChange={handleChange}
                                                                onBlur={handleBlur}
                                                                placeholder="Enter bed type name"
                                                                className="px-3 py-2 border border-gray-300 flex-1 min-w-[200px] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple mr-3"
                                                                disabled={isSubmitting}
                                                            />
                                                            <div className="flex gap-2 mt-2 sm:mt-0">
                                                                <Button label={isSubmitting ? "Saving..." : "Save"} variant="submitStyle" type="submit" disabled={isSubmitting} className="!px-4 !py-2 !text-xs" />
                                                                <Button label="Cancel" variant="dangerStyle" onClick={cancelEdit} disabled={isSubmitting} className="!px-4 !py-2 !text-xs" />
                                                            </div>
                                                            <div className="w-full text-xs text-red-500 space-y-1">
                                                                {touched.name && errors.name && <div>{String(errors.name)}</div>}
                                                            </div>
                                                        </form>
                                                    )}
                                                </Formik>
                                            ) : (
                                                <>
                                                    <span className="flex-1 text-sm text-gray-700">{bedType?.name ?? ""}</span>
                                                    <div className="flex gap-4 flex-wrap">
                                                        {/* In the row actions, only show Rename if not in delete-confirmation mode for this row */}
                                                        {((!editing && !deleting) || editing?.id === bedType?._id || deleting === bedType?._id) && deleting !== bedType?._id && (
                                                            <Button
                                                                label="Rename"
                                                                variant="infoStyle"
                                                                onClick={() => startEdit(bedType)}
                                                                className="!bg-transparent !text-blue-500 hover:!text-blue-700 !px-0 !py-0 !rounded-none !shadow-none !text-base"
                                                                disabled={!!editing}
                                                            />
                                                        )}
                                                        {!bedType?.inUse ? (
                                                            deleting === bedType?._id ? (
                                                                <div className="flex gap-2 items-center">
                                                                    <span className="text-sm text-gray-700">Are you sure you want to delete this bed type?</span>
                                                                    <Button
                                                                        label="Yes"
                                                                        variant="dangerStyle"
                                                                        onClick={() => handleDelete(bedType)}
                                                                        className="!px-3 !py-1 !text-xs"
                                                                        disabled={loading}
                                                                    />
                                                                    <Button
                                                                        label="Cancel"
                                                                        variant="infoStyle"
                                                                        onClick={() => setDeleting(null)}
                                                                        className="!px-3 !py-1 !text-xs"
                                                                        disabled={loading}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                ((!editing && !deleting) || editing?.id === bedType?._id || deleting === bedType?._id) && (
                                                                    <Button
                                                                        label="Delete"
                                                                        variant="dangerStyle"
                                                                        onClick={() => handleStartDelete(bedType?._id ?? "")}
                                                                        className="!bg-transparent !text-red-500 hover:!text-red-700 !px-0 !py-0 !rounded-none !shadow-none !text-base"
                                                                        disabled={!!editing || loading}
                                                                    />
                                                                )
                                                            )
                                                        ) : (
                                                            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 ml-2">
                                                                <Icon icon="mdi:alert" className="text-yellow-500" width={16} height={16} />
                                                                <span className="text-xs text-yellow-800 font-medium">Cannot delete: In use</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    ))
                                )}
                            </ul>
                            {/* Add Form and Button */}
                            {showAddForm && !editing && (
                                <form onSubmit={addFormik.handleSubmit} className="bg-violet-50 border border-violet-100 rounded-lg p-5 mb-4 mt-2 flex flex-col gap-3 shadow-none">
                                    <FormInput
                                        label="Bed Type Name"
                                        name="name"
                                        formik={addFormik}
                                        required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-300 focus:border-violet-300 bg-white text-gray-800 text-base"
                                    />
                                    <div className="flex gap-3 mt-2 justify-end">
                                        <Button label="Add" variant="submitStyle" type="submit" className="!bg-violet-400 hover:!bg-violet-500 !text-white !px-6 !py-2 !rounded-lg !text-base !shadow-none" />
                                        <Button label="Cancel" variant="dangerStyle" onClick={() => { setShowAddForm(false); addFormik.resetForm(); }} className="!bg-red-500 hover:!bg-red-600 !text-white !px-6 !py-2 !rounded-lg !text-base !shadow-none" />
                                    </div>
                                </form>
                            )}
                            <Button
                                label="Add Bed Type"
                                variant="submitStyle"
                                onClick={() => setShowAddForm(true)}
                                icon="mdi:plus"
                                disabled={!!editing}
                            />
                        </div>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
};

export default ManageBedTypesModal; 