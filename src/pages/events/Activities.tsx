import type { EventActivity } from "@/types";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useEffect, useState } from "react";
import PageFooter from "@components/PageFooter";
import AddActivityModal from "@/components/modals/AddActivityModal";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { toast } from "react-toastify";
import {
  createEventActivity,
  getEventActivity,
  updateEventActivity,
} from "@/services/EventsApi";
import { CASES_PER_PAGE } from "@/utils/constants";
import Loader from "@/components/ui/Loader";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const Activities = () => {
  const { canAddEventActivity, canUpdateEventActivity } = useRoleAccess();
  const user = useSelector((state: RootState) => state.user.data);

  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activities, setActivities] = useState<EventActivity[]>([]);
  const [addActivityModalOpen, setAddActivityModalOpen] = useState(false);
  const [activityData, setActivityData] = useState<EventActivity>();

  const fetchEventActivities = async () => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO);
    setIsLoading(true);
    try {
      const response = await getEventActivity(
        user.userId,
        user.activeLocation,
        currentPage,
        CASES_PER_PAGE
      );
      if (response && response.success) {
        const { data, pagination } = response.data;
        setCurrentPage(pagination?.page);
        setTotalPages(pagination?.totalPages);
        setActivities(data);
      }
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.EVENTS.FETCH_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEventActivity = async (formData: any) => {
    if (!user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO);
    try {
      await createEventActivity(formData, user.userId, user.activeLocation);
      toast.success(STATIC_TEXTS.EVENTS.CREATED_SUCCESS);
      setAddActivityModalOpen(false);
      fetchEventActivities();
    } catch (error: any) {
      toast.error(error);
    }
  };

  const handleUpdateEventActivity = async (id: string, formData: any) => {
    if (!id || !user?.userId)
      return toast.error(STATIC_TEXTS.EVENTS.MISSING_INFO);
    try {
      await updateEventActivity(id, formData, user.userId, user.activeLocation);
      toast.success(STATIC_TEXTS.EVENTS.UPDATED_SUCCESS);
      setAddActivityModalOpen(false);
      fetchEventActivities();
    } catch (error: any) {
      toast.error(error);
    }
  };

  useEffect(() => {
    fetchEventActivities();
  }, [currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                    icon="mdi:clipboard-account"
                    className="text-purple"
                    width="24"
                    height="24"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-pink">Activities</h1>
                </div>
              </div>
              {/* Buttons on the right */}
              <div className="flex gap-2">
                {canAddEventActivity && (
                  <button
                    className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/90 flex items-center gap-2 transition-all duration-300 hover:scale-105 group  after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
                    onClick={() => {
                      setActivityData(undefined);
                      setAddActivityModalOpen(true);
                    }}
                  >
                    <Icon icon="mdi:plus" width="18" height="18" />
                    Add Activity
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden space-y-4 pb-4">
          {isLoading ? (
            <Loader />
          ) : activities?.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg">
              No activities found matching your criteria.
            </div>
          ) : (
            activities?.map((activity, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 bg-white`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Icon
                      icon="mdi:table-large"
                      className="text-purple hover:text-purple-600"
                      width="20"
                      height="20"
                    />
                    <h2 className="text-xl font-semibold text-pink">
                      {activity.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {canUpdateEventActivity && (
                      <div
                        className="bg-purple-100 p-2 rounded-sm flex items-center justify-center cursor-pointer"
                        title="edit"
                        onClick={() => {
                          setAddActivityModalOpen(true);
                          setActivityData(activity);
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
                  </div>
                </div>
                <div className="bg-purple/50 h-[1px] w-full my-2"></div>
                <div className="text-sm">{activity.type}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="bg-white border-t border-[#E5E7EB]">
        <PageFooter
          count={activities?.length}
          label="Activities"
          currentPage={currentPage}
          totalPages={totalPages}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      </div>

      <AddActivityModal
        isOpen={addActivityModalOpen}
        onClose={() => setAddActivityModalOpen(false)}
        onSubmit={
          activityData ? handleUpdateEventActivity : handleCreateEventActivity
        }
        activityData={activityData}
      />
    </div>
  );
};

export default Activities;
