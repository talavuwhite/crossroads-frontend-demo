import React, { useState, useMemo, useEffect } from "react";
import PageFooter from "@components/PageFooter";
import SearchBar from "@components/SearchBar";
import AlphabetFilter from "@components/AlphabetFilter";
import { HEADINGS, STATIC_TEXTS, PLACEHOLDERS } from "@utils/textConstants";
import ServiceCard from "@components/ServiceCard";
import { getServices } from "@/services/ServiceApi";
import Loader from "@components/ui/Loader";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useParams } from "react-router-dom";
import type { FilteredService } from "@/types";
import { toast } from "react-toastify";

const Services: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [services, setServices] = useState<Array<FilteredService>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalServices, setTotalServices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const { id } = useParams();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        if (!userData?.userId) {
          toast.error("User authentication or location data missing.");
          return;
        }
        const response = await getServices(
          currentPage,
          pageSize,
          userData.userId,
          userData.activeLocation ?? "",
          searchTerm,
          selectedLetter ?? ""
        );
        const data = response.data;
        setServices((data.results as any) || []);
        setTotalServices(data.pagination?.total ?? 0);
        setTotalPages(data.pagination?.totalPages ?? 1);
      } catch (e) {
        setServices([]);
        setTotalServices(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [
    userData?.activeLocation,
    userData?.userId,
    id,
    currentPage,
    pageSize,
    searchTerm,
    selectedLetter,
  ]);

  const groupedServices: [string, FilteredService[]][] = useMemo(() => {
    const groups = services.reduce((acc, service) => {
      const groupKey = service.sectionId?.name || "Other";
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(service);
      return acc;
    }, {} as Record<string, FilteredService[]>);
    return Object.entries(groups);
  }, [services]);

  return (
    <div className="flex bg-gray-100 flex-col h-full">
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {HEADINGS.SERVICES.TITLE}
          </h1>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-4 min-w-[240px]">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={PLACEHOLDERS.SEARCH.SERVICES}
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

        <div className="overflow-hidden space-y-8 mb-4">
          {loading ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm">
              <Loader />
            </div>
          ) : groupedServices.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg shadow-sm">
              {STATIC_TEXTS.COMMON.NO_DATA}
            </div>
          ) : (
            groupedServices.map(
              ([category, categoryServices]: [string, FilteredService[]]) => (
                <div key={category} className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-pink mb-2">
                    {category}
                  </h2>
                  <div className="space-y-4">
                    {categoryServices.map((service) => (
                      <ServiceCard
                        key={service._id}
                        service={{
                          _id: service._id,
                          name: service.name,
                          description: service.description,
                          taxonomyCode: service.taxonomyCode,
                          providedBy: service.companyName,
                          companyName: service.companyName,
                        }}
                        showActions={false}
                        isServicePage={true}
                      />
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      <div className="bg-white border-t border-[#E5E7EB]">
        <PageFooter
          count={totalServices}
          label={(() => {
            const start = (currentPage - 1) * pageSize + 1;
            const end = Math.min(currentPage * pageSize, totalServices);
            return `${start}-${end} of ${totalServices} ${HEADINGS.SERVICES.TITLE}`;
          })()}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        />
      </div>
    </div>
  );
};

export default Services;
