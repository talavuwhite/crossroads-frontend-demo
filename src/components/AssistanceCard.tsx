import React, { useState } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import type { Attachment } from "@/types/case";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { STATIC_TEXTS } from "@/utils/textConstants";
import type { GHLUserData } from "@/types/user";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { IconButton } from "@/components/ui/IconButton";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

interface AssistanceCardProps {
  record: Partial<any> & {
    description?: string;
    receivedBy?: string | { _id: string; name: string };
    isPrivate?: boolean;
    author?: string;
    authorOrg?: string;
    content?: string;
    relatedPerson?: string;
    date: string;
    id: string;
    provider?: {
      name: string;
      organization: string;
      agencyName?: string;
    };
    agency?: {
      _id: string;
      name: string;
    };
    type?: string;
    amount?: number;
    attachment?: string | Attachment;
    unit?: string | { _id: string; name: string };
    createdBy?: {
      name: string;
      userId: string;
    };
    service?: {
      _id: string;
      name: string;
      companyId: string;
      companyName: string;
      section: string;
    };
    status?: string | { _id: string; name: string };
    statusHistory?: { date: string; status: string; note?: string }[];
    caseName?: string;
    requestDeadline?: string;
    category?: {
      categoryName?: string;
      sectionName?: string;
    };
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  currentUser?: GHLUserData | null;
  type?: string;
  comesFrom?: string;
  onEditStatusHistory?: (statusIdx: number) => void;
  onEditRequestedAssistance?: (req: any) => void;
  onDeleteRequestedAssistance?: (reqId: string) => void;
  onAddRequestedAssistance?: () => void;
  onUpdateStaus?: () => void;
}

const AssistanceCard: React.FC<AssistanceCardProps> = ({
  record,
  onEdit,
  onDelete,
  currentUser,
  type = "assistance",
  comesFrom,
  onEditStatusHistory = () => {},
  onEditRequestedAssistance = () => {},
  onDeleteRequestedAssistance = () => {},
  onAddRequestedAssistance = () => {},
  onUpdateStaus = () => {},
}) => {
  const { canEditDeleteAssistance, canEditDeleteDocument, currentRole } =
    useRoleAccess();
  const userData = useSelector((state: any) => state.user.data);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isNote = record.author !== undefined && type !== "Alert";
  const location = useLocation();
  const isDocumentMenu = location.pathname.endsWith("documents");

  const formattedDate = record.date
    ? formatDate(
        toZonedTime(record.date, userTimeZone),
        "MM-dd-yyyy 'at' hh:mm a"
      )
    : record?.date;

  const isAttachmentObject =
    typeof record.attachment === "object" &&
    record.attachment !== null &&
    "filename" in record.attachment;

  const isAgent = currentRole === "Agent";
  const isOwnRequestedAssistance = (req: any) =>
    req.createdBy?.userId === userData?.userId;
  const canModify = canEditDeleteAssistance(record.createdBy?.userId);
  const canModifyDocument = canEditDeleteDocument();
  const canShowActions =
    (type === "assistance" && currentUser && canModify) ||
    (type === "referral" && currentUser && canModify) ||
    (type === "Document" && currentUser && canModifyDocument) ||
    (type === "Note" && currentUser && canModify) ||
    (type === "Alert" && currentUser && canModify);
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  const [showRequestedAssistance, setShowRequestedAssistance] = useState(false);

  function formatAmPm(date: Date) {
    let formatted = formatDate(date, "M/d/yyyy 'at' h:mm a");
    formatted = formatted.replace("AM", "a.m.").replace("PM", "p.m.");
    return formatted;
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      toast.error(STATIC_TEXTS.COMMON.FAILED_TO_DOWNLOAD_FILE);
    }
  };

