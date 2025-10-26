export interface GHLUserData {
  userId: string;
  activeLocation: string;
  companyId: string;
  email: string;
  role: string;
  type: string;
  userName: string;
  propertyRole: string;
  locations?: string[];
  isActive?: boolean;
  allowPrivateCases?: boolean;
  userType?: string;
  orgName?: string;
}

export interface SliceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface CreateUserData {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  type: string;
  role: string;
  locationIds: string[];
  propertyRole: string;
}
export interface UserData {
  _id: string;
  userId: string;
  activeLocation?: string;
  companyId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  alternatePhoneNumber?: string;
  role?: string;
  type?: string;
  userName?: string;
  isActive?: boolean;
  propertyRole?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  locations?: (string | { name?: string })[];
  __v?: number;
  agencyId?: string;
  userType?: string;
  company?: {
    companyId?: string;
    companyName?: string;
    locationId?: string;
    locationName?: string;
  };
}
