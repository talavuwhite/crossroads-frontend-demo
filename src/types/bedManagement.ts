// For the Bed Listing page
export interface ISiteListItem {
  siteId: string;
  siteName?: string;
  siteAddress?: string;
  siteAddress2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  companyAddress?: string;
  companyName?: string;
  bedsAvailable?: number;
  bedsTotal?: number;
  beds: IBedListItem[];
}

// For the Individual Bed Item on the Bed Listing page
export interface IBedListItem {
  bedId: string;
  bedName: string;
  room: string;
  type: string;
  bedTypeId: string;
  bedTypeName: string;
  status: "Available" | "Occupied" | "Unavailable";
  case?: string | null; // just the case name
  checkIn?: string | null;
  checkInId?: string | null;
  caseId?: string | null;
  notes?: string | null;
  caseAge?: string | number | null;
  isArchived?: boolean;
  checkOut?: string | null;
  checkOutId?: string | null;
  // New fields from updated API response
  checkOutDate?: string | null;
  checkOutNotes?: string | null;
  scheduledCheckoutInfo?: {
    date: string;
    daysUntilCheckout: number;
    isOverdue: boolean;
    isScheduledCheckout: boolean;
    status: string;
  } | null;
}

// Interface for bed type API response
export interface IBedType {
  _id: string;
  name: string;
  siteId: string;
  companyId: string;
  companyName?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  inUse?: boolean;
}

// Bed form interface for managing individual beds
export interface IBedForm {
  bedId?: string;
  bedName: string;
  room: string;
  type?: string;
  bedTypeId: string;
  status?: "Available" | "Occupied" | "Unavailable";

  /**
   * Archive flag for frontend UI. Used to mark a bed as archived.
   */
  isArchived: boolean;
  /**
   * Mark bed for deletion in outgoing payload. Not received from backend.
   */
  delete?: boolean;

  /**
   * Availability of the bed. Not received from backend.
   */
  availability?: "Available" | "Occupied" | "Unavailable";
  /**
   * Site ID of the bed. Not received from backend.
   */
  siteId?: string;
}

// Form values for managing multiple beds
export interface IBedsFormValues {
  beds: IBedForm[];
}

// Form values for managing bed types
export interface IBedTypesFormValues {
  bedTypes: IBedType[];
  renameTypes: {
    [key: string]: string;
  };
  deleteTypes: {
    [key: string]: boolean;
  };
  newTypes: string[];
}
