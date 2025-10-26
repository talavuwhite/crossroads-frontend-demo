import React, { useState, useEffect, useRef } from "react";
import ModalWrapper from "@/components/ui/ModalWrapper";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import type { CategorySection } from "@/types";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  getCategorySections,
  createCategorySection,
  updateCategorySection,
  deleteCategorySection,
} from "@/services/CategorySectionApi";
import { toast } from "react-toastify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ManageCategorySectionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const editingRowRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (isOpen && userData?.userId) {
      setLoading(true);
      const locationId = userData.activeLocation || "";
      getCategorySections(userData.userId, locationId)
        .then(setSections)
        .catch((err) => {
          toast.error(err.message || "Failed to fetch category sections");
        })
        .finally(() => setLoading(false));
    }
    if (isOpen) {
      setAddMode(false);
      setAddValue("");
      setAddError("");
      setEditingId(null);
      setEditValue("");
      setEditError("");
    }
  }, [isOpen, userData?.userId]);

  const handleAdd = async () => {
    if (!addValue.trim()) {
      setAddError("Section name is required");
      return;
    }
    if (!userData?.userId) return;
    const locationId = userData.activeLocation || "";
    setActionLoading(true);
    try {
      const newSection = await createCategorySection(
        addValue.trim(),
        userData.userId,
        locationId
      );
      setSections((prev) => [...prev, newSection]);
      setAddValue("");
      setAddError("");
      setAddMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add section");
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (section: CategorySection) => {
    setEditingId(section._id);
    setEditValue(section.name);
    setEditError("");
    setAddMode(false);
  };

  const handleEditSave = async (id: string) => {
    if (!editValue.trim()) {
      setEditError("Section name is required");
      return;
    }
    if (!userData?.userId) return;
    const locationId = userData.activeLocation || "";
    setActionLoading(true);
    try {
      const updated = await updateCategorySection(
        id,
        editValue.trim(),
        userData.userId,
        locationId
      );
      setSections((prev) => prev.map((s) => (s._id === id ? updated : s)));
      setEditingId(null);
      setEditValue("");
      setEditError("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update section");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue("");
    setEditError("");
  };

  const handleDelete = async (id: string) => {
    if (!userData?.userId) return;
    const locationId = userData.activeLocation || "";
    setActionLoading(true);
    try {
      await deleteCategorySection(id, userData.userId, locationId);
      setSections((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete section");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCancel = () => {
    setAddMode(false);
    setAddValue("");
    setAddError("");
  };

  useEffect(() => {
    if (!editingId) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editingRowRef.current &&
        !editingRowRef.current.contains(event.target as Node)
      ) {
        handleEditCancel();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleEditCancel();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingId]);
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Category Sections"
      widthClass="max-w-lg"
    >
      <div className="space-y-6">
        {loading ? (
          <Loader />
        ) : (
          <>
            <ul className="rounded-lg border border-gray-200 bg-white">
              {sections.length === 0 && !addMode && (
                <li className="text-gray-500 p-4">No sections found.</li>
              )}
              {sections.map((section, index) => (
                <li
                  key={section._id}
                  ref={editingId === section._id ? editingRowRef : undefined}
                  className={`flex items-center justify-between px-4 py-3  ${
                    editingId === section._id ? "bg-purple-50" : ""
                  } ${
                    editingId === section._id
                      ? "bg-white border-2 border-purple-300 shadow-md"
                      : index % 2 === 0
                      ? "bg-purpleLight"
                      : "bg-white"
                  }`}
                >
                  {editingId === section._id ? (
                    <div className="flex-1 flex flex-col md:flex-row gap-2 items-center">
                      <input
                        className="px-3 py-2 border border-purple-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple flex-1 min-w-[100px] bg-purple-50"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        disabled={actionLoading}
                        placeholder="Section name"
                      />
                      <div className="flex gap-2 mt-2 md:mt-0">
                        <Button
                          label="Save"
                          variant="submitStyle"
                          onClick={() => handleEditSave(section._id)}
                          className="!px-4 !py-2 !text-xs"
                          disabled={actionLoading}
                        />
                        <Button
                          label="Cancel"
                          variant="dangerStyle"
                          onClick={handleEditCancel}
                          className="!px-4 !py-2 !text-xs"
                          disabled={actionLoading}
                        />
                      </div>
                      {editError && (
                        <div className="text-xs text-red-500 w-full">
                          {editError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-base text-gray-700 font-medium">
                        <span className="mr-1">•</span>
                        {section.name}
                      </span>
                      <div className="flex gap-4">
                        <Button
                          label="Rename"
                          variant="infoStyle"
                          onClick={() => startEdit(section)}
                          className="!bg-transparent !text-blue-600 underline underline-offset-2 !px-0"
                          disabled={actionLoading || addMode}
                        />

                        <Button
                          label="Delete"
                          variant="dangerStyle"
                          onClick={() => handleDelete(section._id)}
                          className="!bg-transparent !text-primary !px-0 underline underline-offset-2"
                        />
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {addMode && (
              <form className="bg-purple/10 border border-purple/20 rounded-md p-4 mb-4">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="add-section"
                    value={addValue}
                    onChange={(e) => setAddValue(e.target.value)}
                    onFocus={() => setAddError("")}
                    placeholder="Section name"
                    className={`w-full px-3 py-2 border ${
                      addError ? "border-red-500" : "border-gray-300"
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple `}
                    disabled={actionLoading}
                  />
                  {addError && (
                    <div className="text-xs text-red-500 mt-1">{addError}</div>
                  )}
                </div>
                <div className="flex gap-2 mt-2 md:mt-6 justify-end">
                  <Button
                    label="Add"
                    variant="submitStyle"
                    onClick={handleAdd}
                    className="!px-4 !py-2 !text-xs"
                    disabled={actionLoading}
                  />
                  <Button
                    label="Cancel"
                    variant="dangerStyle"
                    onClick={handleAddCancel}
                    className="!px-4 !py-2 !text-xs"
                    disabled={actionLoading}
                  />
                </div>
              </form>
            )}
            {!addMode && !editingId && (
              <div className="mt-4">
                <Button
                  label={"Add Section"}
                  icon="mdi:plus"
                  variant="submitStyle"
                  onClick={() => {
                    setAddMode(true);
                    setEditingId(null);
                  }}
                  disabled={actionLoading}
                />
              </div>
            )}
          </>
        )}
      </div>
    </ModalWrapper>
  );
};

export default ManageCategorySectionModal;
