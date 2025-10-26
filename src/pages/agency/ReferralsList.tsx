import { useState, useEffect, useMemo } from "react";
import PageFooter from "@components/PageFooter";
import { Icon } from "@iconify-icon/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  HEADINGS,
  LABELS,
  STATIC_TEXTS,
  PLACEHOLDERS,
} from "@utils/textConstants";
import { CASES_PER_PAGE, ReferralColumns } from "@/utils/constants";
import {
  useTable,
  usePagination,
  useGlobalFilter,
  useSortBy,
  type TableInstance,
  type TableState,
  type UsePaginationInstanceProps,
  type UseGlobalFiltersInstanceProps,
  type UseSortByInstanceProps,
  type UsePaginationState,
  type UseGlobalFiltersState,
  type UseSortByState,
  type TableOptions,
  type UsePaginationOptions,
  type UseGlobalFiltersOptions,
  type UseSortByOptions,
} from "react-table";
import { FilterComponent } from "@components/common/FilterComponent";
import { fetchReferralsByAgency } from "@/services/ReferralsApi";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import type {
  AgencyReferralRecord,
  RequestStatus,
  SimplifiedCategory,
} from "@/types";
import { fetchCategories } from "@/utils/commonFunc";
import { toast } from "react-toastify";
import { getRequestStatuses } from "@/services/RequestStatusApi";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface ReferralData {
  id: string;
  date: string;
  caseId: string;
  caseName: string;
  category: string;
  amount: string;
  status: string;
  agency: string;
}
interface MyTableInstance<D extends object>
  extends TableInstance<D>,
    UsePaginationInstanceProps<D>,
    UseGlobalFiltersInstanceProps<D>,
    UseSortByInstanceProps<D> {}

interface MyTableState<D extends object>
  extends TableState<D>,
    UsePaginationState<D>,
    UseGlobalFiltersState<D>,
    UseSortByState<D> {}

interface MyTableOptions<D extends object>
  extends TableOptions<D>,
    UsePaginationOptions<D>,
    UseGlobalFiltersOptions<D>,
    UseSortByOptions<D> {}
type MyState = TableState<AgencyReferralRecord> &
  UsePaginationState<AgencyReferralRecord> &
  UseGlobalFiltersState<AgencyReferralRecord> &
  UseSortByState<AgencyReferralRecord>;

