import React, { memo, useEffect, useRef, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { Icon } from "@iconify-icon/react";
import Button from "@ui/Button";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { STATIC_TEXTS } from "@/utils/textConstants";
import Loader from "@ui/Loader";
import {
  createEventType,
  deleteEventType,
  getEventTypes,
  updateEventType,
} from "@/services/EventsApi";
import type { EventTypeData } from "@/types";

interface ManageEventTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageEventTypesModal: React.FC<ManageEventTypesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const user = useSelector((state: RootState) => state.user.data);

  const [eventTypes, setEventTypes] = useState<EventTypeData[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isNewEventType, setIsNewEventType] = useState<boolean>(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [editIndex]);

  const addNewEventType = () => {
    const newEvent: EventTypeData = {
      _id: `temp-${Date.now()}`,
      name: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEventTypes((prev) => {
      const updated = [...prev, newEvent];
      setEditIndex(updated.length - 1);
      setEditValue("");
      setIsNewEventType(true);
      return updated;
    });
  };

  const handleEdit = (index: number, currentValue: string) => {
    setEditIndex(index);
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editIndex !== null && editValue.trim() !== "") {
      const updatedTypes = [...eventTypes];
      const currentItem = updatedTypes[editIndex];
      const updated = {
        ...currentItem,
        name: editValue.trim(),
        updatedAt: new Date().toISOString(),
      };
      updatedTypes[editIndex] = updated;
      setEventTypes(updatedTypes);
      if (currentItem.name !== updated.name) {
        if (updated._id.startsWith("temp-")) {
          handleCreateEventType(updated);
        } else {
          handleUpdateEventType(updated._id, updated);
        }
      }
      setEditIndex(null);
      setEditValue("");
      setIsNewEventType(false);
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

  const fetchEventTypes = async () => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT_TYPE);
    setIsLoading(true);
    try {
      const response = await getEventTypes(user.userId, user.activeLocation);
      if (response && response.success) {
        setEventTypes(response.data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR_EVENTS_TYPE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEventType = async (event: EventTypeData) => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT_TYPE);
    try {
      await createEventType({ name: event.name }, user.userId, user.activeLocation);
      toast.success(STATIC_TEXTS.EVENTS.CREATED_SUCCESS_EVENT_TYPE);
      fetchEventTypes();
    } catch (error: any) {
      toast.error(error);
    }
  };

  const handleUpdateEventType = async (id: string, event: EventTypeData) => {
    if (!id || !user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT_TYPE);
    try {
      await updateEventType(
        id,
        { name: event.name },
        user.userId,
        user.activeLocation
      );
      toast.success(STATIC_TEXTS.EVENTS.UPDATED_SUCCESS_EVENT_TYPE);
      fetchEventTypes();
    } catch (error: any) {
      toast.error(error);
    }
  };

  const handleConfirmDelete = async (eventTypeid: string) => {
    if (!eventTypeid || !user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT_TYPE);
    try {
      await deleteEventType(eventTypeid, user?.userId, user?.activeLocation);
      toast.success(STATIC_TEXTS.EVENTS.DELETE_SUCCESS_EVENT_TYPE);
      fetchEventTypes();
      setIsConfirmDelete(false);
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.DELETE_ERROR_EVENT_TYPE);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setDeleteId(null);
        setEditIndex(null);
        setIsConfirmDelete(false);
      }}
      title={STATIC_TEXTS.EVENTS.MANAGE_EVENT_TYPES}
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
                {eventTypes.map((type, index) => (
                  <div
                    key={index}
                    className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1"
                  >
                    {deleteId !== type._id ? (
                      <>
                        {editIndex === index && !isNewEventType && (
                          <div className="text-sm flex gap-2">
                            <Icon
                              icon="mdi:info"
                              className="text-red-500"
                              title="info"
                              width="18"
                              height="18"
                            />
                            {STATIC_TEXTS.EVENTS.RENAME}{" "}
                            <span className="font-semibold">{type.name}</span>{" "}
                            {STATIC_TEXTS.EVENTS.FOR_ALL_EVENTS}
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
                            />
                          ) : (
                            <span className="text-purple font-semibold">
                              {type.name}
                            </span>
                          )}

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
                                    if (type._id.startsWith("temp-")) {
                                      setEventTypes((prev) =>
                                        prev.filter((item) => item._id !== type._id)
                                      );
                                    } else {
                                      setEditValue(type.name);
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
                                  onClick={() => handleEdit(index, type.name)}
                                />
                                <Icon
                                  icon="mdi:delete"
                                  className="text-purple hover:text-purple-700 cursor-pointer"
                                  title="Delete"
                                  width="20"
                                  height="20"
                                  onClick={() => {
                                    setDeleteId(type._id);
                                    setIsConfirmDelete(false);
                                  }}
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
                              onChange={(e) => setIsConfirmDelete(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-purple focus:ring-purple/20 outline-none focus:outline-none !accent-purple"
                              readOnly
                            />
                            <label className="text-sm">
                              {STATIC_TEXTS.EVENTS.DELETE}{" "}
                              <span className="font-semibold">{type.name}</span>{" "}
                              {STATIC_TEXTS.EVENTS.FROM_EVENT_TYPE}
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
                            onClick={() => handleConfirmDelete(type._id)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addNewEventType}
                  className="text-purple-600 border border-purple-600 px-4 py-2 rounded hover:bg-purple-50 transition"
                >
                  {STATIC_TEXTS.EVENTS.ADD_NEW_EVENT_TYPE}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};

export default memo(ManageEventTypesModal);
