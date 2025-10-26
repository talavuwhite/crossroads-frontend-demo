import React, { useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "@ui/Button";
import { deleteUser } from "@services/UserApi";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "@redux/store";

interface DeleteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentUserId: string;
  onDeleteSuccess: () => void;
}

const DeleteAgentModal: React.FC<DeleteAgentModalProps> = ({
  isOpen,
  onClose,
  agentName,
  agentUserId,
  onDeleteSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const userData = useSelector((state: RootState) => state.user.data);

  const handleDelete = async () => {
    if (!userData || !userData.userId || !userData.activeLocation) {
      toast.error("User authentication or location data missing.");
      return;
    }

    setLoading(true);
    try {
      const response = await deleteUser(
        agentUserId,
        userData.activeLocation,
        userData.userId
      );
      toast.success(response?.message || "Agent deleted successfully!");
      onClose();
      onDeleteSuccess();
    } catch (error: any) {
      console.error("Error deleting agent:", error);
      toast.error(error?.data?.message || "Failed to delete agent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Agent"
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleDelete}
            className="!bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors duration-200"
            label="Delete"
            disabled={loading}
          />
          <Button
            variant="default"
            label="Cancel"
            onClick={onClose}
            disabled={loading}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-red-600">
          <Icon icon="mdi:alert-circle" width="24" height="24" />
          <h3 className="text-lg font-medium">Confirm Deletion</h3>
        </div>

        <p className="text-gray-600">
          Are you sure you want to delete the agent{" "}
          <span className="font-bold text-purple">{agentName}</span>? This
          action cannot be undone.
        </p>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start gap-3">
            <Icon
              icon="mdi:alert"
              className="text-yellow-400 flex-shrink-0"
              width="20"
              height="20"
            />
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Warning</p>
              <p>
                Deleting this agent will:
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Remove their access to the system</li>
                  <li>Delete their profile information</li>
                  <li>Remove them from any assigned cases or tasks</li>
                </ul>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default DeleteAgentModal;