export const ReferralsList = () => {
  const { data: userData } = useSelector((state: RootState) => state.user);
  const { agencyId } = useParams();
  const [referrals, setReferrals] = useState<AgencyReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReferralsCount, setTotalReferralsCount] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filterDateChecked, setFilterDateChecked] = useState(false);
  const [filterCategoryChecked, setFilterCategoryChecked] = useState(false);
  const [filterStatusChecked, setFilterStatusChecked] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<SimplifiedCategory[]>(
    []
  );
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus[]>([]);

  const [filterDateRange, setFilterDateRange] = useState<
    | {
        startDate: Date | undefined;
        endDate: Date | undefined;
      }
    | undefined
  >(undefined);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(
    undefined
  );
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchReferralsByAgency(
          currentPage,
          CASES_PER_PAGE,
          filterStatusChecked ? filterStatus : undefined,
          filterCategoryChecked ? filterCategory : undefined,
          globalFilter,
          filterDateChecked
            ? filterDateRange?.startDate?.toISOString()
            : undefined,
          filterDateChecked
            ? filterDateRange?.endDate?.toISOString()
            : undefined,
          userData?.userId,
          userData?.activeLocation,
          location.pathname.startsWith("/agencies")
            ? agencyId
            : userData?.activeLocation
            ? userData?.activeLocation
            : userData?.companyId
        );
        const { data: referralData, pagination } = data.data;
        setReferrals(referralData);
        setTotalReferralsCount(pagination.total);
        setTotalPages(Math.ceil(pagination.totalPages));
        setCurrentPage(pagination.page);
      } catch (error) {
        console.error("Error fetching referrals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    currentPage,
    globalFilter,
    filterDateChecked,
    filterCategoryChecked,
    filterStatusChecked,
    filterDateRange,
    filterCategory,
    filterStatus,
    agencyId,
    userData?.userId,
    userData?.activeLocation,
  ]);

  function mapReferralToTableRow(referral: AgencyReferralRecord) {
    return {
      id: referral._id,
      date: formatDate(
        toZonedTime(referral.createdAt, userTimeZone),
        "MMM d, yyyy"
      ),
      caseId: referral.caseId?._id || "",
      caseName: referral.caseId
        ? `${referral.caseId.firstName} ${referral.caseId.lastName}`
        : "",
      category: referral.category?.name || "",
      amount: `${referral.amount} ${
        typeof referral.unit === "object" ? referral.unit.name : referral.unit
      }`,
      status:
        requestStatuses.find((status) => status._id === referral.status)
          ?.name || referral.status,
      agency:
        referral.company?.companyName || referral.company?.locationName || "",
    };
  }

  const tableData = useMemo(
    () => referrals.map(mapReferralToTableRow),
    [referrals]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state,
    setGlobalFilter: setTableGlobalFilter,
  } = useTable<ReferralData>(
    {
      columns: ReferralColumns,
      data: tableData,
      initialState: {
        pageIndex: currentPage - 1,
        pageSize: CASES_PER_PAGE,
        globalFilter: globalFilter,
      } as MyTableState<ReferralData>,
      manualPagination: true,
      pageCount: totalPages,
      manualGlobalFilter: true,
    } as MyTableOptions<ReferralData>,
    useGlobalFilter,
    useSortBy,
    usePagination
  ) as MyTableInstance<ReferralData>;

  const { pageIndex, globalFilter: tableGlobalFilter } = state as MyState;

  useEffect(() => {
    gotoPage(currentPage - 1);
    setGlobalFilter(tableGlobalFilter);
  }, [currentPage, gotoPage, setGlobalFilter, tableGlobalFilter]);

  useEffect(() => {
    if (!userData) return;
    fetchCategories(userData, setLoading, setCategoryOptions);
  }, [userData?.userId, userData?.activeLocation]);

  useEffect(() => {
    if (!userData) return;
    const fetchRequestStatuses = async () => {
      if (!userData?.userId) {
        return toast.error("User authentication missing");
      }
      try {
        const data = await getRequestStatuses(
          userData.userId,
          userData.activeLocation
        );
        setRequestStatuses(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch request statuses";
        toast.error(message);
      }
    };
    fetchRequestStatuses();
  }, [userData]);

  const handleFilterToggle = (type: string, checked: boolean) => {
    if (type === "date") {
      setFilterDateChecked(checked);
      if (!checked) setFilterDateRange(undefined);
    } else if (type === "category") {
      setFilterCategoryChecked(checked);
      if (!checked) setFilterCategory(undefined);
    } else if (type === "status") {
      setFilterStatusChecked(checked);
      if (!checked) setFilterStatus(undefined);
    }
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setFilterDateRange({
      startDate: start || undefined,
      endDate: end || undefined,
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value);
  };

  const handlePreviousPage = () => {
    previousPage();
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    nextPage();
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startItem = (currentPage - 1) * CASES_PER_PAGE + 1;
  const endItem = Math.min(currentPage * CASES_PER_PAGE, totalReferralsCount);
  const paginationLabel = `${startItem}-${endItem} ${LABELS.PAGINATION.OF} ${totalReferralsCount} ${LABELS.PAGINATION.REFERRALS_RECEIVED}`;

  const isAnyFilterChecked =
    filterDateChecked || filterCategoryChecked || filterStatusChecked;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto">
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="mdi:share-variant"
                className="text-purple"
                width="24"
                height="24"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-pink">
                {HEADINGS.REFERRALS.TITLE}
              </h1>
              <p className="text-gray-600">{HEADINGS.REFERRALS.SUBTITLE}</p>
            </div>
          </div>
          {referrals?.length > 0 && (
            <div className="flex items-center gap-2 relative">
              <input
                type="text"
                placeholder={PLACEHOLDERS.SEARCH.SEARCH}
                value={globalFilter || ""}
                onChange={(e) => setTableGlobalFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple pr-8"
              />
              <Icon
                icon="mdi:magnify"
                className="text-gray-500 absolute right-2 top-1/2 -translate-y-1/2"
                width="20"
                height="20"
              />
            </div>
          )}
        </div>

        <div className="mx-auto p-4 sm:p-6">
          {referrals?.length > 0 && (
            <div className="bg-white p-4 rounded-t-lg shadow-sm flex flex-col">
              <span className="font-bold text-purple mb-2">
                {LABELS.REFERRALS.FILTERS}
              </span>
              <div className="flex flex-row flex-wrap gap-4">
                <FilterComponent
                  type="date"
                  label={LABELS.REFERRALS.DATE}
                  isChecked={filterDateChecked}
                  onToggle={(checked) => handleFilterToggle("date", checked)}
                />
                <FilterComponent
                  type="category"
                  label={LABELS.REFERRALS.CATEGORY}
                  isChecked={filterCategoryChecked}
                  onToggle={(checked) =>
                    handleFilterToggle("category", checked)
                  }
                />
                <FilterComponent
                  type="status"
                  label={LABELS.REFERRALS.STATUS}
                  isChecked={filterStatusChecked}
                  onToggle={(checked) => handleFilterToggle("status", checked)}
                />
              </div>
            </div>
          )}

          {isAnyFilterChecked && (
            <div className="bg-purple/10 p-4 rounded-b-lg mb-4  relative z-0 flex flex-col gap-2">
              {filterDateChecked && (
                <div className="flex items-center flex-wrap gap-2">
                  <Icon icon="mdi:tag" className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {LABELS.REFERRALS.FILTER_BY_DATE}
                  </span>
                  <DatePicker
                    selected={filterDateRange?.startDate}
                    onChange={(date: Date | null) =>
                      handleDateChange([date, filterDateRange?.endDate || null])
                    }
                    selectsStart
                    startDate={filterDateRange?.startDate}
                    endDate={filterDateRange?.endDate}
                    placeholderText={PLACEHOLDERS.FORM.DATE_PLACEHOLDER}
                    dateFormat="MM - dd - yyyy"
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple max-w-40 bg-white"
                    maxDate={new Date()}
                  />
                  <span className="text-gray-500">
                    {LABELS.REFERRALS.DATE_RANGE_TO}
                  </span>
                  <DatePicker
                    selected={filterDateRange?.endDate}
                    onChange={(date: Date | null) =>
                      handleDateChange([
                        filterDateRange?.startDate || null,
                        date,
                      ])
                    }
                    selectsEnd
                    startDate={filterDateRange?.startDate}
                    endDate={filterDateRange?.endDate}
                    minDate={filterDateRange?.startDate}
                    placeholderText={PLACEHOLDERS.FORM.DATE_PLACEHOLDER}
                    dateFormat="MM - dd - yyyy"
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple max-w-40 bg-white"
                    maxDate={new Date()}
                  />
                </div>
              )}
              {filterCategoryChecked && (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:tag" className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {LABELS.REFERRALS.FILTER_BY_CATEGORY}
                  </span>
                  <select
                    value={filterCategory || STATIC_TEXTS.COMMON.SHOW_ALL}
                    onChange={handleCategoryChange}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none max-w-40 focus:ring-2 focus:ring-purple bg-white"
                  >
                    <option value="">{STATIC_TEXTS.COMMON.SHOW_ALL}</option>
                    {categoryOptions.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {filterStatusChecked && (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:tag" className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {LABELS.REFERRALS.FILTER_BY_STATUS}
                  </span>
                  <select
                    value={filterStatus || STATIC_TEXTS.COMMON.SHOW_ALL}
                    onChange={handleStatusChange}
                    className="px-3 py-1 max-w-40 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple bg-white"
                  >
                    <option value="">{STATIC_TEXTS.COMMON.SHOW_ALL}</option>
                    {requestStatuses.map((status) => (
                      <option key={status._id} value={status._id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {STATIC_TEXTS.COMMON.LOADING}
              </p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              {STATIC_TEXTS.COMMON.NO_DATA}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
              <table
                {...getTableProps()}
                className="min-w-full divide-y divide-gray-200"
              >
                <thead className="bg-gray-50">
                  {headerGroups.map((headerGroup: any) => {
                    const headerGroupProps = headerGroup.getHeaderGroupProps();
                    const { key, ...restHeaderGroupProps } = headerGroupProps;
                    return (
                      <tr key={key} {...restHeaderGroupProps}>
                        {headerGroup.headers.map((column: any) => {
                          const headerProps = column.getHeaderProps(
                            column.getSortByToggleProps()
                          );
                          const { key: headerKey, ...restHeaderProps } =
                            headerProps;
                          return (
                            <th
                              key={headerKey}
                              {...restHeaderProps}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                {column.render("Header")}
                                <span className=" flex flex-col">
                                  <Icon
                                    icon="oui:arrow-up"
                                    className={`w-3 h-3 ${
                                      column.isSorted && !column.isSortedDesc
                                        ? "text-purple"
                                        : "text-gray-300"
                                    }`}
                                  />
                                  <Icon
                                    icon="oui:arrow-down"
                                    className={`w-3 h-3 ${
                                      column.isSorted && column.isSortedDesc
                                        ? "text-purple"
                                        : "text-gray-300"
                                    }`}
                                  />
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    );
                  })}
                </thead>
                <tbody
                  {...getTableBodyProps()}
                  className="bg-white divide-y divide-gray-200"
                >
                  {page.map((row: any) => {
                    prepareRow(row);
                    const rowProps = row.getRowProps();
                    const { key: rowKey, ...restRowProps } = rowProps;
                    return (
                      <tr key={rowKey} {...restRowProps}>
                        {row.cells.map((cell: any) => {
                          const cellProps = cell.getCellProps();
                          const { key: cellKey, ...restCellProps } = cellProps;
                          return (
                            <td
                              key={cellKey}
                              {...restCellProps}
                              className={`px-6 py-4 whitespace-nowrap text-sm ${
                                cell.column.id === "caseName"
                                  ? "font-medium text-purple"
                                  : cell.column.id === "status"
                                  ? "text-pink"
                                  : "text-gray-900"
                              }`}
                            >
                              <Link
                                to={`/cases/${row.original.caseId}/assistance`}
                                className={`${
                                  cell.column.id === "agency" ||
                                  cell.column.id === "status"
                                    ? ""
                                    : "underline"
                                }`}
                              >
                                {cell.render("Cell")}
                              </Link>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {referrals?.length > 0 && (
        <PageFooter
          count={referrals.length}
          label={paginationLabel}
          currentPage={pageIndex + 1}
          totalPages={pageCount}
          hasPrevious={canPreviousPage}
          hasNext={canNextPage}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      )}
    </div>
  );
};
