import React, { useState } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import AddCaseModal from "@components/modals/AddCaseModal";
import Loader from "@components/ui/Loader";
import { HEADINGS, STATIC_TEXTS } from "@utils/textConstants";
import { formatCaseHistoryChange } from "@utils/caseHistoryFormatter";
import { HISTORY_PAGE_SIZE } from "@/utils/constants";
import { calculateNetIncome } from "@/utils/commonFunc";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { Link } from "react-router-dom";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const PersonalInfo: React.FC = () => {
  const [isEditCaseModalOpen, setIsEditCaseModalOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(HISTORY_PAGE_SIZE);
  const { data: caseData, loading } = useSelector(
    (state: RootState) => state.case
  );

  const handleViewMore = () => {
    setDisplayCount((prevCount) => prevCount + HISTORY_PAGE_SIZE);
  };

  const handleLessMore = () => {
    setDisplayCount(HISTORY_PAGE_SIZE);
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

  const fullName =
    [caseData.firstName, caseData.middleName, caseData.lastName]
      .filter(Boolean)
      .join(" ") || "Not Provided";

  const streetAddress =
    (caseData?.streetAddress &&
      [
        caseData.streetAddress.address,
        caseData.streetAddress.apt,
        caseData.streetAddress.city,
        caseData.streetAddress.state,
        caseData.streetAddress.zip,
      ]
        .filter(Boolean)
        .join(", ")) ||
    "Not Provided";

  const mailingAddress =
    (caseData?.mailingAddress &&
      [
        caseData.mailingAddress.address,
        caseData.mailingAddress.apt,
        caseData.mailingAddress.city,
        caseData.mailingAddress.state,
        caseData.mailingAddress.zip,
      ]
        .filter(Boolean)
        .join(", ")) ||
    "Not Provided";

  const netIncome = calculateNetIncome(
    caseData.incomeSources,
    caseData.expenses
  );

  const grossYearly = (caseData.incomeSources || []).reduce((sum, income) => {
    if (!income) return sum;
    const amount =
      typeof income.amount === "number"
        ? income.amount
        : parseFloat(income.amount as string) || 0;
    // Use the same interval logic as calculateNetIncome
    switch ((income.interval || "").toLowerCase()) {
      case "weekly":
        return sum + amount * 52;
      case "monthly":
        return sum + amount * 12;
      case "quarterly":
        return sum + amount * 4;
      case "yearly":
        return sum + amount;
      default:
        return sum + amount;
    }
  }, 0);
  const grossMonthly = grossYearly / 12;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
        <div className="bg-white p-5 md:pl-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 border-b border-gray-200">
          <div className="flex flex-row justify-start items-center gap-4">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="mdi:person"
                className="text-purple"
                width="30"
                height="30"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-pink text-wrap">
                {HEADINGS.PERSONAL_INFO.TITLE} for {fullName}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsEditCaseModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple rounded-lg hover:bg-purple/90 transition-colors duration-200"
            >
              <Icon icon="mdi:pencil" width="20" height="20" />
              {STATIC_TEXTS.COMMON.EDIT + " Case"}
            </button>
          </div>
        </div>

        {/* Privacy Message */}
        {caseData.visibleTo === "Agency Only" && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center gap-3">
              <Icon
                icon="mdi:lock"
                className="text-red-600 flex-shrink-0"
                width="20"
                height="20"
              />
              <div>
                <p className="text-red-800 font-medium text-sm">
                  Private Case - My Agency
                </p>
                <p className="text-red-700 text-xs">
                  This case is only visible to{" "}
                  {caseData.caseCompanyInfo?.companyName ||
                    caseData.caseCompanyInfo?.locationName ||
                    "the agency"}
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm col-span-2 lg:col-span-1">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
                  <Icon
                    icon="mdi:contact-phone"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                  {STATIC_TEXTS.CASE.CONTACT_INFO}
                </h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-start gap-2">
                    <Icon
                      icon="mdi:map-marker"
                      className="text-purple/70 flex-shrink-0 mt-1"
                      width="20"
                      height="20"
                    />
                    <div className="w-0 min-w-0 flex-1">
                      <p>{streetAddress}</p>
                      <p>{caseData?.streetAddress?.county || "Not Provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon
                      icon="mdi:email"
                      className="text-purple/70 flex-shrink-0 mt-1"
                      width="20"
                      height="20"
                    />
                    <div className="w-0 min-w-0 flex-1">
                      <p>Mailing: {mailingAddress}</p>
                    </div>
                  </div>
                  {caseData.phoneNumbers && caseData.phoneNumbers.length > 0 ? (
                    caseData.phoneNumbers.map((phone, index) =>
                      phone?.description && phone?.number ? (
                        <div key={index} className="flex items-center gap-2">
                          <Icon
                            icon="mdi:phone"
                            className="text-purple/70"
                            width="20"
                          />
                          <span className="w-0 min-w-0 flex-1">
                            {phone.description}: {phone.number}
                            {phone.ext && ` ext. ${phone.ext}`}
                          </span>
                        </div>
                      ) : null
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="mdi:phone"
                        className="text-purple/70"
                        width="20"
                      />
                      <span className="w-0 min-w-0 flex-1">Not Provided</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:email"
                      className="text-purple/70"
                      width="20"
                    />
                    <a
                      href={`mailto:${mailingAddress}`}
                      className="w-0 min-w-0 flex-1 hover:underline hover:underline-offset-2 hover:text-purple break-all"
                    >
                      {caseData.email || "Not Provided"}
                    </a>
                  </div>
                  {caseData.identificationNumbers &&
                  caseData.identificationNumbers.length > 0 ? (
                    caseData.identificationNumbers.map((id, index) =>
                      id?.description && id?.number ? (
                        <div key={index} className="flex items-center gap-2">
                          <Icon
                            icon="mdi:card-account-details"
                            className="text-purple/70"
                            width="20"
                          />
                          <span className="w-0 min-w-0 flex-1">
                            {id.description}: {id.number}
                          </span>
                        </div>
                      ) : null
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="mdi:card-account-details"
                        className="text-purple/70"
                        width="20"
                      />
                      <span className="w-0 min-w-0 flex-1">
                        Other IDs: Not Provided
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm col-span-2 lg:col-span-1">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
                  <Icon
                    icon="mdi:card-account-details"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                  {STATIC_TEXTS.CASE.PERSONAL_INFO}
                </h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:calendar"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      DOB:{" "}
                      {caseData.dateOfBirth
                        ? formatDate(
                            toZonedTime(caseData.dateOfBirth, userTimeZone),
                            "MM-dd-yyyy"
                          )
                        : "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:card-account-details"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      SSN: {caseData.ssn || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:account"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      {caseData.headOfHousehold
                        ? "Head of Household"
                        : "Not Head of Household"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:baby-carriage"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Children: {caseData.children || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:account"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Nickname: {caseData.nickname || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:account"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Maiden Name: {caseData.maidenName || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:account"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Suffix: {caseData.suffix || "Not Provided"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm col-span-2">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
                  <Icon
                    icon="mdi:currency-usd"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                  {STATIC_TEXTS.CASE.INCOME_INFO}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                  {/* Income Column */}
                  <div className="bg-gray-50 rounded-lg p-4 flex flex-col h-full">
                    <h4 className="font-semibold mb-2">Income</h4>
                    <div className="space-y-3 flex-1">
                      {caseData.incomeSources &&
                      caseData.incomeSources.length > 0 ? (
                        caseData.incomeSources.map(
                          (income, index) =>
                            income.name && (
                              <div
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <Icon
                                  icon="mdi:cash"
                                  className="text-purple/70 flex-shrink-0 mt-1"
                                  width="20"
                                  height="20"
                                />
                                <div className="w-0 min-w-0 flex-1">
                                  <p>
                                    {income.name}: ${income.amount} (
                                    {income.interval})
                                  </p>
                                  {income.phone && (
                                    <p className="text-gray-500 text-sm">
                                      {income.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                        )
                      ) : (
                        <div className="flex items-start gap-2">
                          <Icon
                            icon="mdi:cash"
                            className="text-purple/70 flex-shrink-0 mt-1"
                            width="20"
                            height="20"
                          />
                          <div className="w-0 min-w-0 flex-1">
                            <p>Income - Personal: Not Provided</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <hr className="my-4 border-gray-200" />
                    <div className="flex items-center gap-2 font-semibold text-green-700">
                      <Icon
                        icon="mdi:cash-multiple"
                        className="text-green-600 flex-shrink-0"
                        width="20"
                        height="20"
                      />
                      <span>
                        Gross Income: ${grossYearly.toFixed(2)} yr ($
                        {grossMonthly.toFixed(2)} mo)
                      </span>
                    </div>
                  </div>
                  {/* Expenses Column */}
                  <div className="bg-gray-50 rounded-lg p-4 flex flex-col h-full">
                    <h4 className="font-semibold mb-2">Expenses</h4>
                    <div className="space-y-3 flex-1">
                      {caseData.expenses && caseData.expenses.length > 0 ? (
                        caseData.expenses.map(
                          (expense, index) =>
                            expense.name && (
                              <div
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <Icon
                                  icon="mdi:credit-card-outline"
                                  className="text-purple/70 flex-shrink-0 mt-1"
                                  width="20"
                                  height="20"
                                />
                                <div className="w-0 min-w-0 flex-1">
                                  <p>
                                    {expense.name}: ${expense.amount} (
                                    {expense.interval})
                                  </p>
                                  {expense.phone && (
                                    <p className="text-gray-500 text-sm">
                                      {expense.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                        )
                      ) : (
                        <div className="flex items-start gap-2">
                          <Icon
                            icon="mdi:credit-card-outline"
                            className="text-purple/70 flex-shrink-0 mt-1"
                            width="20"
                            height="20"
                          />
                          <div className="w-0 min-w-0 flex-1">
                            <p>Expenses - Personal: Not Provided</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <hr className="my-4 border-gray-200" />
                    <div className="flex items-center gap-2 font-semibold text-blue-700">
                      <Icon
                        icon="mdi:calculator-variant"
                        className="text-blue-600 flex-shrink-0"
                        width="20"
                        height="20"
                      />
                      <span>
                        Net Income: ${netIncome.yearly.toFixed(2)} yr ($
                        {netIncome.monthly.toFixed(2)} mo)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm col-span-2">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
                  <Icon
                    icon="mdi:information"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                  {STATIC_TEXTS.CASE.ADDITIONAL_DETAILS}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:gender-male-female"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Gender:{" "}
                      {caseData.gender && caseData.gender.length > 0
                        ? caseData.gender.join(", ")
                        : "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:account"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Race/Ethnicity:{" "}
                      {caseData.raceAndEthnicity &&
                      caseData.raceAndEthnicity.length > 0
                        ? caseData.raceAndEthnicity.join(", ")
                        : "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:school"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Education: {caseData.education || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:briefcase"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Employment: {caseData.employment || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:heart"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Marital Status: {caseData.maritalStatus || "Not Provided"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon
                      icon="mingcute:government-fill"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Government Benefits:{" "}
                      {caseData.governmentBenefits &&
                      caseData.governmentBenefits.length > 0
                        ? caseData.governmentBenefits.join(", ")
                        : "Not Provided"}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:account-group"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      We Play Groups:{" "}
                      {caseData.wePlayGroups && caseData.wePlayGroups.length > 0
                        ? caseData.wePlayGroups.join(", ")
                        : "Not Provided"}
                    </span>
                  </div> */}
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="mdi:information-outline"
                      className="text-purple/70"
                      width="20"
                    />
                    <span className="w-0 min-w-0 flex-1">
                      Other:{" "}
                      {caseData.other && caseData.other.length > 0
                        ? caseData.other.join(", ")
                        : "Not Provided"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm w-full col-span-2">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
                  <Icon
                    icon="mdi:history"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                  {STATIC_TEXTS.CASE.HISTORY}
                </h3>
                <div className="space-y-4 text-gray-700 max-h-60 overflow-y-auto hide-scrollbar pr-2">
                  {caseData?.caseHistory && caseData?.caseHistory.length > 0 ? (
                    caseData?.caseHistory
                      ?.slice(0, displayCount)
                      .map((history, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-2 text-sm">
                            <p>
                              Modified by{" "}
                              <span className="font-semibold">
                                {history.changedBy}
                              </span>{" "}
                              from{" "}
                              {history?.changedByInfo?.locationId ? (
                                <Link
                                  to={`/agencies/${history?.changedByInfo?.locationId}`}
                                  className="font-medium text-purple"
                                >
                                  {history?.changedByInfo?.locationName}
                                </Link>
                              ) : (
                                <Link
                                  to={`/agencies/${history?.changedByInfo?.companyId}`}
                                  className="font-medium text-purple"
                                >
                                  {history?.changedByInfo?.companyName}
                                </Link>
                              )}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {formatDate(
                                toZonedTime(history.timestamp, userTimeZone),
                                "MM-dd-yyyy 'at' hh:mm a"
                              )}
                            </p>
                          </div>
                          {formatCaseHistoryChange(history as any)}
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-gray-500 bg-purpleLight p-4 rounded-lg">
                      {STATIC_TEXTS.CASE.NO_HISTORY}
                    </div>
                  )}
                </div>

                {caseData?.caseHistory &&
                  caseData.caseHistory.length > HISTORY_PAGE_SIZE && (
                    <div className="mt-4 flex justify-end text-center ml-auto w-full">
                      {displayCount < caseData.caseHistory.length ? (
                        <button
                          onClick={handleViewMore}
                          className="text-purple hover:underline text-sm font-medium"
                        >
                          {STATIC_TEXTS.COMMON.VIEW_MORE}
                        </button>
                      ) : (
                        <button
                          onClick={handleLessMore}
                          className="text-purple hover:underline text-sm font-medium"
                        >
                          {STATIC_TEXTS.COMMON.VIEW_LESS}
                        </button>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
        {caseData?.createdBy && caseData?.createdAt && (
          <div className="bg-white border-t border-t-purple/20 text-gray-700 text-[10px] sm:text-sm p-2 py-3 text-center border-b ">
            Case created by{" "}
            <span className="font-medium text-purple">
              {caseData.createdBy?.[0]?.name}
            </span>{" "}
            from{" "}
            {caseData?.caseCompanyInfo?.locationId ? (
              <Link
                to={`/agencies/${caseData?.caseCompanyInfo?.locationId}`}
                className="font-medium text-purple"
              >
                {caseData?.caseCompanyInfo?.locationName}
              </Link>
            ) : (
              <Link
                to={`/agencies/${caseData?.caseCompanyInfo?.companyId}`}
                className="font-medium text-purple"
              >
                {caseData?.caseCompanyInfo?.companyName}
              </Link>
            )}{" "}
            on{" "}
            {formatDate(
              toZonedTime(caseData.createdAt, userTimeZone),
              "MM-dd-yyyy 'at' hh:mm a"
            )}
          </div>
        )}
      </div>

      <AddCaseModal
        isOpen={isEditCaseModalOpen}
        onClose={() => setIsEditCaseModalOpen(false)}
        caseData={caseData}
      />
    </div>
  );
};
