import type { CaseType } from "@/types/case";
import * as Yup from "yup";
import { LABELS, STATIC_TEXTS } from "@/utils/textConstants";
import type { Column } from "react-table";

export const headerItems = [
  { name: "Kiosk", icon: "fluent:kiosk-24-regular" },
  { name: "Invite", icon: "mdi:account-plus" },
  { name: "Feedback", icon: "mdi:comment-text" },
  { name: "Help", icon: "mdi:help-circle" },
  { name: "Contact admin", icon: "mdi:phone" },
];

export const sidebarItems = [
  {
    to: "/",
    label: "Home",
    icon: "mdi:home",
  },
  {
    to: "/myAgency",
    label: "My Agency",
    icon: "mdi:office-building",
    sublinks: [
      { to: "/myAgency", label: "General" },
      { to: "/myAgency/cases", label: "Cases" },
      { to: "/myAgency/assistance", label: "Assistance" },
      { to: "/myAgency/categories", label: "Categories" },
      { to: "/myAgency/barcodes", label: "Barcodes" },
      { to: "/myAgency/services", label: "Services" },
      { to: "/myAgency/referrals", label: "Referrals" },
      { to: "/myAgency/bed-managements", label: "Bed Managements" },
      { to: "/myAgency/assessments", label: "Assessments" },
      { to: "/myAgency/reports", label: "Reports" },
    ],
  },
  {
    to: "/agencies",
    label: "Agencies",
    icon: "mdi:office-building-outline",
    sublinks: [
      { to: "/agencies", label: "Agencies" },
      { to: "/agencies/agents", label: "Agents" },
      { to: "/agencies/services", label: "Services" },
    ],
  },
  {
    to: "/events",
    label: "Occurrences",
    icon: "mdi:calendar-star",
    sublinks: [
      { to: "/events", label: "Occurrences" },
      { to: "/events/locations", label: "Locations" },
      { to: "/events/activities", label: "Activities" },
    ],
  },
  {
    to: "/admin/settings",
    label: "Admin",
    icon: "mdi:account-cog",
    sublinks: [
      { to: "/admin/settings", label: "Settings" },
      { to: "/admin/agent-requests", label: "Agent Requests" },
      { to: "/admin/categories", label: "Categories" },
      { to: "/admin/barcode", label: "Barcode" },
      { to: "/admin/outcomes", label: "Outcomes" },
      { to: "/admin/assessments", label: "Assessments" },
    ],
  },
];

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  count?: number;
  color?: string;
}

export const MAX_FILE_SIZE_MB = 5;

export const statusOptions = ["Pending", "Approved", "Denied"];

export const dataQualityOptions = [
  { value: "fullDobReported", label: "Full DOB reported" },
  {
    value: "approximatePartialDobReported",
    label: "Approximate or partial DOB reported",
  },
  { value: "clientDoesntKnow", label: "Client Doesn't know" },
  { value: "clientPrefresNotToAns", label: "Client prefers not to answer" },
  { value: "dataNotCollected", label: "Data Not Collected" },
];

export const nameDataQualityOptions = [
  { value: "fullSsnReported", label: "Full Name reported" },
  {
    value: "streetPartialCodeNameeported",
    label: "Partial, street name, or code name reported",
  },
  { value: "clientDoesntKnow", label: "Client Doesn't know" },
  { value: "dataNotCollected", label: "Data Not Collected" },
  { value: "clientPreferNotToAns", label: "Client prefers not to answer" },
];

export const ssnDataQualityOptions = [
  { value: "fullSsnReported", label: "Full SSN reported" },
  {
    value: "approximateORPartialSSNReported",
    label: "Approximate or partial SSN reported",
  },
  { value: "clientDoesntKnow", label: "Client Doesn't know" },
  { value: "dataNotCollected", label: "Data Not Collected" },
  { value: "clientPreferNotToAns", label: "Client prefers not to answer" },
];

export const countyOptions = [
  { value: "Hinds", label: "Hinds" },
  { value: "Rankin", label: "Rankin" },
  { value: "Madison", label: "Madison" },
  { value: "Simpson", label: "Simpson" },
  { value: "Copiah", label: "Copiah" },
];

export const CASES_PER_PAGE = 10;
export const OVERDUE_TASKS_PER_PAGE = 3;
export const HISTORY_PAGE_SIZE = 2;
export const MergeFields: (
  | keyof CaseType
  | { field: keyof CaseType; subFields: string[] }
)[] = [
  "firstName",
  "middleName",
  "lastName",
  "suffix",
  "maidenName",
  "nickname",
  "dateOfBirth",
  "ssn",
  "headOfHousehold",
  "dobDataQuality",
  "nameDataQuality",
  "children",
  "ssnDataQuality",
  "email",

  {
    field: "streetAddress",
    subFields: ["address", "apt", "city", "state", "zip", "county"],
  },
  {
    field: "mailingAddress",
    subFields: ["address", "apt", "city", "state", "zip", "county"],
  },

  "gender",
  "other",
  "raceAndEthnicity",
  "education",
  "employment",
  "maritalStatus",
  "governmentBenefits",
  "wePlayGroups",
  "wePlayGroupsOther",
];

