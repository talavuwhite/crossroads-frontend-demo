import React, { useState, useEffect, useCallback } from "react";
import AssistanceCard from "@components/AssistanceCard";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "@components/ui/Button";
import { AddAssistanceModal } from "@components/modals/AddAssitanceRequestModal";
import Footer from "@components/PageFooter";
import { HEADINGS, STATIC_TEXTS } from "@utils/textConstants";
import { handleNextPage, handlePreviousPage } from "@utils/commonFunc";
import {
  fetchAssistanceList,
  updateAssistance,
  deleteAssistance,
  createMultipleAssistance,
} from "@/services/AssistanceApi";
import { toast } from "react-toastify";
import Loader from "@/components/ui/Loader";
import type { AssistanceRecord } from "@/types";
import { CASES_PER_PAGE } from "@/utils/constants";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import DeleteCaseModal from "@components/modals/DeleteCaseModal";
import { useLocation, useParams } from "react-router-dom";

const AssistanceList: React.FC = () => {
  const location = useLocation();
  const { id: agencyId } = useParams();
  const { data: userData } = useSelector((state: RootState) => state.user);

  const [isAddAssistanceModalOpen, setIsAddAssistanceModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [assistanceRecords, setAssistanceRecords] = useState<
    AssistanceRecord[]
  >([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssistanceRecord, setSelectedAssistanceRecord] =
    useState<AssistanceRecord | null>(null);
  const [isDeleteAssistanceModalOpen, setIsDeleteAssistanceModalOpen] =
    useState(false);
  const [assistanceRecordToDeleteId, setAssistanceRecordToDeleteId] = useState<
    string | null
  >(null);

  const user = useSelector((state: RootState) => state.user.data);

  const fetchAssistanceRecords = async () => {
    if (!user?.userId) {
      return toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_INFO);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetchAssistanceList(
        currentPage,
        CASES_PER_PAGE,
        user.userId,
        user.activeLocation,
        location.pathname.startsWith("/agencies")
          ? agencyId
          : userData?.activeLocation
          ? userData?.activeLocation
          : userData?.companyId
      );
      const assistanceRecords = response.data.data;
      const pagination = response.data.pagination;
      setAssistanceRecords(assistanceRecords);
      setTotalPages(pagination.totalPages);
      setTotalItems(pagination.total);
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.ASSISTANCE.FETCH_ERROR);
      console.error("Error fetching assistance records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistanceRecords();
  }, [currentPage, user?.activeLocation]);

  const handleUpdateAssistance = async (
    assistanceId: string,
    formData: any
  ) => {
    if (!user?.userId) return toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_INFO);
    try {
      await updateAssistance(
        assistanceId,
        formData,
        user.userId,
        user.activeLocation
      );
      toast.success(STATIC_TEXTS.ASSISTANCE.UPDATED_SUCCESS);
      setIsAddAssistanceModalOpen(false);
      setSelectedAssistanceRecord(null);
      fetchAssistanceRecords();
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.ASSISTANCE.UPDATE_ERROR);
    }
  };

  const handleCreateMultipleAssistance = async (
    formData: any,
    addAnother?: boolean
  ) => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_CASE_SELECTION);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };
      await createMultipleAssistance(payload, user.userId, user.activeLocation);
      toast.success(STATIC_TEXTS.ASSISTANCE.MULTIPLE_CREATED_SUCCESS);
      if (!addAnother) {
        setIsAddAssistanceModalOpen(false);
      }
      fetchAssistanceRecords();
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.ASSISTANCE.MULTIPLE_CREATE_ERROR);
      console.error("Error creating multiple assistance records:", error);
    }
  };

  const handleDeleteAssistance = (recordId: string) => {
    setAssistanceRecordToDeleteId(recordId);
    setIsDeleteAssistanceModalOpen(true);
  };

  const handleConfirmDeleteAssistance = async () => {
    if (!assistanceRecordToDeleteId || !user?.userId) {
      toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_DELETE_INFO);
      return;
    }
    try {
      await deleteAssistance(
        assistanceRecordToDeleteId,
        user.userId,
        user.activeLocation
      );
      toast.success(STATIC_TEXTS.ASSISTANCE.DELETED_SUCCESS);
      setIsDeleteAssistanceModalOpen(false);
      setAssistanceRecordToDeleteId(null);
      fetchAssistanceRecords();
    } catch (error: any) {
      console.error("Error deleting assistance:", error);
      toast.error(error || STATIC_TEXTS.ASSISTANCE.DELETE_ERROR);
    }
  };

  const handleEdit = (record: AssistanceRecord) => {
    setSelectedAssistanceRecord(record);
    setIsAddAssistanceModalOpen(true);
  };

  const handleCloseAssistanceModal = () => {
    setIsAddAssistanceModalOpen(false);
    setSelectedAssistanceRecord;
  };

  const mapAssistanceRecord = useCallback((record: AssistanceRecord) => {
    let createdByName = "";
    if (record.createdBy) {
      if ("name" in record.createdBy && record.createdBy.name) {
        createdByName = record.createdBy.name;
      } else if (
        "firstName" in record.createdBy ||
        "lastName" in record.createdBy
      ) {
        createdByName = `${(record.createdBy as any).firstName || ""} ${
          (record.createdBy as any).lastName || ""
        }`.trim();
      }
    }

    let receivedBy = null;
    if (typeof record.caseId === "string") {
      receivedBy = record.caseId;
    } else if (
      record.caseId &&
      typeof record.caseId === "object" &&
      "firstName" in record.caseId &&
      "lastName" in record.caseId
    ) {
      const caseObj = record.caseId as {
        firstName?: string;
        lastName?: string;
        _id?: string;
      };
      receivedBy = {
        _id: caseObj._id,
        name: `${caseObj.firstName || ""} ${caseObj.lastName || ""}`.trim(),
      };
    }

    return {
      id: record._id,
      date: record.createdAt,
      description: record.description,
      amount: record.amount,
      type: record.category?.sectionId?.name + " : " + record.category?.name,
      provider: {
        name: record.createdBy?.name,
        organization: record.visibleTo,
        agencyName: record.company?.locationName || record.company?.companyName,
      },
      isPrivate: record.visibleTo !== "All Agencies",
      attachment: record.attachment,
      unit: record?.unit,
      receivedBy: receivedBy,
      createdBy: { name: createdByName, userId: record?.createdBy?.userId },
      agency: {
        _id: record.company?.companyId
          ? record.company.companyId
          : record.company?.locationId,
        name: record.company?.companyName
          ? record.company.companyName
          : record.company?.locationName,
      },
      caseName: record.caseName,
    };
  }, []);

  const paginationLabel = `${(currentPage - 1) * CASES_PER_PAGE + 1}-${Math.min(
    currentPage * CASES_PER_PAGE,
    totalItems
  )} of ${totalItems} ${HEADINGS.ASSISTANCE.TITLE}`;

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-purpleLight overflow-auto">
          <div className="mx-auto p-4 sm:p-6">
            <div className="bg-purple-200/30 p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row  justify-between items-start md:items-center gap-4">
              <div className="flex gap-4 items-center">
                <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
                  <Icon
                    icon="ph:warning-diamond-light"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                </div>
                <p className=" text-sm font-medium text-gray-700 ">
                  {HEADINGS.ASSISTANCE.SUBTITLE}
                </p>
              </div>
              <Button
                variant="submitStyle"
                icon="mdi:plus"
                label={STATIC_TEXTS.ASSISTANCE.ADD_MULTIPLE_ASSISTANCE}
                onClick={() => {
                  setIsAddAssistanceModalOpen(true);
                  setSelectedAssistanceRecord(null);
                }}
              />
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <Loader />
              ) : assistanceRecords.length === 0 ? (
                <p className="text-gray-600 text-center py-10">
                  {STATIC_TEXTS.ASSISTANCE.NO_RECORDS}
                </p>
              ) : (
                assistanceRecords.map((record: AssistanceRecord) => (
                  <AssistanceCard
                    key={record._id}
                    record={mapAssistanceRecord(record) as any}
                    onEdit={() => handleEdit(record)}
                    onDelete={() => handleDeleteAssistance(record._id)}
                    currentUser={user}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        {assistanceRecords?.length > 0 && (
          <Footer
            count={totalItems}
            label={paginationLabel}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => handlePreviousPage(setCurrentPage)}
            onNext={() => handleNextPage(setCurrentPage, totalPages)}
          />
        )}
      </div>
      <AddAssistanceModal
        isOpen={isAddAssistanceModalOpen}
        onClose={handleCloseAssistanceModal}
        onSubmit={
          selectedAssistanceRecord
            ? handleUpdateAssistance
            : handleCreateMultipleAssistance
        }
        caseName={"Agency Assistance"}
        isEdit={!!selectedAssistanceRecord}
        selectedRecord={selectedAssistanceRecord}
      />
      <DeleteCaseModal
        isOpen={isDeleteAssistanceModalOpen}
        onClose={() => setIsDeleteAssistanceModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteAssistance}
        title={STATIC_TEXTS.ASSISTANCE.CONFIRM_DELETE_TITLE("Assistance")}
        message={STATIC_TEXTS.ASSISTANCE.CONFIRM_DELETE_MESSAGE("Assistance")}
        confirmLabel={STATIC_TEXTS.COMMON.DELETE}
        confirmButtonLabel={STATIC_TEXTS.ASSISTANCE.DELETE_BUTTON("Assistance")}
      />
    </>
  );
};

export default AssistanceList;
