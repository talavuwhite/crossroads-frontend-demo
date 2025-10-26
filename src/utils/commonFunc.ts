import React from "react";
import type { CaseType, FilterKeys } from "@/types/case";
import { sidebarItems } from "@/utils/constants";
import type { AssistanceBarcode, Category, SimplifiedCategory } from "@/types";
import { categoryService } from "@/services/categoryService";
import type { GHLUserData } from "@/types/user";
import type { EditAgencyFormValues } from "@/types/agency";

export const getPageTitle = (pathname: string): string => {
  for (const item of sidebarItems) {
    if (item.to === pathname) {
      return item.label;
    }
    if (item.sublinks) {
      const sublinkMatch = item.sublinks.find(
        (sublink) => sublink.to === pathname
      );
      if (sublinkMatch) {
        return sublinkMatch.label;
      }
    }
  }
  if (pathname === "/search") return "Global Search";
  return "Dashboard";
};

export const calculateAnnualAmount = (
  amount: number,
  interval: string
): number => {
  switch (interval.toLowerCase()) {
    case "weekly":
      return amount * 52;
    case "monthly":
      return amount * 12;
    case "quarterly":
      return amount * 4;
    case "yearly":
      return amount;
    default:
      return amount;
  }
};

export const calculateNetIncome = (
  incomeSources: CaseType["incomeSources"] = [],
  expenses: CaseType["expenses"] = []
): { yearly: number; monthly: number } => {
  const totalIncome = (incomeSources || []).reduce((sum, income) => {
    if (!income) return sum;
    const amount =
      typeof income.amount === "number"
        ? income.amount
        : parseFloat(income.amount as string) || 0;
    return sum + calculateAnnualAmount(amount, income.interval);
  }, 0);

  const totalExpenses = (expenses || []).reduce((sum, expense) => {
    if (!expense) return sum;
    const amount =
      typeof expense.amount === "number"
        ? expense.amount
        : parseFloat(expense.amount as string) || 0;
    return sum + calculateAnnualAmount(amount, expense.interval);
  }, 0);

  const netYearly = totalIncome - totalExpenses;
  const netMonthly = netYearly / 12;

  return { yearly: netYearly, monthly: netMonthly };
};

export const getVariantClasses = (variant: string) => {
  switch (variant) {
    case "submitStyle":
      return "text-white bg-purple hover:bg-pink";
    case "dangerStyle":
      return "bg-red-600 text-white hover:bg-red-700";
    case "warningStyle":
      return "bg-yellow-500 text-white hover:bg-yellow-600";
    case "infoStyle":
      return "bg-blue-500 text-white hover:bg-blue-600";
    default:
      return "text-gray-700 bg-white border border-gray-300 hover:bg-gray-100";
  }
};

export const getFieldDisplayValue = (
  value: any,
  fieldName?: string
): string => {
  if (value === null || value === undefined) return "Not Provided";

  if (typeof value === "boolean") {
    return value ? "Yes" : "Not Provided";
  }

  if (Array.isArray(value)) {
    if (value.length === 0 || value.every((item) => !hasValue(item)))
      return "Not Provided";
    return value
      .map((item) => getFieldDisplayValue(item))
      .filter((val) => val !== "Not Provided")
      .join(", ");
  }

  if (typeof value === "object") {
    if (
      fieldName &&
      ["address", "apt", "city", "state", "zip", "county"].includes(fieldName)
    ) {
      return hasValue(value) ? value.toString() : "Not Provided";
    }
    if (hasValue(value)) {
      if (value.number !== undefined && value.description !== undefined)
        return `${value.description}: ${value.number}${
          hasValue(value.ext) ? ` ext. ${value.ext}` : ""
        }`;
      if (
        value.name !== undefined &&
        value.amount !== undefined &&
        value.interval !== undefined
      )
        return `${value.name}: $${value.amount} (${value.interval})${
          hasValue(value.phone) ? ` - ${value.phone}` : ""
        }`;
      return JSON.stringify(value);
    }
    return "Not Provided";
  }
  if (typeof value === "string") {
    return value.trim() !== "" ? value.trim() : "Not Provided";
  }
  if (typeof value === "number") {
    return value !== 0 ? value.toString() : "Not Provided";
  }
  return value.toString();
};

export const hasValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }
  if (Array.isArray(value)) {
    return value.length > 0 && value.some((item) => hasValue(item));
  }

  if (typeof value === "object") {
    if (value.address !== undefined) {
      return (
        hasValue(value.address) ||
        hasValue(value.apt) ||
        hasValue(value.city) ||
        hasValue(value.state) ||
        hasValue(value.zip) ||
        hasValue(value.county)
      );
    }
    if (value.number !== undefined && value.description !== undefined) {
      return (
        hasValue(value.number) ||
        hasValue(value.description) ||
        hasValue(value.ext)
      );
    }
    if (
      value.name !== undefined &&
      value.amount !== undefined &&
      value.interval !== undefined
    ) {
      return (
        hasValue(value.name) ||
        (typeof value.amount === "number"
          ? value.amount !== 0
          : hasValue(value.amount)) ||
        hasValue(value.interval) ||
        hasValue(value.phone)
      );
    }
    return (
      Object.keys(value).length > 0 &&
      Object.values(value).some((v) => hasValue(v))
    );
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return true;
};

export const getNestedFieldState = (obj: any, path: string) => {
  const parts = path
    .replace(/[\[\]]/g, ".")
    .split(".")
    .filter((part) => part !== "");
  let current = obj;
  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }
  return current;
};

