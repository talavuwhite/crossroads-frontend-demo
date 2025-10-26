import React, { useState, useMemo, useEffect } from "react";
import PageFooter from "@components/PageFooter";
import type { FilteredService } from "@/types";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { HEADINGS, STATIC_TEXTS } from "@utils/textConstants";
import {
  deleteServiceById,
  createService,
  updateService,
  getFilteredServices,
} from "@services/ServiceApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import ServiceModal from "@components/modals/AddServiceModal";
import DeleteCaseModal from "@components/modals/DeleteCaseModal";
import Button from "@/components/ui/Button";
import ServiceCard from "@components/ServiceCard";
import Loader from "@/components/ui/Loader";
import { CASES_PER_PAGE } from "@/utils/constants";
import { useParams } from "react-router-dom";

const AgencyServices: React.FC = () => {
  const [services, setServices] = useState<FilteredService[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [isDeleteServiceModalOpen, setIsDeleteServiceModalOpen] =
    useState(false);
  const [selectedService, setSelectedService] =
    useState<FilteredService | null>(null);

  const { data: userData } = useSelector((state: RootState) => state.user);
  const { canCreateService, canUpdateService, canDeleteService, currentRole } =
    useRoleAccess();
  const { id } = useParams();
  const pageSize = CASES_PER_PAGE;

  const fetchServices = async () => {
    setLoading(true);
    try {
      if (!userData?.userId) return;
      const response = await getFilteredServices(
        userData.userId,
        userData.activeLocation ?? "",
        id
          ? id
          : userData.activeLocation
          ? userData.activeLocation
          : userData.companyId
          ? userData.companyId
          : "",
        currentPage,
        pageSize
      );
      const data = response.data;
      setServices(data.results || []);
      setTotalServices(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e) {
      setServices([]);
      setTotalServices(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchServices();
  }, [userData?.activeLocation, userData?.userId, id, currentPage, pageSize]);

  const handleCreateService = async (serviceData: {
    sectionId: string;
    name: string;
    description: string;
    taxonomyCode: string;
  }) => {
    if (!userData?.userId) {
      toast.error(STATIC_TEXTS.SERVICES.MISSING_DATA);
      return;
    }

    try {
      await createService(
        serviceData,
        userData.userId,
        id
          ? id
          : userData.activeLocation
          ? userData.activeLocation
          : userData.companyId
          ? userData.companyId
          : ""
      );
      toast.success(STATIC_TEXTS.SERVICES.CREATE_SUCCESS);
      setIsAddServiceModalOpen(false);
      fetchServices();
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.SERVICES.CREATE_ERROR);
    }
  };

  const handleUpdateService = async (serviceData: {
    sectionId: string;
    name: string;
    description: string;
    taxonomyCode: string;
  }) => {
    if (!selectedService || !userData?.userId) {
      toast.error(STATIC_TEXTS.SERVICES.MISSING_DATA);
      return;
    }

    try {
      await updateService(
        selectedService._id,
        serviceData,
        userData.userId,
        userData.activeLocation ?? ""
      );
      toast.success(STATIC_TEXTS.SERVICES.UPDATE_SUCCESS);
      setIsEditServiceModalOpen(false);
      setSelectedService(null);
      fetchServices();
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.SERVICES.UPDATE_ERROR);
    }
  };

  const groupedServices: [string, FilteredService[]][] = useMemo(() => {
    if (!Array.isArray(services)) return [];
    const groups: Record<string, FilteredService[]> = {};
    services.forEach((service) => {
      const sectionName = service.sectionId?.name || "Other";
      if (!groups[sectionName]) groups[sectionName] = [];
      groups[sectionName].push(service);
    });
    return Object.entries(groups);
  }, [services]);

  const handleEditService = (service: FilteredService) => {
    if (!canUpdateService) {
      toast.error(STATIC_TEXTS.SERVICES.NO_PERMISSION);
      return;
    }
    setSelectedService(service);
    setIsEditServiceModalOpen(true);
  };

  const handleDeleteService = (service: FilteredService) => {
    if (!canDeleteService) {
      toast.error(STATIC_TEXTS.SERVICES.NO_PERMISSION);
      return;
    }
    setSelectedService(service);
    setIsDeleteServiceModalOpen(true);
  };

  const confirmDeleteService = async () => {
    if (selectedService && userData?.userId && userData?.activeLocation) {
      try {
        await deleteServiceById(
          selectedService._id,
          userData.userId,
          userData.activeLocation
        );
        toast.success(STATIC_TEXTS.SERVICES.DELETE_SUCCESS);
        setIsDeleteServiceModalOpen(false);
        setSelectedService(null);
        fetchServices();
      } catch (error: any) {
        toast.error(error || STATIC_TEXTS.SERVICES.DELETE_ERROR);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto">
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="sm:flex items-center gap-3 hidden">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="mdi:folder-open"
                className="text-purple"
                width="24"
                height="24"
              />
            </div>

            <h1 className="text-2xl font-bold text-pink">
              {HEADINGS.SERVICES.TITLE}
            </h1>
          </div>

          {canCreateService && (
            <Button
              onClick={() => setIsAddServiceModalOpen(true)}
              icon="mdi:plus"
              label={"Add Service"}
              variant="submitStyle"
              className="w-full md:w-fit !justify-center py-3 md:py-2"
            />
          )}
        </div>
        <div className="overflow-hidden space-y-8 px-4 sm:px-6 my-4">
          {loading ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm">
              <Loader />
            </div>
          ) : groupedServices.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm">
              {STATIC_TEXTS.COMMON.NO_DATA}
            </div>
          ) : (
            groupedServices.map(([section, sectionServices]) => (
              <div key={section} className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-pink mb-2">
                  {section}
                </h2>
                <div key={section} className="space-y-4">
                  {sectionServices.map((service) => (
                    <ServiceCard
                      key={service._id}
                      service={{
                        _id: service._id,
                        name: service.name,
                        description: service.description,
                        taxonomyCode: service.taxonomyCode,
                        providedBy: service.providedBy,
                        companyName: service.companyName,
                      }}
                      showActions={currentRole !== "Agent"}
                      onEdit={
                        currentRole !== "Agent"
                          ? () => handleEditService(service)
                          : undefined
                      }
                      onDelete={
                        currentRole !== "Agent"
                          ? () => handleDeleteService(service)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {isAddServiceModalOpen && (
        <ServiceModal
          isOpen={isAddServiceModalOpen}
          onClose={() => {
            setIsAddServiceModalOpen(false);
            fetchServices();
          }}
          onSubmit={handleCreateService}
          mode="add"
        />
      )}
      {isEditServiceModalOpen && selectedService && (
        <ServiceModal
          isOpen={isEditServiceModalOpen}
          onClose={() => {
            setIsEditServiceModalOpen(false);
            setSelectedService(null);
            fetchServices();
          }}
          onSubmit={handleUpdateService}
          serviceData={selectedService}
          mode="edit"
        />
      )}
      {isDeleteServiceModalOpen && selectedService && (
        <DeleteCaseModal
          isOpen={isDeleteServiceModalOpen}
          onClose={() => {
            setIsDeleteServiceModalOpen(false);
            setSelectedService(null);
          }}
          onConfirmDelete={confirmDeleteService}
          title={STATIC_TEXTS.SERVICES.DELETE_SERVICE}
          message={STATIC_TEXTS.SERVICES.DELETE_SERVICE_CONFIRM.replace(
            "this service",
            `the service "${selectedService.name}"`
          )}
          confirmLabel="DELETE"
          confirmButtonLabel={STATIC_TEXTS.SERVICES.DELETE_SERVICE}
        />
      )}

      {totalServices > 0 && (
        <PageFooter
          count={totalServices}
          label={(() => {
            const start = (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, totalServices);
            return `${start}-${end} of ${totalServices} ${HEADINGS.SERVICES.TITLE}`;
          })()}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        />
      )}
    </div>
  );
};

export default AgencyServices;
