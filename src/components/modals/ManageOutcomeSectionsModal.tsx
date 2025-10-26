import type { RootState } from "@/redux/store";
import type { IOutcomeSection } from "@/services/OutcomesApi";
import { createOutcomeSection, deleteOutcomeSection, getOutcomeSections, updateOutcomeSection } from "@/services/OutcomesApi";
import type { OutcomeSectionData } from '@/types';
import { STATIC_TEXTS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react";
import Button from "@ui/Button";
import Loader from "@ui/Loader";
import ModalWrapper from "@ui/ModalWrapper";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from 'react-toastify';

// Props
interface ManageOutcomeSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Main component
const ManageOutcomeSectionsModal: React.FC<ManageOutcomeSectionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Get current user from Redux
  const user = useSelector((state: RootState) => state.user.data);

  // State for outcome sections, loading, error, and UI controls
  const [outcomeSections, setOutcomeSections] = useState<IOutcomeSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isNewData, setIsNewData] = useState<boolean>(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [editIndex]);

  // Add a section to the list for editing
  const addNewOutcomeSection = () => {
    const newData: OutcomeSectionData = {
      _id: `temp-${Date.now()}`,
      name: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOutcomeSections((prev) => {
      const updated = [...prev, newData];
      setEditIndex(updated.length - 1);
      setEditValue("");
      setIsNewData(true);
      return updated;
    });
  };

  // Start editing a section
  const handleEdit = (index: number, currentValue: string) => {
    setEditIndex(index);
    setEditValue(currentValue);
  };

  // Save edits (create or update)
  const handleSaveEdit = () => {
    if (editIndex !== null && editValue.trim() !== "") {
      const updatedData = [...outcomeSections];
      const currentItem = updatedData[editIndex];
      const updated = {
        ...currentItem,
        name: editValue.trim(),
        updatedAt: new Date().toISOString(),
      };
      updatedData[editIndex] = updated;
      setOutcomeSections(updatedData);
      // If name changed, call create or update API
      if (currentItem.name !== updated.name) {
        if (updated._id.startsWith("temp-")) {
          handleCreateNewSection(updated); // Create new section
        } else {
          handleUpdateNewSection(updated._id, updated.name); // Update existing section
        }
      }
      setEditIndex(null);
      setEditValue("");
      setIsNewData(false);
    }
  };

  // Footer for the modal
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

  // Fetch outcome sections from API on mount or user change
  const fetchOutcomeSections = useCallback(async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const sections = await getOutcomeSections(user?.userId);
      setOutcomeSections(sections ?? []);
    } catch {
      setError("Failed to load outcome sections");
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  // Create a new section via API
  const handleCreateNewSection = async (section: OutcomeSectionData) => {
    if (!user?.userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const createdRes = await createOutcomeSection(section?.name ?? "", user.userId);
      setOutcomeSections((prev) =>
        prev.map((s) => (s._id === section._id ? createdRes.data : s))
      );
      toast.success(createdRes.message ?? "Section created successfully");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (err as any)?.response?.data?.message || (err as Error)?.message || "Failed to create outcome section";
      toast.error(apiMessage);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing outcome section via API
  const handleUpdateNewSection = async (id: string, name: string) => {
    if (!user?.userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await updateOutcomeSection(id, name, user.userId);
      setOutcomeSections((prev) =>
        prev.map((s) => (s._id === id ? res.data : s))
      );
      // Show backend message if available, otherwise fallback
      toast.success(res.message ?? "Section updated successfully");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (err as any)?.response?.data?.message || (err as Error)?.message || 'Failed to update section';
      toast.error(apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a section via API
  const handleConfirmDelete = async () => {
    if (!user?.userId || !deleteId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await deleteOutcomeSection(deleteId, user.userId);
      if (res.success) {
        setOutcomeSections((prev) => prev.filter((s) => s._id !== deleteId));
        setDeleteId(null);
        setIsConfirmDelete(false);
        toast.success(res.message ?? 'Section deleted');
      } else {
        toast.error(res.message ?? 'Failed to delete section');
      }
      setError(null);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiMessage = (err as any)?.response?.data?.message || (err as Error)?.message || 'Failed to delete section';
      toast.error(apiMessage);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch outcome sections on mount or when user changes
  useEffect(() => {
    fetchOutcomeSections();
  }, [fetchOutcomeSections]);

  // Render
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setDeleteId(null);
        setEditIndex(null);
        setIsConfirmDelete(false);
      }}
      title={STATIC_TEXTS.OUTCOMES.OUTCOME_SECTIONS}
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
                {/* Show error if present, otherwise list sections */}
                {error ? null : outcomeSections?.length > 0 ? (
                  outcomeSections?.map((section, index) => (
                    <div
                      key={section?._id ?? index}
                      className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1"
                    >
                      {/* Section row: edit, delete, confirm delete, etc. */}
                      {deleteId !== section?._id ? (
                        <>
                          {/* Show rename info if editing */}
                          {editIndex === index && !isNewData && (
                            <div className="text-sm flex gap-2">
                              <Icon
                                icon="mdi:info"
                                className="text-red-500"
                                title="info"
                                width="18"
                                height="18"
                              />
                              {STATIC_TEXTS.OUTCOMES.RENAME} {" "}
                              <span className="font-semibold">{section?.name ?? "Unnamed Section"}</span> {" "}
                              {STATIC_TEXTS.OUTCOMES.FOR_ALL_OUTCOMES}
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            {/* Edit input or section name */}
                            {editIndex === index ? (
                              <input
                                type="text"
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                                className="flex-1 p-2 mr-1 border-gray-300 rounded bg-white  text-sm"
                              />
                            ) : (
                              <span className="text-purple font-semibold">
                                {section?.name ?? "Unnamed Section"}
                              </span>
                            )}

                            {/* Edit/delete icons or save/cancel icons */}
                            <div className="flex gap-3">
                              {editIndex === index ? (
                                <>
                                  <Icon
                                    icon="mdi:check"
                                    className="text-purple hover:text-purple-700 cursor-pointer"
                                    title="Save"
                                    width="20"
                                    height="20"
                                    onClick={handleSaveEdit}
                                  />
                                  <Icon
                                    icon="mdi:close"
                                    className="text-purple hover:text-purple-700 cursor-pointer"
                                    title="Delete"
                                    width="20"
                                    height="20"
                                    onClick={() => {
                                      setEditIndex(null);
                                      if (section?._id?.startsWith("temp-")) {
                                        setOutcomeSections((prev) =>
                                          prev.filter(
                                            (item) => item?._id !== section?._id
                                          )
                                        );
                                      } else {
                                        setEditValue(section?.name ?? "");
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
                                    onClick={() => handleEdit(index, section?.name ?? "")}
                                  />
                                  <Icon
                                    icon="mdi:delete"
                                    className="text-purple hover:text-purple-700 cursor-pointer"
                                    title="Delete"
                                    width="20"
                                    height="20"
                                    onClick={() => setDeleteId(section?._id ?? null)}
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
                                {STATIC_TEXTS.OUTCOMES.DELETE} {" "}
                                <span className="font-semibold">{section?.name ?? "Unnamed Section"}</span> {" "}
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

              {/* Add new section button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={addNewOutcomeSection}
                  className="text-purple-600 border border-purple-600 px-4 py-2 rounded hover:bg-purple-50 transition"
                >
                  {STATIC_TEXTS.OUTCOMES.ADD_OUTCOME_SECTION}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};

export default memo(ManageOutcomeSectionsModal);