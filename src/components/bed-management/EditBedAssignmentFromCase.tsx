import ModalWrapper from "@/components/ui/ModalWrapper";
import type { RootState } from '@/redux/store';
import { fetchAvailableBedsBySite, editBedAssignment, type IBedCheckInRequestItem, type IAvailableBedOfSiteForCheckIn } from '@/services/BedManagementApi';
import type { IBedListItem } from '@/types/bedManagement';
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { FormikProvider, useFormik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from 'react-redux';
import * as Yup from "yup";

interface IEditBedAssignmentFromCaseProps {
    isOpen: boolean;
    onClose: () => void;
    assignment?: IBedCheckInRequestItem | null;
    availableBedOptions?: IBedListItem[];
    onSuccess?: () => void;
}

interface IFormValues {
    bedId: string;
    bedName: string;
    room: string;
    bedTypeId: string;
    bedTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    notes: string;
}

const EditBedAssignmentFromCase: React.FC<IEditBedAssignmentFromCaseProps> = ({ isOpen, onClose, assignment, availableBedOptions, onSuccess }) => {
    const { data: userData } =
        useSelector((state: RootState) => state.user) ?? {};
    const data = assignment;
    // Try to find the matching bed in availableBedOptions by bedName
    const initialBed = availableBedOptions?.find(b => b.bedName === data?.bedName);
    const [isChangingBed, setIsChangingBed] = React.useState(false);
    // Track selected bedId for select

    const [availableBeds, setAvailableBeds] = useState<IAvailableBedOfSiteForCheckIn[]>([]);
    useEffect(() => {
        if (isOpen && data?.siteId && userData?.userId) {
            fetchAvailableBedsBySite(data.siteId, userData.userId)
                .then(res => setAvailableBeds(res?.data?.beds || []));
        }
    }, [isOpen, data?.siteId, userData?.userId]);

    const bedOptions = useMemo(() =>
        availableBeds.map(bed => ({
            label: `${bed.bedName} - ${bed.room} - ${bed.bedType.name}`,
            value: bed.bedId,
            ...bed
        })), [availableBeds]);

    const getToday = () => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    };

    const initialValues: IFormValues = {
        bedId: initialBed?.bedId || '',
        bedName: initialBed?.bedName || data?.bedName || '',
        room: initialBed?.room || data?.room || '',
        bedTypeId: initialBed?.bedTypeId || '',
        bedTypeName: initialBed?.bedTypeName || data?.bedTypeName || '',
        checkInDate: data?.checkInDate ? data.checkInDate.split('T')[0] : '',
        checkOutDate: data?.checkOutDate ? data.checkOutDate.split('T')[0] : getToday(),
        notes: data?.notes || '',
    };

    const validationSchema = Yup.object().shape({
        bedId: Yup.string().required("Bed is required"),
        checkInDate: Yup.string().required("Check-in date is required"),
        checkOutDate: Yup.string()
            .required("Check-out date is required")
            .test(
                "checkOutDate-after-checkInDate",
                "Check-out date cannot be before check-in date",
                function (val) {
                    const { checkInDate } = this.parent;
                    return !!val && !!checkInDate && val >= checkInDate;
                }
            ),
        notes: Yup.string(),
    });

    const formik = useFormik<IFormValues>({
        initialValues,
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            if (!data?._id || !userData?.userId) return;
            try {
                const payload = {
                    caseId: data.caseId,
                    caseName: data.caseName,
                    agencyId: data.agencyId,
                    agencyName: data.agencyName,
                    siteId: data.siteId,
                    siteName: data.siteName,
                    bedId: values.bedId,
                    bedName: values.bedName,
                    room: values.room,
                    bedTypeId: values.bedTypeId,
                    bedTypeName: values.bedTypeName,
                    dateOfArrival: data.dateOfArrival,
                    notes: values.notes,
                    sendMail: false, // or from form if needed
                };
                await editBedAssignment(data._id, payload, userData.userId, userData.activeLocation);
                if (typeof onSuccess === 'function') onSuccess();
                onClose();
            } catch (error) {
                // Optionally show error toast
                console.error('Failed to edit bed assignment', error);
            }
        },
    });

    // Helper to get bed by id
    // Only use availableBeds (IAvailableBedOfSiteForCheckIn) for bed selection
    const getBedById = (id: string) => availableBeds.find(b => b.bedId === id);

    const getInputClass = (field: keyof IFormValues) =>
        `border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple transition text-sm ${formik.touched[field] && formik.errors[field] ? "border-red-500" : "border-gray-300"}`;

    React.useEffect(() => {
        if (isOpen) {
            setIsChangingBed(false); // Reset on open
        }
    }, [isOpen]);

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Bed Assignment"
            widthClass="max-w-2xl"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        className="bg-purple text-white px-4 py-2 rounded hover:bg-purple/90 flex items-center gap-2"
                        onClick={() => formik.handleSubmit()}
                    >
                        <Icon icon="mdi:content-save" width={18} height={18} />
                        Save
                    </button>
                    <button
                        type="button"
                        className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 flex items-center gap-2"
                        onClick={onClose}
                    >
                        <Icon icon="mdi:close" width={18} height={18} />
                        Cancel
                    </button>
                </div>
            }
        >
            <FormikProvider value={formik}>
                <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 gap-6 bg-white rounded-md">
                    {/* Case Row */}
                    <div className="border border-gray-300 rounded-md overflow-hidden w-full shadow-sm">
                        <table className="w-full table-auto text-sm text-gray-800 border-collapse">
                            <tbody>
                                {/* Case Row */}
                                <tr className="border-b border-gray-300">
                                    <th className="text-left bg-purple-50 px-4 py-3">Case</th>
                                    <td className="px-4 py-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{data?.caseName || '-'}</span>
                                        </div>
                                    </td>
                                </tr>
                                {/* Bed Row */}
                                <tr className="border-b border-gray-300">
                                    <th className="text-left bg-purple-50 px-4 py-3">Bed</th>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center w-full gap-2">
                                            {isChangingBed ? (
                                                <>
                                                    <select
                                                        className="border border-gray-300 bg-white rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent px-3 py-1.5 text-sm flex-grow transition duration-150 ease-in-out"
                                                        value={formik.values.bedId}
                                                        onChange={e => {
                                                            const selected = getBedById(e.target.value);
                                                            if (selected && selected.bedType) {
                                                                formik.setFieldValue('bedId', selected.bedId);
                                                                formik.setFieldValue('bedName', selected.bedName);
                                                                formik.setFieldValue('room', selected.room);
                                                                formik.setFieldValue('bedTypeId', selected.bedType.bedTypeId);
                                                                formik.setFieldValue('bedTypeName', selected.bedType.name);
                                                            }
                                                        }}
                                                    >
                                                        {bedOptions?.map((bed) => (
                                                            <option key={bed.value} value={bed.value}>
                                                                {bed.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-white transition ml-2"
                                                        onClick={() => setIsChangingBed(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-bold flex-grow">{formik.values.bedName || data?.bedName || '-'}</span>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-2 text-xs font-semibold text-purple border border-purple rounded hover:bg-purple hover:text-white transition ml-2"
                                                        onClick={() => setIsChangingBed(true)}
                                                    >
                                                        Change
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {/* Room Row */}
                                <tr className="border-b border-gray-300">
                                    <th className="text-left bg-purple-50 px-4 py-3">Room</th>
                                    <td className="px-4 py-2">
                                        <span className="font-bold">
                                            {data?.room || '-'}
                                        </span>
                                    </td>
                                </tr>
                                {/* Type Row */}
                                <tr className="border-b border-gray-300">
                                    <th className="text-left bg-purple-50 px-4 py-3">Type</th>
                                    <td className="px-4 py-2">
                                        <span className="font-bold">
                                            {data?.bedTypeName || '-'}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Check-In Date Field */}
                    <div className="grow mb-4">
                        <label className="font-semibold">Check-In Date <span className="text-red-600">*</span></label>
                        <input
                            type="date"
                            {...formik.getFieldProps("checkInDate")}
                            onBlur={formik.handleBlur}
                            className={`${getInputClass("checkInDate")}
                border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple`}
                        />
                        {formik.touched.checkInDate && formik.errors.checkInDate && (
                            <div className="text-xs text-red-600 mt-1">{formik.errors.checkInDate}</div>
                        )}
                    </div>

                    {/* Check-Out Date Field */}
                    <div className="grow mb-4">
                        <label className="font-semibold">Check-Out Date <span className="text-red-600">*</span></label>
                        <input
                            type="date"
                            {...formik.getFieldProps("checkOutDate")}
                            onBlur={formik.handleBlur}
                            min={formik.values.checkInDate}
                            className={`${getInputClass("checkOutDate")}
                border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple`}
                        />
                        {formik.touched.checkOutDate && formik.errors.checkOutDate && (
                            <div className="text-xs text-red-600 mt-1">{formik.errors.checkOutDate}</div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div className="grow mb-4">
                        <label className="font-semibold">Notes</label>
                        <textarea
                            rows={3}
                            {...formik.getFieldProps("notes")}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:outline-none"
                        />
                    </div>
                </form>
            </FormikProvider>
        </ModalWrapper>
    );
};

export default EditBedAssignmentFromCase; 