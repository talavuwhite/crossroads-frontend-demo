import React, { useRef, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import Button from "@ui/Button";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { FormikProvider, useFormik } from "formik";
import * as yup from "yup";
import { toast } from "react-toastify";
import * as htmlToImage from "html-to-image";
import axios from "axios";
import type { CaseType } from "@/types/case";

interface IDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmail: () => void;
  userName: string;
  email: string;
  centerName: string;
  caseData: CaseType;
}

interface EmailFormValues {
  email: string;
}

const validationSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
});

const CASE_ID_CARD_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/NyrQIwdzN3GkHdxFbKIx/webhook-trigger/c3cda711-79a9-451b-859c-0165b56ec6dd";

const sendIdCardEmail = async (
  caseName: string,
  agencyName: string,
  email: string,
  pngDataUrl: string
) => {
  const base64Image = pngDataUrl.split(",")[1];

  const payload = {
    caseName,
    agencyName,
    email,
    attachment: base64Image,
  };

  try {
    const res = await axios.post(CASE_ID_CARD_WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: any) {
    console.error("❌ Failed to send ID card webhook:", err.message);
    throw err;
  }
};

const IDCardModal: React.FC<IDCardModalProps> = ({
  isOpen,
  onClose,
  userName,
  email,
  centerName,
  caseData,
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [openEmailGettingModal, setOpenEmailGettingModal] = useState(false);
  const [idCardImage, setIdCardImage] = useState<string>("");

  const initialValues = {
    email: email || "",
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `ID Card for ${userName}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 0px 20px;
      }
    `,
  });

  const formik = useFormik<EmailFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await sendIdCardEmail(userName, centerName, values.email, idCardImage);

        toast.success("ID Card sent successfully!");
        setOpenEmailGettingModal(false);
        onClose();
      } catch (error) {
        toast.error("Failed to send ID card email.");
      }
    },
  });

  const makeThePNG = async () => {
    const idCard = componentRef.current;
    if (!idCard) {
      toast.error("Something went wrong while creating the ID card image.");
      return;
    }

    try {
      const imageData = await htmlToImage.toPng(idCard, {
        cacheBust: true,
        pixelRatio: 2,
      });

      setIdCardImage(imageData);
      // const link = document.createElement("a");
      // link.href = imageData;
      // link.download = `${userName}-ID.png`;
      // link.click();
    } catch (error) {
      toast.error("Something went wrong while creating the ID card image.");
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={openEmailGettingModal ? "Email ID Card" : "ID Card"}
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          {openEmailGettingModal ? (
            <>
              <Button
                variant="submitStyle"
                label="Send ID Card"
                type="submit"
                form="email-form"
              />
              <Button
                variant="default"
                label="Cancel"
                onClick={() => setOpenEmailGettingModal(false)}
              />
            </>
          ) : (
            <Button variant="submitStyle" label="Close" onClick={onClose} />
          )}
        </div>
      }
    >
      <div
        className={`space-y-4 ${openEmailGettingModal ? "block" : "hidden"}`}
      >
        <div className="text-sm text-gray-600">
          <p>
            Enter the client's email address where you would like to send the ID
            card. They will receive an email with the card attached.
          </p>
        </div>
        <FormikProvider value={formik}>
          <form id="email-form" onSubmit={formik.handleSubmit}>
            <label className="font-semibold block mb-2">
              Client's Email Address
            </label>
            <input
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full p-2 border-2 border-gray-300 rounded focus:outline-none focus:border-purple-500"
              placeholder="Enter client's email address"
            />
            {formik.errors.email && formik.touched.email && (
              <p className="text-red-500 text-sm">{formik.errors.email}</p>
            )}
          </form>
        </FormikProvider>
      </div>

      <div
        className={`space-y-4 ${openEmailGettingModal ? "hidden" : "block"}`}
      >
        <div
          ref={componentRef}
          className="print:mt-40 print:max-w-[600px] print:mx-auto border border-gray-300 rounded-md p-4 bg-gray-50"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 uppercase">
                Identification Card
              </h3>
              <p className="text-sm text-gray-600">{centerName}</p>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {caseData.caseId}
            </span>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">{userName}</h2>
          </div>

          <div className="justify-center flex w-full">
            <Barcode
              value={"C-" + caseData._id}
              height={80}
              width={2}
              displayValue={false}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="submitStyle"
            label="Print ID Card"
            onClick={handlePrint}
            className="flex-1"
          />
          <Button
            variant="submitStyle"
            label="Email ID Card"
            onClick={async () => {
              await makeThePNG();
              setOpenEmailGettingModal(true);
            }}
            className="flex-1"
          />
        </div>

        <div className="text-sm text-gray-600">
          <p>
            Using a Plastic Card Printer? Download the image here and insert the
            image in the software that comes with your printer.
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default IDCardModal;
