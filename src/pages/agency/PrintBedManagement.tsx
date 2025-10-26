import ColumnHeader from "@/components/reusable/TableColumnHeader";
import Button from "@/components/ui/Button";
import { getSmartRelativeTime } from "@/utils/getSmartRelativeTime";
import { LABELS } from "@/utils/textConstants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toZonedTime } from "date-fns-tz";

const PrintBedManagement = () => {
  const location = useLocation();
  const [printData, setPrintData] = useState<any>(null);
  const [listTitle, setListTitle] = useState("Bed List Report");
  const [description, setDescription] = useState("");

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Helper function to format dates in user's timezone
  const formatDateInUserTimezone = (dateString: string) => {
    try {
      const date = toZonedTime(new Date(dateString), userTimeZone);
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        timeZone: userTimeZone,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    }
  };

  // Helper function to format time in user's timezone
  const formatTimeInUserTimezone = (dateString: string) => {
    try {
      const date = toZonedTime(new Date(dateString), userTimeZone);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: userTimeZone,
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  useEffect(() => {
    // Get data from navigation state
    if (location.state) {
      setPrintData(location.state.printData);
      setListTitle(location.state.listTitle || "Bed List Report");
      setDescription(location.state.description || "");
    }

    const header = document.getElementById("no-print-header");
    const sidebar = document.getElementById("no-print-sidebar");
    const toggleButton = document.getElementById("no-print-toggle");

    header?.classList.add("print:hidden");
    sidebar?.classList.add("print:hidden");
    toggleButton?.classList.add("print:hidden");

    return () => {
      header?.classList.remove("print:hidden");
      sidebar?.classList.remove("print:hidden");
      toggleButton?.classList.remove("print:hidden");
    };
  }, []); // Remove location.state from dependencies to prevent re-renders

  // Use the actual data from API - beds come as flat array
  const beds = printData?.beds || [];
  const summaryData = printData?.summary || null;
  const generatedAt = printData?.generatedAt || new Date().toISOString();
  const generatedBy = printData?.generatedBy || null;

  // Update the column helper to match the new data structure
  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.accessor("bedId", {
      header: () => <span>Bed ID</span>,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("siteName", {
      header: ({ column }) => (
        <ColumnHeader
          title={LABELS.TABLES.BED_LIST.SITE}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          sortDirection={column.getIsSorted() as "asc" | "desc"}
          isSorting={false}
        />
      ),
      cell: (info) => (
        <div className="font-medium text-gray-900">
          {info.getValue() || "—"}
        </div>
      ),
    }),
    columnHelper.accessor("bedName", {
      header: ({ column }) => (
        <ColumnHeader
          title={LABELS.TABLES.BED_LIST.NAME}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          sortDirection={column.getIsSorted() as "asc" | "desc"}
          isSorting={false}
        />
      ),
      cell: (info) => (
        <div className="font-semibold text-gray-900">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("room", {
      header: ({ column }) => (
        <ColumnHeader
          title={LABELS.TABLES.BED_LIST.ROOM}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          sortDirection={column.getIsSorted() as "asc" | "desc"}
          isSorting={false}
        />
      ),
      cell: (info) => (
        <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium inline-block">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("bedType", {
      header: ({ column }) => (
        <ColumnHeader
          title={LABELS.TABLES.BED_LIST.TYPE}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          sortDirection={column.getIsSorted() as "asc" | "desc"}
          isSorting={false}
        />
      ),
      cell: (info) => (
        <div className="text-gray-700 font-medium">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <ColumnHeader
          title={LABELS.TABLES.BED_LIST.STATUS}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          sortDirection={column.getIsSorted() as "asc" | "desc"}
          isSorting={false}
        />
      ),
      cell: (info) => {
        const value = info.getValue();
        const statusConfig = {
          Available: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-200",
            icon: "mdi:check-circle",
          },
          Occupied: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-200",
            icon: "mdi:account",
          },
          Unavailable: {
            bg: "bg-gray-100",
            text: "text-gray-800",
            border: "border-gray-200",
            icon: "mdi:close-circle",
          },
        };

        const config =
          statusConfig[value as keyof typeof statusConfig] ||
          statusConfig.Unavailable;

        return (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}
          >
            <Icon icon={config.icon} width="14" height="14" />
            {value}
          </div>
        );
      },
    }),
    columnHelper.accessor("case", {
      header: ({ column }) => (
        <ColumnHeader
          title={LABELS.TABLES.BED_LIST.CASE_NOTE}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          sortDirection={column.getIsSorted() as "asc" | "desc"}
          isSorting={false}
        />
      ),
      cell: (info) => {
        const value: any = info.getValue();
        const row = info.row.original;

        if (!value) {
          return <div className="text-gray-400 italic">No case assigned</div>;
        }

        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
              <Icon
                icon="mdi:account"
                className="text-purple-600"
                width="16"
                height="16"
              />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">
                {row.caseAge ? `${row.caseAge} years old` : "Active case"}
              </div>
              {row.notes && (
                <div className="text-xs text-gray-400 mt-1">{row.notes}</div>
              )}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("checkIn", {
      header: ({ column }) => (
        <ColumnHeader
          title={LABELS.TABLES.BED_LIST.CHECK_IN}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          sortDirection={column.getIsSorted() as "asc" | "desc"}
          isSorting={false}
        />
      ),
      cell: (info) => {
        const value = info.getValue();
        const row = info.row.original;

        if (!value) {
          return <div className="text-gray-400 italic">Not checked in</div>;
        }

        return (
          <div className="flex flex-col">
            <div className="font-medium text-gray-900">
              {formatDateInUserTimezone(value)}
            </div>
            <div className="text-sm text-gray-500">
              {getSmartRelativeTime(value)}
            </div>
            {row.scheduledCheckoutInfo && (
              <div className="text-xs text-orange-600 mt-1">
                Checkout:{" "}
                {formatDateInUserTimezone(row.scheduledCheckoutInfo.date)}
              </div>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: beds,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: {
        bedId: false,
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
      {/* Header with navigation and print button */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between print:hidden">
        <Button
          label="Go Back"
          onClick={() => {
            window.history.back();
          }}
          variant="default"
          icon="mdi:arrow-back"
        />
        <div className="text-xl font-semibold text-gray-800">{listTitle}</div>
        <Button
          label="Print Report"
          onClick={() => {
            window.print();
          }}
          variant="submitStyle"
          icon="mdi:printer"
        />
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-6 print:p-4 print:max-w-none">
        {/* Report Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:shadow-none print:border-0 print:p-0 print:mb-4">
          <div className="flex items-start justify-between mb-4 print:mb-2">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl print:mb-1">
                {listTitle}
              </h1>
              {description && (
                <p className="text-gray-600 text-lg leading-relaxed mb-3 print:text-sm print:mb-2">
                  {description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 print:gap-2 print:text-xs">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:calendar" className="text-purple-600" />
                  <span>
                    Generated: {formatDateInUserTimezone(generatedAt)} at{" "}
                    {formatTimeInUserTimezone(generatedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:bed" className="text-purple-600" />
                  <span>Total Beds: {beds.length}</span>
                </div>
                {generatedBy && (
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:account" className="text-purple-600" />
                    <span>By: {generatedBy.userName}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right print:hidden">
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="text-sm font-medium text-purple-800">
                  {printData?.agencyName}
                </div>
                <div className="text-xs text-purple-600">
                  Bed Inventory Report
                </div>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          {summaryData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 print:grid-cols-4 print:gap-2 print:mb-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 print:p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    icon="mdi:bed"
                    className="text-blue-600"
                    width="16"
                    height="16"
                  />
                  <span className="text-sm font-medium text-blue-800 print:text-xs">
                    Total
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-900 print:text-lg">
                  {summaryData.total}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200 print:p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    icon="mdi:check-circle"
                    className="text-green-600"
                    width="16"
                    height="16"
                  />
                  <span className="text-sm font-medium text-green-800 print:text-xs">
                    Available
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-900 print:text-lg">
                  {summaryData.available}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200 print:p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    icon="mdi:account"
                    className="text-red-600"
                    width="16"
                    height="16"
                  />
                  <span className="text-sm font-medium text-red-800 print:text-xs">
                    Occupied
                  </span>
                </div>
                <div className="text-2xl font-bold text-red-900 print:text-lg">
                  {summaryData.occupied}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 print:p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    icon="mdi:close-circle"
                    className="text-gray-600"
                    width="16"
                    height="16"
                  />
                  <span className="text-sm font-medium text-gray-800 print:text-xs">
                    Unavailable
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 print:text-lg">
                  {summaryData.unavailable}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full print:text-xs">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-700 print:bg-purple-600">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider print:px-2 print:py-2 print:text-xs"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 transition-colors duration-150 print:hover:bg-transparent ${
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50 print:bg-gray-50"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-sm text-gray-900 print:px-2 print:py-2 print:text-xs"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center print:py-6"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Icon
                          icon="mdi:bed-outline"
                          className="text-gray-400 text-4xl print:text-2xl"
                        />
                        <div className="text-gray-500">
                          <p className="font-medium print:text-sm">
                            No beds found
                          </p>
                          <p className="text-sm print:text-xs">
                            Try adjusting your filters
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 print:block hidden border-t border-gray-200 pt-6 print:mt-4 print:pt-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Icon icon="mdi:office-building" className="text-purple-600" />
            <span className="font-medium">Jackson Resource Center</span>
          </div>
          <p className="text-gray-500 print:text-xs">
            Report generated on{" "}
            {formatDateInUserTimezone(new Date().toISOString())} at{" "}
            {formatTimeInUserTimezone(new Date().toISOString())}
          </p>
          <p className="text-gray-500 mt-1 print:text-xs">
            Total Beds: {beds.length} | Page 1 of 1
          </p>
        </div>
      </div>

      {/* Print-specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .print\\:text-xs {
            font-size: 10px !important;
          }
          .print\\:text-sm {
            font-size: 12px !important;
          }
          .print\\:text-lg {
            font-size: 14px !important;
          }
          .print\\:text-2xl {
            font-size: 18px !important;
          }
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
          .print\\:px-2 {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
          .print\\:py-2 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          .print\\:mb-2 {
            margin-bottom: 0.5rem !important;
          }
          .print\\:mb-3 {
            margin-bottom: 0.75rem !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          .print\\:gap-2 {
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintBedManagement;
