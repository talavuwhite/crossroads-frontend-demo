import React from "react";

// --- External Libraries ---
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";

// --- Project Utilities & Constants ---
import { getSmartRelativeTime } from "@/utils/getSmartRelativeTime";
import { LABELS } from "@utils/textConstants";

// --- Redux Actions ---
import { triggerBedsRefetch } from "@/redux/bedManagementSlice";

// --- Components ---
import EditCheckInModal from "@/components/bed-management/EditCheckInModal";
import ManageBedTypesModal from "@/components/bed-management/ManageBedTypesModal";
import ManageSiteBedsModal from "@/components/bed-management/ManageSiteBedsModal";
import ColumnHeader from "@components/reusable/TableColumnHeader";
import SearchBar from "@components/SearchBar";

// --- Types ---
import BedCheckInModal from "@/components/bed-management/BedCheckInModal";
import BedCheckOutModal from "@/components/bed-management/BedCheckOutModal";
import type {
  IBedListItem,
  IBedsFormValues,
  ISiteListItem,
} from "@/types/bedManagement";

/**
 * Props for BedListTable: accepts a single site object.
 * The component will extract beds and site info as needed.
 */
type TBedListTableProps = {
  site: ISiteListItem;
};

/**
 * BedListTable Component
 * Accepts a site object and renders its beds in a table (responsive).
 */
