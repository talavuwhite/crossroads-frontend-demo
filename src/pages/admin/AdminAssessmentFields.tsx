import AssessmentFieldsPage from "@/components/reusable/AssessmentFieldsPage";

const AdminAssessmentFields = () => {
  return (
    <AssessmentFieldsPage
      isGlobal={true}
      title="Admin Assessment Fields"
      useGlobalApi={true}
    />
  );
};

export default AdminAssessmentFields;