  return (
    <div
      key={record.id}
      className={`rounded-lg shadow-sm border ${
        record.isPrivate
          ? "border-red-300 bg-red-50"
          : type === "referral"
          ? "border-green-200 bg-green-50"
          : "border-purpleLight bg-white"
      } hover:shadow-md transition-shadow duration-200`}
    >
      <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-start gap-3 flex-grow">
          <div className="w-10 h-10 bg-purple/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon
              icon="mdi:account"
              className="text-purple"
              width="20"
              height="20"
            />
          </div>
          <div className="flex-grow">
            <div className="flex items-start flex-col sm:flex-row gap-2">
              <div>
                <h3 className="font-medium text-gray-900">
                  {isNote ? record.author : record.createdBy?.name}
                </h3>
                <Link
                  to={`/agencies/${record.agency?._id}`}
                  className="text-purple text-xs hover:underline"
                >
                  {record.agency?.name}
                </Link>
              </div>
              {(isNote && record.authorOrg) ||
              (!isNote && record.provider?.organization) ? (
                <span
                  className={`text-sm text-pink bg-pink/10 p-2 py-1 rounded-full`}
                >
                  {isNote ? record.authorOrg : record.provider?.organization}
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              <span>{formattedDate}</span>
            </div>

            {!isDocumentMenu && (record.content || record.description) && (
              <div className={`mt-2 text-gray-800 text-base`}>
                {isNote ? record.content : record.description}
              </div>
            )}

            {isDocumentMenu && type === "Document" && record.content && (
              <div className={`mt-2 text-gray-800 text-base`}>
                {record.content}
              </div>
            )}

            {!isNote && record.type && (
              <div className="mt-2 text-sm text-gray-600">
                {record.amount !== undefined && record.amount !== null && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {typeof record.unit === "object" &&
                    record.unit.name === "Dollars"
                      ? "$ " + record.amount
                      : record.amount +
                        " " +
                        (typeof record.unit === "object"
                          ? record.unit.name
                          : record.unit)}
                  </span>
                )}
              </div>
            )}

            {record.relatedPerson && (
              <p className="text-sm text-gray-600 mt-2">
                {isDocumentMenu
                  ? STATIC_TEXTS.DOCUMENTS.UPLOADED_BY + " "
                  : type === "Alert"
                  ? STATIC_TEXTS.ALERTS.ADDED_FOR + " "
                  : !isDocumentMenu
                  ? STATIC_TEXTS.NOTES.NOTE_ADDED_FOR + " "
                  : ""}
                {(type === "Note" || type === "Alert") && !isDocumentMenu && (
                  <span className="text-pink hover:underline font-semibold">
                    {record.relatedPerson ? (
                      <Link to={`/cases/${record.caseId}/alerts`}>
                        {record.relatedPerson}
                      </Link>
                    ) : (
                      record.relatedPerson
                    )}
                  </span>
                )}
                {isDocumentMenu && (
                  <span>
                    <span className="font-semibold">
                      {record.createdBy?.name}
                    </span>{" "}
                    {STATIC_TEXTS.ASSISTANCE.AT}{" "}
                    <Link
                      to={`/agencies/${record.agency?._id}`}
                      className="text-purple hover:underline font-semibold"
                    >
                      {record.agency?.name}
                    </Link>{" "}
                    {STATIC_TEXTS.ASSISTANCE.FOR}{" "}
                    {record.relatedPerson ? (
                      <Link
                        className="text-purple hover:underline font-semibold"
                        to={`/cases/${record.caseId}/alerts`}
                      >
                        {record.relatedPerson}
                      </Link>
                    ) : (
                      record.relatedPerson
                    )}
                  </span>
                )}
                {type !== "Document" && isDocumentMenu && (
                  <span>
                    {" "}
                    {STATIC_TEXTS.ASSISTANCE.ON}{" "}
                    {type === "Note"
                      ? STATIC_TEXTS.NOTES.A_NOTE
                      : type === "Alert"
                      ? ""
                      : type === "Assistance" || type === "Referral"
                      ? STATIC_TEXTS.ASSISTANCE.ASSISTANCE_FOR +
                        " " +
                        record.category?.sectionName +
                        " : " +
                        record.category?.categoryName
                      : type === "Requested Assistance"
                      ? STATIC_TEXTS.ASSISTANCE.A_REQUEST_FOR +
                        " " +
                        record.category?.sectionName +
                        " : " +
                        record.category?.categoryName
                      : ""}
                  </span>
                )}
              </p>
            )}

            {record.isPrivate && (
              <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded mt-2">
                {STATIC_TEXTS.ASSISTANCE.PRIVATE} -{" "}
                {record.provider?.agencyName}
              </span>
            )}
            {!isNote && record.receivedBy && record.type && (
              <p className="text-sm text-gray-600 mt-2">
                {type === "assistance"
                  ? STATIC_TEXTS.ASSISTANCE.RECEIVED_BY
                  : record?.service
                  ? "Referred"
                  : "Requested by"}{" "}
                <span className="text-purple hover:underline">
                  {typeof record.receivedBy === "string" ? (
                    <Link to={`/cases/${record.receivedBy}/alerts`}>
                      {record.caseName}
                    </Link>
                  ) : (
                    <Link to={`/cases/${record.receivedBy._id}/alerts`}>
                      {record.receivedBy.name}
                    </Link>
                  )}
                </span>{" "}
                {record?.service
                  ? STATIC_TEXTS.ASSISTANCE.TO
                  : STATIC_TEXTS.ASSISTANCE.FOR}{" "}
                {record?.service ? (
                  <span className="text-green-700">
                    <Link
                      className="text-purple hover:underline"
                      to={`/agencies/${record.service.companyId}`}
                    >
                      {record.service.companyName}
                    </Link>{" "}
                    {STATIC_TEXTS.ASSISTANCE.FOR}{" "}
                    {record.service.section + " : " + record.service.name} {}{" "}
                  </span>
                ) : (
                  <span className="text-green-700">{record.type}</span>
                )}
              </p>
            )}
          </div>
        </div>

        {!(type === "Note" && comesFrom === "document") && (
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <>
              {canShowActions && (
                <>
                  <IconButton
                    icon="mdi:pencil"
                    label={STATIC_TEXTS.COMMON.EDIT}
                    onClick={() => onEdit(record.id)}
                    colorClass="text-purple hover:text-white hover:bg-purple"
                  />
                  <IconButton
                    icon="mdi:delete"
                    label={STATIC_TEXTS.COMMON.DELETE}
                    onClick={() => onDelete(record.id)}
                    colorClass="text-red-500 hover:text-white hover:bg-red-600"
                  />
                </>
              )}
              {type === "Document" &&
                isAttachmentObject &&
                (record.attachment as Attachment)?.url && (
                  <IconButton
                    icon="mdi:download"
                    label={STATIC_TEXTS.DOCUMENTS.DOWNLOAD}
                    colorClass="text-green-600 hover:text-white hover:bg-green-600"
                    title={STATIC_TEXTS.DOCUMENTS.DOWNLOAD}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      handleDownload(
                        (record.attachment as Attachment).url,
                        (record.attachment as Attachment).filename
                      )
                    }
                  />
                )}
            </>
          </div>
        )}
      </div>

      {/* Attachment section for notes*/}
      {isAttachmentObject && (record.attachment as Attachment).filename && (
        <div className="mt-4 p-3 m-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 uppercase">
              {STATIC_TEXTS.NOTES.ATTACHED_FILES}
            </span>
            <Icon
              icon="mdi:paperclip"
              className="text-gray-500"
              width="16"
              height="16"
            />
          </div>
          <div className="flex items-center gap-2 text-purple-500 hover:text-purple-900 transition-colors cursor-pointer">
            <Icon icon="mdi:file-document-outline" width="20" height="20" />
            <div className="flex-1 overflow-hidden">
              <a
                href={
                  !isDocumentMenu
                    ? (record.attachment as Attachment).url
                    : undefined
                }
                target="_blank"
                rel="noopener noreferrer"
                title={(record.attachment as Attachment).filename}
                className="truncate underline block text-sm"
                onClick={() =>
                  isDocumentMenu &&
                  handleDownload(
                    (record.attachment as Attachment).url,
                    (record.attachment as Attachment).filename
                  )
                }
              >
                {(record.attachment as Attachment).filename}
              </a>
            </div>
          </div>
        </div>
      )}
      {type === "referral" && (
        <div className="bg-purpleLight ">
          <div className="flex text-sm  flex-wrap items-center gap-4 p-3 border-b border-purple/20 bg-white/60">
            <div className="flex items-center gap-2">
              <span className="font-medium text-purple-700">Status :</span>
              <span
                className={`font-medium rounded-full ${
                  (record.status &&
                    typeof record.status === "object" &&
                    record.status.name === "Denied") ||
                  (typeof record.status === "string" &&
                    record.status === "Denied")
                    ? "text-red-600 bg-red-100"
                    : (record.status &&
                        typeof record.status === "object" &&
                        record.status.name === "Approved") ||
                      (typeof record.status === "string" &&
                        record.status === "Approved")
                    ? "text-green-700 bg-green-100"
                    : "text-yellow-700 bg-yellow-100"
                } px-2 py-1 rounded`}
              >
                {record.status && typeof record.status === "object"
                  ? record.status.name
                  : record.status || "-"}
              </span>
            </div>
            {record.requestDeadline && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-purple-700">Due Date :</span>
                <span className="text-gray-800 font-medium">
                  {typeof record.requestDeadline === "string"
                    ? formatDate(
                        toZonedTime(record.requestDeadline, userTimeZone),
                        "EEE, MMM d, yyyy"
                      )
                    : ""}
                </span>
              </div>
            )}
          </div>
          {record.statusHistory && record.statusHistory.length > 0 && (
            <div className="p-4 bg-white border-t border-purple/10">
              <button
                className="flex items-center gap-2 text-purple-700 font-semibold mb-2 focus:outline-none"
                onClick={() => setShowStatusHistory((prev) => !prev)}
              >
                <Icon
                  icon={
                    showStatusHistory ? "mdi:chevron-down" : "mdi:chevron-right"
                  }
                  width="20"
                  height="20"
                />
                <span>{STATIC_TEXTS.REFERRALS.STATUS_HISTORY}</span>
              </button>
              {showStatusHistory && (
                <ol className="relative border-l border-purple/20 pl-4 space-y-4">
                  {record.statusHistory.map((item: any, idx: number) => (
                    <li key={idx} className="relative group">
                      <span className="absolute -left-[7.5px] top-[10px] w-2 h-2 rounded-full bg-purple" />
                      <div className="flex ml-2 flex-col sm:flex-row sm:justify-between sm:items-center w-full">
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">
                            <span>Changed status to </span>
                            <span
                              className={`font-medium   ${
                                item.statusName === "Denied"
                                  ? "text-red-600 "
                                  : item.statusName === "Approved"
                                  ? "text-green-700 "
                                  : "text-yellow-700 "
                              }`}
                            >
                              {item.statusName}
                            </span>{" "}
                            {item.statusNotes && (
                              <span> - {item.statusNotes}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-800">
                            Updated by{" "}
                            <span className="text-purple font-medium">
                              {item.updatedBy?.name}
                            </span>
                            {(item?.company?.companyName ||
                              item?.company?.locationName) && (
                              <span>
                                {" "}
                                at{" "}
                                <Link
                                  to={`/agencies/${
                                    item?.company?.companyId
                                      ? item?.company?.companyId
                                      : item?.company?.locationId
                                  }`}
                                  className="text-purple hover:underline font-medium"
                                >
                                  {item?.company?.companyName ||
                                    item?.company?.locationName}
                                </Link>
                              </span>
                            )}
                            {item.updatedAt && (
                              <span className="text-xs text-gray-500">
                                -{" "}
                                {formatAmPm(
                                  toZonedTime(item.updatedAt, userTimeZone)
                                )}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {!isAgent ||
                          (isAgent && isOwnRequestedAssistance(item)) ? (
                            <IconButton
                              icon="mdi:pencil"
                              label={STATIC_TEXTS.REFERRALS.UPDATE_STATUS}
                              onClick={() => onEditStatusHistory(idx)}
                              colorClass="text-purple hover:text-white hover:bg-purple"
                            />
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
          {record.requestedAssistance &&
            record.requestedAssistance.length > 0 && (
              <div className="p-4 border-t border-purple/10 bg-white">
                <button
                  className="flex items-center gap-2 text-purple-700 font-semibold mb-2 focus:outline-none"
                  onClick={() => setShowRequestedAssistance((prev) => !prev)}
                >
                  <Icon
                    icon={
                      showRequestedAssistance
                        ? "mdi:chevron-down"
                        : "mdi:chevron-right"
                    }
                    width="20"
                    height="20"
                  />
                  <span>{STATIC_TEXTS.REFERRALS.REQUESTED_ASSISTANCE}</span>
                </button>
                {showRequestedAssistance && (
                  <div className="space-y-3">
                    {record.requestedAssistance.map((req: any) => (
                      <div
                        key={req._id}
                        className="p-3 border border-gray-200 rounded-md hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {typeof req.unit === "object" &&
                            req.unit.name === "Dollars"
                              ? "$ " + req.amount
                              : req.amount +
                                " " +
                                (typeof req.unit === "object"
                                  ? req.unit.name
                                  : req.unit)}
                          </span>
                          <span className="text-sm text-gray-800 ml-2">
                            {req.description}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            Provided by{" "}
                            <span className="text-purple font-medium">
                              {req.createdBy.firstName} {req.createdBy.lastName}
                            </span>{" "}
                            {(req?.company?.companyName ||
                              req?.company?.locationName) && (
                              <span>
                                {" "}
                                at{" "}
                                <Link
                                  to={`/agencies/${
                                    req?.company?.companyId
                                      ? req?.company?.companyId
                                      : req?.company?.locationId
                                  }`}
                                  className="text-purple hover:underline font-medium"
                                >
                                  {req?.company?.companyName ||
                                    req?.company?.locationName}
                                </Link>
                              </span>
                            )}
                            {req.updatedAt && (
                              <span className="text-xs text-gray-500">
                                {""} -{" "}
                                {formatAmPm(
                                  toZonedTime(req.updatedAt, userTimeZone)
                                )}
                              </span>
                            )}
                          </p>
                          {req.attachedFile && (
                            <a
                              href={req.attachedFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center mt-2 text-purple hover:underline text-sm"
                            >
                              📎 {req.attachedFile.filename}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-4">
                          {/* Agent can only edit/delete their own requested assistance */}
                          {!isAgent ||
                          (isAgent && isOwnRequestedAssistance(req)) ? (
                            <>
                              <IconButton
                                icon="mdi:pencil"
                                label={
                                  STATIC_TEXTS.REFERRALS
                                    .ADD_REQUESTED_ASSISTANCE
                                }
                                onClick={() => onEditRequestedAssistance(req)}
                                colorClass="text-purple hover:text-white hover:bg-purple"
                              />
                              <IconButton
                                icon="mdi:delete"
                                label={STATIC_TEXTS.COMMON.DELETE}
                                onClick={() =>
                                  onDeleteRequestedAssistance(req._id)
                                }
                                colorClass="text-red-500 hover:text-white hover:bg-red-600"
                              />
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          <div className="flex gap-4 p-3">
            <button
              className="text-pink hover:underline font-medium text-sm"
              onClick={onUpdateStaus}
              disabled={isAgent && type !== "referral"}
            >
              {STATIC_TEXTS.REFERRALS.UPDATE_STATUS}
            </button>
            <span className="text-gray-400 italic">
              {STATIC_TEXTS.REFERRALS.OR}
            </span>
            <button
              className="text-pink hover:underline font-medium text-sm"
              onClick={onAddRequestedAssistance}
            >
              {STATIC_TEXTS.REFERRALS.ADD_REQUESTED_ASSISTANCE}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistanceCard;