const BedListTable = ({ site }: TBedListTableProps) => {
  // Extract beds from the site object
  const beds = site?.beds;

  // Compute hasBeds flag once for performance
  const hasBeds = !!(beds && beds?.length > 0);
  // If you want to display the site name, use site.siteName directly where needed

  // --- Redux ---
  const dispatch = useDispatch();

  // --- State ---
  const [isOpenCheckoutModal, setIsOpenCheckoutModal] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isBedTypesModalOpen, setIsBedTypesModalOpen] = useState(false);
  const [isOpenCheckInModal, setIsOpenCheckInModal] = useState(false);
  const [isOpenEditCheckInModal, setIsOpenEditCheckInModal] = useState(false);
  const [selectedEditBed, setSelectedEditBed] = useState<IBedListItem | null>(
    null
  );

  // Bed Management State (moved from ManageSiteBedsModal)
  const bedsData: IBedsFormValues = {
    beds:
      site?.beds?.map((bed) => {
        const bedWithArchive = bed as IBedListItem & { isArchived?: boolean };
        return {
          bedId: bedWithArchive.bedId,
          bedName: bedWithArchive.bedName,
          room: bedWithArchive.room,
          type: bedWithArchive.type,
          bedTypeId: bedWithArchive.bedTypeId,
          status: bedWithArchive.status,
          isArchived: bedWithArchive.isArchived ?? false,
        };
      }) || [],
  };

  // --- Memoized Handlers ---
  const handleGlobalFilterChange = useCallback(
    (value: string) => setGlobalFilter(value),
    []
  );
  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) =>
      setSorting(updater),
    []
  );

  // Handler for Check In
  const handleOpenCheckInModal = useCallback((bed: IBedListItem) => {
    setSelectedEditBed(bed);
    setIsOpenCheckInModal(true);
  }, []);

  const handleCloseCheckInModal = useCallback(() => {
    setIsOpenCheckInModal(false);
    setSelectedEditBed(null);
  }, []);

  // Handler for Edit Check In
  const handleOpenEditCheckInModal = useCallback((bed: IBedListItem) => {
    setSelectedEditBed(bed);
    setIsOpenEditCheckInModal(true);
  }, []);

  const handleCloseEditCheckInModal = useCallback(() => {
    setIsOpenEditCheckInModal(false);
    setSelectedEditBed(null);
  }, []);

  // Handler for Check Out
  const handleOpenCheckoutModal = useCallback((bed: IBedListItem) => {
    setSelectedEditBed(bed);
    setIsOpenCheckoutModal(true);
  }, []);

  const handleCloseCheckoutModal = useCallback(() => {
    setSelectedEditBed(null);
    setIsOpenCheckoutModal(false);
  }, []);

  // --- Table Columns (columnHelper, Memoized) ---
  const columnHelper = useMemo(
    () => createColumnHelper<ISiteListItem["beds"][number]>(),
    []
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("bedName", {
        header: ({ column }) => (
          <ColumnHeader
            title={LABELS.TABLES.BED_LIST.NAME}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            sortDirection={column.getIsSorted() as "asc" | "desc"}
            isSorting={hasBeds}
          />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("room", {
        header: ({ column }) => (
          <ColumnHeader
            title={LABELS.TABLES.BED_LIST.ROOM}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            sortDirection={column.getIsSorted() as "asc" | "desc"}
            isSorting={hasBeds}
          />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("type", {
        header: ({ column }) => (
          <ColumnHeader
            title={LABELS.TABLES.BED_LIST.TYPE}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            sortDirection={column.getIsSorted() as "asc" | "desc"}
            isSorting={hasBeds}
          />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("status", {
        header: ({ column }) => (
          <ColumnHeader
            title={LABELS.TABLES.BED_LIST.STATUS}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            sortDirection={column.getIsSorted() as "asc" | "desc"}
            isSorting={hasBeds}
          />
        ),
        cell: (info) => {
          const value = info.getValue() as string;
          const isUnavailable = value === "Unavailable";
          const isAvailable = value.toLowerCase() === "available";
          const isOccupied = value.toLowerCase() === "occupied";

          return (
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isUnavailable
                    ? "bg-gray-400"
                    : isAvailable
                    ? "bg-green-500"
                    : isOccupied
                    ? "bg-red-500"
                    : "bg-gray-400"
                }`}
              />
              <span
                className={`font-medium text-sm ${
                  isUnavailable
                    ? "text-gray-400"
                    : isAvailable
                    ? "text-green-700"
                    : isOccupied
                    ? "text-red-700"
                    : "text-gray-600"
                }`}
              >
                {value}
              </span>
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
            isSorting={hasBeds}
          />
        ),
        cell: (info) => {
          const row = info.row.original as IBedListItem;
          const caseName = row.case;
          const caseId = row.caseId;
          const notes = row.notes;
          const checkOutNotes = row.checkOutNotes;
          const age = row.caseAge;

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {caseName && caseId ? (
                  <Link
                    to={`/cases/${caseId}`}
                    className="text-purple-600 hover:text-purple-800 font-medium hover:underline transition-colors duration-200"
                  >
                    {caseName}
                  </Link>
                ) : caseName ? (
                  <span className="font-medium text-gray-700">{caseName}</span>
                ) : (
                  <span className="text-gray-400 italic text-sm">No case</span>
                )}
                {caseName && caseId && (
                  <span className="text-gray-500 text-sm">
                    ({age} years old)
                  </span>
                )}
              </div>
              <div className="text-sm">
                {notes ? (
                  <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    Note – {notes}
                  </span>
                ) : checkOutNotes ? (
                  <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Checkout Note – {checkOutNotes}
                  </span>
                ) : (
                  <span className="text-gray-400 italic text-sm">No note</span>
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
            isSorting={hasBeds}
          />
        ),
        cell: (info) => {
          const value = info.getValue() as string | null;
          const row = info.row.original as IBedListItem;
          const scheduledCheckout = row.scheduledCheckoutInfo;

          if (!value) return null;

          const date = new Date(value);
          return (
            <div className="flex flex-col gap-1">
              <div>
                {date.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="text-xs text-gray-500">
                {getSmartRelativeTime(value)}
              </div>
              {/* Display scheduled checkout information if available */}
              {scheduledCheckout && scheduledCheckout.isScheduledCheckout && (
                <div className="mt-1">
                  <div
                    className={`text-xs px-2 py-1 rounded-full inline-block ${
                      scheduledCheckout.isOverdue
                        ? "bg-red-100 text-red-700"
                        : scheduledCheckout.daysUntilCheckout <= 1
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {scheduledCheckout.isOverdue
                      ? "Overdue"
                      : scheduledCheckout.daysUntilCheckout === 0
                      ? "Due today"
                      : scheduledCheckout.daysUntilCheckout === 1
                      ? "Due tomorrow"
                      : `Due in ${scheduledCheckout.daysUntilCheckout} days`}
                  </div>
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "action",
        header: () => null,
        cell: (info) => {
          const bed = info.row.original as IBedListItem;
          if (bed.status === "Unavailable") {
            return null;
          }
          if (bed.status === "Available") {
            return (
              <button
                onClick={() => handleOpenCheckInModal(bed)}
                className="w-10 h-10 group relative bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 rounded-full transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md flex items-center justify-center"
                title="Check In"
              >
                <Icon
                  icon="mdi:plus-circle"
                  width={20}
                  height={20}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Check In
                </span>
              </button>
            );
          }
          if (bed.status === "Occupied") {
            return (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCheckoutModal(bed)}
                  className="w-10 h-10 group relative bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 rounded-full transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md flex items-center justify-center"
                  title="Check Out"
                >
                  <Icon
                    icon="mdi:door-open"
                    width={20}
                    height={20}
                    className="transition-transform duration-200 group-hover:scale-110"
                  />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Check Out
                  </span>
                </button>
                <button
                  className="w-10 h-10 group relative bg-purple-100 hover:bg-purple-200 text-purple hover:text-purple-800 rounded-full transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-md flex items-center justify-center"
                  title="Edit Check In"
                  onClick={() => handleOpenEditCheckInModal(bed)}
                >
                  <Icon
                    icon="mdi:pencil"
                    width={20}
                    height={20}
                    className="transition-transform duration-200 group-hover:scale-110"
                  />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Edit
                  </span>
                </button>
              </div>
            );
          }
          return null;
        },
      }),
    ],
    [
      columnHelper,
      handleOpenCheckoutModal,
      handleOpenCheckInModal,
      handleOpenEditCheckInModal,
      hasBeds,
    ]
  );

  // --- Table Instance ---
  const table = useReactTable({
    data: beds, // Use the extracted beds array
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortingChange,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: handleGlobalFilterChange,
    globalFilterFn: (row, columnId, filterValue) => {
      // Custom filter: checks if the cell value includes the filter string
      return String(row.getValue(columnId))
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    },
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
      columnVisibility: {
        id: false,
      },
    },
  });

  // --- Render ---
  return (
    <>
      <div className="grid grid-cols-1 gap-3">
        {/* Header: Site Info and Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Icon
                  icon="mdi:building"
                  className="text-purple"
                  width="24"
                  height="24"
                />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">
                  {site?.siteName ? <div>{site.siteName}</div> : null}
                </div>
                {(site?.siteAddress || site?.siteAddress2) && (
                  <p className="font-normal text-sm text-gray-600">
                    {[site.siteAddress, site.siteAddress2]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {(site?.city || site?.state || site?.zipCode) && (
                  <p className="font-normal text-sm text-gray-600">
                    {[site.city, site.state, site.zipCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Table Container */}
        <div className="relative w-full">
          {/* Header with Search and Manage Button - Outside table scroll area */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchBar
                  value={globalFilter ?? ""}
                  onChange={handleGlobalFilterChange}
                  placeholder="Search beds..."
                  className="min-w-[250px] bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <button
              className="bg-purple hover:bg-purple-700/70 text-white px-6 py-3 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg font-semibold whitespace-nowrap flex items-center gap-2"
              onClick={() => setIsManageModalOpen(true)}
              type="button"
            >
              <Icon icon="mdi:cog" width="18" height="18" />
              Manage Site Beds
            </button>
          </div>

          {/* Table with horizontal scroll */}
          <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
            <div className="w-full min-w-[1024px]">
              {/* Table Title and Bed Count */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-purple">
                    Beds Available :{" "}
                    <span className="font-normal text-gray-700">
                      {site?.bedsAvailable} of {site?.bedsTotal} Total
                    </span>
                  </span>
                </div>
              </div>
              {/* Table */}
              <table className="w-full table-auto">
                <thead className="bg-purple text-white">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="p-4 text-start font-semibold text-sm"
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
                <tbody className="bg-white">
                  {(() => {
                    const visibleRows = table
                      .getRowModel()
                      .rows.filter((row) => {
                        const original = row.original as IBedListItem & {
                          isArchived?: boolean;
                        };
                        return !original.isArchived;
                      });
                    return visibleRows.length ? (
                      visibleRows.map((row, index) => {
                        const bed = row.original as IBedListItem;
                        const isUnavailable = bed.status === "Unavailable";
                        return (
                          <tr
                            key={row.id}
                            className={`
                              border-b border-gray-100 last:border-b-0
                              hover:bg-purple-50 transition-all duration-200 ease-in-out
                              ${
                                isUnavailable
                                  ? "bg-gray-50 text-gray-400 font-normal pointer-events-none"
                                  : index % 2 === 0
                                  ? "bg-white"
                                  : "bg-gray-50"
                              }
                            `}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={cell.id}
                                className="p-4 border-r border-gray-100 last:border-r-0"
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="p-8">
                          <div className="flex flex-col items-center justify-center h-[120px] w-full text-gray-500 gap-3">
                            <div className="bg-purple-100 p-3 rounded-full">
                              <Icon
                                icon="mdi:bed-empty"
                                width={32}
                                height={32}
                                className="text-purple"
                              />
                            </div>
                            <div className="text-lg font-semibold text-gray-700">
                              No beds found for this site
                            </div>
                            <div className="text-sm text-gray-400">
                              Try adding a new bed to get started
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bed Check-In */}
      {isOpenCheckInModal && selectedEditBed && (
        <BedCheckInModal
          isOpen={isOpenCheckInModal}
          onClose={handleCloseCheckInModal}
          selectedBed={selectedEditBed}
          onSuccess={() => dispatch(triggerBedsRefetch())}
        />
      )}

      {/* Editing Existing Bed Check-In */}
      {isOpenEditCheckInModal && !!selectedEditBed && (
        <EditCheckInModal
          isOpen={isOpenEditCheckInModal && !!selectedEditBed}
          onClose={handleCloseEditCheckInModal}
          selectedBed={selectedEditBed as IBedListItem}
          availableBedOptions={beds?.filter((bed) => !bed?.isArchived)}
          onSuccess={() => dispatch(triggerBedsRefetch())}
        />
      )}

      {/* Bed Check-Out */}
      {isOpenCheckoutModal && selectedEditBed && (
        <BedCheckOutModal
          isOpen={isOpenCheckoutModal}
          onClose={handleCloseCheckoutModal}
          selectedBed={selectedEditBed}
          onSuccess={() => dispatch(triggerBedsRefetch())}
        />
      )}

      {/* Managing Site's Beds */}
      <ManageSiteBedsModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
        }}
        onManageBedTypes={() => {
          setIsManageModalOpen(false);
          setIsBedTypesModalOpen(true);
        }}
        initialValues={bedsData}
        siteId={site?.siteId}
        onSuccess={() => dispatch(triggerBedsRefetch())}
      />

      {/* Managing Bed Types */}
      <ManageBedTypesModal
        isOpen={isBedTypesModalOpen}
        onClose={() => {
          setIsBedTypesModalOpen(false);
          setIsManageModalOpen(true);
        }}
        siteId={site?.siteId}
      />
    </>
  );
};

export default React.memo(BedListTable);
