import { useState, useEffect, useCallback } from "react";
import Footer from "@components/PageFooter";
import { AddAssistanceModal } from "@components/modals/AddAssitanceRequestModal";
import AssistanceCard from "@components/AssistanceCard";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import CaseDetailsFilter from "@components/CaseDetailsFilter";
import Button from "@components/ui/Button";
import { STATIC_TEXTS } from "@utils/textConstants";
import type { FilterKeys } from "@/types/case";
import {
  fetchAssistance,
  createAssistance,
  updateAssistance,
  deleteAssistance,
} from "@/services/AssistanceApi";
import { useParams } from "react-router-dom";
import { CASES_PER_PAGE } from "@/utils/constants";
import DeleteCaseModal from "@components/modals/DeleteCaseModal";
import Loader from "@/components/ui/Loader";
import type {
  AssistanceRecord,
  AssistanceReferralResponse,
  SimplifiedCategory,
} from "@/types";
import {
  fetchCategories,
  handleNextPage,
  handlePreviousPage,
} from "@utils/commonFunc";
import {
  createReferral,
  createRequestedAssistance,
  deleteRequestedAssistance,
  updateRequestedAssistance,
  updateReferralStatus,
  updateReferral,
  deleteReferral,
} from "@/services/AssistanceReferralsApi";
import UpdateStatusModal from "@/components/modals/UpdateStatusModal";
import { updateCaseCount } from "@/redux/caseCountSlice";

