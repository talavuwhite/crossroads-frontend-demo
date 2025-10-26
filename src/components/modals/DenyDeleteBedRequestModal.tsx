// -----------------------------------------------------------------------------
// DenyDeleteBedRequestModal.tsx
// Modal for denying or deleting bed requests with reason input
// -----------------------------------------------------------------------------

import { Icon } from "@iconify-icon/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import { useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";

import Button from "@/components/ui/Button";
import ModalWrapper from "@/components/ui/ModalWrapper";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import type { IBedCheckInRequestItem } from "@/services/BedManagementApi";
import { denyBedRequest, deleteBedRequest } from "@/services/BedManagementApi";

interface DenyDeleteBedRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  bedRequest: IBedCheckInRequestItem;
  onSuccess?: () => void;
  userId: string;
}

const DenyDeleteBedRequestModal: React.FC<DenyDeleteBedRequestModalProps> = ({
  isOpen,
  onClose,
  bedRequest,
  onSuccess,
  userId,
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialValues = {
    denialReason: "",
  };

  const validationSchema = Yup.object().shape({
    denialReason: Yup.string()
      .trim()
      .min(1, "Denial reason is required")
      .max(500, "Denial reason must be less than 500 characters"),
  });

  const handleDenyRequest = async (values: typeof initialValues) => {
    setSubmitting(true);
    try {
      const response = await denyBedRequest(userId, bedRequest._id, {
        denialReason: values.denialReason,
      });

      if (response.success) {
        toast.success(response.message || "Bed request denied successfully!");
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.message || "Failed to deny bed request");
      }
    } catch (error) {
      console.error("Error denying bed request:", error);
      toast.error("An error occurred while denying the bed request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async () => {
    setSubmitting(true);
    try {
      const response = await deleteBedRequest(userId, bedRequest._id);

      if (response.success) {
        toast.success(response.message || "Bed request deleted successfully!");
        onSuccess?.();
        onClose();
        setShowDeleteConfirmation(false);
      } else {
        toast.error(response.message || "Failed to delete bed request");
      }
    } catch (error) {
      console.error("Error deleting bed request:", error);
      toast.error("An error occurred while deleting the bed request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onClose={onClose}
        title="Delete / Deny Bed Request"
        widthClass="max-w-lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              label="Cancel"
              icon="mdi:close"
              className="hover:bg-gray-100 hover:text-gray-700"
              onClick={onClose}
              variant="default"
              disabled={submitting}
            />
            <Button
              label={submitting ? "Denying..." : "Deny Request"}
              icon={submitting ? "mdi:loading" : "ic:round-not-interested"}
              type="submit"
              form="deny-delete-form"
              variant="dangerStyle"
              disabled={submitting}
              className={submitting ? "!opacity-75 !cursor-not-allowed" : ""}
            />
          </div>
        }
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleDenyRequest}
        >
          {() => (
            <Form className="space-y-6 relative" id="deny-delete-form">
              {/* Loading Overlay */}
              {submitting && (
                <div className="absolute inset-0 bg-white/80 h-full w-full flex items-center justify-center z-20 rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
                    <p className="text-gray-600 font-medium">
                      Processing request...
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Bed Request Info */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 border border-purple-200 rounded-xl shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-3 text-base">
                    Bed Request Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 min-w-[80px]">
                        Case :
                      </span>
                      <span className="text-pink-600 font-medium">
                        {bedRequest.caseName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 min-w-[80px]">
                        Agency :
                      </span>
                      <span className="text-gray-600">
                        {bedRequest.agencyName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 min-w-[80px]">
                        Site :
                      </span>
                      <span className="text-gray-600">
                        {bedRequest.siteName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700 min-w-[80px]">
                        Arrival :
                      </span>
                      <span className="text-gray-600">
                        {bedRequest.dateOfArrival}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Denial Reason Input */}
                <div>
                  <label className="font-semibold text-sm text-gray-800 mb-2 block">
                    Denial Reason <span className="text-red-600">*</span>
                  </label>
                  <div className="mt-1">
                    <Field
                      as="textarea"
                      rows={4}
                      name="denialReason"
                      placeholder="Ex. Ineligible, Bed No Longer Available, Documentation Required"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple focus:border-purple-300 outline-none text-sm bg-white resize-none transition-all duration-200"
                    />
                  </div>
                  <ErrorMessage
                    name="denialReason"
                    component="div"
                    className="text-red-500 text-xs mt-2 flex items-center gap-1"
                  />
                </div>

                {/* Information Box */}
                <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <Icon
                    icon="mdi:information"
                    className="text-blue-500 mt-0.5 flex-shrink-0"
                    width={20}
                    height={20}
                  />
                  <div className="flex-1">
                    <div className="text-sm text-blue-800 leading-relaxed">
                      You can also{" "}
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="text-red-600 font-semibold underline hover:text-red-700 transition-colors duration-200"
                      >
                        delete this request
                      </button>{" "}
                      if it was made in error or is a duplicate. Otherwise, it's
                      best to deny the request for better data accuracy.
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </ModalWrapper>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteRequest}
        title="Delete Bed Request"
        message={`Are you sure you want to delete the bed request for "${bedRequest.caseName}"? This action cannot be undone.`}
        confirmText={submitting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
};

export default DenyDeleteBedRequestModal;