export const handleFilterChange = (
  key: FilterKeys,
  setFilters: any,
  setCurrentPage: (page: number) => void
) => {
  setFilters((prev: any) => {
    const updated = { ...prev, [key]: !prev[key] };
    setCurrentPage(1);
    return updated;
  });
};

export const handlePreviousPage = (
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
) => {
  setCurrentPage((prev: number) => Math.max(1, prev - 1));
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export const handleNextPage = (
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  totalPages: number
) => {
  setCurrentPage((prev: number) => Math.min(totalPages, prev + 1));
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export const getOrgTypeIcon = (type: string) => {
  switch (type) {
    case "Non-profit":
      return "mdi:charity";
    case "Government":
      return "mdi:city-variant-outline";
    case "Faith-based":
      return "mdi:church";
    case "Other":
      return "mdi:help-circle-outline";
    default:
      return "mdi:domain";
  }
};

export const displayValue = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join("-") : "Not Provided";
  }
  return value && String(value).trim() !== "" ? value : "Not Provided";
};

export const buildEditPayload = (
  values: EditAgencyFormValues,
  companyId: string
) => ({
  name: values.name,
  companyId: companyId,
  phone: values.phone,
  address: values.address,
  about: values.aboutUs,
  officeHours: values.officeHours,
  fax: values.fax,
  website: values.website,
  organizationType: values.organizationType,
  mailingAddress: {
    street: values.mailingAddress.street,
    city: values.mailingAddress.city,
    state: values.mailingAddress.state,
    postalCode: values.mailingAddress.postalCode,
  },
  country: values.country,
  disableAllLogins: values.disableAllLogins,
  postalCode: values.zip,
  city: values.city,
  state: values.state,
});

export const convertTo24Hour = (time12h: string) => {
  if (!time12h) return "";
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = "00";
  if (modifier === "PM" && hours !== "12") hours = String(Number(hours) + 12);
  return `${hours.padStart(2, "0")}:${minutes}`;
};
export const fetchCategories = async (
  userData: GHLUserData,
  setLoadingCategories: (loading: boolean) => void,
  setCategories: (categories: any[]) => void
): Promise<void> => {
  if (!userData?.userId) return;
  setLoadingCategories(true);
  try {
    const res = await categoryService.getCategories(
      1,
      100,
      userData.userId,
      userData.activeLocation
    );
    const cats = (res?.data?.data || [])
      .filter((cat: Category) => cat._id)
      .map((cat: Category) => ({
        _id: cat._id as string,
        section: cat.section || cat.sectionId?.name || "Uncategorized",
        name: cat.name,
      }));
    setCategories(cats);
  } catch (e: any) {
    console.error(e || "Failed to load categories");
    throw new Error(e);
  } finally {
    setLoadingCategories(false);
  }
};

export const groupCategoriesBySection = (
  categories: SimplifiedCategory[]
): Record<string, SimplifiedCategory[]> => {
  const groups: Record<string, SimplifiedCategory[]> = {};
  categories.forEach((cat) => {
    if (!groups[cat.section]) groups[cat.section] = [];
    groups[cat.section].push(cat);
  });
  return groups;
};

export function groupServicesBySection(services: any[]) {
  const grouped: Record<string, { label: string; value: string }[]> = {};

  services.forEach((service) => {
    const sectionName = service.sectionId?.name || "Undefined";
    if (!grouped[sectionName]) {
      grouped[sectionName] = [];
    }
    grouped[sectionName].push({
      label: `${service.name} (${service.companyName})`,
      value: service._id,
    });
  });

  return Object.entries(grouped).map(([category, options]) => ({
    category,
    options,
  }));
}

export const groupBarcodes = (items: AssistanceBarcode[]) => {
  const groupedMap: Record<
    string,
    { id: string; section: string; items: any[] }
  > = {};

  for (const item of items) {
    const groupLabel = item.assistanceCategory?.sectionId?.name || "Other";

    if (!groupedMap[groupLabel]) {
      groupedMap[groupLabel] = {
        id: groupLabel.toLowerCase().replace(/\s+/g, "-"),
        section: groupLabel,
        items: [],
      };
    }
    groupedMap[groupLabel].items.push(item);
  }

  return Object.values(groupedMap);
};

export function groupBarcodesBySection(barcodes: AssistanceBarcode[]) {
  const grouped: Record<string, AssistanceBarcode[]> = {};
  barcodes.forEach((b) => {
    const section = b.assistanceCategory?.sectionId?.name || "Other";
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(b);
  });
  return grouped;
}

/**
 * Returns a full backend URL for images or documents.
 * If the input is already an absolute URL, returns as is.
 * Otherwise, prepends the VITE_APP_BACKEND_URL from env.
 */
export function getBackendUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:")) return url;

  const backendBase = import.meta.env.VITE_APP_BACKEND_URL || "";
  const cleanBase = backendBase.replace(/\/$/, "");

  try {
    // If url is absolute (http/https), replace its origin with backendBase
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);
      const backendParsed = new URL(cleanBase);
      // Use backend origin + original path/query/hash
      return (
        backendParsed.origin + parsed.pathname + parsed.search + parsed.hash
      );
    }
  } catch {
    // If URL parsing fails, fallback to original logic
  }

  // If url is relative, prepend backendBase
  const cleanUrl = url.startsWith("/") ? url : "/" + url;
  return cleanBase + cleanUrl;
}
export const validateIntegerInput = (value: string) => {
  return value.replace(/[^0-9]/g, "");
};