export const phoneRegex = /^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;
export const zipRegex = /^\d{5}(-\d{4})?$/;
export const ITEMS_PER_PAGE = 5;
export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];
export const BLOCKED_FILE_EXTENSIONS = [".exe", ".sh", ".js", ".html"];

export const alertValidationSchema = Yup.object({
  description: Yup.string().required(STATIC_TEXTS.ALERTS.DESCRIPTION_REQUIRED),
  sendEmail: Yup.boolean(),
});
export const visibleTo = ["All Agencies", "Agency Only"];

export const ORGANIZATION_TYPES = [
  { value: "Non-profit", label: "Non-profit" },
  { value: "Government", label: "Government" },
  { value: "Faith-based", label: "Faith-based" },
  { value: "Other", label: "Other" },
  { value: "Business", label: "Business" },
  { value: "Church", label: "Church" },
];
export const categoryOptions: any[] = [
  {
    _id: "mock-cat-1",
    userId: "mock-user-1",
    section: "Financial Assistance",
    name: "Rent/Mortgage",
    description: "Mock rent/mortgage assistance",
    defaultAmount: null,
    defaultUnit: "Dollars",
    fixedValue: "",
    createdBy: {
      _id: "mock-creator-1",
      firstName: "Mock",
      lastName: "User",
      propertyRole: "Agent",
    },
    visibleTo: "All Agencies",
    createdAt: new Date().toISOString(),
    caseName: null,
    isRelatedCase: false,
  },
  {
    _id: "mock-cat-2",
    userId: "mock-user-2",
    section: "Financial Assistance",
    name: "Utilities",
    description: "Mock utilities assistance",
    defaultAmount: null,
    defaultUnit: "Dollars",
    fixedValue: "",
    createdBy: {
      _id: "mock-creator-2",
      firstName: "Mock",
      lastName: "User",
      propertyRole: "Agent",
    },
    visibleTo: "All Agencies",
    createdAt: new Date().toISOString(),
    caseName: null,
    isRelatedCase: false,
  },
  {
    _id: "mock-cat-3",
    userId: "mock-user-3",
    section: "Medical Assistance",
    name: "Prescription Medication",
    description: "Mock prescription assistance",
    defaultAmount: null,
    defaultUnit: "Dollars",
    fixedValue: "",
    createdBy: {
      _id: "mock-creator-3",
      firstName: "Mock",
      lastName: "User",
      propertyRole: "Agent",
    },
    visibleTo: "All Agencies",
    createdAt: new Date().toISOString(),
    caseName: null,
    isRelatedCase: false,
  },
  {
    _id: "mock-cat-4",
    userId: "mock-user-4",
    section: "Food Assistance",
    name: "Food Bank",
    description: "Mock food bank assistance",
    defaultAmount: null,
    defaultUnit: "Boxes/Bags",
    fixedValue: "",
    createdBy: {
      _id: "mock-creator-4",
      firstName: "Mock",
      lastName: "User",
      propertyRole: "Agent",
    },
    visibleTo: "All Agencies",
    createdAt: new Date().toISOString(),
    caseName: null,
    isRelatedCase: false,
  },
];

export const ReferralColumns: Column<any>[] = [
  {
    Header: LABELS.REFERRALS.DATE,
    accessor: "date",
  },
  {
    Header: LABELS.REFERRALS.CASE,
    accessor: "caseName",
  },
  {
    Header: LABELS.REFERRALS.CATEGORY,
    accessor: "category",
  },
  {
    Header: LABELS.REFERRALS.AMOUNT,
    accessor: "amount",
  },
  {
    Header: LABELS.REFERRALS.STATUS,
    accessor: "status",
  },
  {
    Header: LABELS.REFERRALS.AGENCY,
    accessor: "agency",
  },
];

export const COUNTRY = [
  {
    label: "Copiah",
    value: "copiah",
  },
  {
    label: "Hinds",
    value: "hinds",
  },
  {
    label: "Madison",
    value: "madison",
  },
  {
    label: "Rankin",
    value: "rankin",
  },
  {
    label: "Simpson",
    value: "simpson",
  },
];

