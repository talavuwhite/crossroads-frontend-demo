import React, { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import InfoCard from "@components/InfoCard";
import { ITEMS_PER_PAGE } from "@utils/constants";
import EditAgencyForm from "@components/EditAgencyForm";
import AddAgentForm from "@components/modals/AddAgentForm";
import ChangePasswordModal from "@components/modals/ChangePasswordModal";
import DeleteAgentModal from "@components/modals/DeleteAgentModal";
import PageFooter from "@components/PageFooter";
import { HEADINGS, STATIC_TEXTS, LABELS } from "@utils/textConstants";
import { getUsersByLocationAgency } from "@services/UserApi";
import {
  getAgencyDetails,
  getAgencyOrSubagencyDetails,
} from "@services/AgencyApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import Loader from "@/components/ui/Loader";
import type { UserData } from "@/types/user";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import AdminUserCard from "@/components/reusable/AdminUserCard";
import { displayValue } from "@/utils/commonFunc";
import { formatInTimeZone } from "date-fns-tz";
import type { AgencyDetailsTypes } from "@/types/agency";
import { ContactRow } from "@/components/ContactRow";
import { useParams } from "react-router-dom";
import type { Country } from "@/types";
import { getCountries } from "@/services/CountryApi";
import { getBackendUrl } from "@/utils/commonFunc";
import { format, parse } from "date-fns";

const AgencyDetails: React.FC = () => {
  const [showDisabledAgents, setShowDisabledAgents] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<UserData | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isEditAgentModalOpen, setIsEditAgentModalOpen] = useState(false);
  const [isDeleteAgentModalOpen, setIsDeleteAgentModalOpen] = useState(false);
  const [agents, setAgents] = useState<UserData[]>([]);
  const [totalAgents, setTotalAgents] = useState(0);
  const [disableCounts, setDisableCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agencyData, setAgencyData] = useState<AgencyDetailsTypes | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);

  const { data: userData } = useSelector((state: RootState) => state.user);
  const {
    canUpdateUsers,
    canDeleteUsers,
    canModifyUser,
    canUpdateOwnProfile,
    canCreateUserWithRole,
    allowedRolesToAssign,
  } = useRoleAccess();
  const { id } = useParams();

  const fetchAgency = async () => {
    if (!userData?.userId) return;
    setAgencyLoading(true);
    try {
      const res = await getAgencyDetails(userData.userId);
      if (res?.success) setAgencyData(res?.data?.data);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to fetch agency details");
    } finally {
      setAgencyLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      const fetchAgencyById = async () => {
        setAgencyLoading(true);
        try {
          if (!userData || !userData.userId || !id) {
            toast.error(STATIC_TEXTS.ALERTS.MISSING_DATA);
            return;
          }
          const res = await getAgencyOrSubagencyDetails(id, userData?.userId);
          if (res?.success) setAgencyData(res.data);
        } catch (error: any) {
          toast.error(error || "Failed to fetch agency details");
        } finally {
          setAgencyLoading(false);
        }
      };
      fetchAgencyById();
    } else {
      fetchAgency();
    }
  }, [id, userData?.userId]);

  useEffect(() => {
    fetchAgents();
  }, [
    currentPage,
    userData?.activeLocation,
    agencyData,
    showDisabledAgents,
    disableCounts,
  ]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      if (!userData?.userId || !agencyData) return;

      const response = await getUsersByLocationAgency(
        agencyData?.id,
        currentPage,
        ITEMS_PER_PAGE,
        showDisabledAgents, // 👈 pass flag
        userData.userId
      );
      console.log("🚀 ~ fetchAgents ~ response:", response);
      setDisableCount(response.disabledCount ?? 0);
      setAgents(response.users);
      setTotalAgents(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    if (!userData?.userId) {
      return toast.error("User authentication missing");
    }
    try {
      const countryList = await getCountries(
        userData.userId,
        userData.activeLocation
      );
      setCountries(countryList);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load countries";
      toast.error(message);
    } finally {
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleEditAgent = (agent: UserData) => {
    if (
      !canUpdateUsers &&
      !(agent.userId === userData?.userId && canUpdateOwnProfile)
    ) {
      toast.error("You don't have permission to edit this user");
      return;
    }

    if (
      userData?.propertyRole === "Agency Administrator" &&
      agent.propertyRole === "Network Administrator"
    ) {
      toast.error(
        "Agency Administrators cannot modify Network Administrator users"
      );
      return;
    }

    setSelectedAgent(agent);
    setIsEditAgentModalOpen(true);
  };

  const handleDeleteAgent = (agent: UserData) => {
    if (!canDeleteUsers) {
      toast.error("You don't have permission to delete users");
      return;
    }

    if (!canModifyUser(agent.propertyRole as any)) {
      toast.error("You don't have permission to delete this user");
      return;
    }

    setSelectedAgent(agent);
    setIsDeleteAgentModalOpen(true);
  };

  const isMyAgency =
    userData?.propertyRole === "Agency Administrator" &&
    (agencyData?.id === userData?.activeLocation ||
      agencyData?.id === userData?.companyId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="bg-white p-5 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple/10 p-2 rounded-full transform transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <Icon
                  icon="mdi:office-building"
                  className="text-purple"
                  width="24"
                  height="24"
                />
              </div>
              <div>
                {agencyLoading ? (
                  <Loader width={6} height={6} />
                ) : agencyData ? (
                  <>
                    <h1 className="text-2xl font-bold text-pink transition-colors duration-300">
                      {displayValue(agencyData.name)}
                    </h1>
                    <p className="text-gray-600">
                      {agencyData.type && typeof agencyData.type === "string"
                        ? agencyData.type.charAt(0).toUpperCase() +
                          agencyData.type.slice(1)
                        : displayValue(agencyData.type)}
                    </p>
                  </>
                ) : (
                  <span className="text-gray-400">No agency data</span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {(userData?.propertyRole === "Network Administrator" ||
                isMyAgency) && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="relative text-white bg-purple hover:bg-purple/90 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 group  after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
                >
                  <Icon
                    icon="mdi:pencil"
                    width="20"
                    height="20"
                    className="transform transition-transform duration-300 group-hover:rotate-12"
                  />
                  <span className="">{STATIC_TEXTS.AGENCY.EDIT_AGENCY}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mx-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6 items-stretch">
            {agencyLoading ? (
              <div className="col-span-full flex justify-center items-center py-8">
                <Loader width={8} height={8} />
              </div>
            ) : agencyData ? (
              <>
                <InfoCard
                  icon="mdi:contact-phone"
                  title={STATIC_TEXTS.CASE.CONTACT_INFO}
                  className="h-full flex flex-col"
                >
                  <ContactRow
                    icon="mdi:phone"
                    value={displayValue(agencyData.phone)}
                  />
                  <ContactRow
                    icon="mdi:web"
                    value={
                      agencyData.website ? (
                        <a
                          href={agencyData.website}
                          className="text-blue-600 hover:underline break-all"
                        >
                          {displayValue(agencyData.website)}
                        </a>
                      ) : (
                        displayValue(agencyData.website)
                      )
                    }
                  />
                </InfoCard>

                <InfoCard
                  icon="mdi:map-marker"
                  title={LABELS.FORM.ADDRESS}
                  className="h-full flex flex-col"
                >
                  <ContactRow
                    icon="mdi:home"
                    value={displayValue(agencyData.address)}
                  />
                  <ContactRow
                    icon="mdi:city"
                    value={displayValue(
                      [agencyData.city, agencyData.state, agencyData.postalCode]
                        .filter(Boolean)
                        .join(", ")
                    )}
                  />
                  <ContactRow
                    icon="mdi:earth"
                    value={
                      agencyData.country
                        ? countries.find(
                            (c) => c._id === displayValue(agencyData.country)
                          )?.name
                        : displayValue(agencyData.country)
                    }
                  />
                </InfoCard>
                <InfoCard
                  icon="mdi:map-marker"
                  title={LABELS.FORM.MAILING_ADDRESS}
                  className="h-full flex flex-col"
                >
                  <ContactRow
                    icon="mdi:home"
                    value={displayValue(agencyData.mailingAddress?.street)}
                  />
                  <ContactRow
                    icon="mdi:city"
                    value={
                      <span className="break-words">
                        {displayValue(
                          [
                            agencyData.mailingAddress?.city,
                            agencyData.mailingAddress?.state,
                            agencyData.mailingAddress?.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        )}
                      </span>
                    }
                  />
                </InfoCard>

                <InfoCard
                  icon="mdi:information"
                  title={STATIC_TEXTS.CASE.ADDITIONAL_DETAILS}
                >
                  <div className="space-y-4">
                    <ContactRow
                      icon="mdi:calendar"
                      value={`Joined: ${
                        agencyData.createdAt
                          ? formatInTimeZone(
                              new Date(agencyData.createdAt),
                              agencyData.timezone || "UTC",
                              "MM/dd/yyyy"
                            )
                          : "Not Provided"
                      }`}
                    />
                    <ContactRow
                      icon={
                        agencyData.organizationType
                          ? "mdi:domain"
                          : "mdi:help-circle-outline"
                      }
                      value={`Type: ${
                        agencyData.organizationType || "Not Provided"
                      }`}
                    />
                    <ContactRow
                      icon="mdi:fax"
                      value={`Fax: ${agencyData.fax || "Not Provided"}`}
                    />
                    {agencyData.officeHours &&
                      agencyData.officeHours.map((hour, index) => {
                        const start = hour.startTime
                          ? format(
                              parse(hour.startTime, "HH:mm", new Date()),
                              "h:mmaaa"
                            )
                          : "N/A";
                        const end = hour.endTime
                          ? format(
                              parse(hour.endTime, "HH:mm", new Date()),
                              " h:mmaaa"
                            )
                          : "N/A";

                        return (
                          <li key={hour._id || index} className="text-gray-700">
                            <span className="font-medium">
                              {start} to {end}
                            </span>
                            {hour.additionalDetails && (
                              <span className="text-xs text-gray-500 italic ml-2">
                                ({hour.additionalDetails})
                              </span>
                            )}
                          </li>
                        );
                      })}
                  </div>
                </InfoCard>

                <InfoCard
                  icon="mdi:text-box"
                  title={STATIC_TEXTS.COMMON.ADD}
                  className="col-span-1 md:col-span-2 xl:col-span-3 p-4 bg-white rounded-lg shadow-sm"
                >
                  <p className="text-gray-600 leading-relaxed">
                    {displayValue(agencyData.about)}
                  </p>
                </InfoCard>
              </>
            ) : (
              <div className="col-span-full text-center text-gray-400 py-8">
                No agency data found.
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow lg:col-span-3">
            <div className="bg-purple/70 text-white px-4 sm:px-6 py-4 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Icon
                  icon="mdi:account-group"
                  width="24"
                  height="24"
                  className="text-white"
                />
                {HEADINGS.AGENTS.TITLE} ({totalAgents + disableCounts} Total)
              </h3>
              {canCreateUserWithRole("Agent") && (
                <button
                  onClick={() => setIsAddAgentModalOpen(true)}
                  className="bg-white text-purple px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 w-full sm:w-auto justify-center cursor-pointer"
                >
                  <Icon icon="mdi:account-plus" width="20" height="20" />
                  <span>
                    {userData?.propertyRole === "Agency Administrator"
                      ? "Request New Agent"
                      : STATIC_TEXTS.AGENCY.ADD_AGENT}
                  </span>
                </button>
              )}
            </div>
            {/* Agent section */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showDisabledAgents}
                  onChange={(e) => {
                    setShowDisabledAgents(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary transition-colors duration-200 accent-purple"
                />
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors duration-200">
                  {STATIC_TEXTS.AGENCY.SHOW_DISABLED} ({disableCounts})
                </span>
              </label>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <Loader width={8} height={8} />
              ) : (
                agents?.map((agent) => (
                  <AdminUserCard
                    key={agent._id}
                    name={agent.firstName + " " + agent?.lastName}
                    email={agent.email}
                    agency={agencyData?.name || ""}
                    phone={agent.phone}
                    altPhone={agent.alternatePhoneNumber}
                    role={agent.propertyRole}
                    profileImage={getBackendUrl(agent.profileImage)}
                    isActive={agent.isActive}
                    actions={
                      <>
                        {canModifyUser(
                          agent.propertyRole as any,
                          agent.userId
                        ) ||
                        (agent.userId === userData?.userId &&
                          canUpdateOwnProfile) ? (
                          <>
                            {/* <Button
                              onClick={() => handleChangePassword(agent)}
                              className="!px-3 !py-1.5 text-sm !rounded !bg-blue-100 !text-blue-700 hover:!bg-blue-200 !border-none"
                              icon="mdi:key-change"
                              label="Change Password"
                            /> */}
                            <Button
                              onClick={() => handleEditAgent(agent)}
                              className=" !px-3 !py-1.5 !text-sm rounded !bg-gray-100 !text-gray-700 hover:!bg-gray-200 !border-none"
                              icon="mdi:pencil"
                              label="Edit Agent"
                            />
                          </>
                        ) : null}
                        {canDeleteUsers &&
                          canModifyUser(
                            agent.propertyRole as any,
                            agent.userId
                          ) && (
                            <Button
                              onClick={() => handleDeleteAgent(agent)}
                              className="!px-3 !py-1.5 !text-sm !rounded !bg-red-100 !text-red-700 hover:!bg-red-200 !border-none disabled:!opacity-50 disabled:!cursor-not-allowed"
                              icon="mdi:delete"
                              disabled={true}
                              label="Delete"
                            />
                          )}
                      </>
                    }
                    disabledBadge={
                      !agent.isActive ? (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded flex items-center gap-1 uppercase">
                          <Icon icon="mdi:account-off" width="14" height="14" />{" "}
                          LOGIN DISABLED
                        </span>
                      ) : undefined
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {agents && agents.length > 0 && (
        <div className="bg-white border-t border-gray-200">
          <PageFooter
            count={agents.length}
            label={`${agents.length} ${LABELS.PAGINATION.OF} ${totalAgents} ${HEADINGS.AGENTS.TITLE}`}
            hasPrevious={currentPage > 1}
            hasNext={currentPage < totalPages}
            onPrevious={handlePrevious}
            onNext={handleNext}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      )}
      <EditAgencyForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => {
          setIsEditModalOpen(false);
          fetchAgency();
          fetchAgents();
        }}
        agencyData={agencyData}
        countries={countries}
      />
      <AddAgentForm
        isOpen={isAddAgentModalOpen}
        onClose={() => setIsAddAgentModalOpen(false)}
        onSave={() => {
          setIsAddAgentModalOpen(false);
          fetchAgents();
        }}
        allowedRolesToAssign={allowedRolesToAssign}
      />
      {selectedAgent && (
        <>
          <ChangePasswordModal
            isOpen={isChangePasswordModalOpen}
            onClose={() => {
              setIsChangePasswordModalOpen(false);
              setSelectedAgent(null);
            }}
            agentData={selectedAgent}
          />

          {(canModifyUser(
            selectedAgent.propertyRole as any,
            selectedAgent.userId
          ) ||
            (selectedAgent.userId === userData?.userId &&
              canUpdateOwnProfile)) &&
            (selectedAgent.propertyRole !== "Network Administrator" ||
              userData?.propertyRole === "Agency Administrator") && (
              <AddAgentForm
                isOpen={isEditAgentModalOpen}
                onClose={() => {
                  setIsEditAgentModalOpen(false);
                  setSelectedAgent(null);
                }}
                onSave={() => {
                  setIsEditAgentModalOpen(false);
                  setSelectedAgent(null);
                  fetchAgents();
                }}
                agentData={selectedAgent}
                allowedRolesToAssign={allowedRolesToAssign}
              />
            )}

          {canDeleteUsers &&
            canModifyUser(
              selectedAgent.propertyRole as any,
              selectedAgent.userId
            ) && (
              <DeleteAgentModal
                isOpen={isDeleteAgentModalOpen}
                onClose={() => setIsDeleteAgentModalOpen(false)}
                onDeleteSuccess={() => {
                  setIsDeleteAgentModalOpen(false);
                  fetchAgents();
                }}
                agentUserId={selectedAgent.userId}
                agentName={
                  selectedAgent.firstName + " " + selectedAgent?.lastName
                }
              />
            )}
        </>
      )}
    </div>
  );
};

export default AgencyDetails;
