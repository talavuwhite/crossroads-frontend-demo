import type { Pagination } from "@/types/case";

export interface ProspectInfo {
  firstName: string;
  lastName: string;
  email: string;
}

export interface MailingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface OfficeHour {
  startTime: string;
  endTime: string;
  additionalDetails: string;
  _id?: string;
}

export interface MailingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}
export interface AgencyDetailsTypes {
  id: string;
  type: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website: string;
  timezone: string;
  about: string;
  organizationType: string;
  fax?: string;
  officeHours?: OfficeHour[];
  createdAt?: string;
  mailingAddress?: MailingAddress;
  disableAllLogins?: boolean;
}

export interface SubAccountData {
  userId: string;
  userName: string;
  email: string;
  propertyRole: string;
  userType: string;
  activeLocation: string;
  data: AgencyDetailsTypes;
}

export interface AddAgencyPayload {
  companyId: string;
  name: string;
  phone: string;
  fax?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  website?: string;
  timezone: string;
  prospectInfo: ProspectInfo;
  organizationType: string;
  about?: string;
  mailingAddress: MailingAddress;
  disableAllLogins: boolean;
  officeHours: OfficeHour[];
}

interface User {
  userId: string;
  name: string;
  role: string;
}
export interface BaseAgency {
  id: string;
  type: "agency" | "sub-agency";
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
  about?: string;
  organizationType?: string;
  phone?: string;
  mailingAddress?: Record<string, any>;
  users: User[];
}

export interface EditAgencyFormValues {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  website: string;
  timezone: string;
  prospectInfo?: { firstName: string; lastName: string; email: string };
  fax: string;
  organizationType: string;
  about: string;
  mailingAddress: MailingAddress;
  disableAllLogins: boolean;
  officeHours: OfficeHour[];
  passwordOption?: string;
  password?: string;
  confirmPassword?: string;
  zip?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZip?: string;
  aboutUs?: string;
}

export interface NetworkAdministrator {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  altPhone?: string;
  userName?: string;
  userType?: string;
  locations?: (string | { name?: string })[];
  activeLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  agencyId: string;
  companyId: string;
  firstName?: string;
  lastName?: string;
  propertyRole?: string;
  profileImage?: string;
  company?: {
    companyId?: string;
    companyName?: string;
    locationId?: string;
    locationName?: string;
  };
}

export interface NetworkAdminsApiResponse {
  agency: {
    companyId: string;
    agencyName: string;
    address: string;
    city: string;
  };
  networkAdministrators: NetworkAdministrator[];
  pagination: Pagination;
}
