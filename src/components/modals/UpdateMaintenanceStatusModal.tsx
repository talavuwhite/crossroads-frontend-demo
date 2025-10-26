import React, { useState, useEffect } from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";

interface UpdateMaintenanceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (statusId: string) => void;
  currentStatus: string;
  statusOptions: { id: string; label: string }[];
  loading?: boolean;
}

const UpdateMaintenanceStatusModal: React.FC<
  UpdateMaintenanceStatusModalProps
> = ({ isOpen, onClose, onSubmit, currentStatus, statusOptions, loading }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus) {
      onSubmit(selectedStatus);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Update Status"
      footer={
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            onClick={onClose}
            variant="default"
            label="Cancel"
          />
          <Button
            type="submit"
            variant="submitStyle"
            label="Update"
            disabled={loading || !selectedStatus}
            onClick={() => handleSubmit(new Event("submit") as any)}
          />
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-primary">*</span>
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            required
          >
            <option value="" disabled>
              Select status
            </option>
            {statusOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default UpdateMaintenanceStatusModal;