export const Assistance = () => {
  const { id: caseId } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [assistanceRecords, setAssistanceRecords] = useState<
    AssistanceReferralResponse[]
  >([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddAssistanceModalOpen, setIsAddAssistanceModalOpen] =
    useState(false);
  const [isAddAssistanceReqModalOpen, setIsAddAssistanceReqModalOpen] =
    useState(false);
  const [selectedAssistanceRecord, setSelectedAssistanceRecord] =
    useState<AssistanceRecord | null>(null);
  const [isDeleteAssistanceModalOpen, setIsDeleteAssistanceModalOpen] =
    useState(false);
  const [assistanceRecordToDeleteId, setAssistanceRecordToDeleteId] = useState<
    string | null
  >(null);
  const [referralRecordToDeleteId, setReferraleRecordToDeleteId] = useState<
    string | null
  >(null);
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [filters, setFilters] = useState<Record<FilterKeys, boolean>>({
    caseName: true,
    live_with: false,
    related: false,
  });
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState("");

  const [editStatusHistoryIdx, setEditStatusHistoryIdx] = useState<
    number | null
  >(null);
  const [isEditStatusModal, setIsEditStatusModal] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [categoryOptions, setCategoryOptions] = useState<SimplifiedCategory[]>(
    []
  );
  const dispatch = useDispatch();
  const handleFilterChange = (key: FilterKeys) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setCurrentPage(1);
      return updated;
    });
  };

  const { data: caseData } = useSelector((state: RootState) => state.case);
  const user = useSelector((state: RootState) => state.user.data);

  const fetchAssistanceRecords = async () => {
    if (!caseId) return;
    setIsLoading(true);
    const selectedTypes = Object.entries(filters)
      .filter(([key, value]) => value && key !== "caseName")
      .map(([key]) => key);

    const relationshipType =
      selectedTypes.length > 0 ? selectedTypes.join(",") : undefined;
    try {
      const response = await fetchAssistance(
        caseId,
        currentPage,
        CASES_PER_PAGE,
        relationshipType,
        selectedShow,
        userData?.userId,
        userData?.activeLocation
      );
      const records = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setAssistanceRecords(records);
      setTotalPages(Number(response.data.pagination.totalPages));
      setTotalItems(Number(response.data.pagination.total));
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.ASSISTANCE.FETCH_ERROR);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    setSelectedReferral(null);
    setSelectedAssistanceRecord(null);
  }, []);
  useEffect(() => {
    fetchAssistanceRecords();
  }, [caseId, currentPage, selectedShow, filters]);
  const handleCreateAssistance = async (
    formData: any,
    addAnother?: boolean
  ) => {
    if (!caseId || !user?.userId)
      return toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_INFO);
    try {
      if (selectedReferral) {
        await createRequestedAssistance(
          selectedReferral?._id,
          formData,
          user.userId,
          user.activeLocation
        );
        toast.success(STATIC_TEXTS.ASSISTANCE.CREATED_SUCCESS);
      } else {
        await createAssistance(
          caseId,
          formData,
          user.userId,
          user.activeLocation
        );
        toast.success(STATIC_TEXTS.ASSISTANCE.CREATED_SUCCESS);
        if (!addAnother) {
          setIsAddAssistanceModalOpen(false);
        }
      }
      setSelectedReferral(null);
      fetchAssistanceRecords();
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.ASSISTANCE.CREATE_ERROR);
    }
  };

  const handleUpdateAssistance = async (
    assistanceId: string,
    formData: any
  ) => {
    if (!user?.userId) return toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_INFO);
    try {
      if (selectedReferral) {
        await updateRequestedAssistance(
          selectedReferral?._id,
          assistanceId,
          formData,
          user.userId,
          user.activeLocation
        );
        toast.success(STATIC_TEXTS.REFERRALS.STATUS_UPDATED);
      } else {
        await updateAssistance(
          assistanceId,
          formData,
          user.userId,
          user.activeLocation
        );
        toast.success(STATIC_TEXTS.ASSISTANCE.UPDATED_SUCCESS);
      }
      setIsAddAssistanceModalOpen(false);
      fetchAssistanceRecords();
      setSelectedReferral(null);
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.ASSISTANCE.UPDATE_ERROR);
    }
  };

  const handleDeleteAssistance = (recordId: string) => {
    setAssistanceRecordToDeleteId(recordId);
    setIsDeleteAssistanceModalOpen(true);
  };
  const handleDeletereferrals = (recordId: string) => {
    setReferraleRecordToDeleteId(recordId);
    setIsDeleteAssistanceModalOpen(true);
  };

  const handleConfirmDeleteAssistance = async () => {
    if (!assistanceRecordToDeleteId || !user?.userId) {
      toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_DELETE_INFO);
      return;
    }
    try {
      if (selectedReferral) {
        await deleteRequestedAssistance(
          selectedReferral?._id,
          assistanceRecordToDeleteId,
          user.userId,
          user.activeLocation
        );
      } else {
        await deleteAssistance(
          assistanceRecordToDeleteId,
          user.userId,
          user.activeLocation
        );
      }
      toast.success(STATIC_TEXTS.ASSISTANCE.DELETED_SUCCESS);
      setIsDeleteAssistanceModalOpen(false);
      setAssistanceRecordToDeleteId(null);
      fetchAssistanceRecords();
    } catch (error: any) {
      console.error("Error deleting assistance:", error);
      toast.error(error || STATIC_TEXTS.ASSISTANCE.DELETE_ERROR);
    }
  };
  const handleConfirmDeleteReferrals = async () => {
    if (!referralRecordToDeleteId || !user?.userId) {
      toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_DELETE_INFO);
      return;
    }
    try {
      await deleteReferral(
        referralRecordToDeleteId,
        user.userId,
        user.activeLocation
      );

      toast.success(STATIC_TEXTS.REFERRALS.REFERRAL_DELETED);
      setIsDeleteAssistanceModalOpen(false);
      setAssistanceRecordToDeleteId(null);
      fetchAssistanceRecords();
    } catch (error: any) {
      console.error("Error deleting assistance:", error);
      toast.error(error || STATIC_TEXTS.REFERRALS.REFERRAL_DELETE_FAILED);
    }
  };

  const handleEditAssistance = (record: AssistanceReferralResponse) => {
    setSelectedAssistanceRecord(record as AssistanceRecord);
    setIsAddAssistanceModalOpen(true);
  };
  const handleEditReferral = (record: AssistanceReferralResponse) => {
    setSelectedReferral(record);
    setIsAddAssistanceReqModalOpen(true);
  };

  const handleCloseAssistanceModal = () => {
    setIsAddAssistanceModalOpen(false);
    setSelectedReferral(null);
    setSelectedAssistanceRecord(null);
  };

  const handleEditStatusHistory = (
    record: AssistanceReferralResponse,
    idx: number
  ) => {
    setSelectedReferral(record);
    setEditStatusHistoryIdx(idx);
    setIsUpdateStatusModalOpen(true);
    setIsEditStatusModal(true);
  };

  const handleEditRequestedAssistance = (
    record: AssistanceReferralResponse,
    req: AssistanceRecord
  ) => {
    setSelectedAssistanceRecord(req);
    setIsAddAssistanceModalOpen(true);
    setSelectedReferral(record);
  };

  const handleDeleteRequestedAssistance = (
    record: AssistanceReferralResponse,
    reqId: string
  ) => {
    setSelectedReferral(record);
    setAssistanceRecordToDeleteId(reqId);
    setIsDeleteAssistanceModalOpen(true);
  };

  const handleAddRequestedAssistance = (record: AssistanceReferralResponse) => {
    setIsAddAssistanceModalOpen(true);
    setSelectedReferral(record);
  };
  const handleSubmitStatus = async (
    status: string,
    notes: string,
    isEdit: boolean
  ) => {
    if (!selectedReferral || !user?.userId) return;
    try {
      await updateReferralStatus(
        selectedReferral._id,
        status,
        notes,
        user.userId,
        user.activeLocation,
        isEdit
          ? selectedReferral?.statusHistory[editStatusHistoryIdx || 0]?._id
          : undefined
      );
      toast.success(STATIC_TEXTS.REFERRALS.STATUS_UPDATED);
      setIsUpdateStatusModalOpen(false);
      setIsEditStatusModal(false);
      fetchAssistanceRecords();
    } catch (error: any) {
      toast.error(error || "Failed to update status");
    }
  };

  const handleCreateReferral = async (formData: any) => {
    if (!caseId || !user?.userId) return;
    try {
      await createReferral(caseId, formData, user.userId, user.activeLocation);
      toast.success(STATIC_TEXTS.REFERRALS.REFERRAL_CREATED);
      setIsAddAssistanceModalOpen(false);
      fetchAssistanceRecords();
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.REFERRALS.REFERRAL_CREATE_FAILED);
    }
  };

  if (!caseData) {
    toast.error("Something went wrong!!");
    return null;
  }

  const mapAssistanceRecord = useCallback((record: any) => {
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

    const attachment =
      "attachedFile" in record
        ? (record as any).attachedFile || record.attachment || null
        : record.attachment || null;

    const type = record.category?.name || "";
    const section = record.category?.section
      ? ` ${record.category.section}`
      : "";

    const service = record.service
      ? {
          _id: record.service._id,
          name: record.service.name,
          companyId: record.service.companyId
            ? record.service.companyId
            : record.service.locationId,
          companyName: record.service.companyName,
          section: record.service.sectionId?.name,
        }
      : undefined;

    const status =
      "status" in record && typeof record.status === "object"
        ? {
            _id: record.status._id,
            name: record.status.name,
          }
        : record.status;

    const requestDeadline =
      "requestDeadline" in record ? (record as any).requestDeadline : undefined;

    const statusHistory = "statusHistory" in record ? record.statusHistory : [];

    if (record.type === "referral") {
      return {
        id: record._id,
        date: record.createdAt,
        description: record.description,
        amount: record.amount,
        type: section + (type ? " : " : "") + type,
        provider: {
          name: createdByName,
          organization: record.visibleTo,
          agencyName: record.company.locationName || record.company.companyName,
        },
        isPrivate: record.visibleTo !== "All Agencies",
        attachment,
        unit: record.unit,
        receivedBy: receivedBy,
        createdBy: { name: createdByName, userId: record?.createdBy?.userId },
        status: status,
        statusHistory: statusHistory,
        service: service,
        requestDeadline: requestDeadline,
        caseName: record.caseName,
        requestedAssistance: record.requestedAssistance,
        agency: {
          _id: record.company.companyId
            ? record.company.companyId
            : record.company.locationId,
          name: record.company.companyName
            ? record.company.companyName
            : record.company.locationName,
        },
      };
    }

    return {
      id: record._id,
      date: record.createdAt,
      description: record.description,
      amount: record.amount,
      type: type + " : " + section,
      provider: {
        name: createdByName,
        organization: record.visibleTo,
        agencyName: record.company.locationName || record.company.companyName,
      },
      isPrivate: record.visibleTo !== "All Agencies",
      attachment,
      unit: record.unit,
      receivedBy: receivedBy,
      createdBy: { name: createdByName, userId: record?.createdBy?.userId },
      caseName: record.caseName,
    };
  }, []);

  const startItem = (currentPage - 1) * CASES_PER_PAGE + 1;
  const endItem = Math.min(currentPage * CASES_PER_PAGE, totalItems);
  const paginationLabel = `${startItem}-${endItem} of ${totalItems} Assistance`;
  const handleOpenUpdateStatusModal = (record: AssistanceReferralResponse) => {
    setSelectedReferral(record);
    setIsUpdateStatusModalOpen(true);
  };

  const handleUpdateReferral = async (referralId: string, formData: any) => {
    if (!referralId || !caseId || !user?.userId) return;
    try {
      await updateReferral(
        referralId,
        formData,
        user.userId,
        user.activeLocation
      );
      toast.success(STATIC_TEXTS.REFERRALS.REFERRAL_UPDATED);
      setIsAddAssistanceModalOpen(false);
      fetchAssistanceRecords();
      setSelectedReferral(null);
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.REFERRALS.REFERRAL_UPDATE_FAILED);
    }
  };

  useEffect(() => {
    if (!userData) return;
    fetchCategories(userData, setLoadingCategories, setCategoryOptions);
  }, [userData?.userId, userData?.activeLocation]);

  useEffect(() => {
    dispatch(updateCaseCount({ key: "assistance", value: totalItems }));
  }, [totalItems]);

  return (
    <div className="flex flex-col h-full ">
      <div className="flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
        <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4 pr-10">
          <h1 className="text-2xl font-bold text-pink">
            Assistance for {caseData?.firstName + " " + caseData?.lastName}
          </h1>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="submitStyle"
              label={STATIC_TEXTS.CASE_DETAILS.ADD_REQUEST}
              icon="mdi:plus"
              className="hover:bg-purple/90 transition-colors duration-200"
              onClick={() => {
                setSelectedReferral(null);
                setIsAddAssistanceReqModalOpen(true);
              }}
            />
            <Button
              variant="submitStyle"
              label={STATIC_TEXTS.CASE_DETAILS.ADD_ASSISTANCE}
              icon="mdi:plus"
              className="hover:bg-purple/90 transition-colors duration-200"
              onClick={() => setIsAddAssistanceModalOpen(true)}
            />
          </div>
        </div>

        <CaseDetailsFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          caseName={caseData?.firstName + " " + caseData?.lastName}
          selectedShow={selectedShow}
          onShowChange={setSelectedShow}
          showOptions={[
            { label: "All", value: "" },
            ...categoryOptions.map((option) => ({
              label: option.name,
              value: option._id,
            })),
          ]}
        />

        <div className="p-6 space-y-4">
          {isLoading ? (
            <Loader />
          ) : assistanceRecords.length === 0 ? (
            <p className="text-center text-gray-500">
              {STATIC_TEXTS.COMMON.NO_DATA}
            </p>
          ) : (
            assistanceRecords.map((record) => (
              <AssistanceCard
                key={record._id}
                record={mapAssistanceRecord(record)}
                onEdit={() => {
                  record.type === "referral"
                    ? handleEditReferral(record)
                    : handleEditAssistance(record);
                }}
                onDelete={() =>
                  record.type === "referral"
                    ? handleDeletereferrals(record?._id)
                    : handleDeleteAssistance(record._id)
                }
                currentUser={user}
                type={record?.type}
                onEditStatusHistory={(idx) =>
                  handleEditStatusHistory(record, idx)
                }
                onEditRequestedAssistance={(req) =>
                  handleEditRequestedAssistance(record, req)
                }
                onDeleteRequestedAssistance={(reqId) =>
                  handleDeleteRequestedAssistance(record, reqId)
                }
                onAddRequestedAssistance={() =>
                  handleAddRequestedAssistance(record)
                }
                onUpdateStaus={() => {
                  handleOpenUpdateStatusModal(record);
                }}
              />
            ))
          )}
        </div>
      </div>

      {assistanceRecords && assistanceRecords.length > 0 && (
        <Footer
          count={assistanceRecords.length}
          label={paginationLabel}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={() => {
            handlePreviousPage(setCurrentPage);
          }}
          onNext={() => {
            handleNextPage(setCurrentPage, totalPages);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}

      <AddAssistanceModal
        isOpen={isAddAssistanceModalOpen}
        onClose={handleCloseAssistanceModal}
        onSubmit={
          selectedAssistanceRecord
            ? handleUpdateAssistance
            : handleCreateAssistance
        }
        caseName={caseData?.firstName + " " + caseData?.lastName}
        isEdit={!!selectedAssistanceRecord}
        selectedRecord={selectedAssistanceRecord as AssistanceRecord | null}
        referralData={selectedReferral}
        prefillAssistance={
          selectedReferral && !selectedAssistanceRecord ? true : false
        }
      />
      <AddAssistanceModal
        isOpen={isAddAssistanceReqModalOpen}
        onClose={() => setIsAddAssistanceReqModalOpen(false)}
        caseName={caseData?.firstName + " " + caseData?.lastName}
        onSubmit={
          selectedReferral ? handleUpdateReferral : handleCreateReferral
        }
        isAddReq={true}
        isEdit={!!selectedReferral}
        selectedRecord={selectedReferral}
      />

      <DeleteCaseModal
        isOpen={isDeleteAssistanceModalOpen}
        onClose={() => {
          setIsDeleteAssistanceModalOpen(false);
          setAssistanceRecordToDeleteId(null);
          setReferraleRecordToDeleteId(null);
        }}
        onConfirmDelete={
          assistanceRecordToDeleteId
            ? handleConfirmDeleteAssistance
            : handleConfirmDeleteReferrals
        }
        title={
          assistanceRecordToDeleteId
            ? STATIC_TEXTS.ASSISTANCE.CONFIRM_DELETE_TITLE("Assistance")
            : STATIC_TEXTS.ASSISTANCE.CONFIRM_DELETE_TITLE("Referral")
        }
        message={
          assistanceRecordToDeleteId
            ? STATIC_TEXTS.ASSISTANCE.CONFIRM_DELETE_MESSAGE("Assistance")
            : STATIC_TEXTS.ASSISTANCE.CONFIRM_DELETE_MESSAGE("Referral")
        }
        confirmLabel={STATIC_TEXTS.COMMON.DELETE}
        confirmButtonLabel={
          assistanceRecordToDeleteId
            ? STATIC_TEXTS.ASSISTANCE.DELETE_BUTTON("Assistance")
            : STATIC_TEXTS.ASSISTANCE.DELETE_BUTTON("Referral")
        }
      />
      <UpdateStatusModal
        isOpen={isUpdateStatusModalOpen}
        onClose={() => {
          setIsUpdateStatusModalOpen(false);
          setIsEditStatusModal(false);
        }}
        onSubmit={handleSubmitStatus}
        initialStatus={
          isEditStatusModal && selectedReferral
            ? selectedReferral?.statusHistory[editStatusHistoryIdx || 0]?.status
            : ""
        }
        initialNotes={
          isEditStatusModal && selectedReferral
            ? selectedReferral?.statusHistory[editStatusHistoryIdx || 0]
                ?.statusNotes
            : ""
        }
        isEdit={isEditStatusModal}
      />
      {loadingCategories && <Loader />}
    </div>
  );
};
