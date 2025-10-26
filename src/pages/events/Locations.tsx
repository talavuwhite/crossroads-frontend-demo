import type { Country, EventLocation } from "@/types";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageFooter from "@components/PageFooter";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import AddLocationModal from "@/components/modals/AddLocationModal";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { CASES_PER_PAGE } from "@/utils/constants";
import {
  createEventLocation,
  deleteEventLocation,
  getEventLocations,
  updateEventLocation,
} from "@/services/EventsApi";
import Loader from "@/components/ui/Loader";
import { getAgenciesAndSubAgencies } from "@/services/AgencyApi";
import { getCountries } from "@/services/CountryApi";
import type { BaseAgency } from "@/types/agency";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const Locations = () => {
  const { canAddEventActivity: canAddLocation, canEditDeleteEventLocation } =
    useRoleAccess();
  const user = useSelector((state: RootState) => state.user.data);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [locationsData, setLocationsData] = useState<EventLocation[]>([]);
  // const [selectedAgency, setSelectedAgency] = useState<string>("all");
  const [addLocationModalOpen, setAddLocationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [location, setLocation] = useState<EventLocation>();
  const [countries, setCountries] = useState<Country[]>([]);
  const [agencies, setAgencies] = useState<BaseAgency[]>([]);

  const fetchEventLocation = async () => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_LOCATION);
    setIsLoading(true);
    try {
      const response = await getEventLocations(
        currentPage,
        CASES_PER_PAGE,
        user.userId,
        user.activeLocation
      );
      if (response && response.success) {
        const { data, pagination } = response.data;
        setCurrentPage(pagination?.page);
        setTotalPages(pagination?.totalPages);
        setLocationsData(data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR_LOCATION);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEventLocation = async (formData: any) => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_LOCATION);
    try {
      await createEventLocation(formData, user.userId, user.activeLocation);
      toast.success(STATIC_TEXTS.EVENTS.CREATED_SUCCESS_LOCATION);
      setAddLocationModalOpen(false);
      fetchEventLocation();
    } catch (error: any) {
      toast.error(error);
    }
  };

  const handleUpdateEventLocation = async (id: string, formData: any) => {
    if (!id || !user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_LOCATION);
    try {
      await updateEventLocation(id, formData, user.userId, user.activeLocation);
      toast.success(STATIC_TEXTS.EVENTS.UPDATED_SUCCESS_LOCATION);
      setAddLocationModalOpen(false);
      fetchEventLocation();
    } catch (error: any) {
      toast.error(error);
    }
  };

  const handleDelete = async () => {
    if (!location?._id || !user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_LOCATION);
    setIsLoading(true);
    try {
      await deleteEventLocation(
        location?._id,
        user?.userId,
        user?.activeLocation
      );
      toast.success(STATIC_TEXTS.EVENTS.DELETE_SUCCESS_LOCATION);
      fetchEventLocation();
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.DELETE_ERROR_LOCATION);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventLocation();
  }, [currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchCountries = async () => {
    if (!user?.userId) {
      return toast.error("User authentication missing");
    }
    try {
      const countryList = await getCountries(user.userId, user.activeLocation);
      setCountries(countryList);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load countries";
      toast.error(message);
    } finally {
    }
  };

  const fetchAgencies = async () => {
    try {
      const data = await getAgenciesAndSubAgencies();
      setAgencies(data.data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load agencies";
      toast.error(message);
    } finally {
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchAgencies();
  }, []);

  return (
    <div className="flex bg-purpleLight flex-col h-full">
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="mb-6">
          <div className="mb-6">
            <div className="bg-white p-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
                  <Icon
                    icon="mdi:location"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-pink">Locations</h1>
                </div>
              </div>
              {/* Buttons on the right */}
              <div className="flex gap-2">
                {canAddLocation && (
                  <button
                    className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/90 flex items-center gap-2 transition-all duration-300 hover:scale-105 group  after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
                    onClick={() => {
                      setLocation(undefined);
                      setAddLocationModalOpen(true);
                    }}
                  >
                    <Icon icon="mdi:plus" width="18" height="18" />
                    Add Location
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden space-y-4 pb-4">
          {isLoading ? (
            <Loader />
          ) : locationsData?.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg">
              No locations found matching your criteria.
            </div>
          ) : (
            locationsData?.map((location, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 bg-white`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Icon
                      icon="mdi:building"
                      className="text-purple hover:text-purple-600"
                      width="20"
                      height="20"
                    />
                    <h2 className="text-xl font-semibold text-pink">
                      {location.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditDeleteEventLocation(location) && (
                      <div
                        className="bg-purple-100 p-2 rounded-sm flex items-center justify-center cursor-pointer"
                        title="edit"
                        onClick={() => {
                          setAddLocationModalOpen(true);
                          setLocation(location);
                        }}
                      >
                        <Icon
                          icon="mdi:edit"
                          className="text-purple hover:text-purple-600"
                          width="20"
                          height="20"
                        />
                      </div>
                    )}
                    {canEditDeleteEventLocation(location) && (
                      <div
                        className="bg-purple-100 p-2 rounded-sm flex items-center justify-center cursor-pointer"
                        title="delete"
                        onClick={() => {
                          setIsDeleteModalOpen(true);
                          setLocation(location);
                        }}
                      >
                        <Icon
                          icon="mdi:delete"
                          className="text-purple hover:text-purple-600"
                          width="20"
                          height="20"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-purple/50 h-[1px] w-full my-2"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
                  <div className="lg:col-span-2">
                    {location.address ||
                    location.city ||
                    location.state ||
                    location.zipCode ||
                    location.country ? (
                      <>
                        <h2 className="text-sm font-semibold text-pink mb-1">
                          Address:
                        </h2>
                        <div className="text-sm">
                          <p>{location.address}</p>
                          <p>
                            {location.city}
                            {location.state && <span>,</span>} {location.state}
                            {location.zipCode && <span>,</span>}{" "}
                            {location.zipCode}
                          </p>
                          <p>
                            {(typeof location?.country === "object"
                              ? location.country?.name
                              : countries.find(
                                  (c) => c._id === location.country
                                )?.name) || ""}{" "}
                            {location.country && <span>County</span>}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No address provided
                      </p>
                    )}
                  </div>
                  <div className="lg:col-span-2">
                    {location.contactName ||
                    location.contactPhone ||
                    location.contactEmail ? (
                      <>
                        <h2 className="text-sm font-semibold text-pink mb-1">
                          Contact Info:
                        </h2>
                        <div className="text-sm">
                          <p>{location.contactName}</p>
                          <p>{location.contactPhone}</p>
                          <Link to={`mailto:${location.contactEmail}`}>
                            <p className="text-blue-700 hover:text-blue-600 underline">
                              {location.contactEmail}
                            </p>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No contact info provided
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    {location.description ? (
                      <>
                        <h2 className="text-sm font-semibold text-pink mb-1">
                          Description:
                        </h2>
                        <p>{location.description}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No description provided
                      </p>
                    )}
                  </div>
                </div>
                {location.dedicateToCompany && (
                  <div className="bg-purple/70 rounded-sm text-sm text-white p-2 px-4 mt-2">
                    Only used by{" "}
                    <Link
                      to={`/agencies/${
                        agencies.find(
                          (a) => a.name === location.dedicateToCompany
                        )?.id
                      }`}
                    >
                      <span className="underline font-medium">
                        {location.dedicateToCompany}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="bg-white border-t border-[#E5E7EB]">
        <PageFooter
          count={locationsData?.length}
          label="Locations"
          currentPage={currentPage}
          totalPages={totalPages}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      </div>

      <AddLocationModal
        isOpen={addLocationModalOpen}
        onClose={() => setAddLocationModalOpen(false)}
        agencies={agencies}
        countries={countries}
        locationData={location}
        onSubmit={
          location ? handleUpdateEventLocation : handleCreateEventLocation
        }
      />

      {/* Event Delete Model */}
      <ConfirmationModal
        title="Delete Location"
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this location?"
        variant="danger"
      />
    </div>
  );
};

export default Locations;