export const ACIVITY_TYPE = [
  {
    label: "Whole Number",
    value: "whole_number",
  },
  {
    label: "Number with decimal places (ex. 1.25 hours)",
    value: "decimal_number",
  },
  {
    label: "Checkbox",
    value: "checkbox",
  },
];

export const GOAL_SET_STATUS = [
  {
    label: "No Status",
    value: "NO_STATUS",
  },
  {
    label: "In Process",
    value: "IN_PROCESS",
  },
  {
    label: "Closed",
    value: "CLOSED",
  },
];

export const GOAL_SET_VISIBLE_TO = [
  {
    label: "All Agencies",
    value: "All Agencies",
  },
  {
    label: "My Agency",
    value: "Agency Only",
  },
];

export const agencySublinks = [
  { to: (id: string) => `/agencies/${id}`, label: "General" },
  { to: (id: string) => `/agencies/${id}/cases`, label: "Cases" },
  { to: (id: string) => `/agencies/${id}/assistance`, label: "Assistance" },
  { to: (id: string) => `/agencies/${id}/categories`, label: "Categories" },
  { to: (id: string) => `/agencies/${id}/barcodes`, label: "Barcodes" },
  { to: (id: string) => `/agencies/${id}/services`, label: "Services" },
  { to: (id: string) => `/agencies/${id}/referrals`, label: "Referrals" },
  {
    to: (id: string) => `/agencies/${id}/bed-managements`,
    label: "Bed Managements",
  },
  { to: (id: string) => `/agencies/${id}/assessments`, label: "Assessments" },
];

export const NetworkSettingsTabs = [
  "General",
  "Units",
  "Counties",
  "Request Status",
];

export const categoryTypes = [
  {
    icon: "mdi:earth",
    color: "text-green-700",
    label: "Global Category",
    description:
      "Available to all agencies and managed by network administrators",
  },
  {
    icon: "mdi:folder",
    color: "text-yellow-600",
    label: "Agency Category",
    description:
      "Available to a specific agency and managed by that agency and network administrators",
  },
];

export const FIELD_TYPES = [
  { value: "checkbox", label: STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_CHECKBOX },
  { value: "date", label: STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_DATE },
  { value: "radio", label: STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_RADIO },
  { value: "dropdown", label: STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_DROPDOWN },
  {
    value: "whole_number",
    label: STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_WHOLE_NUMBER,
  },
  {
    value: "number_with_decimal",
    label: STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_DECIMAL_NUMBER,
  },
  { value: "text_input", label: STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_TEXT },
  {
    value: "multi_line_text_input",
    label: STATIC_TEXTS.ASSESSMENT.FIELD_TYPE_TEXTAREA,
  },
];

export const MIN_COMMENT_LENGTH = 3;
export const MAX_COMMENT_LENGTH = 200;
export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const reportCards = [
  {
    id: "assistance",
    title: "Assistance",
    description: "View all assistance provided by your agency.",
  },
  {
    id: "cases",
    title: "Cases",
    description: "View all cases created by your agency.",
  },
  {
    id: "referrals",
    title: "Referrals",
    description:
      "View all referrals created by your agency with detailed status tracking and deadline management.",
  },
  {
    id: "categories",
    title: "Categories",
    description:
      "View all categories and associated assistance records for your agency.",
  },
  {
    id: "events",
    title: "Events",
    description: "View all events for your agency.",
  },
  // {
  //   id: 'appointments',
  //   title: "Appointments",
  //   description: "View all appointments for your agency.",
  // },
];

export const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const userGender = [
  "Woman (Girl, or Child)",
  "Man (Boy, or Child)",
  "Culturally Specific Identity (e.g., Two-Spirit)",
  "Different Identity",
  "Non-binary",
  "Transgender",
  "Questioning",
  "Client Doesn't Know",
  "Client Prefers Not To Answer",
  "Data Not Collected",
];
export const sortOptionsForEvents = [
  { value: "createdAt", label: "Newest to Oldest", direction: "desc" },
  { value: "createdAt", label: "Oldest to Newest", direction: "asc" },
  {
    value: "updatedAt",
    label: "Last Updated (Newest First)",
    direction: "desc",
  },
  {
    value: "updatedAt",
    label: "Last Updated (Oldest First)",
    direction: "asc",
  },
  { value: "title", label: "Title (A-Z)", direction: "asc" },
  { value: "title", label: "Title (Z-A)", direction: "desc" },
  { value: "dateTime", label: "Date (Earliest First)", direction: "asc" },
  { value: "dateTime", label: "Date (Latest First)", direction: "desc" },
  { value: "facilitator", label: "Facilitator (A-Z)", direction: "asc" },
  { value: "facilitator", label: "Facilitator (Z-A)", direction: "desc" },
];
