import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useParams, useNavigate } from "react-router-dom";
import DeleteCaseModal from "@modals/DeleteCaseModal";
import type { CaseType, TabConfig } from "@/types/case";
import AddCaseModal from "@modals/AddCaseModal";
import SidebarButton from "@ui/SidebarButton";
import {
  deleteCase,
  fetchCaseById,
  addRecentCases,
  getRecentCases,
  fetchCaseRelatedCounts,
} from "@services/CaseApi";
import { toast } from "react-toastify/unstyled";
import FlagCaseModal from "@modals/FlagCaseModal";
import MergeCaseModal from "@modals/MergeCase";
import IDCardModal from "@modals/IdCardModal";
import CaseReportModal from "@modals/CaseReportModal";
import backendApi from "@/api/api";
import ConfirmationModal from "@modals/ConfirmationModal";
import { STATIC_TEXTS } from "@utils/textConstants";
import { setCurrentCaseData } from "@/redux/caseSlice";
import { setRecentCases, setRecentCasesError } from "@/redux/recentCasesSlice";
import { useDispatch, useSelector } from "react-redux";
import Loader from "@/components/ui/Loader";
import type { RootState } from "@/redux/store";
import { resetCaseCounts, setCaseCounts } from "@/redux/caseCountSlice";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { getBackendUrl } from "@/utils/commonFunc";

interface CaseLayoutProps {
  children?: React.ReactNode;
}

