import AssessmentFieldsPage from "@/components/reusable/AssessmentFieldsPage";
import { useParams } from "react-router-dom";

const AssessmentFields = () => {
  const { id } = useParams();
  return <AssessmentFieldsPage isGlobal={false} contextId={id} />;
};

export default AssessmentFields;
