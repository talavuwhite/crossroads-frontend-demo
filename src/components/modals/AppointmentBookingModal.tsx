import ModalWrapper from "@ui/ModalWrapper";
import { useEffect } from "react";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentBookingModal = ({
  isOpen,
  onClose,
}: AppointmentBookingModalProps) => {
  const { data: caseData } = useSelector((state: RootState) => state.case);
  useEffect(() => {
    if (!isOpen) return;
    const script = document.createElement("script");
    script.src = "https://link.msgsndr.com/js/embed.js";
    script.type = "text/javascript";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [isOpen]);

  if (!caseData) return null;

  const caseQueryData = {
    case_first_name: caseData.firstName || "",
    case_last_name: caseData.lastName || "",
    caseid: caseData?._id || "",
    case_email: caseData.email || "",
  };
  const queryString = new URLSearchParams(caseQueryData).toString();
  const iframeSrc = `https://api.leadconnectorhq.com/widget/booking/7kVCQ2hz9tQTbceVoE03?${queryString}`;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Book Appointment"
      widthClass="max-w-2xl"
      footer={null}
    >
      <div style={{ minHeight: "900px" }}>
        <iframe
          src={iframeSrc}
          style={{
            width: "100%",
            minHeight: "900px",
            border: "none",
            overflow: "hidden",
          }}
          scrolling="no"
          title="Appointment Booking"
        ></iframe>
      </div>
    </ModalWrapper>
  );
};

export default AppointmentBookingModal;