export const CaseLayout: React.FC<CaseLayoutProps> = ({ children }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal-info");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [caseImage, setCaseImage] = useState<string | null>(null);
  const [modalStates, setModalStates] = useState({
    deleteCase: false,
    editCase: false,
    mergeCase: false,
    flagCase: false,
    idCard: false,
    caseReport: false,
  });
  const { canMergeCase } = useRoleAccess();
  const [caseData, setCaseData] = useState<CaseType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const dispatch = useDispatch();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const caseCounts = useSelector((state: RootState) => state.caseCounts);

  const tabs: TabConfig[] = useMemo(
    () => [
      { id: "personal-info", label: "Personal Info", icon: "mdi:account" },
      {
        id: "assistance",
        label: "Assistance",
        icon: "mdi:hand-heart",
        count: caseCounts.assistance,
        color: "bg-orange-500",
      },
      {
        id: "relationships",
        label: "Relationships",
        icon: "mdi:account-group",
        count: caseCounts.relationships,
        color: "bg-yellow-500",
      },
      {
        id: "notes",
        label: "Notes",
        icon: "mdi:note-text",
        count: caseCounts.notes,
      },
      {
        id: "documents",
        label: "Documents",
        icon: "mdi:file-document",
        count: caseCounts.documents,
      },
      {
        id: "alerts",
        label: "Alerts",
        icon: "mdi:alert",
        count: caseCounts.alerts,
      },
      {
        id: "assessments",
        label: "Assessments",
        icon: "mdi:clipboard-check",
        count: caseCounts.assessments,
      },
      {
        id: "outcomes",
        label: "Outcomes",
        icon: "mdi:target",
        count: caseCounts.outcomes,
      },
      {
        id: "appointments",
        label: "Appointments",
        icon: "mdi:calendar",
        count: caseCounts.appointments,
      },
      {
        id: "bed-assignments",
        label: "Bed Assignments",
        icon: "mdi:bed",
        count: caseCounts.bedAssignments,
      },
      {
        id: "rental-subsidy",
        label: "Rental & Subsidy",
        icon: "mdi:home-currency-usd",
        count: caseCounts.rentalSubsidy,
      },
      {
        id: "maintenance-request",
        label: "Maintenance Request",
        icon: "mdi:home-currency-usd",
        count: caseCounts.maintenanceRequests,
      },
    ],
    [caseCounts]
  );

  useEffect(() => {
    const fetchCaseData = async () => {
      setLoading(true);
      try {
        if (id) {
          const data = await fetchCaseById(
            id,
            userData?.userId,
            userData?.activeLocation
          );
          setCaseData(data);
          dispatch(setCurrentCaseData(data));
          if (data?.caseImage) {
            setCaseImage(data.caseImage[0]);
          } else {
            setCaseImage(null);
          }
          if (userData?.userId) {
            try {
              await addRecentCases(
                id,
                userData.userId,
                userData.activeLocation
              );
              const recentCasesData = await getRecentCases(
                userData.userId,
                userData.activeLocation
              );
              dispatch(setRecentCases(recentCasesData));
            } catch (error) {
              console.error("Error with recent cases:", error);
              dispatch(setRecentCasesError("Failed to update recent cases"));
            }
          }
        } else {
          setCaseData(null);
          setCaseImage(null);
        }
      } catch (error) {
        console.error("Error fetching case data:", error);
        toast.error(STATIC_TEXTS.ERROR_MESSAGES.FETCH.CASES);
        setCaseData(null);
        setCaseImage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
    fetchCaseCounts();
  }, [id, modalStates, userData, dispatch]);

  const fetchCaseCounts = useCallback(async () => {
    setLoading(true);
    try {
      if (id) {
        if (userData?.userId) {
          const counts = await fetchCaseRelatedCounts(
            id,
            userData.userId,
            userData.activeLocation
          );
          if (counts?.data) dispatch(setCaseCounts(counts?.data));
        }
      } else {
        dispatch(resetCaseCounts());
      }
    } catch (error) {
      console.error("Error fetching case data:", error);
      toast.error(STATIC_TEXTS.ERROR_MESSAGES.FETCH.CASES);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !caseData?.caseId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCaseImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("caseImage", file);

    try {
      await backendApi.post(`/api/cases/${caseData?.caseId}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-user-id": userData?.userId,
          "x-location-id": userData?.activeLocation,
        },
      });
      toast.success(STATIC_TEXTS.CASE.IMAGE.UPLOAD_SUCCESS);
    } catch (error) {
      console.error("Error uploading case image:", error);
      toast.error(STATIC_TEXTS.CASE.IMAGE.UPLOAD_ERROR);
      setCaseImage(null);
    }
  };

  const handleDeleteImage = () => {
    if (!caseData?.caseId || !caseImage) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteImage = async () => {
    try {
      await backendApi.delete(`/api/cases/${caseData?.caseId}/image`, {
        headers: {
          "x-user-id": userData?.userId,
          "x-location-id": userData?.activeLocation,
        },
      });
      toast.success(STATIC_TEXTS.CASE.IMAGE.DELETE_SUCCESS);
      setCaseData((prev) => (prev ? { ...prev, caseImage: undefined } : null));
      setCaseImage(null);
    } catch (error) {
      console.error("Error deleting case image:", error);
      toast.error(STATIC_TEXTS.CASE.IMAGE.DELETE_ERROR);
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/cases/${id}/${tabId}`);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleModal = (modalName: keyof typeof modalStates) => {
    setModalStates((prev) => ({
      ...prev,
      [modalName]: !prev[modalName],
    }));
    setIsSidebarOpen(false);
  };

  const handleDeleteCase = async () => {
    if (!id) return;

    try {
      await deleteCase(id, userData?.userId, userData?.activeLocation);
      toast.success("Case deleted successfully");
      toggleModal("deleteCase");
      navigate("/myAgency/cases");
    } catch (error) {
      console.error("Error deleting case:", error);
      toast.error("Failed to delete case. Please try again.");
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Case not found</p>
      </div>
    );
  }

  const fullName = [caseData.firstName, caseData.middleName, caseData.lastName]
    .filter(Boolean)
    .join(" ");

  const streetAddress = caseData?.streetAddress
    ? [
        caseData.streetAddress.address,
        caseData.streetAddress.apt,
        caseData.streetAddress.city,
        caseData.streetAddress.state,
        caseData.streetAddress.zip,
      ]
        .filter(Boolean)
        .join(", ")
    : STATIC_TEXTS.CASE.NO_ADDRESS;

  const handleEmailIDCard = () => {};

  const sidebarButtons = [
    {
      icon: "mdi:pencil",
      label: "Edit Case",
      onClick: () => toggleModal("editCase"),
      visible: true,
    },
    {
      icon: "material-symbols:merge-type-rounded",
      label: "Merge Case",
      onClick: () => toggleModal("mergeCase"),
      visible: canMergeCase,
    },
    {
      icon: "typcn:flag",
      label: "Flag Case",
      onClick: () => toggleModal("flagCase"),
      visible: !canMergeCase,
    },
    {
      icon: "mdi:delete",
      label: "Delete Case",
      onClick: () => toggleModal("deleteCase"),
      className: "!text-red-700 hover:!bg-red-100",
      visible: canMergeCase,
    },
    {
      icon: "mdi:file-document",
      label: "Case Report",
      onClick: () => toggleModal("caseReport"),
      visible: true,
    },
    {
      icon: "mdi:file-document",
      label: "Id Card",
      onClick: () => toggleModal("idCard"),
      visible: true,
    },
  ];

  return (
    <div className="flex h-full bg-gray-100 flex-col lg:flex-row-reverse !overflow-hidden">
      <div
        id="no-print-case-sidebar"
        className={`fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 overflow-y-auto hide-scrollbar transform transition-transform duration-300 z-[10000]
          ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <button
          onClick={toggleSidebar}
          className="text-primary absolute top-4 right-4  bl px-4 py-2 rounded flex items-center gap-2 transition-colors duration-200"
        >
          <Icon icon="mdi:close" width="20" height="20" />
        </button>
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-primary/10">
                {caseImage || caseData?.caseImage ? (
                  <img
                    src={getBackendUrl(caseImage || caseData?.caseImage?.[0])}
                    alt={STATIC_TEXTS.CASE.IMAGE.TITLE}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon
                      icon="mdi:account"
                      className="text-gray-400"
                      width="64"
                      height="64"
                    />
                  </div>
                )}
              </div>
              <label
                htmlFor="case-image"
                className="absolute bottom-1 right-2 bg-green text-white w-7 h-7 p-1 items-center flex justify-center rounded-full cursor-pointer shadow-lg hover:bg-green/90 transition-colors duration-200"
              >
                <Icon icon="mdi:camera" className="w-full h-full" />
              </label>
              <input
                type="file"
                id="case-image"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              {(caseImage || caseData?.caseImage) && (
                <button
                  onClick={handleDeleteImage}
                  className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full cursor-pointer shadow-lg hover:bg-red-600 transition-colors duration-200"
                  aria-label={STATIC_TEXTS.CASE.IMAGE.DELETE_TITLE}
                >
                  <Icon icon="mdi:close" width="16" height="16" />
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{fullName}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Case #{caseData.caseId}
            </p>
            {caseData.headOfHousehold && (
              <div className="mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  HEAD OF HOUSEHOLD
                </span>
              </div>
            )}
            <div className="mt-4 text-sm text-gray-600">
              {caseData.streetAddress?.address ? (
                <div className="flex items-start gap-1 justify-center">
                  <Icon icon="mdi:map-marker" width="16" height="16" />
                  <span>{streetAddress || "Not address provided"}</span>
                </div>
              ) : (
                <p>Not address provided</p>
              )}
              {caseData.phoneNumbers &&
                caseData.phoneNumbers.length > 0 &&
                caseData.phoneNumbers[0]?.number && (
                  <div className="flex items-center gap-2 justify-center mt-1">
                    <Icon icon="mdi:phone" width="16" height="16" />
                    <span>{caseData.phoneNumbers[0].number}</span>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="p-4">
          {tabs.map((tab: TabConfig) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mb-1 transition-colors duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-purple text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }
              }`}
            >
              <Icon icon={tab.icon} width="20" height="20" />
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : tab.color || "bg-gray-200"
                  }
                  text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            {sidebarButtons.map(
              (button, index) =>
                button.visible && (
                  <SidebarButton
                    key={index}
                    icon={button.icon}
                    label={button.label}
                    onClick={button.onClick}
                    className={button.className}
                  />
                )
            )}
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`flex-1 flex-col !hide-scrollbar overflow-auto lg:flex lg:flex-1 w-full ${
          isSidebarOpen ? "hidden lg:flex" : "flex"
        }
        lg:flex`}
      >
        <div
          id="no-print-subheader"
          className="sticky top-0 bg-white p-5 md:pl-5 pl-16 flex items-center justify-between border-b border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-800">Case Details</h2>{" "}
          <button onClick={toggleSidebar} className="text-gray-600">
            <Icon icon="mdi:menu" width="24" height="24" />
          </button>
        </div>

        <DeleteCaseModal
          isOpen={modalStates.deleteCase}
          onClose={() => toggleModal("deleteCase")}
          onConfirmDelete={handleDeleteCase}
        />
        <AddCaseModal
          isOpen={modalStates.editCase}
          onClose={() => toggleModal("editCase")}
          caseData={caseData}
        />
        <MergeCaseModal
          isOpen={modalStates.mergeCase}
          onClose={() => toggleModal("mergeCase")}
          initialKeepingCase={caseData}
        />
        <FlagCaseModal
          isOpen={modalStates.flagCase}
          onClose={() => toggleModal("flagCase")}
          caseId={caseData?.caseId}
        />
        <IDCardModal
          isOpen={modalStates.idCard}
          onClose={() => toggleModal("idCard")}
          onEmail={handleEmailIDCard}
          userName={fullName}
          email={caseData.email || ""}
          centerName={
            caseData.caseCompanyInfo?.locationName ||
            caseData.caseCompanyInfo?.companyName ||
            ""
          }
          caseData={caseData}
        />
        <CaseReportModal
          isOpen={modalStates.caseReport}
          onClose={() => toggleModal("caseReport")}
        />

        <div className="h-full overflow-auto !hide-scrollbar">{children}</div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteImage}
        title={STATIC_TEXTS.CASE.IMAGE.DELETE_TITLE}
        message={STATIC_TEXTS.CASE.IMAGE.DELETE_CONFIRM}
        variant="danger"
      />
    </div>
  );
};

export default CaseLayout;
