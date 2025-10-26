import React, { useState, useEffect } from "react";
import PageFooter from "@components/PageFooter";
import SearchBar from "@components/SearchBar";
import AlphabetFilter from "@components/AlphabetFilter";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import ChangePasswordModal from "@components/modals/ChangePasswordModal";
import { useSelector } from "react-redux";
import { getUsers } from "@services/UserApi";
import type { RootState } from "@/redux/store";
import type { UserData } from "@/types/user";
import { toast } from "react-toastify";
import AdminUserCard from "@components/reusable/AdminUserCard";
import Button from "@/components/ui/Button";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import Loader from "@/components/ui/Loader";
import { CASES_PER_PAGE } from "@/utils/constants";
import AddAgentForm from "@components/modals/AddAgentForm";
import DeleteAgentModal from "@components/modals/DeleteAgentModal";
import { getBackendUrl } from "@/utils/commonFunc";

const Agents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<UserData | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isEditAgentModalOpen, setIsEditAgentModalOpen] = useState(false);
  const [isDeleteAgentModalOpen, setIsDeleteAgentModalOpen] = useState(false);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [agents, setAgents] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const {
    canUpdateUsers,
    canDeleteUsers,
    canModifyUser,
    canUpdateOwnProfile,
    allowedRolesToAssign,
  } = useRoleAccess();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAgents = async () => {
    if (!userData?.userId) {
      toast.error("Please login with valid credentials");
      return;
    }
    setLoading(true);
    try {
      const response = await getUsers(
        page,
        CASES_PER_PAGE,
        userData.userId,
        userData.activeLocation,
        searchTerm,
        selectedLetter ?? undefined
      );
      setAgents(response.users || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [
    userData?.activeLocation,
    userData?.userId,
    page,
    searchTerm,
    selectedLetter,
  ]);

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
      agent.activeLocation !== userData?.activeLocation &&
      agent.companyId !== userData?.companyId
    ) {
      toast.error("Can only modify users within your sub-agency");
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
    if (
      userData?.propertyRole === "Agency Administrator" &&
      (agent.activeLocation !== userData?.activeLocation ||
        agent.companyId !== userData?.companyId)
    ) {
      toast.error("Can only modify users within your sub-agency");
      return;
    }
    setSelectedAgent(agent);
    setIsDeleteAgentModalOpen(true);
  };

  // const handleChangePassword = (agent: UserData) => {
  //   if (agent.userId !== userData?.userId && !canUpdateUsers) {
  //     toast.error(
  //       "You don't have permission to change passwords for other users"
  //     );
  //     return;
  //   }

  //   setSelectedAgent(agent);
  //   setIsChangePasswordModalOpen(true);
  // };

  return (
    <div className="flex bg-gray-100 flex-col h-full">
      <div className="flex-1  overflow-auto">
        <div className="mb-6">
          <div className="mb-6">
            <div className="bg-white p-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
                  <Icon
                    icon="mdi:user"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-pink">Agents</h1>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 px-4 sm:px-6 gap-4">
            <div className="col-span-12 lg:col-span-4 min-w-[240px]">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search agents..."
                className="w-full"
              />
            </div>
            <div className="col-span-12 lg:col-span-8 flex">
              <div className="w-full overflow-x-auto custom-scrollbar mobile-scrollbar-hide">
                <div className="min-w-max">
                  <AlphabetFilter
                    selectedLetter={selectedLetter}
                    onLetterSelect={setSelectedLetter}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 p-4 sm:p-6 lg:grid-cols-2 gap-4 mb-4">
          {loading ? (
            <div className="col-span-full p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm">
              <Loader width={3} height={3} />
            </div>
          ) : agents.length === 0 ? (
            <div className="col-span-full p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm">
              No agents found matching your criteria
            </div>
          ) : (
            agents.map((agent, index) => (
              <div
                key={agent.userId || index}
                className="bg-white rounded-lg shadow-sm hover:shadow transition-shadow duration-200"
              >
                <AdminUserCard
                  key={agent._id}
                  name={agent.firstName + " " + agent?.lastName}
                  email={agent.email}
                  agency={
                    agent.company?.locationName ||
                    agent.company?.companyName ||
                    (Array.isArray(agent.locations) &&
                    agent.locations.length > 0
                      ? typeof agent.locations[0] === "string"
                        ? agent.locations[0]
                        : (agent.locations[0] as any)?.name
                      : undefined)
                  }
                  phone={agent.phone}
                  role={agent.propertyRole}
                  profileImage={getBackendUrl(agent.profileImage)}
                  isActive={agent.isActive}
                  actions={
                    <>
                      {(canModifyUser(
                        agent.propertyRole as any,
                        agent.userId
                      ) ||
                        (agent.userId === userData?.userId &&
                          canUpdateOwnProfile)) &&
                      !(
                        userData?.propertyRole === "Agency Administrator" &&
                        (agent.activeLocation !== userData?.activeLocation ||
                          agent.companyId !== userData?.companyId)
                      ) ? (
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
                        ) &&
                        !(
                          userData?.propertyRole === "Agency Administrator" &&
                          (agent.activeLocation !== userData?.activeLocation ||
                            agent.companyId !== userData?.companyId)
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
                />
              </div>
            ))
          )}
        </div>
      </div>

      {agents?.length !== 0 && (
        <div className="bg-white border-t border-[#E5E7EB]">
          <PageFooter
            count={agents.length}
            label="Agents"
            currentPage={page}
            totalPages={totalPages}
            hasPrevious={page > 1}
            hasNext={page < totalPages}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      )}

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
              canUpdateOwnProfile)) && (
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

export default Agents;
