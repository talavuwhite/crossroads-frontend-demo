import Sidebar from "@/components/Sidebar";
import Agencies from "@/pages/Agencies";
import Agents from "@/pages/Agents";
import Dashboard from "@/pages/Dashboard";
import GlobalSearch from "@/pages/GlobalSearch";
import Services from "@/pages/Services";
import AgencyDetails from "@/pages/agency/AgencyDetails";
import CaseDetailsRoutes from "@/routes/CaseDetailsRoutes";
import { CasesList } from "@/pages/agency/CasesList";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { getPageTitle } from "@/utils/commonFunc";
import AssistanceList from "@/pages/agency/AssistanceList";
import Events from "@/pages/events";
import Locations from "@/pages/events/Locations";
import Activities from "@/pages/events/Activities";
import { Provider, useSelector } from "react-redux";
import { store, type RootState } from "@/redux/store";
import { UserDataProvider } from "@/provider/userProvider";
import { CategoriesList } from "@/pages/agency/CategoryList";
import Barcodes from "@/pages/agency/Barcodes";
import AdminSettings from "@/pages/admin/Settings";
import { ReferralsList } from "@/pages/agency/ReferralsList";
import AdminCategories from "@/pages/admin/AdminCategory";
import AgencyServices from "@/pages/agency/AgencyServices";
import React, { useState, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { BedManagement } from "@/pages/agency/BedManagement";
import PrintBedManagement from "@/pages/agency/PrintBedManagement";
import Outcomes from "@/pages/admin/Outcomes";
import AssessmentFields from "@/pages/agency/AssessmentFields";
import AdminAssessmentFields from "@/pages/admin/AdminAssessmentFields";
import Reports from "@/pages/agency/Reports";
import PrintReport from "@/pages/agency/PrintReport";
import AdminBarcodes from "@/pages/admin/AdminBarcode";
import AgentRequests from "@/pages/admin/AgentRequests";
import Loader from "@/components/ui/Loader";
import AuthGuard from "@/components/AuthGuard";
import Login from "@/pages/auth/login";
import VerifyOTP from "@/pages/auth/VerifyOtp";
import { BarcodeScannerProvider } from "@/contexts/BarcodeScannerContext";
import GlobalBarcodeScannerHandler from "@/components/GlobalBarcodeScannerHandler";
import BarcodeScannerFAB from "@/components/BarcodeScannerFAB";
import BarcodeScannerKeyboardHandler from "@/components/BarcodeScannerKeyboardHandler";
import GlobalBarcodeScannerListener from "@/components/GlobalBarcodeScannerListener";

const EnhancedAssistanceReport = React.lazy(
  () => import("@/pages/agency/EnhancedAssistanceReport")
);

const EnhancedCaseReport = React.lazy(
  () => import("@/pages/agency/EnhancedCaseReport")
);

const EnhancedCategoryReport = React.lazy(
  () => import("@/pages/agency/EnhancedCategoryReport")
);

const EnhancedEventReport = React.lazy(
  () => import("@/pages/agency/EnhancedEventReport")
);

const EnhancedReferralReport = React.lazy(
  () => import("@/pages/agency/EnhancedReferralReport")
);

const EnhancedOutcomeReport = React.lazy(
  () => import("@/pages/agency/EnhancedOutcomeReport")
);

const EnhancedOutcomeGoalsReport = React.lazy(
  () => import("@/pages/agency/EnhancedOutcomeGoalsReport")
);

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { data: userData } = useSelector((state: RootState) => state.user);

  if (userData && userData.isActive === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Account Disabled
          </h2>
          <p className="text-gray-600">
            Your account is currently disabled. Please contact your
            administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  const isNetworkAdmin = userData?.propertyRole === "Network Administrator";

  return (
    <Provider store={store}>
      <UserDataProvider>
        <BarcodeScannerProvider
          userId={userData?.userId}
          locationId={userData?.activeLocation}
        >
          <GlobalBarcodeScannerListener />
          <BarcodeScannerKeyboardHandler />
          <Routes>
            {/* Authentication routes - No sidebar */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/verify-otp" element={<VerifyOTP />} />

            {/* Protected routes - With sidebar */}
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <div className="flex h-screen overflow-hidden relative">
                    <Sidebar
                      isSidebarOpen={isSidebarOpen}
                      setIsSidebarOpen={setIsSidebarOpen}
                    />

                    {location.pathname.startsWith("/cases") && (
                      <button
                        id="no-print-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label="toggle sidebar"
                        className={`absolute  z-[9999]  text-[#2A2C3F] px-1  md:hidden hover:bg-[#3B3E5B] transition-colors duration-200 cursor-pointer ${
                          isSidebarOpen ? "p-0" : "p-2"
                        }`}
                        title="Open main sidebar"
                      >
                        {!isSidebarOpen && (
                          <Icon
                            icon="mdi:menu"
                            className="text-purple  p-2 rounded-full"
                            width="24"
                            height="24"
                          />
                        )}
                      </button>
                    )}

                    <div className="flex-1 flex flex-col overflow-hidden">
                      {!location.pathname.startsWith("/cases") && (
                        <div
                          id="no-print-header"
                          className="bg-white p-4 border-b border-b-purple/20 flex items-center gap-4 md:hidden shadow-sm"
                        >
                          <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            aria-label="toggle sidebar"
                            className="p-0 rounded-full transition-colors duration-200"
                          >
                            <Icon
                              icon="mdi:menu"
                              width="24"
                              height="24"
                              className="text-purple bg-purple/10 p-2 rounded-full"
                            />
                          </button>
                          <h1 className="text-xl font-semibold text-purple">
                            {getPageTitle(location.pathname)}
                          </h1>
                        </div>
                      )}

                      <main className="flex-1 overflow-auto">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/search" element={<GlobalSearch />} />
                          {/* my agency routes */}
                          <Route path="/myAgency" element={<AgencyDetails />} />
                          <Route
                            path="/myAgency/cases"
                            element={<CasesList />}
                          />
                          <Route
                            path="/myAgency/assistance"
                            element={<AssistanceList />}
                          />
                          <Route
                            path="/myAgency/categories"
                            element={<CategoriesList />}
                          />
                          <Route
                            path="/myAgency/bed-managements/print"
                            element={<PrintBedManagement />}
                          />

                          <Route
                            path="/agencies/:agencyId/referrals"
                            element={<ReferralsList />}
                          />
                          <Route
                            path="/myAgency/services"
                            element={<AgencyServices />}
                          />
                          <Route
                            path="/myAgency/referrals"
                            element={<ReferralsList />}
                          />
                          <Route
                            path="/myAgency/bed-managements"
                            element={<BedManagement />}
                          />
                          {isNetworkAdmin && (
                            <Route
                              path="/myAgency/assessments"
                              element={<AssessmentFields />}
                            />
                          )}
                          <Route
                            path="/myAgency/reports"
                            element={<Reports />}
                          />
                          <Route
                            path="/myAgency/:id/report"
                            element={<PrintReport />}
                          />
                          <Route
                            path="/myAgency/assistance/report"
                            element={
                              <Suspense fallback={<Loader />}>
                                <EnhancedAssistanceReport />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/myAgency/barcodes"
                            element={<Barcodes />}
                          />
                          <Route
                            path="/myAgency/cases/report"
                            element={
                              <Suspense fallback={<Loader />}>
                                <EnhancedCaseReport />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/myAgency/categories/report"
                            element={
                              <Suspense fallback={<Loader />}>
                                <EnhancedCategoryReport />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/myAgency/events/report"
                            element={
                              <Suspense fallback={<Loader />}>
                                <EnhancedEventReport />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/myAgency/referrals/report"
                            element={
                              <Suspense fallback={<Loader />}>
                                <EnhancedReferralReport />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/myAgency/outcomes/report"
                            element={
                              <Suspense fallback={<Loader />}>
                                <EnhancedOutcomeReport />
                              </Suspense>
                            }
                          />
                          <Route
                            path="/myAgency/outcome-goals/report"
                            element={
                              <Suspense fallback={<Loader />}>
                                <EnhancedOutcomeGoalsReport />
                              </Suspense>
                            }
                          />

                          {/* case routes */}
                          <Route
                            path="/cases/:id/*"
                            element={<CaseDetailsRoutes />}
                          />
                          {/* agency routes */}
                          <Route path="/agencies" element={<Agencies />} />
                          <Route
                            path="/agencies/:id"
                            element={<AgencyDetails />}
                          />
                          <Route
                            path="/agencies/:id/cases"
                            element={<CasesList />}
                          />
                          <Route
                            path="/agencies/:id/services"
                            element={<AgencyServices />}
                          />
                          <Route
                            path="/agencies/:id/assistance"
                            element={<AssistanceList />}
                          />
                          <Route
                            path="/agencies/:id/categories"
                            element={<CategoriesList />}
                          />
                          <Route
                            path="/agencies/:id/barcodes"
                            element={<Barcodes />}
                          />
                          <Route
                            path="/agencies/:id/bed-managements"
                            element={<BedManagement />}
                          />
                          <Route
                            path="/agencies/:id/bed-managements/print"
                            element={<PrintBedManagement />}
                          />
                          <Route
                            path="/agencies/:agencyId/referrals"
                            element={<ReferralsList />}
                          />
                          {isNetworkAdmin && (
                            <Route
                              path="/agencies/:id/assessments"
                              element={<AssessmentFields />}
                            />
                          )}

                          <Route path="/agencies/agents" element={<Agents />} />
                          <Route
                            path="/agencies/services"
                            element={<Services />}
                          />
                          {/* events routes */}
                          <Route path="/events" element={<Events />} />
                          <Route
                            path="/events/locations"
                            element={<Locations />}
                          />
                          <Route
                            path="/events/activities"
                            element={<Activities />}
                          />
                          {/* Admin routes */}
                          {userData &&
                            userData?.propertyRole ===
                              "Network Administrator" && (
                              <>
                                <Route
                                  path="/admin/settings"
                                  element={<AdminSettings />}
                                />
                                <Route
                                  path="/admin/agent-requests"
                                  element={<AgentRequests />}
                                />
                                <Route
                                  path="/admin/categories"
                                  element={<AdminCategories />}
                                />
                                <Route
                                  path="/admin/assessments"
                                  element={<AdminAssessmentFields />}
                                />
                                <Route
                                  path="/admin/barcode"
                                  element={<AdminBarcodes />}
                                />
                                <Route
                                  path="/admin/outcomes"
                                  element={<Outcomes />}
                                />
                              </>
                            )}
                        </Routes>
                      </main>
                    </div>
                  </div>

                  {/* Global Barcode Scanner Components */}
                  <GlobalBarcodeScannerHandler />
                  <BarcodeScannerFAB />
                </AuthGuard>
              }
            />
          </Routes>
        </BarcodeScannerProvider>
      </UserDataProvider>
    </Provider>
  );
};

export default App;
