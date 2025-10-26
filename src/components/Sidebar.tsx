import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, matchPath } from "react-router-dom";
import { sidebarItems, headerItems, agencySublinks } from "@/utils/constants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Modal from "react-modal";
import AddCaseModal from "@/components/modals/AddCaseModal";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { getRecentCases } from "@/services/CaseApi";
import { setRecentCases } from "@/redux/recentCasesSlice";
import { fetchRecentSearches } from "@/redux/recentSearchesSlice";
import { getMyAgentRequests } from "@/services/AgentRequestApi";
import { toast } from "react-toastify";
import type { RecentSearch, SearchCaseFormValues } from "@/types/case";
import { STATIC_TEXTS, ERROR_MESSAGES } from "@/utils/textConstants";
import Loader from "@/components/ui/Loader";
import logo from "@/assets/logo-1.png";
import { logout } from "@/redux/userSlice";
import { logout as logoutApi } from "@/services/authApi";

Modal.setAppElement("#root");

const customModalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#1E1F2A",
    border: "1px solid #374151",
    borderRadius: "0.5rem",
    padding: "2rem",
    maxWidth: "90%",
    width: "500px",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
};

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const [showRecentCases, setShowRecentCases] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [showNavigation, setShowNavigation] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [addCaseModalOpen, setAddCaseModalOpen] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [pendingAgentRequests, setPendingAgentRequests] = useState(0);
  const location = useLocation();
  const { data: recentCases } = useSelector(
    (state: RootState) => state.recentCases
  );
  const { data: recentSearchTerms, loading: recentSearchesLoading } =
    useSelector((state: RootState) => state.recentSearches);
  const { data: userData } = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const agencyDetailMatch = matchPath("/agencies/:id/*", location.pathname);
  const agencyId = agencyDetailMatch?.params?.id;
  const excludedAgencyPages = ["agents", "services"];
  const isRealAgencyDetail =
    agencyId && !excludedAgencyPages.includes(agencyId);
  const getSearchDisplayLabel = (
    search: RecentSearch,
    index: number
  ): string => {
    const query = search.searchQuery;

    const advancedFields = Object.keys(query).filter(
      (key) => query[key as keyof SearchCaseFormValues]
    );
    if (advancedFields.length > 0) {
      const displayFields = advancedFields
        .map((key) => `${query[key as keyof SearchCaseFormValues]}`)
        .join(", ");
      return `${displayFields}`;
    }

    return `${STATIC_TEXTS.GLOBAL_SEARCH.ADVANCED_SEARCH_TITLE} ${index + 1}`;
  };

  useEffect(() => {
    const fetchRecentCasesData = async () => {
      if (!userData || !userData?.userId) {
        toast.error("User authentication data missing.");
        return;
      }
      if (userData?.userId) {
        try {
          const cases = await getRecentCases(
            userData.userId,
            userData.activeLocation
          );
          dispatch(setRecentCases(cases));
        } catch (error) {
          console.error("Failed to fetch recent cases:", error);
          toast.error(ERROR_MESSAGES.FETCH.RECENT_CASES_FAILED);
        }
      }
    };
    fetchRecentCasesData();
  }, [userData?.userId, userData?.activeLocation, dispatch]);

  // Fetch pending agent requests count for Agency Administrators
  useEffect(() => {
    const fetchPendingAgentRequests = async () => {
      if (
        !userData?.userId ||
        !userData?.activeLocation ||
        userData?.propertyRole !== "Agency Administrator"
      ) {
        return;
      }

      try {
        const response = await getMyAgentRequests(
          userData.userId,
          userData.activeLocation,
          1,
          100
        );
        const pendingCount =
          response.data.requests?.filter((req) => req.status === "pending")
            .length || 0;
        setPendingAgentRequests(pendingCount);
      } catch (error) {
        console.error("Failed to fetch pending agent requests:", error);
      }
    };

    fetchPendingAgentRequests();
  }, [userData?.userId, userData?.activeLocation, userData?.propertyRole]);

  useEffect(() => {
    if (userData?.userId) {
      dispatch(
        fetchRecentSearches({
          userId: userData.userId,
          locationId: userData.activeLocation,
        })
      );
    }
  }, [userData?.userId, userData?.activeLocation, dispatch]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!agencyId) {
      setExpandedItems((prev) => prev.filter((item) => item !== "Agencies"));
    }
  }, [agencyId]);

  const toggleSublinks = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedItem(null);
  };

  const handleRecentSearchClick = (search: RecentSearch) => {
    navigate("/search", {
      state: {
        searchParams: search.searchQuery,
        isRecentClick: true,
      },
    });
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still logout locally even if API fails
      dispatch(logout());
      navigate("/auth/login");
    }
  };

  return (
    <div id="no-print-sidebar" className="flex h-full overflow-hidden relative">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-1000 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-[280px] bg-[#1E1F2A] text-white flex flex-col min-h-screen border-r border-gray-700 transition-transform duration-300 transform
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}
      >
        <button
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[#3B3E5B] transition-colors duration-200 md:hidden cursor-pointer"
          onClick={() => setIsSidebarOpen(false)}
        >
          <Icon
            icon="mdi:close"
            className="text-white"
            width="24"
            height="24"
          />
        </button>
        <img src="/image-5.png" alt="" className="w-full h-auto hidden" />
        <div className="flex-shrink-0 p-4 border-b border-gray-700">
          <Link
            to="/"
            className="block group relative rounded-xl overflow-hidden transition-shadow hover:shadow-[0_0_24px_4px_rgba(161,140,209,0.4)]"
            title="Go to Dashboard"
          >
            <div className="absolute inset-0  opacity-20 pointer-events-none" />
            <img
              src={logo}
              alt="Logo"
              className="mx-auto h-20 w-auto transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
            />
          </Link>
        </div>

        {/* User Profile Section */}
        <div className="bg-[#2A2C3F]  mt-auto shadow-lg border border-gray-700">
          <button
            onClick={() => setShowUserProfile(!showUserProfile)}
            className="flex items-center justify-between w-full p-4 hover:bg-[#3B3E5B] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userData?.userName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-white truncate max-w-[150px]">
                  {userData?.userName || userData?.email || "User"}
                </span>
                <p className="text-sm text-purple-400 font-medium truncate max-w-[150px]">
                  {userData?.orgName}
                </p>
                <span className="text-xs text-gray-400 truncate max-w-[150px]">
                  {userData?.propertyRole || userData?.role || "Member"}
                </span>
              </div>
            </div>
            <Icon
              icon="mdi:chevron-down"
              className={`transition-transform duration-300 ${
                showUserProfile ? "rotate-180" : ""
              }`}
              width="20"
              height="20"
            />
          </button>

          {showUserProfile && (
            <div className="p-4 border-t border-gray-600 space-y-4 animate-fadeIn">
              <div>
                <p className="text-sm text-gray-200 break-words">
                  {userData?.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
              >
                <Icon icon="mdi:logout" width="16" height="16" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
          <div className="relative">
            <div
              className="w-full bg-[#2A2C3F] text-white p-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B3E5B] cursor-pointer"
              onClick={() => navigate("/search")}
            >
              Search
            </div>
            <Icon
              icon="line-md:search"
              className="absolute top-2.5 left-3 text-gray-400"
              width="20"
              height="20"
            />
          </div>

          <div className="bg-[#2A2C3F] rounded-lg overflow-hidden">
            <div className="p-2 space-y-2">
              <button
                className="flex items-center gap-2 w-full p-2 hover:bg-[#3B3E5B] rounded-lg transition-colors duration-200 text-base cursor-pointer"
                onClick={() => setAddCaseModalOpen(true)}
              >
                <Icon icon="line-md:plus" width="20" height="20" />
                <span>Add New Case</span>
              </button>
              {/* <button className="flex items-center gap-2 w-full p-2 hover:bg-[#3B3E5B] rounded-lg transition-colors duration-200 text-base cursor-pointer">
                <Icon icon="ic:outline-barcode" width="20" height="20" />
                <span>Barcode Mode</span>
              </button> */}
            </div>
          </div>

          <div className="bg-[#2A2C3F] rounded-lg overflow-hidden">
            <button
              onClick={() => setShowNavigation(!showNavigation)}
              className="flex justify-between items-center w-full p-3 hover:bg-[#3B3E5B] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon icon="mdi:navigation" width="20" height="20" />
                <span className="font-medium text-base">Navigation</span>
              </div>
              <Icon
                icon="mdi:chevron-down"
                className={`transition-transform duration-200 ${
                  showNavigation ? "rotate-180" : ""
                }`}
                width="20"
                height="20"
              />
            </button>
            {showNavigation && (
              <div className="p-2">
                <ul className="space-y-1">
                  {sidebarItems
                    .filter((item) => {
                      if (
                        item.label === "Admin" &&
                        userData?.propertyRole !== "Network Administrator"
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((item) => (
                      <li key={item.to}>
                        <div className="rounded-lg overflow-hidden">
                          <div
                            className={`flex items-center justify-between p-2 hover:bg-[#3B3E5B] cursor-pointer transition-colors duration-200 ${
                              location.pathname === item.to
                                ? "bg-[#3B3E5B]"
                                : ""
                            }`}
                            onClick={() =>
                              item.sublinks && toggleSublinks(item.label)
                            }
                          >
                            <div className="flex items-center gap-2">
                              <Icon
                                icon={item.icon}
                                width="20"
                                height="20"
                                className={
                                  location.pathname === item.to
                                    ? "text-[#A18CD1]"
                                    : ""
                                }
                              />
                              <Link
                                to={item.to}
                                className={`flex-grow text-base cursor-pointer ${
                                  location.pathname === item.to
                                    ? "text-[#A18CD1] font-normal"
                                    : ""
                                }`}
                              >
                                {item.label}
                              </Link>
                            </div>
                            {item.sublinks && (
                              <Icon
                                icon={
                                  expandedItems.includes(item.label)
                                    ? "mdi:chevron-down"
                                    : "mdi:chevron-right"
                                }
                                width="20"
                                height="20"
                                className="transition-transform"
                              />
                            )}
                          </div>

                          {/* Agencies: Show dynamic sublinks */}
                          {item.label === "Agencies" && agencyId ? (
                            <ul
                              className={`ml-6 space-y-1 overflow-hidden transition-all duration-200 ${
                                expandedItems.includes(item.label)
                                  ? "max-h-auto py-1"
                                  : "max-h-0"
                              }`}
                            >
                              {(item.sublinks ?? [])
                                .filter((sub) => {
                                  // Only allow "Assessments" for Network Administrator
                                  if (
                                    sub.label === "Assessments" &&
                                    userData?.propertyRole !==
                                      "Network Administrator"
                                  ) {
                                    return false;
                                  }
                                  return true;
                                })
                                .map((sub) => (
                                  <React.Fragment key={sub.to}>
                                    <li>
                                      <Link
                                        to={sub.to}
                                        className={`block py-2 px-2 rounded-lg text-sm hover:bg-[#3B3E5B] transition-colors duration-200 ${
                                          location.pathname === sub.to
                                            ? "bg-[#3B3E5B] text-pink font-medium"
                                            : "text-gray-300"
                                        }`}
                                      >
                                        {sub.label}
                                      </Link>
                                    </li>
                                    {sub.label === "Agencies" &&
                                      isRealAgencyDetail &&
                                      (userData?.propertyRole ===
                                      "Network Administrator"
                                        ? agencySublinks
                                        : agencySublinks.slice(0, 1)
                                      ).map((nested) => (
                                        <li key={nested.label} className="ml-6">
                                          <Link
                                            to={nested.to(agencyId)}
                                            className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-sm hover:bg-[#2F324B] transition-colors duration-200 ${
                                              location.pathname ===
                                              nested.to(agencyId)
                                                ? "bg-[#2F324B] text-pink font-medium"
                                                : "text-gray-400"
                                            }`}
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full bg-pink" />
                                            {nested.label}
                                          </Link>
                                        </li>
                                      ))}
                                  </React.Fragment>
                                ))}
                            </ul>
                          ) : (
                            item.sublinks && (
                              <ul
                                className={`ml-6 space-y-1 overflow-hidden transition-all duration-200 ${
                                  expandedItems.includes(item.label)
                                    ? "max-h-auto py-1"
                                    : "max-h-0"
                                }`}
                              >
                                {(item.sublinks ?? [])
                                  .filter((sub) => {
                                    if (
                                      sub.label === "Assessments" &&
                                      userData?.propertyRole !==
                                        "Network Administrator"
                                    ) {
                                      return false;
                                    }
                                    return true;
                                  })
                                  .map((sub) => (
                                    <li key={sub.to}>
                                      <Link
                                        to={sub.to}
                                        className={`block py-2 px-2 rounded-lg text-sm hover:bg-[#3B3E5B] transition-colors duration-200 ${
                                          location.pathname === sub.to
                                            ? "bg-[#3B3E5B] text-pink font-medium"
                                            : "text-gray-300"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>{sub.label}</span>
                                          {sub.label === "My Agent Requests" &&
                                            pendingAgentRequests > 0 && (
                                              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                                                {pendingAgentRequests}
                                              </span>
                                            )}
                                        </div>
                                      </Link>
                                    </li>
                                  ))}
                              </ul>
                            )
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recent Cases */}
          {recentCases && recentCases.length > 0 && (
            <div className="bg-[#2A2C3F] rounded-lg overflow-hidden">
              <button
                onClick={() => setShowRecentCases(!showRecentCases)}
                className="flex justify-between items-center w-full p-3 hover:bg-[#3B3E5B] transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:clock-outline" width="20" height="20" />
                  <span className="font-medium text-base">
                    {STATIC_TEXTS.SIDEBAR.RECENT_CASES}
                  </span>
                </div>
                <Icon
                  icon="mdi:chevron-down"
                  className={`transition-transform duration-200 ${
                    showRecentCases ? "rotate-180" : ""
                  }`}
                  width="20"
                  height="20"
                />
              </button>
              {showRecentCases && (
                <div className="p-2 space-y-2">
                  {recentCases &&
                    recentCases.map((caseItem) => (
                      <div
                        key={caseItem._id}
                        className="flex items-center gap-2 p-2 hover:text-white hover:bg-[#3B3E5B] rounded-lg cursor-pointer transition-all duration-200"
                        onClick={() => navigate(`/cases/${caseItem._id}`)}
                      >
                        <Icon icon="mdi:folder" width="16" height="16" />
                        <span className="text-sm text-gray-300">
                          {caseItem.name}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Searches */}
          <div className="bg-[#2A2C3F] rounded-lg overflow-hidden">
            <button
              onClick={() => setShowRecentSearches(!showRecentSearches)}
              className="flex justify-between items-center w-full p-3 hover:bg-[#3B3E5B] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icon icon="mdi:history" width="20" height="20" />
                <span className="font-medium text-base">
                  {STATIC_TEXTS.SIDEBAR.RECENT_SEARCHES}
                </span>
              </div>
              <Icon
                icon="mdi:chevron-down"
                className={`transition-transform duration-200 ${
                  showRecentSearches ? "rotate-180" : ""
                }`}
                width="20"
                height="20"
              />
            </button>
            {showRecentSearches && (
              <div className="p-2 space-y-2">
                {recentSearchTerms.length > 0 ? (
                  recentSearchTerms.map((search, index) => (
                    <div
                      key={search._id}
                      className="flex items-center gap-2 p-2 hover:text-white hover:bg-[#3B3E5B] rounded-lg cursor-pointer transition-all duration-200"
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      <Icon icon="mdi:magnify" width="16" height="16" />
                      <span className="truncate w-full max-w-full text-sm text-gray-300">
                        {getSearchDisplayLabel(search, index)}
                      </span>
                      <span>({search?.count})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-300 p-2">
                    {STATIC_TEXTS.SIDEBAR.NO_RECENT_SEARCHES}
                  </p>
                )}
                {recentSearchesLoading && <Loader width={5} height={5} />}
              </div>
            )}
          </div>
        </div>
      </aside>

      {selectedItem && selectedItem !== "Kiosk" && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customModalStyles}
          contentLabel={`${selectedItem} Modal`}
        >
          <div className="text-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Icon
                  icon={
                    headerItems.find((item) => item.name === selectedItem)
                      ?.icon || ""
                  }
                  width="24"
                  height="24"
                />
                {selectedItem}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-[#374151] rounded-lg transition-colors duration-200"
              >
                <Icon icon="mdi:close" width="20" height="20" />
              </button>
            </div>

            <div className="min-h-[200px]">
              <p className="text-gray-300">
                This is the {selectedItem} modal content. Replace this with
                actual content.
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-[#374151] hover:bg-[#4B5563] text-white rounded-lg transition-colors duration-200 cursor-pointer"
              >
                {STATIC_TEXTS.COMMON.CLOSE}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <AddCaseModal
        isOpen={addCaseModalOpen}
        onClose={() => setAddCaseModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
