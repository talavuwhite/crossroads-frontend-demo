import React, { useEffect, useState } from "react";
import { format as formatDate } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import type {
  Country,
  EventActivity,
  EventData,
  EventLocation,
  EventTypeData,
  Facilitator,
} from "@/types";
import ManageEventTypesModal from "@/components/modals/ManageEventTypesModal";
import AddEventModal from "@/components/modals/AddEventModal";
import { Link } from "react-router-dom";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { toast } from "react-toastify";
import {
  createEvent,
  deleteEvent,
  getAllEvents,
  getEventActivity,
  getEventLocationsDedicated,
  getEventTypes,
  myAgencyGetEvents,
  updateEvent,
} from "@/services/EventsApi";
import { CASES_PER_PAGE } from "@/utils/constants";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { getUsersWithoutPagination } from "@/services/UserApi";
import type { UserData } from "@/types/user";
import { getCountries } from "@/services/CountryApi";
import Loader from "@/components/ui/Loader";
import Button from "@/components/ui/Button";
import DeleteCaseModal from "@/components/modals/DeleteCaseModal";
import PageFooter from "@/components/PageFooter";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const Events: React.FC = () => {
  const user = useSelector((state: RootState) => state.user.data);
  const { canManageEventTypes, canEditDeleteEvent } = useRoleAccess();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [events, setEvents] = useState<EventData[]>([]);
  console.log("🚀 ~ events:", events);

  const [allEvents, setAllEvents] = useState<boolean>(true);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [manageEventTypeModalOpen, setManageEventTypeModalOpen] =
    useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [event, setEvent] = useState<EventData>();

  const [eventTypes, setEventTypes] = useState<EventTypeData[]>([]);
  const [locationsData, setLocationsData] = useState<EventLocation[]>([]);
  const [agents, setAgents] = useState<UserData[]>([]);
  const [activities, setActivities] = useState<EventActivity[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

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

  const fetchEventActivities = async () => {
    if (!user?.userId) return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO);
    setIsLoading(true);
    try {
      const response = await getEventActivity(user.userId, user.activeLocation);
      if (response && response.success) {
        const { data } = response.data;
        setActivities(data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT_TYPE);
    setIsLoading(true);
    try {
      const response = await getEventTypes(user.userId, user.activeLocation);
      if (response && response.success) {
        setEventTypes(response.data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR_EVENTS_TYPE);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventLocationDedicated = async () => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_LOCATION);
    setIsLoading(true);
    try {
      const response = await getEventLocationsDedicated(
        user.userId,
        user.activeLocation
      );
      if (response && response.success) {
        const data = response.data;
        setLocationsData(data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR_LOCATION);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    try {
      const response = await getUsersWithoutPagination(
        user.userId,
        user.activeLocation
      );
      setAgents(response.data || []);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to fetch agents");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchEvents = async () => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT);
    setIsLoading(true);
    try {
      const fetchFn = allEvents ? getAllEvents : myAgencyGetEvents;

      const response = await fetchFn(
        currentPage,
        CASES_PER_PAGE,
        user.userId,
        user.activeLocation
      );
      if (response && response.success) {
        const { data, pagination } = response.data;
        setCurrentPage(pagination?.page);
        setTotalPages(pagination?.totalPages);
        setEvents(data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR_EVENT);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (formData: FormData) => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT);
    try {
      await createEvent(formData, user.userId, user.activeLocation);
      toast.success(STATIC_TEXTS.EVENTS.CREATED_SUCCESS_EVENT);
      setAddEventModalOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast.error(error);
    }
  };

  const handleUpdateEvent = async (id: string, formData: any) => {
    if (!id || !user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT);
    try {
      const response = await updateEvent(
        id,
        formData,
        user.userId,
        user.activeLocation
      );
      if (response.success) {
        toast.success(STATIC_TEXTS.EVENTS.UPDATED_SUCCESS_EVENT);
        await fetchEvents();
      }
      setAddEventModalOpen(false);
    } catch (error: any) {
      toast.error(error);
    }
  };

  const handleDelete = async () => {
    if (!event?._id || !user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO_EVENT);
    setIsLoading(true);
    try {
      await deleteEvent(event?._id, user?.userId, user?.activeLocation);
      toast.success(STATIC_TEXTS.EVENTS.DELETE_SUCCESS_EVENT);
      fetchEvents();
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.DELETE_ERROR_EVENT);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
    fetchEventLocationDedicated();
    fetchAgents();
    fetchEventActivities();
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, allEvents]);

  const renderFacilitator = (facilitator: Facilitator, agents: UserData[]) => {
    const agent = agents.find((a) => a._id === facilitator?._id);
    return (
      <p className="text-sm">
        {facilitator?.firstName} {facilitator?.lastName} at{" "}
        <Link
          to={`/agencies/${
            agent?.company?.locationId
              ? agent?.company?.locationId
              : agent?.company?.companyId
          }`}
        >
          <span className="text-purple cursor-pointer underline">
            {agent?.company?.locationName || agent?.company?.companyName}
          </span>
        </Link>
      </p>
    );
  };

  return (
    <div className="flex bg-purpleLight flex-col h-full">
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="mb-6">
          <div className="mb-6">
            <div className="bg-white p-6 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
                  <Icon
                    icon="mdi:calendar-star"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-pink">Events</h1>
                </div>
              </div>
              {/* Buttons on the right */}
              <div className="flex gap-2">
                {canManageEventTypes && (
                  <Button
                    label="Manage Event Types"
                    onClick={() => setManageEventTypeModalOpen(true)}
                    className="px-4 py-2 border border-purple text-purple rounded-lg hover:bg-purple/90 hover:text-white transition"
                  />
                )}
                <Button
                  label="Add Event"
                  onClick={() => {
                    setEvent(undefined);
                    setAddEventModalOpen(true);
                  }}
                  className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple transition"
                  variant="submitStyle"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="inline-flex rounded-md overflow-hidden border border-gray-200 shadow-sm">
              <Button
                label="My Agency's Events"
                onClick={() => setAllEvents(false)}
                className={`px-6 py-2 text-sm font-medium transition-all duration-200 !border-none !rounded-none ${
                  !allEvents
                    ? "!bg-purple-100 !text-purple !border-r !border-purple font-semibold !ring-2 !ring-purple/30"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              />
              <Button
                label="All Agencies Events"
                onClick={() => setAllEvents(true)}
                className={`px-6 py-2 text-sm font-medium transition-all duration-200 !border-none !rounded-none ${
                  allEvents
                    ? "!bg-purple-100 !text-purple font-semibold !ring-2 !ring-purple/30"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden space-y-4 mb-4">
          {isLoading ? (
            <Loader />
          ) : events.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg">
              No events found matching your criteria.
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl shadow-md border border-gray-200 bg-white mb-6 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-pink mb-1 flex items-center gap-2">
                      <Icon
                        icon="mdi:calendar-star"
                        className="text-pink"
                        width="24"
                        height="24"
                      />
                      {(event.title || event.eventType) as string}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <Icon icon="mdi:map-marker" width="18" height="18" />
                      {event.location?.name}, {event.location?.address}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Icon icon="mdi:earth" width="18" height="18" />
                      {event.location?.city}, {event.location?.state}{" "}
                      {event.location?.zipCode}{" "}
                      {(typeof event?.location?.country === "object"
                        ? event?.location.country?.name
                        : countries.find(
                            (c) => c._id === event?.location.country
                          )?.name) || ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {canEditDeleteEvent(event) && (
                        <Button
                          onClick={() => {
                            setEvent(event);
                            setAddEventModalOpen(true);
                          }}
                          icon="mdi:pencil"
                          className="p-2 !px-2 !border-transparent !rounded-full !text-purple hover:!text-white hover:!bg-purple"
                        />
                      )}
                      {canEditDeleteEvent(event) && (
                        <Button
                          onClick={() => {
                            setEvent(event);
                            setIsDeleteModalOpen(true);
                          }}
                          icon="mdi:delete"
                          className="p-2 !px-2 !border-transparent !rounded-full !text-primary hover:!text-white hover:!bg-primary"
                        />
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      {renderFacilitator(event.facilitator, agents)}
                    </div>
                    <div className="text-xs flex justify-end my-2 gap-1 text-gray-500">
                      <Icon
                        icon="mdi:clock-outline"
                        width="16"
                        height="16"
                        className="inline"
                      />{" "}
                      {formatDate(
                        toZonedTime(event.dateTime, userTimeZone),
                        "EEE, MMM d, yyyy 'at' hh:mm a."
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-purple/20 h-[1px] w-full my-3"></div>
                <p className="text-sm text-gray-700 mb-3">
                  {event.description || "No description provided."}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-sm border border-purple-200 rounded-lg border-collapse bg-purple-50">
                    <tbody>
                      <tr className="border-b border-purple-200">
                        <th className="text-left px-3 py-2 border-r border-purple-200 text-purple font-semibold bg-purple-100">
                          Event Type
                        </th>
                        <td className="text-left px-3 py-2 border-r border-purple-200 text-gray-600 font-semibold bg-purple-100">
                          {event.eventType?.name}
                        </td>
                      </tr>
                      {event.activities?.map(
                        (activity, idx) =>
                          activity.activityId &&
                          activity.value && (
                            <tr
                              key={idx}
                              className="border-b border-purple-100"
                            >
                              <th className="text-left px-3 py-2 border-r border-purple-100 text-purple font-medium bg-purple-50">
                                {activity.activityId?.name}
                              </th>
                              <td className="px-3 py-2">
                                {activity?.activityId?.type === "checkbox" &&
                                activity.value
                                  ? "Yes"
                                  : activity.value}
                              </td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Attached File Section - TypeScript safe */}
                {event.file &&
                  (() => {
                    // Type guard for object with url
                    const isFileObj =
                      typeof event.file === "object" &&
                      event.file !== null &&
                      "url" in event.file;
                    if (isFileObj) {
                      const fileObj = event.file as {
                        url: string;
                        filename?: string;
                        fileSize?: number;
                      };
                      return (
                        <div className="mt-4 w-full bg-purple-50 border border-purple-100 rounded-lg flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                          <div className="flex-1 flex flex-col items-start">
                            <div className="text-xs px-3 pt-3 pb-2 w-full text-gray-500 font-semibold uppercase tracking-wide mb-1 border-b border-b-purple/20">
                              Attached File
                            </div>
                            <a
                              href={fileObj.url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between w-full gap-2 text-purple font-medium hover:underline text-base p-3"
                            >
                              <div className="flex items-center gap-1">
                                <Icon
                                  icon="mdi:file"
                                  width="24"
                                  height="24"
                                  className="inline-block"
                                />
                                <span>
                                  {fileObj.filename ||
                                    fileObj.url.split("/").pop()}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 ml-2">
                                {fileObj.fileSize
                                  ? `${(fileObj.fileSize / 1024).toFixed(1)} KB`
                                  : ""}
                              </span>
                            </a>
                          </div>
                        </div>
                      );
                    } else if (typeof event.file === "string") {
                      // Fallback for string type
                      return (
                        <div className="mt-4 w-full bg-purple-50 border border-purple-100 rounded-lg flex flex-col items-start gap-2 shadow-sm">
                          <div className="text-xs px-3 pt-3 pb-2 w-full text-gray-500 font-semibold uppercase tracking-wide mb-1 border-b border-b-purple/20">
                            Attached File
                          </div>
                          <a
                            href={`/${event.file}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-purple font-medium hover:underline text-base p-3"
                          >
                            <Icon
                              icon="mdi:file"
                              width="24"
                              height="24"
                              className="inline-block"
                            />
                            <span>{event.file.split("/").pop()}</span>
                          </a>
                        </div>
                      );
                    }
                    return null;
                  })()}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white border-t border-[#E5E7EB]">
        <PageFooter
          count={events.length}
          label="Events"
          currentPage={currentPage}
          totalPages={totalPages}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      </div>

      {addEventModalOpen && (
        <AddEventModal
          isOpen={addEventModalOpen}
          onClose={() => setAddEventModalOpen(false)}
          locationsData={locationsData}
          eventTypes={eventTypes}
          agents={agents}
          activities={activities}
          eventData={event}
          onSubmit={event ? handleUpdateEvent : handleCreateEvent}
        />
      )}

      {manageEventTypeModalOpen && (
        <ManageEventTypesModal
          isOpen={manageEventTypeModalOpen}
          onClose={() => setManageEventTypeModalOpen(false)}
        />
      )}

      {/* Event Delete Model */}
      <DeleteCaseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleDelete}
        title={"Delete Event"}
        message={
          "Are you sure you want to delete This Event ? This action cannot be undone."
        }
        confirmLabel={STATIC_TEXTS.COMMON.DELETE}
        confirmButtonLabel={"Delete Event"}
      />
    </div>
  );
};

export default Events;
