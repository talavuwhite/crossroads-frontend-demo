import React, { useState, useEffect } from "react";
import PageFooter from "@components/PageFooter";
import SearchBar from "@components/SearchBar";
import AlphabetFilter from "@components/AlphabetFilter";
import { getAgenciesAndSubAgencies } from "@/services/AgencyApi";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Loader from "@/components/ui/Loader";
import type { BaseAgency } from "@/types/agency";
import type { Pagination } from "@/types/case";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import { STATIC_TEXTS } from "@/utils/textConstants";

const Agencies: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [agencies, setAgencies] = useState<BaseAgency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalItems: 0,
    totalPages: 1,
  });

  const startIndex = (pagination.page - 1) * pagination.limit + 1;
  const endIndex = Math.min(
    startIndex + agencies.length - 1,
    pagination.totalItems ?? 0
  );

  const navigate = useNavigate();
  const { data: userData } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAgenciesAndSubAgencies(
          page,
          pagination.limit,
          searchTerm,
          selectedLetter || ""
        );
        setAgencies(data.data);
        setPagination(data?.pagination);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, searchTerm, selectedLetter]);

  if (!userData) {
    toast.error(STATIC_TEXTS.ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    return null;
  }

  return (
    <div className="flex bg-purpleLight flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="mb-6">
          <div className="mb-6">
            <div className="bg-white p-6 rounded-lg hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 ">
                <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
                  <Icon
                    icon="map:insurance-agency"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-pink ">Agencies</h1>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 mx-auto px-4 sm:px-6 gap-4">
            <div className="col-span-12 lg:col-span-4 min-w-[240px]">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search agencies..."
                className="w-full"
              />
            </div>
            <div className="col-span-12 lg:col-span-8 flex">
              <div className="w-full overflow-x-auto custom-scrollbar mobile-scrollbar-hide">
                <div className="min-w-max">
                  <AlphabetFilter
                    selectedLetter={selectedLetter}
                    onLetterSelect={setSelectedLetter}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden mx-auto p-4 sm:p-6 space-y-4 mb-4">
          {loading ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow">
              <Loader width={3} height={3} />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 bg-white rounded-lg shadow">
              {error}
            </div>
          ) : agencies.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow">
              No agencies found matching your criteria
            </div>
          ) : (
            agencies
              .filter(
                (agency) =>
                  agency.id !==
                  (userData?.activeLocation || userData?.companyId)
              )
              .map((agency, index) => (
                <div
                  key={agency.id}
                  className={`p-4 hover:purple/30 rounded-lg shadow ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-200"
                  }`}
                >
                  <h3 className="font-medium mb-1" style={{ color: "#4a7c7c" }}>
                    <button
                      className="hover:underline text-pink bg-transparent border-none p-0 m-0 cursor-pointer"
                      onClick={() => navigate(`/agencies/${agency.id}`)}
                      type="button"
                    >
                      {agency.name}
                    </button>
                  </h3>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Type - </span>
                    {agency.type}
                  </p>
                  <p className="text-xs my-1 text-gray-600">
                    <span className="font-medium">Agents - </span>
                    {agency?.users?.length
                      ? agency.users.map((user, userIndex) => (
                          <span key={user.userId}>
                            {user.name}
                            {userIndex < agency.users.length - 1 ? ", " : ""}
                          </span>
                        ))
                      : "Not Provided"}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>

      {agencies.length !== 0 && (
        <div className="bg-white border-t border-[#E5E7EB]">
          <PageFooter
            count={pagination.totalItems ?? 0}
            label={`${startIndex}–${endIndex} of ${
              pagination.totalItems ?? 0
            } Agencies`}
            hasPrevious={pagination.page > 1}
            hasNext={pagination.page < pagination.totalPages}
            onPrevious={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
          />
        </div>
      )}
    </div>
  );
};

export default Agencies;
