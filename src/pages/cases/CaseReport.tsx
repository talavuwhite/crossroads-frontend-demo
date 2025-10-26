import Button from "@/components/ui/Button";
import type { RootState } from "@/redux/store";
import { fetchCaseReport } from "@/services/CaseApi";
import type { CaseReport } from "@/types/case";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Loader from "@/components/ui/Loader";
import { useReactToPrint } from "react-to-print";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatDateString(date: string) {
  if (!date) return date;
  try {
    const localDate = toZonedTime(date, userTimeZone);
    return formatDate(localDate, "MM-dd-yyyy hh:mm a");
  } catch {
    return date;
  }
}

function formatAmPm(date: Date) {
  const localDate = toZonedTime(date, userTimeZone);
  let formatted = formatDate(localDate, "MM-dd-yyyy h:mm a");
  formatted = formatted.replace("AM", "a.m.").replace("PM", "p.m.");
  return formatted;
}

const CaseReportPrint = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const includeRelationships =
    searchParams.get("includeRelationships") === "true";
  const { id: caseId } = useParams();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [caseReport, setCaseReport] = useState<CaseReport | null>(null);
  const [loading, setLoading] = useState(false);

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Case Report for ${caseReport?.case?.firstName} ${caseReport?.case?.lastName}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 50px 20px;
      }
    `,
  });

  // Fetch case report data
  useEffect(() => {
    setLoading(true);
    const fetchReport = async () => {
      const response = await fetchCaseReport(
        caseId || "",
        includeRelationships,
        userData?.userId,
        userData?.activeLocation
      );
      setCaseReport(response.data);
      setLoading(false);
    };
    fetchReport();
  }, [includeRelationships]);

  if (loading) {
    return <Loader />;
  }

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
                  Case Report
                </h1>
              </td>
              <td className="text-right">
                <h2 className="text-md font-bold">
                  {caseReport?.case?.firstName} {caseReport?.case?.lastName}
                </h2>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="border-b-5 pb-2 border-black"></td>
            </tr>
          </tbody>
        </table>

        <table width="100%">
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
                <div className="case_name">
                  <h2 className="text-sm text-blue-600 font-bold">
                    {caseReport?.case?.firstName} {caseReport?.case?.lastName}
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
                      <td className="grow">{caseReport?.case?.caseId}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">FirstName:</td>
                      <td className="grow">{caseReport?.case?.firstName}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Middle Name:</td>
                      <td className="grow">{caseReport?.case?.middleName}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Last Name:</td>
                      <td className="grow">{caseReport?.case?.lastName}</td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Date of birth:</td>
                      <td className="grow">
                        {caseReport?.case?.dateOfBirth ? (
                          <span>{caseReport?.case?.dateOfBirth}</span>
                        ) : (
                          <span className="text-gray-400">No DOB Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">SSN:</td>
                      <td className="grow">
                        {caseReport?.case?.ssn ? (
                          <span>{caseReport?.case?.ssn}</span>
                        ) : (
                          <span className="text-gray-400">No SSN Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Address:</td>
                      <td className="grow">
                        <span className="capitalize">
                          {caseReport?.case?.streetAddress?.address} #
                          {caseReport?.case?.streetAddress?.apt}
                        </span>
                        <br />
                        <span>
                          <span className="capitalize">
                            {caseReport?.case?.streetAddress?.city}{" "}
                            {caseReport?.case?.streetAddress?.zip}
                          </span>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">
                        Head of household:
                      </td>
                      <td className="grow">
                        {caseReport?.case?.headOfHousehold ? "Yes" : "No"}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Children:</td>
                      <td className="grow capitalize">
                        {caseReport?.case?.children}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">County:</td>
                      <td className="grow">
                        {caseReport?.case?.streetAddress?.county}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Phone numbers:</td>
                      <td className="grow">
                        {caseReport?.case?.phoneNumbers &&
                        caseReport.case.phoneNumbers.length > 0 ? (
                          <span className="capitalize">
                            {caseReport.case.phoneNumbers
                              .map(
                                (phone) =>
                                  `${phone.description}: ${phone.number}${
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
                      <td className="grow">
                        {caseReport?.case?.education ? (
                          caseReport.case.education
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Employment:</td>
                      <td className="grow">
                        {caseReport?.case?.employment ? (
                          caseReport.case.employment
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className="w-[210px] align-top">Gender:</td>
                      <td className="grow">
                        {caseReport?.case?.gender &&
                        caseReport.case.gender.length > 0 ? (
                          caseReport.case.gender.join(", ")
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Other:</td>
                      <td className="grow">
                        {caseReport?.case?.other &&
                        caseReport.case.other.length > 0 ? (
                          caseReport.case.other.join(", ")
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top">Race & Ethnicity:</td>
                      <td className="grow">
                        {caseReport?.case?.raceAndEthnicity &&
                        caseReport.case.raceAndEthnicity.length > 0 ? (
                          caseReport.case.raceAndEthnicity.join(", ")
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
                        {caseReport?.case?.governmentBenefits &&
                        caseReport.case.governmentBenefits.length > 0 ? (
                          caseReport.case.governmentBenefits.join(", ")
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    {/* <tr>
                      <td className="w-[210px] align-top">We Play Groups:</td>
                      <td className="grow">
                        {caseReport?.case?.wePlayGroups &&
                        caseReport.case.wePlayGroups.length > 0 ? (
                          caseReport.case.wePlayGroups.join(", ")
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
                        {caseReport?.case?.wePlayGroupsOther ? (
                          caseReport.case.wePlayGroupsOther
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr> */}
                    <tr>
                      <td className="w-[210px] align-top">Visible To:</td>
                      <td className="grow">
                        {caseReport?.case?.visibleTo ? (
                          caseReport.case.visibleTo
                        ) : (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-[210px] align-top font-bold">
                        Income Sources:
                      </td>
                      <td className="grow font-bold">
                        {caseReport?.case?.incomeSources &&
                        caseReport.case.incomeSources.length > 0 ? (
                          <span>
                            {caseReport.case.incomeSources.map((src, idx) => {
                              let parts = [src.name];
                              if (src.phone) parts.push(src.phone);
                              if (src.amount) parts.push(`${src.amount}`);
                              if (src.interval) parts.push(src.interval);
                              return (
                                <span key={idx}>
                                  {idx + 1}. {parts.join(" - ")}
                                  {idx !==
                                    (caseReport.case?.incomeSources?.length ??
                                      0) -
                                      1 && <br />}
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
                        {caseReport?.case?.expenses &&
                        caseReport.case.expenses.length > 0 ? (
                          <span>
                            {caseReport.case.expenses.map((exp, idx) => {
                              let parts = [exp.name];
                              if (exp.phone) parts.push(exp.phone);
                              if (exp.amount) parts.push(`${exp.amount}`);
                              if (exp.interval) parts.push(exp.interval);
                              return (
                                <span key={idx}>
                                  {idx + 1}. {parts.join(" - ")}
                                  {idx !==
                                    (caseReport.case?.expenses?.length ?? 0) -
                                      1 && <br />}
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
                        {caseReport?.case?.createdBy?.[0]?.name ?? (
                          <span className="text-gray-400">Not Provided</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {caseReport?.relationships?.length
          ? caseReport?.relationships?.length > 0 && (
              <table width="100%" className="mt-10">
                <tbody>
                  <tr>
                    <td>
                      <h1 className="text-black text-lg font-bold">
                        Relationships{" "}
                        <span className="text-gray-400 text-sm">
                          ({caseReport?.relationships?.length ?? 0})
                        </span>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="border-b-5 pb-2 border-black"
                    ></td>
                  </tr>
                </tbody>
              </table>
            )
          : null}

        {caseReport?.relationships?.length
          ? caseReport?.relationships?.map((relationship, index) => (
              <table key={relationship?._id} width="100%" className="text-xs">
                <tbody>
                  <tr>
                    <td
                      className={`${index === 0 ? "pt-6" : "pt-4"} font-bold`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src="/user-blue.png"
                          alt={`${index}-relationship-user`}
                          className="w-[18px] h-[18px]"
                        />
                        <span className="text-sm text-blue-600">
                          {relationship?.caseB?.firstName}{" "}
                          {relationship?.caseB?.lastName}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <div className="border-b border-dotted pb-2"></div>
                    </td>
                  </tr>
                  <tr>
                    <td className="w-[210px] align-top pt-2">Relationship:</td>
                    <td className="grow pt-2">
                      <div>
                        {relationship?.caseA?.firstName}{" "}
                        {relationship?.caseA?.lastName} is the{" "}
                        {relationship?.customLabelAtoB} of{" "}
                        {relationship?.caseB?.firstName}{" "}
                        {relationship?.caseB?.lastName}
                      </div>
                      <div>
                        {relationship?.caseB?.firstName}{" "}
                        {relationship?.caseB?.lastName} is the{" "}
                        {relationship?.customLabelBtoA} of{" "}
                        {relationship?.caseA?.firstName}{" "}
                        {relationship?.caseA?.lastName}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="w-[210px] align-top">Living with:</td>
                    <td className="grow">
                      {relationship?.relationshipType?.includes("live_with")
                        ? "True"
                        : "False"}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-[210px] align-top">Dependant:</td>
                    <td className="grow">
                      {relationship?.relationshipType?.includes("dependant")
                        ? "True"
                        : "False"}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-[210px] align-top">Date of birth:</td>
                    <td className="grow">
                      {relationship?.caseB?.dateOfBirth ? (
                        <span>{relationship?.caseB?.dateOfBirth}</span>
                      ) : (
                        <span className="text-gray-400">Not Provided</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="w-[210px] align-top">SSN:</td>
                    <td className="grow">
                      {relationship?.caseB?.ssn ? (
                        <span>{relationship?.caseB?.ssn}</span>
                      ) : (
                        <span className="text-gray-400">Not Provided</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))
          : null}

        {caseReport?.assistance?.length
          ? caseReport?.assistance?.length > 0 && (
              <table width="100%" className="mt-10">
                <tbody>
                  <tr>
                    <td>
                      <h1 className="text-black text-lg font-bold">
                        Case Assistance{" "}
                        <span className="text-gray-400 text-sm">
                          ({caseReport?.assistance?.length ?? 0})
                        </span>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="border-b-5 pb-2 border-black"
                    ></td>
                  </tr>
                </tbody>
              </table>
            )
          : null}

        {caseReport?.assistance?.length
          ? caseReport?.assistance?.map((assistance, index) => (
              <table key={assistance?._id} width="100%" className="text-xs">
                <tbody>
                  <tr>
                    <td
                      className={`${index === 0 ? "pt-6" : "pt-4"} font-bold`}
                    >
                      {formatDateString(assistance?.createdAt)} for{" "}
                      {assistance?.category ? (
                        <span className="text-green-600">
                          {assistance?.category?.sectionId?.name}:{" "}
                          {assistance?.category?.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          No category provided
                        </span>
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
                          assistance?.amount +
                          " " +
                          (assistance?.unit?.name ?? "")
                        )
                      ) : (
                        <span className="text-gray-400">
                          No amount provided
                        </span>
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
                            {caseReport?.case?.firstName}{" "}
                            {caseReport?.case?.lastName}
                          </span>
                        </span>
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
                      <div className="flex items-center gap-2 pt-2 pb-8">
                        <img
                          src="/user-red.png"
                          alt={`${index}-assistance-provided-by`}
                          className="w-[18px] h-[18px]"
                        />
                        <span className="text-sm text-[#990000]">
                          Provided by{" "}
                          <span className="font-bold">
                            {assistance?.createdBy?.firstName}{" "}
                            {assistance?.createdBy?.lastName}
                          </span>{" "}
                          at{" "}
                          <span className="font-bold underline">
                            {assistance?.company?.locationName
                              ? assistance?.company?.locationName
                              : assistance?.company?.companyName}
                          </span>
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
          : null}

        {caseReport?.referrals?.length
          ? caseReport?.referrals?.length > 0 && (
              <table width="100%" className="mt-10">
                <tbody>
                  <tr>
                    <td>
                      <h1 className="text-black text-lg font-bold">
                        Case Assistance Requests{" "}
                        <span className="text-gray-400 text-sm">
                          ({caseReport?.referrals?.length ?? 0})
                        </span>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="border-b-5 pb-2 border-black"
                    ></td>
                  </tr>
                </tbody>
              </table>
            )
          : null}

        {caseReport?.referrals?.length
          ? caseReport?.referrals?.map((referral, index) => (
              <table key={referral?._id} width="100%" className="text-xs">
                <tbody>
                  <tr>
                    <td
                      className={`${index === 0 ? "pt-6" : "pt-4"} font-bold`}
                    >
                      {formatDateString(referral?.createdAt)} for{" "}
                      {referral?.category ? (
                        <span className="text-green-600">
                          {referral?.category?.sectionId?.name}:{" "}
                          {referral?.category?.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          No category provided
                        </span>
                      )}
                    </td>
                    <td
                      className={`${
                        index === 0 ? "pt-6" : "pt-4"
                      } w-[100px] text-right text-lg font-semibold text-green-600`}
                    >
                      {referral?.amount !== undefined &&
                      referral?.amount !== null ? (
                        referral?.unit?.name === "Dollars" ? (
                          "$ " + referral?.amount
                        ) : (
                          referral?.amount + " " + (referral?.unit?.name ?? "")
                        )
                      ) : (
                        <span className="text-gray-400">
                          No amount provided
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <div className="flex items-center gap-2">
                        <img
                          src="/message-bubble.png"
                          alt={`${index}-referral-message`}
                          className="w-[18px] h-[18px]"
                        />
                        {referral?.description ? (
                          <span>{referral?.description}</span>
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
                          alt={`${index}-referral-requested-by`}
                          className="w-[18px] h-[18px]"
                        />
                        <span className="text-sm text-blue-600">
                          Requested by{" "}
                          <span className="font-bold">
                            {caseReport?.case?.firstName}{" "}
                            {caseReport?.case?.lastName}
                          </span>
                        </span>
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
                      <div className="flex items-center gap-2 pt-2 pb-2">
                        <div className="w-[30px] h-[30px] flex items-center justify-center shadow bg-gray-100 border border-primary/10">
                          <img
                            src="/user-red.png"
                            alt={`${index}-referral-requested-from`}
                            className="w-[18px] h-[18px]"
                          />
                        </div>
                        <span className="text-sm text-[#990000]">
                          Requested from{" "}
                          <span className="font-bold underline">
                            {referral?.company?.locationName
                              ? referral?.company?.locationName
                              : referral?.company?.companyName}
                          </span>{" "}
                          - Entered by{" "}
                          <span className="font-bold">
                            {referral?.createdBy?.firstName}{" "}
                            {referral?.createdBy?.lastName}
                          </span>{" "}
                          at{" "}
                          <span className="font-bold underline">
                            {referral?.company?.locationName
                              ? referral?.company?.locationName
                              : referral?.company?.companyName}
                          </span>
                        </span>
                      </div>
                      Status:{" "}
                      {referral?.status ? (
                        <span
                          className={`${
                            referral?.status?.name === "Approved"
                              ? "text-green-600"
                              : referral?.status?.name === "Denied"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {referral?.status?.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          No status provided
                        </span>
                      )}
                    </td>
                  </tr>
                  {referral?.statusHistory?.length > 0 ? (
                    <tr>
                      <td colSpan={2}>
                        <div className="border-b border-dotted pb-2"></div>
                      </td>
                    </tr>
                  ) : null}
                  {referral?.statusHistory
                    ? referral?.statusHistory?.length > 0 &&
                      referral?.statusHistory?.map((status, index) => (
                        <React.Fragment key={status?._id}>
                          <tr>
                            <td colSpan={2}>
                              <div className="pt-2">
                                {status?.updatedAt && (
                                  <span>
                                    {formatAmPm(
                                      toZonedTime(
                                        status?.updatedAt,
                                        userTimeZone
                                      )
                                    )}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p>
                                  <span className="font-bold">
                                    {status?.updatedBy?.firstName}{" "}
                                    {status?.updatedBy?.lastName}
                                  </span>{" "}
                                  at{" "}
                                  <span className="font-bold">
                                    {status?.company?.locationName
                                      ? status?.company?.locationName
                                      : status?.company?.companyName}
                                  </span>{" "}
                                  changed status to{" "}
                                  <span
                                    className={`font-medium   ${
                                      status?.status?.name === "Denied"
                                        ? "text-red-600 "
                                        : status?.status?.name === "Approved"
                                        ? "text-green-700 "
                                        : "text-yellow-700 "
                                    }`}
                                  >
                                    {status?.status?.name}
                                  </span>
                                  . Notes: {status?.statusNotes}
                                </p>{" "}
                              </div>
                            </td>
                          </tr>

                          {index !== referral?.statusHistory?.length - 1 && (
                            <tr>
                              <td colSpan={2}>
                                <div className="border-b border-dotted pb-2"></div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    : null}
                  {referral?.requestedAssistance?.length > 0 && (
                    <tr>
                      <td colSpan={2}>
                        <div className="border-b border-dotted pb-2"></div>
                      </td>
                    </tr>
                  )}
                  {referral?.requestedAssistance
                    ? referral?.requestedAssistance?.length > 0 &&
                      referral?.requestedAssistance?.map(
                        (assistance, index) => (
                          <React.Fragment key={assistance?._id}>
                            <tr>
                              <td colSpan={2}>
                                <div className="pt-2">
                                  {assistance?.updatedAt && (
                                    <span>
                                      {formatAmPm(
                                        toZonedTime(
                                          assistance?.updatedAt,
                                          userTimeZone
                                        )
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p>
                                    {assistance?.amount && (
                                      <span className="text-green-600">
                                        {assistance?.unit?.name === "Dollars"
                                          ? "$ " + assistance?.amount
                                          : assistance?.amount +
                                            " " +
                                            (assistance?.unit?.name ?? "")}{" "}
                                        <span className="text-black">-</span>
                                      </span>
                                    )}{" "}
                                    <span>{assistance?.description}</span>
                                  </p>
                                </div>
                                <div>
                                  Assistance provided by{" "}
                                  <span className="font-bold">
                                    {assistance?.createdBy?.firstName}{" "}
                                    {assistance?.createdBy?.lastName}
                                  </span>{" "}
                                  at{" "}
                                  <span className="font-bold">
                                    {assistance?.company?.locationName
                                      ? assistance?.company?.locationName
                                      : assistance?.company?.companyName}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            <tr>
                              <td colSpan={2}>
                                <div
                                  className={`${
                                    index !==
                                    referral?.requestedAssistance?.length - 1
                                      ? "border-b"
                                      : ""
                                  } border-dotted pb-2`}
                                ></div>
                              </td>
                            </tr>
                          </React.Fragment>
                        )
                      )
                    : null}
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
          : null}

        {caseReport?.notes?.length
          ? caseReport?.notes?.length > 0 && (
              <table width="100%" className="mt-10">
                <tbody>
                  <tr>
                    <td>
                      <h1 className="text-black text-lg font-bold">
                        Case Notes{" "}
                        <span className="text-gray-400 text-sm">
                          ({caseReport?.notes?.length ?? 0})
                        </span>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="border-b-5 pb-2 border-black"
                    ></td>
                  </tr>
                </tbody>
              </table>
            )
          : null}

        {caseReport?.notes?.length
          ? caseReport?.notes?.map((note, index) => (
              <table key={note?._id} width="100%" className="text-xs">
                <tbody>
                  <tr>
                    <td
                      className={`${
                        index === 0 ? "pt-6" : "pt-4"
                      } pb-2 font-bold`}
                    >
                      {formatDateString(note?.createdAt)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <div className="flex items-center gap-2">
                        <img
                          src="/message-bubble.png"
                          alt={`${index}-note-message`}
                          className="w-[18px] h-[18px]"
                        />
                        {note?.description ? (
                          <span>{note?.description}</span>
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
                      <div className="flex items-center gap-2 pt-2 pb-8">
                        <img
                          src="/user-red.png"
                          alt={`${index}-note-user`}
                          className="w-[18px] h-[18px]"
                        />
                        <span className="text-sm text-[#990000]">
                          Note by{" "}
                          <span className="font-bold">
                            {note?.createdBy?.firstName}{" "}
                            {note?.createdBy?.lastName}
                          </span>{" "}
                          at{" "}
                          <span className="font-bold">
                            {note?.company?.locationName
                              ? note?.company?.locationName
                              : note?.company?.companyName}
                          </span>
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
          : null}

        {caseReport?.alerts?.length
          ? caseReport?.alerts?.length > 0 && (
              <table width="100%" className="mt-10">
                <tbody>
                  <tr>
                    <td>
                      <h1 className="text-black text-lg font-bold">
                        Case Alerts{" "}
                        <span className="text-gray-400 text-sm">
                          ({caseReport?.alerts?.length ?? 0})
                        </span>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="border-b-5 pb-2 border-black"
                    ></td>
                  </tr>
                </tbody>
              </table>
            )
          : null}

        {caseReport?.alerts?.length
          ? caseReport?.alerts?.map((alert, index) => (
              <table key={alert?._id} width="100%" className="text-xs">
                <tbody>
                  <tr>
                    <td
                      className={`${
                        index === 0 ? "pt-6" : "pt-4"
                      } pb-2 font-bold`}
                    >
                      {formatDateString(alert?.createdAt)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <div className="flex items-center gap-2">
                        <img
                          src="/message-bubble.png"
                          alt={`${index}-alert-message`}
                          className="w-[18px] h-[18px]"
                        />
                        {alert?.description ? (
                          <span>{alert?.description}</span>
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
                      <div className="flex items-center gap-2 pt-2 pb-8">
                        <img
                          src="/user-red.png"
                          alt={`${index}-alert-user`}
                          className="w-[18px] h-[18px]"
                        />
                        <span className="text-sm text-[#990000]">
                          Alert by{" "}
                          <span className="font-bold">
                            {alert?.createdBy?.firstName}{" "}
                            {alert?.createdBy?.lastName}
                          </span>{" "}
                          at{" "}
                          <span className="font-bold">
                            {alert?.company?.locationName
                              ? alert?.company?.locationName
                              : alert?.company?.companyName}
                          </span>
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
          : null}

        {caseReport?.outcomes?.length
          ? caseReport?.outcomes?.length > 0 &&
            caseReport?.outcomes?.map((outcome) => (
              <table key={outcome?._id} width="100%" className="mt-10">
                <tbody>
                  <tr>
                    <td>
                      <h1 className="text-black text-lg font-bold">
                        {outcome?.title}{" "}
                        <span className="text-gray-400 text-sm">
                          ({outcome?.goalStats?.label} -{" "}
                          {outcome?.goalStats?.percentComplete}% complete)
                        </span>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="border-b-5 pb-2 border-black"
                    ></td>
                  </tr>
                  <tr>
                    <td className="pt-4 font-bold text-lg text-[#990000]">
                      Status:{" "}
                      {outcome?.status ? (
                        <span>{outcome?.status}</span>
                      ) : (
                        <span className="text-red-600">Not Provided</span>
                      )}
                    </td>
                  </tr>

                  {outcome?.sections?.length
                    ? outcome?.sections?.length > 0 &&
                      outcome?.sections?.map((section) => (
                        <React.Fragment key={section?.section?._id}>
                          <tr>
                            <td className="pt-8">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xl text-gray-800">
                                  {section?.section?.name}
                                </span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2}>
                              <div className="border-b border-dotted pb-2"></div>
                            </td>
                          </tr>
                          {section?.goals?.length
                            ? section?.goals?.length > 0 &&
                              section?.goals?.map((goal, index) => (
                                <React.Fragment key={goal?.goal?._id}>
                                  <tr>
                                    <td className="pt-2 px-4 text-sm">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          className=""
                                          readOnly
                                        />
                                        <span>{goal?.goalName}</span>
                                      </div>
                                    </td>
                                  </tr>
                                  {goal?.steps?.length
                                    ? goal?.steps?.length > 0 &&
                                      goal?.steps?.map((step, index) => (
                                        <React.Fragment key={index}>
                                          <tr>
                                            <td className="pt-2 px-10 text-sm">
                                              <div className="flex items-center justify-between gap-2 border border-gray-400 px-2 py-1">
                                                <div className="flex items-center gap-2">
                                                  <input
                                                    type="checkbox"
                                                    className=""
                                                    readOnly
                                                  />
                                                  <span>{step?.stepName}</span>
                                                </div>

                                                {step?.dueDate && (
                                                  <span className="text-[#990000]">
                                                    {formatDate(
                                                      toZonedTime(
                                                        step?.dueDate,
                                                        userTimeZone
                                                      ),
                                                      "MMM d, yyyy"
                                                    )}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        </React.Fragment>
                                      ))
                                    : null}
                                  {index !== section?.goals?.length - 1 && (
                                    <tr>
                                      <td colSpan={2}>
                                        <div className="border-b border-dotted pb-2"></div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))
                            : null}

                          <tr>
                            <td colSpan={2}>
                              <div className="border-b border-dotted pb-2"></div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))
                    : null}
                </tbody>
              </table>
            ))
          : null}
      </div>
    </div>
  );
};

export default CaseReportPrint;
