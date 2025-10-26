// --- External Libraries ---
import type { RootState } from "@/redux/store";
import { fetchBedsByCompany } from "@/services/BedManagementApi";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSelector as useReduxSelector } from "react-redux";

// --- Project Utilities & Constants ---
import { HEADINGS, STATIC_TEXTS } from "@/utils/textConstants";

// --- Components ---
import BedListTable from "@components/BedListTable";
import PrintBedListModal from "@modals/PrintBedListModal";

// --- Types ---
import type { ISiteListItem } from "@/types/bedManagement";
import { toast } from "react-toastify";

// --- Mock Data: List of sites with beds ---

const SiteBedManagement = () => {
  // --- State ---
  // Holds the list of beds to display (currently static/mock data)
  const [data, setData] = useState<ISiteListItem[]>([]);

  // Get userId from Redux
  const userData = useSelector((state: RootState) => state.user.data);
  const shouldRefetch = useReduxSelector(
    (state: RootState) => state.bedManagement.shouldRefetch
  );

  // Local handler for fetching beds
  const handleFetchBeds = useCallback(async () => {
    if (!userData?.userId) return;
    try {
      const res = await fetchBedsByCompany(userData.userId);
      setData(res || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        error?.response?.data?.message || "Failed to fetch beds";
      toast.error(errorMessage);
      console.error("Error fetching beds by company:", err);
    }
  }, [userData?.userId]);

  useEffect(() => {
    handleFetchBeds();
  }, [handleFetchBeds, userData?.userId, shouldRefetch]);

  // Controls the visibility of the print modal
  const [openPrintListModal, setOpenPrintListModal] = useState<boolean>(false);

  // --- Render ---
  return (
    <>
      <div className="mb-8">
        {/* Header Section: Title and Print Button */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Bed Icon */}
              <div className="bg-purple/10 flex p-2 rounded-full transform transition-transform duration-300 hover:scale-110 hover:rotate-3">
                <Icon
                  icon="mdi:bed"
                  className="text-purple"
                  width="24"
                  height="24"
                />
              </div>

              {/* Page Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-pink break-words">
                {HEADINGS.SITE_BED_MANAGEMENT.TITLE}
              </h1>
            </div>

            {/* Print Bed List Button */}
            <button
              onClick={() => setOpenPrintListModal(true)}
              className="relative text-white bg-purple hover:bg-purple/90 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 group  after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 group-hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
            >
              <Icon
                icon="mdi:printer"
                className="text-white"
                width="24"
                height="24"
              />
              {STATIC_TEXTS.AGENCY.BED_MANAGEMENT.PRINT_BED_LIST}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="bg-purple-200 h-[1px] my-4"></div>

        {/* Bed List Table (Main) */}
        {data?.length > 0 ? (
          data?.map((site, idx) => (
            <div key={site.siteId || site.siteName || idx}>
              <BedListTable site={site} />
              <div className="bg-purple-200 h-[1px] my-12"></div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No sites or beds found.
          </div>
        )}
      </div>

      {/* Print Modal (opens when print button is clicked) */}
      <PrintBedListModal
        isOpen={openPrintListModal}
        onClose={() => setOpenPrintListModal(false)}
      />
    </>
  );
};

export default SiteBedManagement;
