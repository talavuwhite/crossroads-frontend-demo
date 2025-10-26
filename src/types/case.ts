export interface Address {
  address: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  preferredContact: "phone" | "email";
}

export interface CaseFilters {
  agencyId?: string;
  page: number;
  perPage: number;
}

export interface CaseListResponse {
  cases: CaseType[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  count?: number;
  color?: string;
}

export type PhoneNumber = { description: string; number: string; ext?: string };
export type IdNumber = { description: string; number: string };
export type IncomeSource = {
  name: string;
  phone?: string;
  amount: string | number;
  interval: string;
};
export type Expense = {
  name: string;
  phone?: string;
  amount: string | number;
  interval: string;
};

export type AddCaseFormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  maidenName: string;
  nickname: string;
  dob: string;
  ssn: string;
  headOfHousehold: boolean;
  dobDataQuality: string;
  nameDataQuality: string;
  children: string;
  ssnDataQuality: string;
  streetAddress: string;
  streetApt: string;
  streetCity: string;
  streetState: string;
  streetZip: string;
  streetCounty: string;
  mailingAddress: string;
  mailingApt: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  phoneNumbers: PhoneNumber[];
  idNumbers: IdNumber[];
  email: string;
  visibleTo: string;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  gender: string[];
  other: string[];
  race: string[];
  education: string;
  employment: string;
  maritalStatus: string;
  benefits: string[];
  playGroups: string[];
  playGroupsOther: string;
};

export interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CaseType {
  _id: string;
  caseId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  maidenName?: string;
  nickname?: string;
  dateOfBirth?: string;
  ssn?: string;
  headOfHousehold: boolean;
  dobDataQuality?: string;
  nameDataQuality?: string;
  children?: string;
  ssnDataQuality?: string;
  streetAddress?: {
    address: string;
    apt?: string;
    city: string;
    state: string;
    zip: string;
    county?: string;
  };
  mailingAddress?: {
    address: string;
    apt?: string;
    city: string;
    state: string;
    zip: string;
  };
  phoneNumbers?: Array<{
    description: string;
    number: string;
    ext?: string;
  }>;
  identificationNumbers?: Array<{
    description: string;
    number: string;
  }>;
  email?: string;
  incomeSources?: Array<{
    name: string;
    phone?: string;
    amount: number;
    interval: string;
  }>;
  expenses?: Array<{
    name: string;
    phone?: string;
    amount: number;
    interval: string;
  }>;
  gender?: string[];
  other?: string[];
  raceAndEthnicity?: string[];
  education?: string;
  employment?: string;
  maritalStatus?: string;
  governmentBenefits?: string[];
  wePlayGroups?: string[];
  wePlayGroupsOther?: string;
  createdBy: Array<{
    userId: string;
    name: string;
    _id: string;
  }>;
  caseCompanyInfo: {
    companyId?: string;
    companyName?: string;
    locationId?: string;
    locationName?: string;
  };
  caseHistory?: Array<{
    changedBy: string;
    changedByInfo: {
      type: string;
      locationId?: string;
      locationName?: string;
      companyId?: string;
      companyName?: string;
    };
    changes: Record<string, any>;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
  caseImage?: string;
  relatedCases?: {
    caseId: string;
    name: string;
    relationshipType: string[];
  }[];
  visibleTo: string;
  isSameAgencyOrSubAgency: boolean;
}

export interface CaseApiResponseData {
  _id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  maidenName: string;
  nickname: string;
  dateOfBirth: string;
  ssn: string;
  headOfHousehold: boolean;
  dobDataQuality: string;
  nameDataQuality: string;
  children: string;
  ssnDataQuality: string;
  streetAddress: Address;
  mailingAddress: Address;
  phoneNumbers: PhoneNumber[];
  identificationNumbers: IdNumber[];
  email: string;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  gender: string[];
  other: string[];
  raceAndEthnicity: string[];
  education: string;
  employment: string;
  maritalStatus: string;
  governmentBenefits: string[];
  wePlayGroups: string[];
  wePlayGroupsOther: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SearchMergeCaseResult {
  address: string;
  ssn: string;
  caseId: string;
  fullName: string;
  id: string;
  headOfHousehold?: boolean;
}

export interface Change {
  from: any;
  to: any;
}

export interface ActionHistoryItem {
  changedBy: string;
  type: string;
  details?: any;
  timestamp: string;
}

export interface FieldChangeHistoryItem {
  changedBy: string;
  changes: { [key: string]: Change };
  timestamp: string;
}

export type CaseHistoryItem = ActionHistoryItem | FieldChangeHistoryItem;

export interface RelationshipChange {
  action: "added" | "updated" | "deleted";
  description: string;
}

export interface FieldChange {
  from: any;
  to: any;
}

export interface HistoryItem {
  changedBy: string;
  changes: { [key: string]: FieldChange } | RelationshipChange;
  timestamp: string;
}

export type FilterKeys = "caseName" | "live_with" | "related";

export interface Relationship {
  id: string;
  name: string;
  dob: string;
  age: string;
  label: string;
  customLabelAtoB: string;
  customLabelBtoA: string;
  showDependantTag?: boolean;
  livesTogether?: boolean;
  caseAId?: string;
  caseBId?: string;
  isCaseBPrivate?: boolean;
}
export interface RelationShipTypes {
  dependant: Relationship[];
  live_with: Relationship[];
  related: Relationship[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalItems?: number;
}
export interface RelationshipsResponseData {
  relationships: RelationShipTypes;
  pagination: Pagination;
}

export interface Attachment {
  filename: string;
  url: string;
}

export interface CaseNote {
  caseId: string;
  description: string;
  visibleTo: string;
  attachment?: Attachment;
  createdBy: { name: string; userId: string };
  _id: string;
  createdAt: string;
  __v: number;
  caseName?: string;
  type?: string;
  isRelatedCase?: boolean;
  company?: {
    companyId?: string;
    companyName?: string;
    locationId?: string;
    locationName?: string;
  };
}

export interface CaseDocument {
  caseId: string;
  description?: string;
  visibleTo: string;
  attachment: Attachment;
  createdBy: { name: string; userId: string };
  _id: string;
  createdAt: string;
  __v: number;
  caseName?: string;
  type?: string;
  isRelatedCase?: boolean;
  company?: {
    companyId?: string;
    companyName?: string;
    locationId?: string;
    locationName?: string;
  };
  category?: {
    categoryName?: string;
    sectionName?: string;
  };
}

export interface CaseAlert {
  caseId: string;
  description?: string;
  visibleTo: string;
  emailSent: boolean;
  createdBy: { name: string; userId: string };
  _id: string;
  createdAt: string;
  __v: number;
  caseName?: string;
  isRelatedCase?: boolean;
  company?: {
    companyId?: string;
    companyName?: string;
    locationId?: string;
    locationName?: string;
  };
  companyId?: string;
  locationId?: string;
}

export type DocumentData = {
  description: string;
  visibleTo: string;
  attachment?: File;
};
export interface RecentCase {
  _id: string;
  name: string;
}
export interface SearchCaseFormValues {
  firstName?: string;
  lastName?: string;
  caseId?: string;
  dateOfBirth?: string;
  ssn?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phoneNumber?: string;
  email?: string;
  headOfHousehold?: boolean;
  name?: string;
  general?: string;
}

export interface RecentSearch {
  _id: string;
  searchQuery: SearchCaseFormValues;
  userId: string;
  count: number;
  createdAt: string;
  updatedAt: string;
  timestamp: string;
  __v: number;
}

export interface AssignBedFormValues {
  site: string;
  checkInDate: Date | null;
  availableBeds: string;
  notes: string;
}

export interface AddBedRequestFormValues {
  selectedMember: string[];
  agency: string;
  dateOfArrival: string;
  site: string;
  notes: string;
}

export interface PrintBedListFormValues {
  listTitle: string;
  description: string;
  siteFilterBy: any[]; // Changed from string[] to any[] to support ISiteListItem
  bedTypeFilterBy: string[];
  bedStatusFilterBy: string[];
}

export interface AddBedCheckOutFormValues {
  checkInDate: string;
  checkOutDate: string;
  notes: string;
}

export interface PrintOutcomesFormValues {
  title: string;
  description: string;
  selectedGoals: string[];
}
export interface RelatedCounts {
  assistance: number;
  notes: number;
  documents: number;
  alerts: number;
  bedAssignments: number;
  assessments: number;
  outcomes: number;
  relationships: number;
  appointments: number;
  rentalSubsidy: number;
  maintenanceRequests: number;
}
export interface CaseAlertReport {
  _id: string;
  caseId: string;
  description: string;
  emailSent: boolean;
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
  companyId: string;
  locationId: string;
  createdAt: string;
  __v: 0;
}

export interface CaseAssessmentReport {
  _id: string;
  caseId: string;
  companyId: string;
  locationId: string;
  fields: {
    fieldId: {
      _id: string;
      name: string;
    };
    value: string | number;
  }[];
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
  description: string;
  history: {
    changedBy: string;
    changedAt: string;
    companyId: string;
    locationId: string;
    changes: {
      field: string;
      fieldId: string;
      newValue: string;
    }[];
  }[];
  comments: {
    comment: string;
    commentedBy: {
      _id: string;
      userId: string;
      firstName: string;
      lastName: string;
    };
    commentedAt: string;
    companyId: string;
    locationId: string;
    _id: string;
    company: {
      locationId: string;
      locationName: string;
      companyId: string;
      companyName: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CaseAssistanceReport {
  attachment: {
    filename: string;
    url: string;
  };
  _id: string;
  caseId: string;
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
  __v: number;
}

export interface CaseDocumentReport {
  attachment: {
    filename: string;
    url: string;
  };
  _id: string;
  caseId: string;
  description: string;
  visibleTo: string;
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
  type: string;
  companyId: string;
  locationId: string;
  createdAt: string;
  __v: number;
}

export interface CaseNoteReport {
  attachment: {
    filename: string;
    url: string;
  };
  _id: string;
  caseId: string;
  description: string;
  visibleTo: string;
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
  type: string;
  companyId: string;
  locationId: string;
  createdAt: string;
  __v: number;
}

export interface CaseOutcomeReport {
  createdBy: {
    userId: string;
  };
  _id: string;
  title: string;
  status: string;
  caseId: string;
  visibleTo: string;
  goalStats: {
    percentComplete: number;
    completedGoals: number;
    totalGoals: number;
    label: string;
  };
  comments: {
    createdBy: {
      userId: string;
    };
    text: string;
    createdAt: string;
    _id: string;
  }[];
  sections: {
    section: {
      _id: string;
      name: string;
    };
    sectionName: string;
    goals: {
      changedBy: {
        userId: string;
      };
      _id: string;
      goal: {
        _id: string;
        name: string;
      };
      goalName: string;
      isCustom: boolean;
      status: {
        _id: string;
        name: string;
      };
      steps: {
        stepName: string;
        complete: boolean;
        dueDate: string;
      }[];
      dueDate: string;
      emailNotifications: string;
    }[];
  }[];
  history: [
    {
      action: string;
      userId: string;
      userName: string;
      companyId: string;
      companyName: string;
      goalName: string;
      status: string;
      date: string;
      section: string;
    }
  ];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CaseReferralReport {
  attachedFile: {
    filename: string;
    url: string;
  };
  _id: string;
  caseId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  amount: number;
  unit: {
    _id: string;
    name: string;
  };
  service: {
    _id: string;
    name: string;
    description: string;
  };
  category: {
    _id: string;
    sectionId: {
      _id: string;
      name: string;
    };
    name: string;
  };
  description: string;
  status: {
    _id: string;
    name: string;
  };
  requestDeadline: string;
  visibleTo: string;
  createdBy: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  companyId: string;
  locationId: string;
  statusHistory: {
    status: {
      _id: string;
      name: string;
    };
    statusNotes: string;
    updatedBy: {
      _id: string;
      userId: string;
      firstName: string;
      lastName: string;
    };
    updatedAt: string;
    companyId: string;
    locationId: string;
    _id: string;
    company: {
      locationId: string;
      locationName: string;
      companyId: string;
      companyName: string;
    };
  }[];
  requestedAssistance: {
    attachedFile: {
      filename: string;
      url: string;
    };
    amount: number;
    unit: {
      _id: string;
      name: string;
    };
    category: {
      _id: string;
      sectionId: {
        _id: string;
        name: string;
      };
      name: string;
    };
    description: string;
    visibleTo: string;
    createdBy: {
      _id: string;
      userId: string;
      firstName: string;
      lastName: string;
    };
    companyId: string;
    locationId: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
    company: {
      locationId: string;
      locationName: string;
      companyId: string;
      companyName: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
  company: {
    locationId: string;
    locationName: string;
    companyId: string;
    companyName: string;
  };
}

export interface CaseRelationshipReport {
  caseA: CaseType;
  caseB: CaseType;
  createdAt: string;
  customLabelAtoB: string;
  customLabelBtoA: string;
  relationshipType: string[];
  _id: string;
  __v: number;
}

export interface CaseReport {
  alerts: CaseAlertReport[];
  assessments: CaseAssessmentReport[];
  assistance: CaseAssistanceReport[];
  case: CaseType;
  documents: CaseDocumentReport[];
  notes: CaseNoteReport[];
  outcomes: CaseOutcomeReport[];
  referrals: CaseReferralReport[];
  relationships: CaseRelationshipReport[];
}
