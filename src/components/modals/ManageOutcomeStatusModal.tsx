import type { RootState } from "@/redux/store";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react";
import Button from "@ui/Button";
import Loader from "@ui/Loader";
import ModalWrapper from "@ui/ModalWrapper";
import React, { memo, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { createOutcomeStatus, deleteOutcomeStatus, getOutcomeStatuses, updateOutcomeStatus, type IOutcomeStatus } from '@/services/OutcomesApi';
import type { OutcomeSectionData as OutcomeStatusData } from "@/types";
import { toast } from 'react-toastify';

interface ManageOutcomeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageOutcomeStatusModal: React.FC<ManageOutcomeStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const user = useSelector((state: RootState) => state.user.data);

  // State for outcome statuses, loading, and error
  const [OutcomeStatuses, setOutcomeStatuses] = useState<IOutcomeStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isNewData, setIsNewData] = useState<boolean>(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false); // -> For create loading
  const [isDeleting, setIsDeleting] = useState<boolean>(false); // -> For delete loading

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [editIndex]);

  const addNewOutcomeStatus = () => {
    const newData: OutcomeStatusData = {
      _id: `temp-${Date.now()}`,
      name: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOutcomeStatuses((prev) => {
      const updated = [...prev, newData];
      setEditIndex(updated.length - 1);
      setEditValue("");
      setIsNewData(true);
      return updated;
    });
  };

  const handleEdit = (index: number, currentValue: string) => {
    setEditIndex(index);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editIndex !== null && editValue.trim() !== "") {
      const updatedData = [...OutcomeStatuses];
      const currentItem = updatedData[editIndex];
      const updated = {
        ...currentItem,
        name: editValue.trim(),
        updatedAt: new Date().toISOString(),
      };
      updatedData[editIndex] = updated;
      setOutcomeStatuses(updatedData);
      if (currentItem.name !== updated.name) {
        if (updated._id.startsWith("temp-")) {
          handleCreateNewStatus();
        } else {
          handleUpdateNewStatus();
        }
      }
      setEditIndex(null);
      setEditValue("");
      setIsNewData(false);
    }
  };

  const footerContent = (
    <>
      <Button
        onClick={() => {
          onClose();
          setDeleteId(null);
          setEditIndex(null);
          setIsConfirmDelete(false);
        }}
        label="Cancel"
      />
    </>
  );

  // Fetch outcome statuses from API
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!user?.userId) return;
      setIsLoading(true);
      try {
        const statuses = await getOutcomeStatuses(user.userId);
        setOutcomeStatuses(statuses ?? []);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatuses();
  }, [user?.userId]);

  const handleCreateNewStatus = async () => {
    // -> Only run if user and editIndex are valid
    if (!user?.userId || editIndex === null) return;
    setIsSaving(true);
    try {
      // -> Call API to create status
      const res = await createOutcomeStatus(editValue.trim(), user.userId);
      if (!res?.success) {
        // -> Show backend error message in toast (e.g., name already exists)
        toast.error(res?.message ?? 'Failed to create outcome status.');
        // -> Remove the temp item from state
        setOutcomeStatuses((prev) => prev.filter((item) => item._id && !item._id.startsWith('temp-')));
        setEditIndex(null);
        setEditValue("");
        setIsNewData(false);
        return;
      }
      // -> Replace temp item with real item from API
      setOutcomeStatuses((prev) => {
        const updated = [...prev];
        if (editIndex !== null) {
          updated[editIndex] = res?.data ?? updated[editIndex];
        }
        return updated;
      });
      toast.success(res?.message ?? 'Outcome status created.');
    } catch {
      toast.error('Failed to create outcome status.');
    } finally {
      setIsSaving(false);
      setEditIndex(null);
      setEditValue("");
      setIsNewData(false);
    }
  };

  const handleUpdateNewStatus = async () => {
    // -> Only run if user, editIndex, and item id are valid
    if (!user?.userId || editIndex === null) return;
    const item = OutcomeStatuses?.[editIndex];
    if (!item?._id || item._id.startsWith('temp-')) return;
    setIsSaving(true);
    try {
      // -> Call API to update status
      const res = await updateOutcomeStatus(item._id, editValue.trim(), user.userId);
      if (!res?.success) {
        // -> Show backend error message in toast
        toast.error(res?.message ?? 'Failed to update outcome status.');
        setIsSaving(false);
        return;
      }
      // -> Update item in state with API response
      setOutcomeStatuses((prev) => {
        const updated = [...prev];
        if (editIndex !== null) {
          updated[editIndex] = res?.data ?? updated[editIndex];
        }
        return updated;
      });
      toast.success(res?.message ?? 'Outcome status updated.');
    } catch {
      toast.error('Failed to update outcome status.');
    } finally {
      setIsSaving(false);
      setEditIndex(null);
      setEditValue("");
      setIsNewData(false);
    }
  };

  const handleConfirmDelete = async () => {
    // -> Only run if user and deleteId are valid
    if (!user?.userId || !deleteId) return;
    setIsDeleting(true);
    try {
      // -> Call API to delete status
      const res = await deleteOutcomeStatus(deleteId, user.userId);
      if (!res?.success) {
        // -> Show backend error message in toast
        toast.error(res?.message ?? 'Failed to delete outcome status.');
        setIsDeleting(false);
        return;
      }
      // -> Remove deleted item from state
      setOutcomeStatuses((prev) => prev.filter((item) => item._id !== deleteId));
      toast.success(res?.message ?? 'Outcome status deleted.');
      setDeleteId(null);
      setIsConfirmDelete(false);
    } catch {
      toast.error('Failed to delete outcome status.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setDeleteId(null);
        setEditIndex(null);
        setIsConfirmDelete(false);
      }}
      title={STATIC_TEXTS.OUTCOMES.OUTCOME_STATUSES}
      footer={footerContent}
      widthClass="max-w-xl"
    >
      {isLoading ? (
        <Loader />
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            <form
              autoComplete="off"
              className="bg-white border border-gray-200 rounded-lg shadow space-y-4 max-h-[60vh] overflow-y-auto p-4"
            >
              <div className="space-y-3">
                {OutcomeStatuses?.length > 0 ? (
                  OutcomeStatuses?.map((status, index) => (
                    <div
                      key={status?._id ?? index}
                      className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1"
                    >
                      {deleteId !== status._id ? (
                        <>
                          {editIndex === index && !isNewData && (
                            <div className="text-sm flex gap-2">
                              <Icon
                                icon="mdi:info"
                                className="text-red-500"
                                title="info"
                                width="18"
                                height="18"
                              />
                              {STATIC_TEXTS.OUTCOMES.RENAME}{" "}
                              <span className="font-semibold">{status.name}</span>{" "}
                              {STATIC_TEXTS.OUTCOMES.FOR_ALL_OUTCOMES}
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            {editIndex === index ? (
                              <input
                                type="text"
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                                className="flex-1 p-2 mr-1 border-gray-300 rounded bg-white  text-sm"
                                disabled={isSaving} // -> Disable while saving
                              />
                            ) : (
                              <span className="text-purple font-semibold">
                                {status.name}
                              </span>
                            )}

                            <div className="flex gap-3">
                              {['Complete', 'Not Applicable'].includes(status.name) ? (
                                <Icon
                                  icon="mdi:lock"
                                  className="text-gray-400"
                                  title="Default status cannot be edited or deleted"
                                  width="20"
                                  height="20"
                                />
                              ) : editIndex === index ? (
                                <>
                                  <Icon
                                    icon="mdi:check"
                                    className="text-purple hover:text-purple-700 cursor-pointer"
                                    title="Save"
                                    width="20"
                                    height="20"
                                    onClick={handleSaveEdit}
                                    // -> Disable while saving
                                    style={{ pointerEvents: isSaving ? 'none' : 'auto', opacity: isSaving ? 0.5 : 1 }}
                                  />
                                  <Icon
                                    icon="mdi:close"
                                    className="text-purple hover:text-purple-700 cursor-pointer"
                                    title="Delete"
                                    width="20"
                                    height="20"
                                    onClick={() => {
                                      setEditIndex(null);
                                      if (status._id.startsWith("temp-")) {
                                        setOutcomeStatuses((prev) =>
                                          prev.filter(
                                            (item) => item._id !== status._id
                                          )
                                        );
                                      } else {
                                        setEditValue(status.name);
                                      }
                                    }}
                                  />
                                </>
                              ) : (
                                <>
                                  <Icon
                                    icon="mdi:edit"
                                    className="text-purple hover:text-purple-700 cursor-pointer"
                                    title="Edit"
                                    width="20"
                                    height="20"
                                    onClick={() => handleEdit(index, status.name)}
                                  />
                                  <Icon
                                    icon="mdi:delete"
                                    className="text-purple hover:text-purple-700 cursor-pointer"
                                    title="Delete"
                                    width="20"
                                    height="20"
                                    onClick={() => setDeleteId(status._id)}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <div className="flex gap-4">
                            <Icon
                              icon="mdi:info"
                              className="text-red-500"
                              title="info"
                              width="18"
                              height="18"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isConfirmDelete}
                                onChange={(e) =>
                                  setIsConfirmDelete(e.target.checked)
                                }
                                className="w-4 h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple"
                                readOnly
                              />
                              <label className="text-sm">
                                {STATIC_TEXTS.OUTCOMES.DELETE}{" "}
                                <span className="font-semibold">{status.name}</span>{" "}
                                {STATIC_TEXTS.OUTCOMES.FROM_OUTCOME_SECTIONS}
                              </label>
                            </div>
                          </div>
                          {isConfirmDelete && (
                            <Icon
                              icon="mdi:delete"
                              className="text-purple hover:text-purple-700 cursor-pointer"
                              title="Delete"
                              width="20"
                              height="20"
                              onClick={() => handleConfirmDelete()}
                              style={{ pointerEvents: isDeleting ? 'none' : 'auto', opacity: isDeleting ? 0.5 : 1 }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="font-bold text-center">
                    {STATIC_TEXTS.COMMON.NO_DATA}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addNewOutcomeStatus}
                  className="text-purple-600 border border-purple-600 px-4 py-2 rounded hover:bg-purple-50 transition"
                >
                  {STATIC_TEXTS.OUTCOMES.ADD_OUTCOME_STATUS}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};

export default memo(ManageOutcomeStatusModal);
