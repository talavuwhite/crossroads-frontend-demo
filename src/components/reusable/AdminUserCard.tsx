import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { getBackendUrl } from "@/utils/commonFunc";

interface AdminUserCardProps {
  name: string;
  email: string;
  agency?: string;
  phone?: string;
  altPhone?: string;
  role?: string;
  profileImage?: string;
  isActive?: boolean;
  actions?: React.ReactNode;
  disabledBadge?: React.ReactNode;
}

const AdminUserCard: React.FC<AdminUserCardProps> = ({
  name,
  email,
  agency,
  phone,
  altPhone,
  role,
  profileImage,
  isActive = true,
  actions,
  disabledBadge,
}) => {
  return (
    <div
      className={`p-4 sm:p-6 transition-all duration-300 hover:bg-gray-50 ${
        !isActive ? "bg-red-50 hover:bg-red-100" : ""
      }`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-purple/20 rounded-full flex items-center justify-center flex-shrink-0">
            {profileImage ? (
              <img
                src={getBackendUrl(profileImage)}
                alt={name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <Icon
                icon="mdi:account"
                className="text-purple"
                width="24"
                height="24"
              />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h4 className="text-lg font-medium text-gray-900 truncate">
              {name}
              {agency && (
                <span className="text-sm font-normal text-gray-500">
                  {" "}
                  from{" "}
                  <span className="text-pink text-sm font-medium">
                    {agency}
                  </span>
                </span>
              )}
            </h4>
            <p className="text-gray-600 truncate">{email}</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1 text-sm">
              {phone && (
                <span className="text-gray-500 truncate">
                  Phone: {phone}
                  {altPhone && ` / ${altPhone}`}
                </span>
              )}
              {role && <span className="text-gray-500">Role: {role}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          {actions}
          {!isActive &&
            (disabledBadge || (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded flex items-center gap-1 uppercase">
                <Icon icon="mdi:account-off" width="14" height="14" /> LOGIN
                DISABLED
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUserCard;
