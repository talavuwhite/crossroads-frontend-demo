import React, { useMemo, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import AdminUserCard from "@/components/reusable/AdminUserCard";
import EditNetworkSettingsModal from "@/components/modals/EditNetworkSettingsModal";
import EditAgencyForm from "@/components/EditAgencyForm";
import PovertyGuidelinesModal from "@/components/modals/ProvertyModal";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  createSubAgency,
  getNetworkAdministrators,
} from "@/services/AgencyApi";
import { toast } from "react-toastify";
import type { NetworkAdministrator } from "@/types/agency";
import ChangePasswordModal from "@/components/modals/ChangePasswordModal";
import AddAgentForm from "@/components/modals/AddAgentForm";
import Loader from "@/components/ui/Loader";
import { getCountries } from "@/services/CountryApi";
import type { Country } from "@/types";
import { getBackendUrl } from "@/utils/commonFunc";

const AdminSettings: React.FC = () => {
  const { currentRole } = useRoleAccess();
  const [showDisabled, setShowDisabled] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddAgencyModalOpen, setIsAddAgencyModalOpen] = useState(false);
  const [isPovertyModalOpen, setIsPovertyModalOpen] = useState(false);
  const { data: user } = useSelector((state: RootState) => state?.user);
  const [admins, setAdmins] = useState<NetworkAdministrator[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [selectedAdmin, setSelectedAdmin] =
    useState<NetworkAdministrator | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);

  if (currentRole !== "Network Administrator") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const fetchCountries = async () => {
    if (!user?.userId) {
      return toast.error("User authentication missing");
    }
    try {
      const countryList = await getCountries(user.userId, user.activeLocation);
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

  const fetchAdmins = async () => {
    if (!user?.companyId || !user?.userId) return;
    setLoadingAdmins(true);
    setAdminError(null);
    try {
      const res = await getNetworkAdministrators(user.companyId, user.userId);
      setAdmins(res.data.networkAdministrators || []);
    } catch (err: any) {
      setAdminError(err?.toString() || "Failed to load admins");
    } finally {
      setLoadingAdmins(false);
    }
  };
  useEffect(() => {
    fetchAdmins();
  }, [user?.companyId, user?.userId]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => admin.isActive || showDisabled);
  }, [admins, showDisabled]);

  const handleAddAgency = async (data: any) => {
    try {
      if (!user || !user.userId) {
        throw new Error("User authentication or location data missing");
      }
      const payload = {
        companyId: user?.companyId,
        ...data,
      };
      await createSubAgency(payload, user?.userId);
      toast.success("Agency Created successfully.");
      setIsAddAgencyModalOpen(false);
    } catch (error: any) {
      toast.error(error);
      console.error("Error for creating agency records:", error);
    }
  };

  const handleEditAdmin = (admin: NetworkAdministrator) => {
    setSelectedAdmin(admin);
    setIsEditAdminModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 bg-gray-100 overflow-auto">
          <div className="bg-white p-5 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full flex items-center justify-center">
                  <Icon
                    icon="mdi:account-cog"
                    className="text-purple"
                    width={32}
                    height={32}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-pink transition-colors duration-300">
                    Network Administrator
                  </h1>
                  <p className="text-gray-600">
                    Manage network administrators, security, and backups
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:gap-3 lg:items- justify-end mt-4 lg:mt-0">
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  label="Edit Network Settings"
                  icon="mdi:pencil"
                  variant="submitStyle"
                  className="!bg-pink hover:!bg-pink-700 !text-white !font-semibold !px-6 !py-2 w-full sm:w-auto"
                />
                {/* <Button
                  onClick={() => setIsPovertyModalOpen(true)}
                  label="Poverty Guidelines"
                  icon="mdi:book-open-page-variant"
                  variant="default"
                  className="!bg-white hover:!bg-purple-100 !text-purple border border-purple !font-semibold !px-6 !py-2 w-full sm:w-auto"
                /> */}
                <Button
                  onClick={() => {
                    setIsAddAgencyModalOpen(true);
                  }}
                  label="Add New Agency"
                  icon="mdi:plus"
                  variant="infoStyle"
                  className="!bg-purple !text-white hover:!bg-purple-700 !font-semibold !px-6 !py-2 w-full sm:w-auto"
                />
              </div>
            </div>
          </div>

          {/* Admins Section */}
          <div className="mx-auto p-4 sm:p-6">
            <div className="bg-white rounded-lg shadow lg:col-span-3">
              <div className="bg-purple/70 text-white px-4 sm:px-6 py-4 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Icon
                    icon="mdi:account-group"
                    width="24"
                    height="24"
                    className="text-white"
                  />
                  Network Administrators
                </h3>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showDisabled}
                    onChange={(e) => setShowDisabled(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary transition-colors duration-200 accent-pink"
                  />
                  <span className="text-white group-hover:text-gray-200 transition-colors duration-200">
                    Show Disabled Admins (
                    {admins.filter((a) => !a.isActive).length})
                  </span>
                </label>
              </div>
              {adminError && (
                <div className="text-red-500 p-4">{adminError}</div>
              )}
              {loadingAdmins ? (
                <div className="p-4">
                  <Loader width={3} height={3} />
                </div>
              ) : (
                filteredAdmins.map((admin) => (
                  <AdminUserCard
                    key={admin._id}
                    name={admin.name}
                    email={admin.email}
                    agency={
                      admin.company?.locationName ||
                      admin.company?.companyName ||
                      "N/A"
                    }
                    phone={admin.phone}
                    role={admin.propertyRole}
                    altPhone={admin.altPhone}
                    profileImage={getBackendUrl(admin.profileImage)}
                    isActive={admin.isActive !== false}
                    actions={
                      <>
                        {/* <Button
                          onClick={() => handleChangePassword(admin)}
                          className="!px-3 !py-1.5 text-sm !rounded !bg-blue-100 !text-blue-700 hover:!bg-blue-200 !border-none"
                          icon="mdi:key-change"
                          label="Change Password"
                        /> */}
                        <Button
                          onClick={() => handleEditAdmin(admin)}
                          className=" !px-3 !py-1.5 !text-sm rounded !bg-gray-100 !text-gray-700 hover:!bg-gray-200 !border-none"
                          icon="mdi:pencil"
                          label="Edit Agent"
                        />
                        <Button
                          onClick={() => {}}
                          className="!px-3 !py-1.5 !text-sm !rounded !bg-red-100 !text-red-700 hover:!bg-red-200 !border-none disabled:!opacity-50 disabled:!cursor-not-allowed"
                          icon="mdi:delete"
                          disabled={true}
                          label="Delete"
                        />
                      </>
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <EditNetworkSettingsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <EditAgencyForm
        isOpen={isAddAgencyModalOpen}
        onClose={() => {
          setIsAddAgencyModalOpen(false);
        }}
        onSave={handleAddAgency}
        countries={countries}
      />

      <PovertyGuidelinesModal
        isOpen={isPovertyModalOpen}
        onClose={() => setIsPovertyModalOpen(false)}
        onSave={(values) => console.log("Saved poverty guidelines:", values)}
      />

      {selectedAdmin && (
        <>
          <ChangePasswordModal
            isOpen={isChangePasswordModalOpen}
            onClose={() => {
              setIsChangePasswordModalOpen(false);
              setSelectedAdmin(null);
            }}
            agentData={{ ...selectedAdmin, _id: selectedAdmin._id }}
          />
          <AddAgentForm
            isOpen={isEditAdminModalOpen}
            onClose={() => {
              setIsEditAdminModalOpen(false);
              setSelectedAdmin(null);
            }}
            onSave={() => {
              setIsEditAdminModalOpen(false);
              setSelectedAdmin(null);
              fetchAdmins();
            }}
            agentData={{ ...selectedAdmin, _id: selectedAdmin._id }}
          />
        </>
      )}
    </>
  );
};

export default AdminSettings;
