import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { STATIC_TEXTS } from "@/utils/textConstants";
import { toast } from "react-toastify";
import AppointmentCard from "@/components/AppointmentCard";
import AppointmentBookingModal from "@/components/modals/AppointmentBookingModal";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { fetchAppointments } from "@/services/AppointmentApi";
import type {
  Appointment,
  FetchAppointmentsResponse,
} from "@/services/AppointmentApi";
import { CASES_PER_PAGE } from "@/utils/constants";
import type { ApiResponse } from "@/types/api";
import Footer from "@/components/PageFooter";
import { updateCaseCount } from "@/redux/caseCountSlice";

const AppointmentPage = () => {
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddAppointmentModalOpen, setIsAddAppointmentModalOpen] =
    useState(false);

  const fetchAppointmentRecords = async () => {
    if (!caseData?._id || !userData?.userId) return;
    setIsLoading(true);
    try {
      const response: ApiResponse<FetchAppointmentsResponse> =
        await fetchAppointments(
          caseData._id,
          currentPage,
          CASES_PER_PAGE,
          userData.userId,
          userData.activeLocation
        );
      setAppointments(response.data.results || []);
      setTotalPages(Number(response.data.pagination.totalPages));
      setTotalItems(Number(response.data.pagination.total));
      dispatch(
        updateCaseCount({
          key: "appointments",
          value: Number(response.data.pagination.total),
        })
      );
    } catch (error: any) {
      toast.error(error || STATIC_TEXTS.ERROR_MESSAGES.FETCH.GENERIC);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentRecords();
  }, [caseData?._id, currentPage, isAddAppointmentModalOpen]);

  useEffect(() => {
    fetchAppointmentRecords();
  }, []);

  if (!caseData) return null;

  const startItem = (currentPage - 1) * CASES_PER_PAGE + 1;
  const endItem = Math.min(currentPage * CASES_PER_PAGE, totalItems);
  const paginationLabel = `${startItem}-${endItem} of ${totalItems} Appointments`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
        <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4 pr-10">
          <h1 className="text-2xl font-bold text-pink">
            Appointments for {caseData?.firstName + " " + caseData?.lastName}
          </h1>
          <Button
            variant="submitStyle"
            label="Add Appointment"
            icon="mdi:plus"
            className="hover:bg-purple/90 transition-colors duration-200"
            onClick={() => setIsAddAppointmentModalOpen(true)}
          />
        </div>
        <div className="p-6 space-y-4">
          {isLoading ? (
            <Loader />
          ) : appointments.length === 0 ? (
            <p className="text-center text-gray-500">
              {STATIC_TEXTS.COMMON.NO_DATA}
            </p>
          ) : (
            appointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
              />
            ))
          )}
        </div>
      </div>
      {appointments && appointments.length > 0 && (
        <Footer
          count={appointments.length}
          label={paginationLabel}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
          onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      )}
      <AppointmentBookingModal
        isOpen={isAddAppointmentModalOpen}
        onClose={() => setIsAddAppointmentModalOpen(false)}
      />
    </div>
  );
};

export default AppointmentPage;
