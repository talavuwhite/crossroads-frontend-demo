import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import type { RootState } from "@/redux/store";
import {
  fetchAssistanceReport,
  fetchCasesReport,
  fetchCategoriesReport,
  fetchEventsReport,
} from "@/services/ReportsApi";
import type {
  AssistanceReport,
  CaseReport,
  CategoriesReport,
  CountryType,
  EventsReport,
} from "@/types";
import { reportCards } from "@/utils/constants";
import { format as formatDateFn } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { toZonedTime } from "date-fns-tz";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function isCaseReport(data: any): data is CaseReport {
  return data && Array.isArray(data.cases);
}

function isCategoriesReport(data: any): data is CategoriesReport {
  return data && Array.isArray(data.categories);
}

function isEventsReport(data: any): data is EventsReport {
  return data && Array.isArray(data.events);
}

function isAssistanceReport(data: any): data is AssistanceReport {
  return data && Array.isArray(data.assistance);
}

function formatDate(date: string) {
  if (!date) return date;
  try {
    const localDate = toZonedTime(date, userTimeZone);
    return formatDateFn(localDate, "MM-dd-yyyy hh:mm a");
  } catch {
    return date;
  }
}

const PrintReport = () => {
  const location = useLocation();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const searchParams = new URLSearchParams(location.search);
  const { id: reportId } = useParams();
  const caseId = searchParams.get("caseId") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const [data, setData] = useState<
    AssistanceReport | CaseReport | CategoriesReport | EventsReport | null
  >(null);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPrintData = async () => {
      setLoading(true);
      try {
        switch (reportId) {
          case "assistance":
            const assistanceResponse = await fetchAssistanceReport(
              caseId,
              categoryId,
              userData?.userId,
              userData?.activeLocation
            );
            setData(assistanceResponse.data);
            break;
          case "cases":
            const casesResponse = await fetchCasesReport(
              userData?.userId,
              userData?.activeLocation
            );
            setData(casesResponse.data);
            break;
          case "categories":
            const categoriesResponse = await fetchCategoriesReport(
              userData?.userId,
              userData?.activeLocation
            );
            setData(categoriesResponse.data);
            break;
          case "events":
            const eventsResponse = await fetchEventsReport(
              userData?.userId,
              userData?.activeLocation
            );
            setData(eventsResponse.data);
            break;
          case "appointments":
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrintData();
  }, [
    reportId,
    caseId,
    categoryId,
    userData?.userId,
    userData?.activeLocation,
  ]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Agency ${
      reportCards.find((card) => card.id === reportId)?.title
    } Report`,
    pageStyle: `
      @page {
        size: auto;
        margin: 50px 20px;
      }
    `,
  });

  if (loading) {
    return <Loader />;
  }

  const getValue = (value: string | number | undefined) => {
    if (value && value !== "") {
      return value;
    }
    return <span className="text-gray-400">Not Provided</span>;
  };

  const renderCases = () => {
    return isCaseReport(data) && data?.cases?.length > 0 ? (
      data?.cases?.map((caseItem) => (
        <table key={caseItem?._id} width="100%">
          <tbody>
            <tr>
              <td className="flex items-center gap-2 border-b border-dotted pt-6 pb-2">
                <div className="relative">
                  <img
                    src="/user-blue.png"
                    alt="case-user"
                    className="w-[18px] h-[18px]"
                  />
                </div>
                <div>
                  <h2 className="text-sm text-blue-600 font-bold">
                    {caseItem?.firstName} {caseItem?.lastName}
                  </h2>
                </div>
              </td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-2">
                <table className="relative text-xs">
                  <tbody>
                    <tr>
                      <td className="w-[210px] align-top">Case #:</td>
                      <td className="grow">{getValue(caseItem?.caseId)}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">FirstName:</td>
                      <td className="grow">{getValue(caseItem?.firstName)}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Middle Name:</td>
                      <td className="grow">{getValue(caseItem?.middleName)}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Last Name:</td>
                      <td className="grow">{getValue(caseItem?.lastName)}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Date of birth:</td>
                      <td className="grow">
                        {getValue(caseItem?.dateOfBirth)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">SSN:</td>
                      <td className="grow">{getValue(caseItem?.ssn)}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Address:</td>
                      <td className="grow">
                        <span className="capitalize">
                          {caseItem?.streetAddress?.address} #
                          {caseItem?.streetAddress?.apt}
                        </span>
                        <br />
                        <span>
                          <span className="capitalize">
                            {caseItem?.streetAddress?.city}{" "}
                            {caseItem?.streetAddress?.zip}
                          </span>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">
                        Head of household:
                      </td>
                      <td className="grow">
                        {caseItem?.headOfHousehold ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Children:</td>
                      <td className="grow capitalize">
                        {caseItem?.children ? caseItem.children : "No"}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">County:</td>
                      <td className="grow">
                        {getValue(caseItem?.streetAddress?.county)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Phone numbers:</td>
                      <td className="grow">
                        {caseItem?.phoneNumbers &&
                        caseItem.phoneNumbers.length > 0 ? (
                          <span className="capitalize">
                            {caseItem.phoneNumbers
                              .map(
                                (phone) =>
                                  `${
                                    phone.description
                                      ? phone.description + " : "
                                      : ""
                                  } ${phone.number || ""}${
                                    phone.ext ? ` Ext: ${phone.ext}` : ""
                                  }`
                              )
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Education:</td>
                      <td className="grow">{getValue(caseItem?.education)}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Employment:</td>
                      <td className="grow">{getValue(caseItem?.employment)}</td>
                    </tr>

                    <tr>
                      <td className="w-[210px] align-top">Gender:</td>
                      <td className="grow">
                        {caseItem?.gender && caseItem.gender.length > 0 ? (
                          caseItem.gender.join(", ")
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Other:</td>
                      <td className="grow">
                        {caseItem?.other && caseItem.other.length > 0 ? (
                          caseItem.other.join(", ")
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Race & Ethnicity:</td>
                      <td className="grow">
                        {caseItem?.raceAndEthnicity &&
                        caseItem.raceAndEthnicity.length > 0 ? (
                          caseItem.raceAndEthnicity.join(", ")
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">
                        Government Benefits:
                      </td>
                      <td className="grow">
                        {caseItem?.governmentBenefits &&
                        caseItem.governmentBenefits.length > 0 ? (
                          caseItem.governmentBenefits.join(", ")
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    {/* <tr>
                      <td className="w-[210px] align-top">We Play Groups:</td>
                      <td className="grow">
                        {caseItem?.wePlayGroups &&
                        caseItem.wePlayGroups.length > 0 ? (
                          caseItem.wePlayGroups.join(", ")
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr> */}
                    {/* <tr>
                      <td className="w-[210px] align-top">
                        We Play Groups Other:
                      </td>
                      <td className="grow">
                        {getValue(caseItem?.wePlayGroupsOther)}
                      </td>
                    </tr> */}
                    <tr>
                      <td className="w-[210px] align-top">Visible To:</td>
                      <td className="grow">{getValue(caseItem?.visibleTo)}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top font-bold">
                        Income Sources:
                      </td>
                      <td className="grow font-bold">
                        {caseItem?.incomeSources &&
                        caseItem.incomeSources.length > 0 ? (
                          <span>
                            {caseItem.incomeSources.map((src, idx) => {
                              let parts = [src.name];
                              if (src.phone) parts.push(src.phone);
                              if (src.amount) parts.push(`${src.amount}`);
                              if (src.interval) parts.push(src.interval);
                              return parts.length > 0 && parts[0] !== "" ? (
                                <span key={idx}>
                                  {idx + 1}. {parts.join(" - ")}
                                  {idx !==
                                    (caseItem?.incomeSources?.length ?? 0) -
                                      1 && <br />}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  Not Provided
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            No Income Sources
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top font-bold">
                        Expenses:
                      </td>
                      <td className="grow font-bold">
                        {caseItem?.expenses && caseItem.expenses.length > 0 ? (
                          <span>
                            {caseItem.expenses.map((exp, idx) => {
                              let parts = [exp.name];
                              if (exp.phone) parts.push(exp.phone);
                              if (exp.amount) parts.push(`${exp.amount}`);
                              if (exp.interval) parts.push(exp.interval);
                              return parts.length > 0 && parts[0] !== "" ? (
                                <span key={idx}>
                                  {idx + 1}. {parts.join(" - ")}
                                  {idx !==
                                    (caseItem?.expenses?.length ?? 0) - 1 && (
                                    <br />
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  Not Provided
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">No Expenses</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top font-bold">
                        Created By:
                      </td>
                      <td className="grow font-bold">
                        {getValue(caseItem?.createdBy?.[0]?.name)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      ))
    ) : (
      <div className="mt-10">
        <h1 className="text-lg font-bold text-center">No cases found</h1>
      </div>
    );
  };

  const renderCategories = () => {
    return isCategoriesReport(data) && data?.categories?.length > 0 ? (
      data?.categories?.map((category) => (
        <table key={category?._id} width="100%">
          <tbody className="text-xs">
            <tr>
              <td className="flex items-center justify-between gap-2 border-b border-dotted pt-6 pb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src="/file.png"
                      alt="category-icon"
                      className="w-5 h-5"
                    />
                  </div>
                  <div>
                    <h2 className="text-sm text-green-600 font-bold">
                      {category?.sectionId
                        ? category?.sectionId?.name + " - "
                        : ""}
                      {category?.name}
                    </h2>
                  </div>
                </div>
                <div>{formatDate(category?.createdAt)}</div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-2">
                <div className="flex items-center gap-2">
                  <img
                    src="/message-bubble.png"
                    alt={`${category?.name}-category-message`}
                    className="w-[18px] h-[18px]"
                  />
                  <span>{getValue(category?.description)}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-2">
                <span className="font-bold">Default Amount :</span>{" "}
                {category.defaultAmount ? (
                  category?.defaultUnit?.name === "Dollars" ? (
                    "$ " + category?.defaultAmount
                  ) : (
                    category?.defaultAmount +
                    " " +
                    (category?.defaultUnit?.name ?? "")
                  )
                ) : (
                  <span className="text-gray-400">Not Provided</span>
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="font-bold">Fixed Value :</span>{" "}
                {category?.fixedValue ? (
                  "$ " + getValue(category?.fixedValue)
                ) : (
                  <span className="text-gray-400">Not Provided</span>
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="font-bold">Visible To :</span>{" "}
                {getValue(category?.visibleTo)}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <span className="font-bold">Created By :</span>{" "}
                {category?.createdBy ? (
                  category?.createdBy?.firstName +
                  " " +
                  category?.createdBy?.lastName
                ) : (
                  <span className="text-gray-400">Not Provided</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      ))
    ) : (
      <div className="mt-10">
        <h1 className="text-lg font-bold text-center">No categories found</h1>
      </div>
    );
  };

  const renderEvents = () => {
    return isEventsReport(data) && data?.events?.length > 0 ? (
      data?.events?.map((event) => (
        <table key={event?._id} width="100%">
          <tbody className="text-xs">
            <tr>
              <td colSpan={2} className="border-b border-dotted pt-6 pb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src="/event.png"
                      alt="event-icon"
                      className="w-5 h-5"
                    />
                  </div>
                  <h2 className="text-lg text-blue-600 font-bold">
                    {event?.title || "No Title"}
                  </h2>
                </div>
              </td>
            </tr>
            <tr>
              <td
                colSpan={2}
                className="pt-2 flex items-center justify-between gap-2"
              >
                <div className="font-bold text-sm flex items-center gap-2">
                  {getValue(event?.location?.name)}
                </div>
                <div className="text-end">
                  <div>{formatDate(event?.dateTime)}</div>
                  <div>
                    <span className="font-bold">
                      {event?.facilitator?.firstName}{" "}
                      {event?.facilitator?.lastName}
                    </span>{" "}
                    at <span className="font-bold">{data.companyName}</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-2">
                <div className="flex items-center gap-2">
                  <img
                    src="/location.png"
                    alt={`${event?.location?.name}-location`}
                    className="w-[14px] h-[14px]"
                  />
                  <span>
                    {event?.location?.address
                      ? event?.location?.address + ","
                      : ""}{" "}
                    {event?.location?.city ? event?.location?.city + "," : ""}{" "}
                    {event?.location?.state ? event?.location?.state + "," : ""}{" "}
                    {event?.location?.zipCode ? event?.location?.zipCode : ""}
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-2">
                <div className="flex items-center gap-2">
                  <img
                    src="/country.png"
                    alt={`${
                      (event?.location?.country as CountryType)?.name
                    }-country`}
                    className="w-[14px] h-[14px]"
                  />
                  <span>
                    {getValue(
                      typeof event?.location?.country === "object"
                        ? event?.location?.country?.name
                        : ""
                    )}
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-2">
                <div className="flex items-center gap-2">
                  <img
                    src="/message-bubble.png"
                    alt={`${event?.description}-description`}
                    className="w-[14px] h-[14px]"
                  />
                  <span>{getValue(event?.description)}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-4">
                <table className="w-full table-auto text-sm border border-purple-200 rounded-lg border-collapse">
                  <tbody>
                    <tr className="border-b border-purple-200">
                      <th className="text-left px-3 py-2 border-r border-purple-200 text-purple font-semibold">
                        Event Type
                      </th>
                      <th className="text-left px-3 py-2 border-r border-purple-200 font-semibold">
                        {event.eventType?.name}
                      </th>
                    </tr>
                    {event.activities?.map(
                      (activity, idx) =>
                        activity.activityId &&
                        activity.value && (
                          <tr key={idx} className="border-b border-purple-100">
                            <th className="text-left px-3 py-2 border-r border-purple-100 text-purple font-medium">
                              {activity.activityId?.name}
                            </th>
                            <td className="px-3 py-2">
                              {activity?.activityId?.type === "checkbox" &&
                              activity.value
                                ? "Yes"
                                : activity.value}
                            </td>
                          </tr>
                        )
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      ))
    ) : (
      <div className="mt-10">
        <h1 className="text-lg font-bold text-center">No events found</h1>
      </div>
    );
  };

  const renderAssistance = () => {
    return isAssistanceReport(data) && data?.assistance?.length > 0 ? (
      data?.assistance?.map((assistance, index) => (
        <table key={assistance?._id} width="100%" className="text-xs">
          <tbody>
            <tr>
              <td className={`${index === 0 ? "pt-6" : "pt-4"} font-bold`}>
                {formatDate(assistance?.createdAt)}
                {assistance?.category?.name && (
                  <>
                    <span> for </span>
                    <span className="text-green-600">
                      {assistance?.category?.sectionId?.name
                        ? assistance?.category?.sectionId?.name + " : "
                        : ""}
                      {assistance?.category?.name}
                    </span>
                  </>
                )}
              </td>
              <td
                className={`${
                  index === 0 ? "pt-6" : "pt-4"
                } w-[100px] text-right text-lg font-semibold text-green-600`}
              >
                {assistance?.amount !== undefined &&
                assistance?.amount !== null ? (
                  assistance?.unit?.name === "Dollars" ? (
                    "$ " + assistance?.amount
                  ) : (
                    assistance?.amount + " " + (assistance?.unit?.name ?? "")
                  )
                ) : (
                  <span className="text-gray-400">No amount provided</span>
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div className="flex items-center gap-2">
                  <img
                    src="/message-bubble.png"
                    alt={`${index}-assistance-message`}
                    className="w-[18px] h-[18px]"
                  />
                  {assistance?.description ? (
                    <span>{assistance?.description}</span>
                  ) : (
                    <span className="text-gray-400">
                      No description provided
                    </span>
                  )}
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div className="border-b border-dotted pb-2"></div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div className="flex items-center gap-2 pt-2">
                  <img
                    src="/user-blue.png"
                    alt={`${index}-assistance-user`}
                    className="w-[18px] h-[18px]"
                  />
                  <span className="text-sm text-blue-600">
                    Received by{" "}
                    <span className="font-bold">
                      {assistance?.caseId?.firstName}{" "}
                      {assistance?.caseId?.lastName}
                    </span>
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-[210px] align-top">Case #:</td>
                      <td className="grow">
                        {getValue(assistance?.caseId?.caseId)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">FirstName:</td>
                      <td className="grow">
                        {getValue(assistance?.caseId?.firstName)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Middle Name:</td>
                      <td className="grow">
                        {getValue(assistance?.caseId?.middleName)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Last Name:</td>
                      <td className="grow">
                        {getValue(assistance?.caseId?.lastName)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Date of birth:</td>
                      <td className="grow">
                        {getValue(assistance?.caseId?.dateOfBirth)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">SSN:</td>
                      <td className="grow">
                        {getValue(assistance?.caseId?.ssn)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Address:</td>
                      <td className="grow">
                        <span className="capitalize">
                          {assistance?.caseId?.streetAddress?.address} #
                          {assistance?.caseId?.streetAddress?.apt}
                        </span>
                        <br />
                        <span>
                          <span className="capitalize">
                            {assistance?.caseId?.streetAddress?.city}{" "}
                            {assistance?.caseId?.streetAddress?.zip}
                          </span>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">County:</td>
                      <td className="grow">
                        {getValue(assistance?.caseId?.streetAddress?.county)}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Phone numbers:</td>
                      <td className="grow">
                        {assistance?.caseId?.phoneNumbers &&
                        assistance?.caseId?.phoneNumbers.length > 0 ? (
                          <span className="capitalize">
                            {assistance?.caseId?.phoneNumbers
                              .map(
                                (phone) =>
                                  `${
                                    phone.description
                                      ? phone.description + " : "
                                      : ""
                                  } ${phone.number || ""}${
                                    phone.ext ? ` Ext: ${phone.ext}` : ""
                                  }`
                              )
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <div className="border-b border-dotted pb-2"></div>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top font-bold pt-2">
                        Income Sources:
                      </td>
                      <td className="grow font-bold pt-2">
                        {assistance?.caseId?.incomeSources &&
                        assistance?.caseId?.incomeSources.length > 0 ? (
                          <span>
                            {assistance?.caseId?.incomeSources.map(
                              (src, idx) => {
                                let parts = [src.name];
                                if (src.phone) parts.push(src.phone);
                                if (src.amount) parts.push(`${src.amount}`);
                                if (src.interval) parts.push(src.interval);
                                return parts.length > 0 && parts[0] !== "" ? (
                                  <span key={idx}>
                                    {idx + 1}. {parts.join(" - ")}
                                    {idx !==
                                      (assistance?.caseId?.incomeSources
                                        ?.length ?? 0) -
                                        1 && <br />}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">
                                    Not Provided
                                  </span>
                                );
                              }
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            No Income Sources
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <div className="border-b border-dotted pb-2"></div>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top font-bold pt-2">
                        Expenses:
                      </td>
                      <td className="grow font-bold pt-2">
                        {assistance?.caseId?.expenses &&
                        assistance?.caseId?.expenses.length > 0 ? (
                          <span>
                            {assistance?.caseId?.expenses.map((exp, idx) => {
                              let parts = [exp.name];
                              if (exp.phone) parts.push(exp.phone);
                              if (exp.amount) parts.push(`${exp.amount}`);
                              if (exp.interval) parts.push(exp.interval);
                              return parts.length > 0 && parts[0] !== "" ? (
                                <span key={idx}>
                                  {idx + 1}. {parts.join(" - ")}
                                  {idx !==
                                    (assistance?.caseId?.expenses?.length ??
                                      0) -
                                      1 && <br />}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  Not Provided
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">No Expenses</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <div className="border-b border-dotted pb-2"></div>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top font-bold pt-2">
                        Entry Date:
                      </td>
                      <td className="grow font-bold pt-2">
                        {formatDate(assistance?.caseId?.createdAt)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div className="border-b border-dotted pb-2"></div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div className="flex items-center gap-2 pt-2 pb-8">
                  <img
                    src="/user-red.png"
                    alt={`${index}-assistance-provided-by`}
                    className="w-[18px] h-[18px]"
                  />
                  <span className="text-sm text-[#990000]">
                    Provided by{" "}
                    {assistance?.createdBy?.firstName && data.companyName ? (
                      <>
                        <span className="font-bold">
                          {assistance?.createdBy?.firstName}{" "}
                          {assistance?.createdBy?.lastName}
                        </span>{" "}
                        at{" "}
                        <span className="font-bold underline">
                          {data.companyName}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">Not Provided</span>
                    )}
                  </span>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div
                  style={{ borderBottomStyle: "dotted" }}
                  className="border-t-5 border-t-purple border-b border-black pb-1"
                ></div>
              </td>
            </tr>
          </tbody>
        </table>
      ))
    ) : (
      <div className="mt-10">
        <h1 className="text-lg font-bold text-center">No assistances found</h1>
      </div>
    );
  };

  const renderAppointments = () => {
    return <div></div>;
  };

  return (
    <div ref={componentRef}>
      {/* Top action buttons */}
      <div className="bd-purple/10 p-2 flex items-center justify-between print:hidden">
        <Button
          label="Go Back"
          onClick={() => window.history.back()}
          variant="default"
          icon="mdi:arrow-back"
        />
        <Button
          label="Print"
          onClick={handlePrint}
          variant="submitStyle"
          icon="mdi:printer"
        />
      </div>
      <div className="my-10 print:my-0 px-5">
        <table width="100%">
          <tbody>
            <tr>
              <td>
                <h1 className="text-[#990000] text-lg font-bold">
                  {data?.companyName || "Agency"}
                </h1>
              </td>
              <td className="text-right">
                <h2 className="text-md font-bold">
                  {`Agency ${
                    reportCards.find((card) => card.id === reportId)?.title
                  }`}
                </h2>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border-b-5 pb-2 border-black"></td>
            </tr>
          </tbody>
        </table>
        {reportId === "cases" && renderCases()}
        {reportId === "categories" && renderCategories()}
        {reportId === "events" && renderEvents()}
        {reportId === "assistance" && renderAssistance()}
        {reportId === "appointments" && renderAppointments()}
      </div>
    </div>
  );
};

export default PrintReport;
