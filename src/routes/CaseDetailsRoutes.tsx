import { Route, Routes } from "react-router-dom";
import { PersonalInfo } from "@/pages/cases/PersonalDetails";
import { Assistance } from "@/pages/cases/Assistance";
import { CaseLayout } from "@/components/layouts/CaseLayout";
import { Relationships } from "@/pages/cases/Relationships";
import NotesPage from "@/pages/cases/NotesPage";
import DocumentsPage from "@/pages/cases/Documents";
import AlertsPage from "@/pages/cases/AlertsPage";
import BedAssignments from "@/pages/cases/BedAssignments";
import CaseOutcomes from "@/pages/cases/CaseOutcomes";
import PrintOutcomes from "@/pages/cases/PrintOutcomes";
import AssessmentsPage from "@/pages/cases/AssessmentsPage";
import RentalSubsidyPage from "@/pages/cases/RentalSubsidyPage";
import MaintenanceRequestsPage from "@/pages/cases/MaintenanceRequestsPage";
import CaseReportPrint from "@/pages/cases/CaseReport";
import AppointmentPage from "@/pages/cases/Appointment";

export const CaseDetailsRoutes = () => {
  return (
    <CaseLayout>
      <Routes>
        <Route path="/" element={<PersonalInfo />} />
        <Route path="/personal-info" element={<PersonalInfo />} />
        <Route path="/assistance" element={<Assistance />} />
        <Route path="/relationships" element={<Relationships />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/rental-subsidy" element={<RentalSubsidyPage />} />
        <Route
          path="/maintenance-request"
          element={<MaintenanceRequestsPage />}
        />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/outcomes" element={<CaseOutcomes />} />
        <Route path="/outcomes/print" element={<PrintOutcomes />} />
        <Route path="/appointments" element={<AppointmentPage />} />
        <Route path="/bed-assignments" element={<BedAssignments />} />
        <Route path="/case-report" element={<CaseReportPrint />} />
      </Routes>
    </CaseLayout>
  );
};

export default CaseDetailsRoutes;
