import { useState, useEffect } from "react";
import { CaseCard } from "@components/CaseCard";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import PageFooter from "@components/PageFooter";
import backendApi from "@api/api";
import { toast } from "react-toastify";
import type { ApiResponse } from "@/types/api";
import type { CaseType } from "@/types/case";
import {
  HEADINGS,
  ERROR_MESSAGES,
  LABELS,
  STATIC_TEXTS,
} from "@utils/textConstants";
import { CASES_PER_PAGE } from "@/utils/constants";
import type { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { getUsersByLocationAgencyWithoutPagination } from "@/services/UserApi";
import type { UserData } from "@/types/user";
import { useParams } from "react-router-dom";
import { setCaseList } from "@/redux/caseListSlice";
import { getAgenciesAndSubAgencies } from "@/services/AgencyApi";
import type { BaseAgency } from "@/types/agency";

export const CasesList = () => {
  const dispatch = useDispatch();
  const shouldRefresh = useSelector(
    (state: RootState) => state.caseList.shouldRefresh
  );
  const { id: agencyId } = useParams();
  const { data: userData } = useSelector((state: RootState) => state.user);
  const [cases, setCases] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentLoading, setAgentLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCasesCount, setTotalCasesCount] = useState(0);
  const [agents, setAgents] = useState<UserData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [agencies, setAgencies] = useState<BaseAgency[]>([]);
  const [filter, setFilter] = useState<{
    agencyId?: string;
    createdByUserId?: string;
  }>({});

  const fetchCases = async () => {
    setLoading(true);

    try {
      // Base URL
      let query = `/api/cases/filter?id=${
        agencyId || userData?.activeLocation || userData?.companyId
      }&page=${currentPage}&limit=${CASES_PER_PAGE}`;

      // Apply dynamic filters
      if (filter.agencyId) {
        query += `&agencyId=${filter.agencyId}`;
      }
      if (filter.createdByUserId) {
        query += `&createdByUserId=${filter.createdByUserId}`;
      }

      const response = await backendApi.get<
        ApiResponse<{
          data: CaseType[];
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        }>
      >(query, {
        headers: {
          "x-user-id": userData?.userId,
          "x-location-id": userData?.activeLocation,
        },
      });

      const apiResponse = response.data;

      if (apiResponse && apiResponse.success) {
        const { data: fetchedCases, pagination } = apiResponse.data;
        dispatch(setCaseList(fetchedCases));
        setCases(fetchedCases);
        setTotalCasesCount(pagination.total);
        setTotalPages(pagination.totalPages);
        if (pagination?.page && pagination.page !== currentPage) {
          setCurrentPage(pagination.page);
        }
      } else {
        toast.error(apiResponse?.message || ERROR_MESSAGES.FETCH.CASES);
        dispatch(setCaseList([]));
        setCases([]);
        setTotalPages(1);
        setTotalCasesCount(0);
      }
    } catch (error: any) {
      console.error("Error fetching cases:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(ERROR_MESSAGES.FETCH.GENERIC);
      }

      setCases([]);
      setTotalPages(1);
      setTotalCasesCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      setAgentLoading(true);
      if (!userData?.userId) return;
      if (agencyId) {
        const response = await getUsersByLocationAgencyWithoutPagination(
          "",
          userData.userId,
          agencyId,
          false
        );
        setAgents(response.data);
      } else {
        const response = await getUsersByLocationAgencyWithoutPagination(
          userData?.activeLocation ? userData?.activeLocation : "",
          userData.userId,
          userData?.activeLocation ? undefined : userData?.companyId,
          false
        );
        setAgents(response.data);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to fetch agents");
    } finally {
      setAgentLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const data = await getAgenciesAndSubAgencies(
        undefined,
        undefined,
        "",
        "",
        false
      );
      setAgencies(data.data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load agencies";
      toast.error(message);
    } finally {
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [userData?.activeLocation, agencyId]);

  useEffect(() => {
    fetchCases();
  }, [currentPage, selectedAgent, filter]);

  useEffect(() => {
    if (shouldRefresh) fetchCases();
  }, [shouldRefresh]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startItem = (currentPage - 1) * CASES_PER_PAGE + 1;
  const endItem = Math.min(currentPage * CASES_PER_PAGE, totalCasesCount);
  const paginationLabel = `${startItem}-${endItem} of ${totalCasesCount} Cases`;
  const handleAgencyChange = (value: string) => {
    setSelectedAgent(value);

    if (!value) {
      setFilter({});
      return;
    }

    const [type, id] = value.split(":");

    if (type === "agency") {
      setFilter({ agencyId: id });
    } else if (type === "user") {
      setFilter({ createdByUserId: id });
    }

    setCurrentPage(1);
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto">
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="mdi:folder-open"
                className="text-purple"
                width="24"
                height="24"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-pink">
                {HEADINGS.CASES.TITLE}
              </h1>
              <p className="text-gray-600">{HEADINGS.CASES.SUBTITLE}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto p-4 sm:p-6">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {LABELS.FILTERS.SHOW_CASES}
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => handleAgencyChange(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple"
                >
                  <option value="">All</option>

                  {/* Agency Option */}
                  <option
                    value={`agency:${
                      agencyId
                        ? agencyId
                        : userData?.activeLocation
                        ? userData?.activeLocation
                        : userData?.companyId
                    }`}
                  >
                    {agencyId
                      ? agencies.find((agency) => agency.id === agencyId)?.name
                      : userData?.activeLocation
                      ? agencies.find(
                          (agency) => agency.id === userData?.activeLocation
                        )?.name
                      : agencies.find(
                          (agency) => agency.id === userData?.companyId
                        )?.name}
                  </option>

                  {/* Agent Options */}
                  {agents.map((agent, index) => (
                    <option key={index} value={`user:${agent?.userId}`}>
                      {agent?.userName}
                    </option>
                  ))}
                  {agentLoading && <option value="">Loading...</option>}
                </select>
              </div>
            </div>
          </div>
          {loading ? (
            // While loading → skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(CASES_PER_PAGE)].map((_, index) => (
                <div
                  key={index}
                  className="h-64 bg-white rounded-lg shadow-sm animate-pulse"
                />
              ))}
            </div>
          ) : cases.length > 0 ? (
            // After loading → show cases
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {cases.map((caseItem) => (
                <CaseCard key={caseItem._id} case={caseItem} />
              ))}
            </div>
          ) : (
            // After loading but no data
            <div className="flex items-center justify-center text-gray-600 text-center py-5">
              {STATIC_TEXTS.CASE.NO_CASES_FOUND}
            </div>
          )}
        </div>
      </div>
      {cases.length > 0 && (
        <PageFooter
          count={cases.length}
          label={paginationLabel}
          currentPage={currentPage}
          totalPages={totalPages}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      )}
    </div>
  );
};
