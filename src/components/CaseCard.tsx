import type { CaseType } from "@/types/case";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaPhone,
  FaEnvelope,
  FaBirthdayCake,
  FaIdCard,
} from "react-icons/fa";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface CaseCardProps {
  case: CaseType;
}

export const CaseCard: React.FC<CaseCardProps> = ({ case: caseData }) => {
  const fullName = [caseData.firstName, caseData.middleName, caseData.lastName]
    .filter(Boolean)
    .join(" ");

  const fullAddress = [
    caseData.streetAddress?.address,
    caseData.streetAddress?.apt,
    caseData.streetAddress?.city,
    caseData.streetAddress?.state,
    caseData.streetAddress?.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const firstPhoneNumber =
    caseData.phoneNumbers && caseData.phoneNumbers?.length > 0
      ? caseData.phoneNumbers[0].number
      : null;

  return (
    <Link
      to={`/cases/${caseData._id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 ">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="mdi:user"
                className="text-purple"
                width="24"
                height="24"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
          </div>
          {caseData.headOfHousehold && (
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Head of Household
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm text-gray-600">
          {fullAddress && (
            <div className="flex items-center space-x-2">
              <FaHome className="text-gray-400" />
              <span>{fullAddress}</span>
            </div>
          )}

          {caseData.email && (
            <div className="flex items-center space-x-2 break-all">
              <FaEnvelope className="text-gray-400" />
              <span>{caseData.email}</span>
            </div>
          )}

          {!caseData.email && firstPhoneNumber && (
            <div className="flex items-center space-x-2">
              <FaPhone className="text-gray-400" />
              <span>{firstPhoneNumber}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {caseData.dateOfBirth && (
              <div className="flex items-center space-x-2">
                <FaBirthdayCake className="text-gray-400" />
                <span>
                  {caseData.dateOfBirth
                    ? (() => {
                        const userTimeZone =
                          Intl.DateTimeFormat().resolvedOptions().timeZone;
                        return formatDate(
                          toZonedTime(caseData.dateOfBirth, userTimeZone),
                          "MM-dd-yyyy"
                        );
                      })()
                    : "Not Provided"}
                </span>
              </div>
            )}
            {caseData.ssn && (
              <div className="flex items-center space-x-2">
                <FaIdCard className="text-gray-400" />
                <span>{caseData.ssn}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
