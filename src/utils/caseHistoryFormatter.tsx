import React from "react";
import { STATIC_TEXTS } from "@utils/textConstants";
import type { HistoryItem, RelationshipChange } from "@/types/case";

const formatFieldName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
};

const formatValue = (value: any): string => {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return STATIC_TEXTS.COMMON.NOT_PROVIDED;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return "[Object]";
    }
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }
  return String(value);
};

const formatArrayItem = (field: string, item: any): string | null => {
  if (!item) return null;

  switch (field) {
    case "phoneNumbers":
      if (!item.description && !item.number) return null;
      return `${item.description || STATIC_TEXTS.COMMON.NOT_PROVIDED}: ${
        item.number || STATIC_TEXTS.COMMON.NOT_PROVIDED
      }${item.ext ? " ext. " + item.ext : ""}`;
    case "identificationNumbers":
      if (!item.description && !item.number) return null;
      return `${item.description || STATIC_TEXTS.COMMON.NOT_PROVIDED}: ${
        item.number || STATIC_TEXTS.COMMON.NOT_PROVIDED
      }`;
    case "incomeSources":
    case "expenses":
      if (
        !item.name &&
        (item.amount === undefined ||
          item.amount === null ||
          item.amount === "")
      )
        return null;
      return `${item.name || STATIC_TEXTS.COMMON.NOT_PROVIDED}: ${
        item.amount !== undefined && item.amount !== null && item.amount !== ""
          ? "$" + item.amount
          : STATIC_TEXTS.COMMON.NOT_PROVIDED
      } ${item.interval || STATIC_TEXTS.COMMON.NOT_PROVIDED}`;
    default:
      try {
        const stringified = JSON.stringify(item);
        if (stringified === "{}") return null;
        return stringified;
      } catch (e) {
        return "[Item]";
      }
  }
};

export const formatCaseHistoryChange = (
  historyItem: HistoryItem
): React.ReactNode => {
  if ("action" in historyItem.changes) {
    const relationshipChange = historyItem.changes as RelationshipChange;
    return (
      <div className="my-2 bg-gray-50 border border-purple/20 p-2 px-3 rounded-lg">
        <p className="font-medium my-1">
          {relationshipChange.action.charAt(0).toUpperCase() +
            relationshipChange.action.slice(1)}{" "}
          Relationship
        </p>
        <p className="text-gray-700">{relationshipChange.description}</p>
      </div>
    );
  }

  const fieldChangeEntries = Object.entries(historyItem.changes);

  if (fieldChangeEntries.length === 0) {
    return null;
  }

  return fieldChangeEntries.map(([field, change]) => {
    const formattedFieldName = formatFieldName(field);

    if (field === "streetAddress" || field === "mailingAddress") {
      const fromAddress = change.from || {};
      const toAddress = change.to || {};
      const addressFields = [
        "address",
        "apt",
        "city",
        "state",
        "zip",
        "county",
      ];
      const addressChanges: React.ReactNode[] = [];

      addressFields.forEach((addrField) => {
        const fromAddrValue = fromAddress[addrField];
        const toAddrValue = toAddress[addrField];

        if (fromAddrValue !== toAddrValue) {
          addressChanges.push(
            <div
              key={`${field}-${addrField}`}
              className="my-2 bg-gray-50 border border-purple/20 p-2 px-3 rounded-lg"
            >
              <p className="font-medium">
                {formattedFieldName} {formatFieldName(addrField)} changed
              </p>
              <p>
                <span className="text-gray-500">
                  {formatValue(fromAddrValue)}
                </span>{" "}
                {STATIC_TEXTS.CASE.HISTORY_TO_SEPARATOR}{" "}
                {formatValue(toAddrValue)}
              </p>
            </div>
          );
        }
      });

      if (addressChanges.length > 0) {
        return addressChanges;
      } else if (JSON.stringify(fromAddress) !== JSON.stringify(toAddress)) {
        return (
          <div
            key={field}
            className="my-2 bg-gray-50 border border-purple/20 p-2 px-3 rounded-lg"
          >
            <p className="font-medium">{formattedFieldName} changed</p>
            <p>Details updated</p>
          </div>
        );
      } else {
        return null;
      }
    }

    if (
      [
        "incomeSources",
        "expenses",
        "phoneNumbers",
        "identificationNumbers",
      ].includes(field)
    ) {
      const fromArray = Array.isArray(change.from) ? change.from : [];
      const toArray = Array.isArray(change.to) ? change.to : [];

      if (JSON.stringify(fromArray) !== JSON.stringify(toArray)) {
        const formattedItems = toArray
          .map((item) => formatArrayItem(field, item))
          .filter((item): item is string => item !== null);

        return (
          <div
            key={field}
            className="my-2 bg-gray-50 border border-purple/20 p-2 px-3 rounded-lg"
          >
            <p className="font-medium">{formattedFieldName} updated</p>
            {formattedItems.length > 0 ? (
              formattedItems.map((item, itemIndex) => (
                <p key={itemIndex} className="ml-2 text-gray-700">
                  {item}
                </p>
              ))
            ) : (
              <p className="ml-2 text-gray-700">
                {STATIC_TEXTS.COMMON.NOT_PROVIDED}
              </p>
            )}
          </div>
        );
      } else {
        return null;
      }
    }

    const formattedFromValue = formatValue(change.from);
    const formattedToValue = formatValue(change.to);

    return (
      <div
        key={field}
        className="my-2 bg-gray-50 border border-purple/20 p-2 px-3 rounded-lg"
      >
        <p className="font-medium my-1">
          {formattedFieldName} {STATIC_TEXTS.CASE.HISTORY_CHANGED_SUFFIX}
        </p>
        <p>
          <span className="text-gray-500">{formattedFromValue}</span>{" "}
          {STATIC_TEXTS.CASE.HISTORY_TO_SEPARATOR} {formattedToValue}
        </p>
      </div>
    );
  });
};
