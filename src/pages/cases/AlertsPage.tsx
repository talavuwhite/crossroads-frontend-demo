import React, { useState, useEffect, useCallback } from "react";
import AssistanceCard from "@/components/AssistanceCard";
import Footer from "@/components/PageFooter";
import CaseDetailsFilter from "@/components/CaseDetailsFilter";
import Button from "@/components/ui/Button";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import type { CaseAlert, FilterKeys } from "@/types/case";
import AddAlertModal from "@/components/modals/AddAlertModal";
import {
  createCaseAlert,
  fetchCaseAlerts,
  updateCaseAlert,
  deleteCaseAlert,
} from "@/services/CaseAlertsApi";
import type { ApiResponse } from "@/types/api";
import DeleteCaseModal from "@/components/modals/DeleteCaseModal";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import Loader from "@/components/ui/Loader";
import { handleFilterChange as handleFilterChangeCommon } from "@/utils/commonFunc";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { updateCaseCount } from "@/redux/caseCountSlice";

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<CaseAlert[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(ITEMS_PER_PAGE);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [editAlert, setEditAlert] = useState<CaseAlert | null>(null);
  const [isDeleteAlertModalOpen, setIsDeleteAlertModalOpen] = useState(false);
  const [alertToDeleteId, setAlertToDeleteId] = useState<string | null>(null);
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [loading, setLoading] = useState(false);
  if (!caseData) {
    toast.error(STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
  }
  const { canEditDeleteAssistance: canEditDeleteAlert } = useRoleAccess();

  const [filters, setFilters] = useState<Record<FilterKeys, boolean>>({
    caseName: true,
    live_with: false,
    related: false,
  });

  const [isAddAlertModalOpen, setIsAddAlertModalOpen] = useState(false);
  const dispatch = useDispatch();
  const fetchAlerts = async () => {
    if (!caseData?._id) return;

    try {
      setLoading(true);
      const selectedTypes = Object.entries(filters)
        .filter(([key, value]) => value && key !== "caseName")
        .map(([key]) => key);

      const relationshipType =
        selectedTypes.length > 0 ? selectedTypes.join(",") : undefined;

      const response = await fetchCaseAlerts(
        caseData._id,
        currentPage,
        limit,
        relationshipType,
        userData?.userId,
        userData?.activeLocation
      );

      setAlerts(response.data.data);
      setTotalPages(response.data.pagination?.totalPages ?? 0);
      setTotalAlerts(response.data.pagination?.total ?? 0);
    } catch (error: any) {
      console.error("Error fetching alerts:", error);
      toast.error(error.message || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [caseData?._id, currentPage, limit, filters]);

  const handleAddAlert = () => {
    setIsAddAlertModalOpen(true);
  };

  const handleCloseAddAlertModal = () => {
    setIsAddAlertModalOpen(false);
    setEditAlert(null);
    fetchAlerts();
  };

  const handleSubmitNewAlert = async (newAlertData: any, alertId?: string) => {
    if (!caseData?._id || !userData?.userId) {
      toast.error(STATIC_TEXTS.ALERTS.MISSING_DATA);
      return;
    }

    try {
      let response: ApiResponse<CaseAlert>;
      if (alertId) {
        response = await updateCaseAlert(
          alertId,
          {
            description: newAlertData.description,
            sendEmail: newAlertData.sendEmail,
          },
          userData.userId,
          userData.activeLocation
        );
        toast.success(
          response?.message || STATIC_TEXTS.ALERTS.ALERT_UPDATED_SUCCESS
        );
      } else {
        response = await createCaseAlert(
          caseData?._id,
          {
            description: newAlertData.description,
            sendEmail: newAlertData.sendEmail,
          },
          userData.userId,
          userData.activeLocation
        );
        toast.success(
          response?.message || STATIC_TEXTS.ALERTS.ALERT_ADDED_SUCCESS
        );
      }
      handleCloseAddAlertModal();
    } catch (error: any) {
      console.error("Error saving alert:", error);
      toast.error(error.message || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    }
  };

  const handleEditAlert = (id: string) => {
    const alertToEdit = alerts.find((alert) => alert._id === id);
    if (!userData?.userId) {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
      return;
    }

    if (alertToEdit && canEditDeleteAlert(alertToEdit.createdBy.userId)) {
      setEditAlert(alertToEdit);
      setIsAddAlertModalOpen(true);
    } else {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
  };

  const handleDeleteAlert = (id: string) => {
    const alertToDelete = alerts.find((alert) => alert._id === id);
    if (!userData?.userId) {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
      return;
    }

    if (alertToDelete && canEditDeleteAlert(alertToDelete.createdBy.userId)) {
      setAlertToDeleteId(id);
      setIsDeleteAlertModalOpen(true);
    } else {
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }
  };

  const handleConfirmDeleteAlert = async () => {
    if (!alertToDeleteId || !userData?.userId) {
      toast.error(STATIC_TEXTS.ALERTS.MISSING_DATA);
      return;
    }

    try {
      await deleteCaseAlert(
        alertToDeleteId,
        userData.userId,
        userData.activeLocation
      );
      toast.success(STATIC_TEXTS.ALERTS.ALERT_DELETED_SUCCESS);
      fetchAlerts();
      setIsDeleteAlertModalOpen(false);
      setAlertToDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting alert:", error);
      toast.error(error.message || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalAlerts);
  const footerLabel = `${startItem}-${endItem} of ${totalAlerts} Alerts`;

  const mapAlertRecord = useCallback((alert: CaseAlert) => {
    return {
      id: alert._id,
      author: alert.createdBy.name,
      date: alert.createdAt,
      description: alert.description,
      relatedPerson: alert.caseName,
      createdBy: alert.createdBy,
      agency: {
        _id: alert.company?.companyId
          ? alert.company.companyId
          : alert.company?.locationId,
        name: alert.company?.companyName
          ? alert.company.companyName
          : alert.company?.locationName,
      },
      caseId: alert.caseId,
    };
  }, []);

  useEffect(() => {
    dispatch(updateCaseCount({ key: "alerts", value: totalAlerts }));
  }, [totalAlerts]);

  return (
    <div className="flex flex-col h-full ">
      <div className="flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
        <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4 pr-10">
          <h1 className="text-2xl font-bold text-pink">
            {`${STATIC_TEXTS.ALERTS.ALERTS} for ${caseData?.firstName || ""} ${
              caseData?.lastName || ""
            }`}
          </h1>

          <Button
            variant="submitStyle"
            label={STATIC_TEXTS.ALERTS.ADD_ALERT}
            icon="mdi:plus"
            className="hover:bg-purple/90 transition-colors duration-200"
            onClick={handleAddAlert}
          />
        </div>
        <CaseDetailsFilter
          filters={filters}
          onFilterChange={(key) =>
            handleFilterChangeCommon(key, setFilters, setCurrentPage)
          }
          caseName={caseData?.firstName + " " + caseData?.lastName}
          label={`${STATIC_TEXTS.ALERTS.ALERTS} for...`}
        />
        {loading ? (
          <div className="flex justify-center items-center p-6">
            <Loader />
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {alerts.length === 0 ? (
              <p className="text-center text-gray-500">
                {STATIC_TEXTS.COMMON.NO_DATA}
              </p>
            ) : (
              alerts?.map((alert) => (
                <AssistanceCard
                  key={alert._id}
                  record={mapAlertRecord(alert) as any}
                  onEdit={handleEditAlert}
                  onDelete={handleDeleteAlert}
                  type="Alert"
                  currentUser={userData}
                />
              ))
            )}
          </div>
        )}
      </div>
      {alerts && alerts.length > 0 && (
        <Footer
          count={alerts.length}
          label={footerLabel}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}

      <AddAlertModal
        isOpen={isAddAlertModalOpen}
        onClose={handleCloseAddAlertModal}
        onSubmit={handleSubmitNewAlert}
        editAlert={editAlert}
      />

      <DeleteCaseModal
        isOpen={isDeleteAlertModalOpen}
        onClose={() => setIsDeleteAlertModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteAlert}
        title={STATIC_TEXTS.ALERTS.CONFIRM_DELETE_TITLE}
        message={STATIC_TEXTS.ALERTS.CONFIRM_DELETE_MESSAGE}
        confirmLabel={STATIC_TEXTS.COMMON.DELETE}
        confirmButtonLabel={STATIC_TEXTS.ALERTS.DELETE_ALERT_BUTTON}
      />
    </div>
  );
};

export default AlertsPage;
