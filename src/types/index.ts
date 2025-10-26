import type { GHLUserData } from "@/types/user";
import type { CaseType, Pagination } from "@/types/case";

export interface HeadreProps {
  user: any;
}
export interface Agency {
  name: string;
  agents: string;
}

export interface Service {
  _id: string;
  userId: string;
  section: string;
  name: string;
  description: string;
  taxonomyCode: string;
  providedBy: string;
  createdAt: string;
  sectionId: {
    _id: string;
    name: string;
  };
  companyId: string | null;
  companyName: string;
  locationId: string | null;
  agencyInfo: {
    name: string;
    address: string;
    phone: string;
    officeHours: {
      startTime: string;
      endTime: string;
      additionalDetails: string;
      _id: string;
    }[];
  };
}

export interface ServicesResponse {
  results: Service[];
  pagination: Pagination;
}

export interface Agent {
  name: string;
  email: string;
  agency: string;
  phone?: string;
  altPhone?: string;
  lastLogin: string;
}
export interface FooterProps {
  count: number;
  label: string;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Optional items per page functionality
  itemsPerPage?: number;
  onItemsPerPageChange?: (newItemsPerPage: number) => void;
  showItemsPerPage?: boolean;
}
export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
  noPadding?: boolean;
}
export interface AlphabetFilterProps {
  selectedLetter: string | null;
  onLetterSelect: (letter: string | null) => void;
  className?: string;
}

export interface BulletinProps {
  title: string;
  content: string;
  postedBy: string;
  date: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
export interface StatCardProps {
  value: string;
  label: string;
  bgColor: string;
}
export interface Agent {
  id?: number;
  name: string;
  email: string;
  agency: string;
  phone?: string;
  altPhone?: string;
  lastLogin: string;
  image?: string | null;
  showSecurityQuestion?: boolean;
  from?: string;
  status?: string;
}

export interface BulletinFormValues {
  title: string;
  description: string;
  expirationDate: string;
  sendEmail: boolean;
}

export interface AssistanceRecord {
  _id: string;
  caseId: string;
  amount: number;
  unit: string;
  category: {
    _id: string;
    name: string;
    section: string;
    sectionId?: {
      _id: string;
      name: string;
    };
  };
  description: string;
  visibleTo: string;
  createdBy: {
    name: string;
    userId: string;
  };
  createdAt: string;
  caseName: string;
  isRelatedCase?: boolean;
  attachment?: {
    filename: string;
    url: string;
  };
  attachedFile?: {
    filename: string;
    url: string;
  };
  company?: {
    companyId?: string;
    companyName?: string;
    locationId?: string;
    locationName?: string;
  };
  companyId?: string | null;
  locationId?: string | null;
}
export type AssistanceFormValues = Omit<
  AssistanceRecord,
  | "_id"
  | "caseId"
  | "createdAt"
  | "createdBy"
  | "caseName"
  | "isRelatedCase"
  | "attachment"
  | "amount"
> & {
  amount: string;
  attachment?: File;
  category: string;
};

export const canEditDelete = (currentUser: GHLUserData, author?: string) => {
  if (!currentUser) return false;

  if (
    currentUser.propertyRole === "Agency Administrator" ||
    currentUser.propertyRole === "Network Administrator"
  ) {
    return true;
  }

  if (currentUser.propertyRole === "Agent" && author === currentUser.userName) {
    return true;
  }
  return false;
};
export interface Category {
  _id?: string;
  userId?: string;
  userType?: string;
  companyId?: string | null;
  locationId?: string | null;
  section?: string;
  sectionId?: {
    _id: string;
    name: string;
  };
  name: string;
  description: string;
  defaultAmount: number | null;
  defaultUnit: string | null;
  fixedValue: string | null;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    companyName: string;
  };
  createdAt?: string;
  caseName?: string | null;
  isRelatedCase?: boolean;
  visibleTo?: "All Agencies" | "Agency Only";
}

export interface SimplifiedCategory {
  _id: string;
  section: string;
  name: string;
}
export interface ReferralRecord {
  attachedFile: string | null;
  _id: string;
  caseId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  unit: string;
  category: {
    _id: string;
    name: string;
  };
  description: string;
  status: string;
  requestDeadline: string;
  visibleTo: string;
  createdBy: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  statusHistory: any[];
  requestedAssistance: any[];
  createdAt: string;
  updatedAt: string;
  isRelatedCase: boolean;
}

export interface AgencyReferralRecord {
  attachedFile: string | null;
  _id: string;
  caseId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  unit: string | { _id: string; name: string };
  service: string | null;
  category: {
    _id: string;
    sectionId: {
      _id: string;
      name: string;
    };
    name: string;
  };
  description: string;
  status: string;
  requestDeadline: string;
  visibleTo: string;
  createdBy: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  companyId: string | null;
  locationId: string | null;
  statusHistory: any[];
  requestedAssistance: any[];
  createdAt: string;
  updatedAt: string;
  isRelatedCase: boolean;
  company: {
    companyId?: string;
    companyName?: string;
    locationId?: string;
    locationName?: string;
  };
}

