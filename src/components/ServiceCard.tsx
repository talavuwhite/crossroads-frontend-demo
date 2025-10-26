import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "@/components/ui/Button";

export type ServiceCardData = {
  _id: string;
  name: string;
  description?: string;
  taxonomyCode?: string;
  providedBy?: string | { name: string; link?: string };
  companyName?: string;
};

interface ServiceCardProps {
  service: ServiceCardData;
  onEdit?: (service: ServiceCardData) => void;
  onDelete?: (service: ServiceCardData) => void;
  showActions?: boolean;
  className?: string;
  isServicePage?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  showActions = false,
  className = "",
  isServicePage = false,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 sm:p-5 my-2 flex flex-col gap-2 w-full max-w-full ${className}`}
    >
      <div
        className={`flex gap-3 ${
          showActions
            ? "flex-col-reverse sm:flex-row items-stretch sm:items-start"
            : "flex-row items-start"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-green-600 flex-shrink-0">
                <Icon icon="mdi:tree" width="20" height="20" />
              </span>
              <h3 className="text-gray-900 font-semibold mb-1 truncate text-base sm:text-lg">
                {service.name}
              </h3>
            </div>
            {showActions && (
              <div className="flex flex-row items-center gap-2">
                {onEdit && (
                  <Button
                    onClick={() => onEdit(service)}
                    icon="mdi:pencil"
                    aria-label="Edit Service"
                    className="p-2 !px-2 !border-transparent !rounded-full !text-purple hover:!text-white hover:!bg-purple"
                  />
                )}
                {onDelete && (
                  <Button
                    onClick={() => onDelete(service)}
                    icon="mdi:delete"
                    className="p-2 !px-2 !border-transparent !rounded-full !text-primary hover:!text-white hover:!bg-primary"
                  />
                )}
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
            {service.description?.trim() || "No description provided"}
          </p>

          {service.taxonomyCode && (
            <div className="text-xs text-gray-500 mb-1">
              <span className="font-medium text-pink">Taxonomy Code</span> —{" "}
              {service.taxonomyCode}
            </div>
          )}
          {isServicePage && service.providedBy && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Provided by</span>{" "}
              {typeof service.providedBy === "object" ? (
                service.providedBy.link ? (
                  <a
                    href={service.providedBy.link}
                    className="text-pink"
                    rel="noopener noreferrer"
                  >
                    {service.providedBy.name}
                  </a>
                ) : (
                  <span className="ml-1 text-pink">
                    {service.providedBy.name}
                  </span>
                )
              ) : (
                <span className="ml-1 text-pink">{service.providedBy}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
