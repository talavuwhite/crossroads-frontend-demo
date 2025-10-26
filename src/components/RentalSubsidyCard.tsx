import React from "react";
import { Icon } from "@iconify-icon/react";
import Button from "@/components/ui/Button";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface RentalSubsidyCardProps {
  title: string;
  data: any;
  onEdit: () => void;
  onDelete: () => void;
  onAddDocument: () => void;
  onDeleteDocument: (documentId: string) => void;
}

const formatCurrency = (value: number | string) => {
  if (value === undefined || value === null || value === "") return "N/A";
  return `${Number(value).toLocaleString()}`;
};

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const formatDate = (date: string) => {
  if (!date) return "N/A";
  return format(toZonedTime(date, userTimeZone), "MM-dd-yyyy");
};

const sectionTitle = (icon: string, text: string) => (
  <span className="flex items-center gap-2 text-lg font-semibold text-purple mb-2">
    <Icon icon={icon} className="text-purple" width={22} height={22} /> {text}
  </span>
);

export const Divider = () => <div className="my-4 border-t border-gray-200" />;

const getDocumentUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = process.env.VITE_APP_BACKEND_URL || "";
  // Remove trailing slash from base if present
  const cleanBase = base.replace(/\/$/, "");
  // Ensure url starts with /
  const cleanUrl = url.startsWith("/") ? url : "/" + url;
  return cleanBase + cleanUrl;
};

const RentalSubsidyCard: React.FC<RentalSubsidyCardProps> = ({
  title,
  data,
  onEdit,
  onDelete,
  onAddDocument,
  onDeleteDocument,
}) => {
  const { canManageRentalSubsidyRecord, canViewRentalSubsidy } =
    useRoleAccess();
  const canManageRecord = canManageRentalSubsidyRecord(data);

  if (!canViewRentalSubsidy) {
    return null; // Don't render anything if user can't view
  }

  return (
    <div className="bg-white rounded-lg shadow p-0 mb-6 border border-purple-200 overflow-hidden">
      <div className="flex flex-wrap justify-between items-center px-6 py-4 bg-purpleLight border-b border-purple-100">
        <h3 className="text-xl font-bold text-purple flex items-center gap-2">
          <Icon
            icon="mdi:home-city"
            className="text-purple"
            width={26}
            height={26}
          />
          {title}
        </h3>
        {canManageRecord && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onEdit}
              icon="mdi:pencil"
              className="p-2 !px-2 !border-transparent !rounded-full !text-purple hover:!text-white hover:!bg-purple"
            />
            <Button
              onClick={onDelete}
              icon="mdi:delete"
              className="p-2 !px-2 !border-transparent !rounded-full !text-primary hover:!text-white hover:!bg-primary"
            />
          </div>
        )}
      </div>
      <div className="px-6 py-4">
        {sectionTitle("mdi:home-outline", "Rental Details")}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-2">
          <div className="text-gray-800">
            <b className="text-pink">Property Address :</b>{" "}
            {data.propertyAddress || "N/A"}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Agency Name :</b>{" "}
            {data.agencyName || "N/A"}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Rent Amount :</b>{" "}
            {formatCurrency(data.rentAmount)}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Past Due Amount :</b>{" "}
            {formatCurrency(data.dueAmount)}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Payable Amount :</b>{" "}
            {formatCurrency(data.payableAmount)}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Rent Due Date :</b>{" "}
            {formatDate(data.rentDueDate)}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Last Payment Date :</b>{" "}
            {formatDate(data.lastPaymentDate)}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Payment Status :</b>{" "}
            {data.paymentStatus || "N/A"}
          </div>
        </div>
        <Divider />
        {sectionTitle("mdi:cash-multiple", "Subsidy Details")}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-2">
          <div className="text-gray-800">
            <b className="text-pink">Subsidy Type :</b>{" "}
            {data.subsidyType || "N/A"}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Subsidy Amount :</b>{" "}
            {formatCurrency(data.subsidyAmount)}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Subsidy Status :</b>{" "}
            {data.subsidyStatus || "N/A"}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Lease Start Date :</b>{" "}
            {formatDate(data.leaseStartDate)}
          </div>
          <div className="text-gray-800">
            <b className="text-pink">Lease End Date :</b>{" "}
            {formatDate(data.leaseEndDate)}
          </div>
        </div>
        <Divider />
        <div className="flex justify-between flex-wrap">
          {sectionTitle("mdi:paperclip", "Documents")}
          {canManageRecord && (
            <Button
              onClick={onAddDocument}
              icon="mdi:plus"
              variant="submitStyle"
              label="Add Document"
              className="ml-4"
            />
          )}
        </div>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {data.documents && data.documents.length > 0 ? (
              <ul className="list-disc ml-6 space-y-1">
                {data.documents.map((doc: any) => (
                  <li
                    key={doc._id}
                    className="flex items-center my-2 mx-2 rounded-lg justify-between group hover:bg-purpleLight"
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="mdi:file-document-outline"
                        className="text-gray-500"
                        width={18}
                        height={18}
                      />
                      <a
                        href={getDocumentUrl(doc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                        download
                        title={`Download ${doc.name}`}
                      >
                        {doc.name}
                      </a>
                    </div>
                    {canManageRecord && (
                      <Button
                        onClick={() => onDeleteDocument(doc._id)}
                        className="!text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity !p-2 !bg-red-500 !border-none !rounded-full"
                        title="Delete document"
                        icon="mdi:delete"
                      />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500">No documents</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalSubsidyCard;