export interface ReferralFormValues {
  amount: number;
  unit: string;
  category: string;
  description: string;
  referredAgencyService: string;
  visibleTo: string;
  attachedFile?: File | null;
  attachment?: File | null;
  deadlineDate?: string;
  status?: string;
}

export interface Options {
  label: string;
  value: string;
}

export interface ServiceOption {
  category: string;
  options: Options[];
}

export interface AssistanceCategory {
  _id: string;
  name: string;
  section: string;
}
export interface AssistanceService {
  _id: string;
  name: string;
  description?: string;
}

export interface AssistanceCaseId {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface AssistanceCreatedBy {
  _id?: string;
  userId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}
export interface AssistanceReferralResponse {
  attachedFile?: { filename: string; url: string } | null;
  attachment?: { filename: string; url: string } | null;
  _id: string;
  caseId: string | { _id: string; firstName: string; lastName: string };
  amount: number;
  unit: string | { _id: string; name: string };
  unitName?: string;
  service?: {
    _id: string;
    name: string;
    description?: string;
    companyId?: string;
    locationId?: string;
    providedBy?: string;
    companyName?: string;
    agencyInfo?: {
      name: string;
      address: string;
      phone: string;
      officeHours: {
        startTime: string;
        endTime: string;
        additionalDetails: string;
        _id: string;
      }[];
    };
    sectionId?: { _id: string; name: string };
  };
  category: { _id: string; section: string; name: string };
  company?: { companyId: string; companyName: string };
  companyId?: string | null;
  locationId?: string | null;
  description: string;
  status?: string | { _id: string; name: string };
  requestDeadline?: string;
  visibleTo: string;
  createdBy: {
    _id?: string;
    userId: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  statusName?: string;
  statusHistory?: Array<{
    status: string;
    statusNotes?: string;
    updatedBy?: { name: string; userId: string };
    updatedAt?: string;
    date?: string;
    note?: string;
  }>;
  requestedAssistance?: any[];
  createdAt: string;
  updatedAt?: string;
  type: string;
  caseName?: string;
  isRelatedCase?: boolean;
}

export interface Event {
  location?: string;
  eventType?: string;
  eventTitle?: string;
  description?: string;
  dateAndTime?: string;
  facilatator?: string;
}

export interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export interface ManageEventTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface Location {
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  agency?: string;
}

export interface Activity {
  name?: string;
  type?: string;
}
export interface Country {
  _id: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface Unit {
  _id: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface RequestStatus {
  _id: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}
export interface EventActivity {
  name: string;
  type: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventActivityData {
  data: EventActivity[];
  pagination: Pagination;
}

export type CountryType = {
  _id: string;
  name: string;
};

export interface EventLocation {
  _id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | CountryType | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  description: string | null;
  dedicateToCompany?: string;
  createdAt: string;
  updatedAt: string;
  sameAgency?: boolean;
}

export interface EventLocationData {
  data: EventLocation[];
  pagination: Pagination;
}

export interface EventTypeData {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface CategorySection {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilteredServiceSection {
  _id: string;
  name: string;
}

export interface FilteredService {
  _id: string;
  userId: string;
  companyId: string | null;
  locationId: string;
  sectionId: FilteredServiceSection;
  name: string;
  description: string;
  taxonomyCode: string;
  providedBy: string;
  createdAt: string;
  updatedAt: string;
  companyName: string;
}

export interface EventType {
  _id: string;
  name: string;
}

export interface Facilitator {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Activity {
  activityId: {
    _id: string;
    name: string;
    type: string;
  } | null;
  value: number;
}

export interface EventData {
  _id: string;
  location: EventLocation;
  eventType: EventType;
  title: string;
  description: string;
  dateTime: string;
  facilitator: Facilitator;
  file: EventFile | string;
  activities: Activity[];
  sameAgency?: boolean;
}

export interface EventFile {
  filename: string;
  url: string;
  fileSize: number;
}
export interface EventsData {
  data: EventData[];
  pagination: Pagination;
}

export interface OutcomeSectionData {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export type Assessment = {
  id: number;
  assessor: {
    name: string;
    agency: string;
  };
  date: string;
  text: string;
  comments: any[];
  modifications: number;
  answers?: Record<string, any>;
};

export interface AssessmentField {
  fieldId: string;
  name: string;
  value: string | number | boolean | null;
  type: string;
  options: string[];
  isRequired: boolean;
}

export interface AssessmentByDate {
  assessmentId: string;
  createdAt: string; // ISO string
  fields: AssessmentField[];
}

export interface DashboardStatsResponse {
  companyId: string;
  companyName: string;
  agentCount: number;
  caseCount: number;
  serviceCount: number;
  dueOutcomeGoals: {
    caseId: string;
    goalName: string;
    dueDate: string;
    caseFirstName: string;
    caseLastName: string;
    sectionName: string;
  }[];
  dueOutcomeGoalsPagination: Pagination;
  appointmentStats: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    latestAppointments: {
      id: string;
      appointmentName: string;
      startTime: string;
      endTime: string;
      status: string;
      caseName: string;
      caseId: string;
    }[];
  };
}

export interface AssistanceReport {
  companyId: string;
  companyName: string;
  assistance: {
    attachment: {
      filename: string;
      url: string;
    };
    _id: string;
    caseId: CaseType;
    amount: number;
    unit: {
      _id: string;
      name: string;
    };
    category: {
      _id: string;
      userId: string;
      userType: string;
      companyId: string;
      locationId: string;
      sectionId: {
        _id: string;
        name: string;
      };
      name: string;
      description: string;
      defaultAmount: number;
      defaultUnit: string;
      fixedValue: string;
      createdBy: string;
      visibleTo: string;
    };
    description: string;
    visibleTo: string;
    companyId: string;
    locationId: string;
    createdBy: {
      _id: string;
      userId: string;
      firstName: string;
      lastName: string;
    };
    company: {
      locationId: string;
      locationName: string;
      companyId: string;
      companyName: string;
    };
    createdAt: string;
  }[];
}

// Enhanced Assistance Report Types
export interface AssistanceReportFilters {
  // Date filters
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Amount filters
  amountRange?: {
    minAmount?: number;
    maxAmount?: number;
  };

  // Demographic filters
  demographics?: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
  };

  // Geographic filters
  location?: {
    county?: string;
    zipCode?: string;
    city?: string;
  };

  // Other filters
  createdBy?: string;
  categoryId?: string;
}

export interface AssistanceReportFieldSelection {
  // Ordering
  orderBy?: string;
  orderDirection?: "asc" | "desc";

  // Report Sections
  includeAssistanceSummary?: boolean;
  includeAssistanceRecord?: boolean;

  // Summary Fields
  summaryAssistanceAmount?: boolean;
  summaryAssistanceCount?: boolean;
  summaryCaseCount?: boolean;
  summaryHouseholdCount?: boolean;
  summaryAgeRanges?: boolean;
  summaryHouseholdAgeRanges?: boolean;

  // Case Fields
  caseNumber?: boolean;
  caseFullName?: boolean;
  caseCounty?: boolean;
  caseStreetAddress?: boolean;
  caseDateOfBirth?: boolean;
  casePhoneNumbers?: boolean;
  caseEntryDate?: boolean;
  casePersonalIncome?: boolean;

  // Assistance Fields
  assistanceDate?: boolean;
  assistanceAgentName?: boolean;
  assistanceAgencyName?: boolean;
  assistanceCategory?: boolean;
  assistanceAmount?: boolean;
  assistanceUnit?: boolean;
  assistanceDescription?: boolean;
  assistanceOtherFields?: boolean;
}

export interface AssistanceReportSummary {
  totalAssistanceAmount?: number;
  totalAssistanceCount?: number;
  uniqueCaseCount?: number;
  uniqueHouseholdCount?: number;
  ageRanges?: {
    "0-17": number;
    "18-24": number;
    "25-34": number;
    "35-44": number;
    "45-54": number;
    "55+": number;
  };
  householdAgeRanges?: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5+": number;
  };
}

export interface AssistanceReportRecord {
  caseNumber?: string;
  caseFullName?: string;
  caseCounty?: string;
  caseStreetAddress?: string;
  caseDateOfBirth?: string;
  casePhoneNumbers?: string[];
  caseEntryDate?: string;
  casePersonalIncome?: number;
  assistanceDate?: string;
  assistanceAgentName?: string;
  assistanceAgencyName?: string;
  assistanceCategory?: string;
  assistanceAmount?: number;
  assistanceUnit?: string;
  assistanceDescription?: string;
  assistanceFundingSource?: string;
}

export interface EnhancedAssistanceReport {
  summary?: AssistanceReportSummary;
  records?: AssistanceReportRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: AssistanceReportFilters;
  fieldSelection: AssistanceReportFieldSelection;
}

// Enhanced Case Report Types
export interface CaseReportFilters {
  // Date filters
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Demographic filters
  demographics?: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    maritalStatus?: string;
  };

  // Geographic filters
  location?: {
    county?: string;
    zipCode?: string;
    city?: string;
    state?: string;
  };

  // Agent/Staff filters
  createdBy?: string;
}

export interface CaseReportFieldSelection {
  // Ordering
  orderBy?: string;
  orderDirection?: "asc" | "desc";

  // Report Sections
  includeReportFilters?: boolean;
  includeCaseSummary?: boolean;
  includeCaseRecords?: boolean;

  // Case Summary Fields
  summaryTotalCases?: boolean;
  summaryTotalAssistanceAmount?: boolean;
  summaryTotalAssistanceCount?: boolean;
  summaryAgeRanges?: boolean;
  summaryGenderDistribution?: boolean;
  summaryHouseholdSizes?: boolean;

  // Case Record Fields
  caseNumber?: boolean;
  caseEntryDate?: boolean;
  caseEntryAgent?: boolean;
  caseEntryAgency?: boolean;
  caseFullName?: boolean;
  caseMaidenName?: boolean;
  caseNickname?: boolean;
  caseDateOfBirth?: boolean;
  caseAge?: boolean;
  caseSSNumber?: boolean;
  caseStreetAddress?: boolean;
  caseCounty?: boolean;
  caseMailingAddress?: boolean;
  casePersonalIncome?: boolean;
  caseHouseholdIncome?: boolean;
  casePersonalExpenses?: boolean;
  caseHouseholdExpenses?: boolean;
  casePhoneNumbers?: boolean;
  caseEmail?: boolean;
  caseIdentificationNumbers?: boolean;
  caseDemographics?: boolean;
  caseAssistanceCount?: boolean;
  caseAssistanceAmount?: boolean;
  caseLastAssistanceDate?: boolean;
  caseHouseholdSize?: boolean;
  caseOtherInfo?: boolean;
}

export interface CaseReportSummary {
  totalCases?: number;
  totalAssistanceAmount?: number;
  totalAssistanceCount?: number;
  locationInfo?: {
    locationId: string;
    locationName: string;
  };
  ageRanges?: {
    "0-17": number;
    "18-24": number;
    "25-34": number;
    "35-44": number;
    "45-54": number;
    "55+": number;
  };
  genderDistribution?: {
    [key: string]: number;
  };
  householdSizes?: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5+": number;
  };
}

export interface CaseReportRecord {
  caseNumber?: string;
  caseEntryDate?: string;
  caseEntryAgent?: string;
  caseEntryAgency?: string;
  caseFullName?: string;
  caseMaidenName?: string;
  caseNickname?: string;
  caseDateOfBirth?: string;
  caseAge?: number;
  caseSSNumber?: string;
  caseStreetAddress?: string;
  caseCounty?: string;
  caseMailingAddress?: string;
  casePersonalIncome?: number;
  caseHouseholdIncome?: number;
  casePersonalExpenses?: number;
  caseHouseholdExpenses?: number;
  casePhoneNumbers?: string[];
  caseEmail?: string;
  caseIdentificationNumbers?: string[];
  caseDemographics?: {
    education?: string;
    employment?: string;
    maritalStatus?: string;
    raceAndEthnicity?: string[];
  };
  caseAssistanceCount?: number;
  caseAssistanceAmount?: number;
  caseLastAssistanceDate?: string;
  caseHouseholdSize?: number;
  caseOtherInfo?: {
    suffix?: string;
    headOfHousehold?: boolean;
    dobDataQuality?: string;
    nameDataQuality?: string;
    children?: string;
    ssnDataQuality?: string;
    other?: string[];
    raceAndEthnicity?: string[];
    governmentBenefits?: string[];
    wePlayGroups?: string[];
    wePlayGroupsOther?: string;
    visibleTo?: string;
    caseImage?: string[];
    createdAt?: string;
    updatedAt?: string;
    middleName?: string;
  };
}

export interface EnhancedCaseReport {
  summary?: CaseReportSummary;
  records?: CaseReportRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: CaseReportFilters;
  fieldSelection: CaseReportFieldSelection;
}

export interface CaseReport {
  companyId: string;
  companyName: string;
  cases: CaseType[];
}

export interface CategoriesReport {
  companyId: string;
  companyName: string;
  categories: {
    _id: string;
    userId: string;
    userType: string;
    companyId: string | null;
    locationId: string;
    sectionId: {
      _id: string;
      name: string;
    };
    name: string;
    description: string;
    defaultAmount: number;
    defaultUnit: {
      _id: string;
      name: string;
    };
    fixedValue: string;
    createdBy: {
      _id: string;
      companyId: string;
      firstName: string;
      lastName: string;
      propertyRole: string;
      userType: string;
      activeLocation: string;
    };
    visibleTo: string;
    createdAt: string;
  }[];
}

export interface EventsReport {
  companyId: string;
  companyName: string;
  events: EventData[];
}
// @/types/barcode.ts
export interface AssistanceBarcode {
  _id: string;
  barcodeName: string;
  assistanceCategory: {
    _id: string;
    name: string;
    sectionId?: {
      _id: string;
      name: string;
    };
  };
  assistanceAmount: string;
  allowEditAmount: boolean;
  assistanceUnit: {
    _id: string;
    name: string;
  };
  assistanceDescription: string;
  visibleTo: string;
  userId: string;
  userType: string;
  companyId: string;
  companyName: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ReferralReportFilters {
  // Date filters
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  deadlineRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Status filters
  status?: string;

  // Amount filters
  amountRange?: {
    minAmount?: number;
    maxAmount?: number;
  };
  requestedAmountRange?: {
    minAmount?: number;
    maxAmount?: number;
  };

  // Service filters
  serviceType?: string;
  categoryId?: string;
  unitId?: string;

  // Agent/Staff filters
  createdBy?: string;
  agencyId?: string;
  locationId?: string;
}

export interface ReferralReportFieldSelection {
  // Ordering
  orderBy?: string;
  orderDirection?: "asc" | "desc";

  // Report Sections
  includeReportFilters?: boolean;
  includeReferralSummary?: boolean;
  includeReferralRecords?: boolean;

  // Summary Fields
  summaryTotalReferrals?: boolean;
  summaryReferralsByStatus?: boolean;
  summaryAmountStatistics?: boolean;
  summaryServiceDistribution?: boolean;
  summaryDeadlineStatistics?: boolean;

  // Referral Record Fields
  referralCase?: boolean;
  referralAmount?: boolean;
  referralUnit?: boolean;
  referralService?: boolean;
  referralCategory?: boolean;
  referralDescription?: boolean;
  referralStatus?: boolean;
  referralStatusNotes?: boolean;
  referralDeadline?: boolean;
  referralCreatedBy?: boolean;
  referralCreatedDate?: boolean;
  referralStatusHistory?: boolean;
  referralRequestedAssistance?: boolean;
  referralOtherFields?: boolean;
}

export interface ReferralReportSummary {
  totalReferrals?: number;
  referralsByStatus?: {
    [key: string]: number;
  };
  amountStatistics?: {
    totalAmount?: number;
    totalRequestedAmount?: number;
    averageAmount?: number;
    averageRequestedAmount?: number;
    minAmount?: number;
    maxAmount?: number;
  };
  serviceDistribution?: {
    [key: string]: number;
  };
  deadlineStatistics?: {
    overdueReferrals?: number;
    upcomingDeadlines?: number;
    totalWithDeadlines?: number;
    averageDaysUntilDeadline?: number;
  };
  locationInfo?: {
    locationId: string;
    locationName: string;
  };
  companyInfo?: {
    agencyId: string;
    agencyName: string;
  };
}

export interface ReferralReportRecord {
  referralCase?: {
    caseId: string;
    fullName: string;
  };
  referralAmount?: number;
  referralUnit?: string;
  referralService?: string;
  referralCategory?: string;
  referralDescription?: string;
  referralStatus?: string;
  referralStatusNotes?: string;
  referralDeadline?: string;
  referralCreatedBy?: string;
  referralCreatedDate?: string;
  referralStatusHistory?: Array<{
    status: string;
    statusNotes?: string;
    updatedBy?: string;
    updatedAt?: string;
    companyId?: string | null;
    locationId?: string;
    _id?: string;
  }>;
  referralRequestedAssistance?: Array<{
    attachedFile?: {
      filename: string;
      url: string;
    } | null;
    amount: number;
    description: string;
    visibleTo: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
    unit: string;
    category: string;
    agencyName: string;
    createdBy: string;
  }>;
  referralOtherInfo?: {
    visibleTo: string;
    attachedFile?: {
      filename: string;
      url: string;
    } | null;
    daysUntilDeadline: number;
    isOverdue: boolean;
    overdueDays: number;
    totalRequestedAmount: number;
    totalRequestedAssistanceCount: number;
    hasAttachments: boolean;
    isUrgent: boolean;
    deadlineStatus: string;
  };
}

export interface EnhancedReferralReport {
  summary?: ReferralReportSummary;
  records?: ReferralReportRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: ReferralReportFilters;
  fieldSelection: ReferralReportFieldSelection;
}

// Enhanced Category Report Types
export interface CategoryReportFilters {
  // Date filters
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  lastUpdatedRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Category filters
  sectionId?: string;
  unitId?: string;
  amountRange?: {
    minAmount?: number;
    maxAmount?: number;
  };
  visibility?: string;

  // Agent/Staff filters
  createdBy?: string;

  // Usage filters
  usageCount?: {
    minCount?: number;
    maxCount?: number;
  };

  // Additional filters from API response
  category?: {
    minAmount?: string;
    maxAmount?: string;
    unitId?: string;
  };
  usage?: {
    minUsageCount?: string;
    maxUsageCount?: string;
  };
}

export interface CategoryReportFieldSelection {
  // Ordering
  orderBy?: string;
  orderDirection?: "asc" | "desc";

  // Report Sections
  includeReportFilters?: boolean;
  includeCategorySummary?: boolean;
  includeCategoryRecords?: boolean;

  // Category Summary Fields
  summaryTotalCategories?: boolean;
  summaryCategoriesBySection?: boolean;
  summaryUsageStatistics?: boolean;

  // Category Record Fields
  categoryName?: boolean;
  categorySection?: boolean;
  categoryDescription?: boolean;
  categoryDefaultAmount?: boolean;
  categoryDefaultUnit?: boolean;
  categoryCreatedBy?: boolean;
  categoryCreatedDate?: boolean;
  categoryUsageCount?: boolean;
  categoryTotalAmount?: boolean;
  categoryVisibility?: boolean;
}

export interface CategoryReportSummary {
  totalCategories?: number;
  categoriesBySection?: {
    [key: string]: number;
  };
  usageStatistics?: {
    totalUsage?: number;
    averageUsage?: number;
    mostUsed?: {
      _id: string;
      name: string;
      description: string;
      defaultAmount: number;
      defaultUnit: string;
      visibleTo: string;
      createdAt: string;
      sectionData?: {
        _id: string;
        name: string;
      };
      unitData?: {
        _id: string;
        name: string;
      };
      createdByData?: {
        _id: string;
        firstName: string;
        lastName: string;
        userName: string;
      };
      totalUsageCount: number;
      totalAmount: number;
    };
    leastUsed?: {
      _id: string;
      name: string;
      description: string;
      defaultAmount: number;
      defaultUnit: string;
      visibleTo: string;
      createdAt: string;
      sectionData?: {
        _id: string;
        name: string;
      };
      unitData?: {
        _id: string;
        name: string;
      };
      createdByData?: {
        _id: string;
        firstName: string;
        lastName: string;
        userName: string;
      };
      totalUsageCount: number;
      totalAmount: number;
    };
    usageBreakdown?: {
      assistanceUsage: number;
      referralUsage: number;
      referralAssistanceUsage: number;
    };
  };
  locationInfo?: {
    locationId: string;
    locationName: string;
  };
  companyInfo?: {
    agencyId: string;
    agencyName: string;
  };
}

export interface CategoryReportRecord {
  categoryName?: string;
  categorySection?: string;
  categoryDescription?: string;
  categoryDefaultAmount?: number;
  categoryDefaultUnit?: string;
  categoryCreatedBy?: string;
  categoryCreatedDate?: string;
  categoryUsageCount?: number;
  categoryTotalAmount?: number;
  categoryVisibility?: string;
}

export interface EnhancedCategoryReport {
  summary?: CategoryReportSummary;
  records?: CategoryReportRecord[];
  filters: CategoryReportFilters;
  fieldSelection?: CategoryReportFieldSelection;
  userInfo?: {
    userId: string;
    userType: string;
    userName: string;
    agencyName?: string | null;
    subAgencyName?: string | null;
  };
}

// Enhanced Event Report Types
export interface EventReportFilters {
  // Date filters
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Event type filters
  eventTypeId?: string;
  eventLocationId?: string;
  facilitatorId?: string;

  // Agent/Staff filters
  createdBy?: string;
  agencyId?: string;
  locationId?: string;

  // Activity filters
  activityTypeId?: string;
  activityValue?: {
    minValue?: number;
    maxValue?: number;
  };

  // Visibility filter
  eventVisibility?: string;
}

export interface EventReportFieldSelection {
  // Ordering
  orderBy?: string;
  orderDirection?: "asc" | "desc";

  // Report Sections
  includeReportFilters?: boolean;
  includeEventSummary?: boolean;
  includeEventRecords?: boolean;

  // Event Summary Fields
  summaryTotalEvents?: boolean;
  summaryEventsByType?: boolean;
  summaryEventsByLocation?: boolean;
  summaryAttendanceStatistics?: boolean;
  summaryDateRanges?: boolean;

  // Event Record Fields
  eventTitle?: boolean;
  eventType?: boolean;
  eventLocation?: boolean;
  eventDateTime?: boolean;
  eventFacilitator?: boolean;
  eventDescription?: boolean;
  eventActivities?: boolean;
  eventCreatedBy?: boolean;
  eventCreatedDate?: boolean;
}

export interface EventReportSummary {
  totalEvents?: number;
  eventsByType?: {
    [key: string]: number;
  };
  eventsByLocation?: {
    [key: string]: number;
  };
  attendanceStatistics?: {
    totalAttendance?: number;
    averageAttendance?: number;
    maxAttendance?: number;
    minAttendance?: number;
  };
  dateRanges?: {
    earliestEvent?: string;
    latestEvent?: string;
    totalDays?: number;
  };
  locationInfo?: {
    locationId: string;
    locationName: string;
  };
  companyInfo?: {
    agencyId: string;
    agencyName: string;
  };
}

export interface EventReportRecord {
  eventTitle?: string;
  eventType?: string;
  eventLocation?: string;
  eventDateTime?: string;
  eventFacilitator?: string;
  eventDescription?: string;
  eventActivities?: Array<{
    name: string;
    type: string;
    value: string | number | boolean;
  }>;
  eventCreatedBy?: string;
  eventCreatedDate?: string;
  eventVisibility?: string;
}

export interface EnhancedEventReport {
  summary?: EventReportSummary;
  records?: EventReportRecord[];
  filters: EventReportFilters;
  fieldSelection?: EventReportFieldSelection;
  userInfo?: {
    userId: string;
    userType: string;
    userName: string;
    agencyName: string;
    subAgencyName: string | null;
  };
}

// API Response Types for Enhanced Event Report
export interface EventReportApiResponse {
  userInfo: {
    firstName: string;
    lastName: string;
    userType: string;
    locationName: string;
  };
  data: EventReportApiEvent[];
  summary: EventReportApiSummary;
  filters: EventReportApiFilters;
  fieldSection: EventReportApiFieldSection;
}

export interface EventReportApiEvent {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  formattedDate: string;
  formattedTime: string;
  createdAt: string;
  updatedAt: string;
  estimatedAttendance: number;
  duration: string;
  location: {
    _id: string;
    name: string;
    address: string;
    city: string;
  };
  eventType: {
    _id: string;
    name: string;
  };
  facilitator: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  activities: Array<{
    activityId: string;
    name: string;
    type: string;
    value?: string | number | boolean;
  }>;
}

export interface EventReportApiSummary {
  _id: null;
  totalEvents: number;
  totalAttendance: number;
  averageAttendance: number;
  minAttendance: number;
  maxAttendance: number;
  earliestEvent: string;
  latestEvent: string;
  eventsByType: {
    [key: string]: number;
  };
  eventsByLocation: {
    [key: string]: number;
  };
  attendanceStatistics: {
    _id: null;
    totalAttendance: number;
    averageAttendance: number;
    minAttendance: number;
    maxAttendance: number;
  };
  dateRanges: {
    _id: null;
    earliestEvent: string;
    latestEvent: string;
    totalDays: number;
  };
}

export interface EventReportApiFilters {
  startDate?: string;
  endDate?: string;
  eventTypeId?: string;
  eventLocationId?: string;
  facilitatorId?: string;
  activityTypeId?: string;
  visibilityFilter?: string;
  orderBy?: string;
  orderDirection?: string;
  includeReportFilters?: string;
  includeEventSummary?: string;
  includeEventRecords?: string;
  summaryTotalEvents?: string;
  summaryEventsByType?: string;
  summaryEventsByLocation?: string;
  summaryAttendanceStatistics?: string;
  summaryDateRanges?: string;
  eventTitle?: string;
  eventType?: string;
  eventLocation?: string;
  eventDateTime?: string;
  eventDescription?: string;
  eventFacilitator?: string;
  eventActivities?: string;
  eventCreatedBy?: string;
  eventCreatedDate?: string;
}

export interface EventReportApiFieldSection {
  eventTitle: boolean;
  eventType: boolean;
  eventLocation: boolean;
  eventDateTime: boolean;
  eventDescription: boolean;
  eventFacilitator: boolean;
  eventActivities: boolean;
  eventCreatedBy: boolean;
  eventCreatedDate: boolean;
  visibilityFilter: string;
}

// Enhanced Outcome Case Report Types
export interface OutcomeReportFilters {
  // Date filters
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Due date filters
  dueDateRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Status filters
  outcomeStatus?: string;
  goalStatus?: string;
  sectionStatus?: string;

  // Goal filters
  goalType?: string;
  goalCompletionStatus?: string;

  // Agent/Staff filters
  createdBy?: string;
  agencyId?: string;
  locationId?: string;

  // Case filters
  caseId?: string[];
  caseDemographics?: {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    maritalStatus?: string;
  };
}

export interface OutcomeReportFieldSelection {
  // Ordering
  orderBy?: string;
  orderDirection?: "asc" | "desc";

  // Report Sections
  includeReportFilters?: boolean;
  includeOutcomeSummary?: boolean;
  includeOutcomeRecords?: boolean;

  // Outcome Summary Fields
  summaryTotalOutcomes?: boolean;
  summaryOutcomesByStatus?: boolean;
  summaryGoalsByStatus?: boolean;
  summaryCompletionRates?: boolean;
  summaryDueDateStatistics?: boolean;

  // Outcome Record Fields
  outcomeTitle?: boolean;
  outcomeStatus?: boolean;
  outcomeCase?: boolean;
  outcomeSections?: boolean;
  outcomeGoals?: boolean;
  outcomeDueDates?: boolean;
  outcomeCreatedBy?: boolean;
  outcomeCreatedDate?: boolean;
  outcomeComments?: boolean;
}

export interface OutcomeReportSummary {
  totalOutcomes?: number;
  outcomesByStatus?: {
    [key: string]: number;
  };
  goalsByStatus?: {
    [key: string]: number;
  };
  completionRates?: {
    totalGoals?: number;
    completedGoals?: number;
    completionRate?: number;
  };
  dueDateStatistics?: {
    overdue?: number;
    upcoming?: number;
  };
  locationInfo?: {
    locationId: string;
    locationName: string;
  };
}

export interface OutcomeReportRecord {
  id?: string;
  caseId?: string;
  title?: string;
  status?: string;
  case?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
  };
  sections?: Array<{
    section: string;
    sectionName: string;
    goals: Array<{
      _id: string;
      goal?: string;
      goalName: string;
      isCustom: boolean;
      status: string;
      dueDate?: string;
      steps: Array<{
        stepName: string;
        complete: boolean;
        dueDate?: string;
      }>;
      emailNotifications?: any;
      createdBy?: {
        userId: string | null;
      };
      changedBy?: {
        userId: string;
      };
    }>;
  }>;
  totalGoals?: number;
  completedGoals?: number;
  overdueGoals?: number;
  completionRate?: number;
  dueDates?: Array<{
    sectionName: string;
    goalName: string;
    dueDate: string;
    status: string;
  }>;
  createdBy?: {
    userId: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
  comments?: Array<{
    text: string;
    createdBy: {
      userId: string;
      name: string;
    };
    createdAt: string;
    _id: string;
  }>;
}

export interface EnhancedOutcomeReport {
  companyId: string;
  companyName: string;
  locationId: string;
  locationName: string;
  summary: OutcomeReportSummary;
  records: OutcomeReportRecord[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: OutcomeReportFilters;
  fieldSelection: OutcomeReportFieldSelection;
}

// Enhanced Outcome Goals Report Types
export interface OutcomeGoalsReportFilters {
  // Date filters
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Due date filters
  dueDateRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Completion date filters
  completionDateRange?: {
    startDate?: string;
    endDate?: string;
  };

  // Goal filters
  goalId?: string;
  goalName?: string;
  sectionId?: string;
  goalType?: string; // "custom" | "standard"

  // Status filters
  goalStatus?: string;

  // Agent/Staff filters
  createdBy?: string;
  agencyId?: string;
  locationId?: string;
}

export interface OutcomeGoalsReportFieldSelection {
  // Ordering
  orderBy?: string;
  orderDirection?: "asc" | "desc";

  // Report Sections
  includeReportFilters?: boolean;
  includeGoalSummary?: boolean;
  includeGoalRecords?: boolean;

  // Goal Summary Fields
  summaryTotalGoals?: boolean;
  summaryGoalsBySection?: boolean;
  summaryCompletionRates?: boolean;
  summaryDueDateStatistics?: boolean;
  summaryOverdueGoals?: boolean;

  // Goal Record Fields
  goalName?: boolean;
  goalSection?: boolean;
  goalStatus?: boolean;
  goalDueDate?: boolean;
  goalSteps?: boolean;
  goalCreatedBy?: boolean;
  goalCreatedDate?: boolean;
  goalCompletionDate?: boolean;
  outcomeTitle?: boolean;
  outcomeStatus?: boolean;
}

export interface OutcomeGoalsReportSummary {
  totalGoals?: number;
  goalsBySection?: {
    [key: string]: number;
  };
  completionRates?: {
    totalGoals?: number;
    completedGoals?: number;
    completionRate?: number;
  };
  dueDateStatistics?: {
    overdue?: number;
    upcoming?: number;
    completed?: number;
  };
  overdueGoals?: number;
  locationInfo?: {
    locationId: string;
    locationName: string;
  };
}

export interface OutcomeGoalsReportRecord {
  id?: string;
  goalId?: string;
  outcomeId?: string;
  caseId?: string;
  caseName?: string;
  goalName?: string;
  sectionName?: string;
  goalStatus?: string;
  goalDueDate?: string;
  goalSteps?: Array<{
    stepName: string;
    complete: boolean;
    dueDate?: string;
    emailNotifications?: string;
  }>;
  createdBy?: {
    userId: string;
    name: string;
  };
  createdAt?: string;
  completionDate?: string;
  isCustom?: boolean;
  goalType?: string;
  outcomeTitle?: string;
  outcomeStatus?: string;
}

export interface EnhancedOutcomeGoalsReport {
  companyId: string;
  companyName: string;
  locationId: string;
  locationName: string;
  summary: OutcomeGoalsReportSummary;
  records: OutcomeGoalsReportRecord[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: OutcomeGoalsReportFilters;
  fieldSelection: OutcomeGoalsReportFieldSelection;
}
