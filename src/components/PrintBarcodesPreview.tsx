import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import Button from "@/components/ui/Button";
import type { AssistanceBarcode } from "@/types";
import { Divider } from "./RentalSubsidyCard";

const PrintBarcodesPreview = ({
  barcodes,
  layout,
  pageTitle,
  description,
  onBack,
}: {
  barcodes: AssistanceBarcode[];
  layout: string;
  pageTitle: string;
  description: string;
  onBack: () => void;
}) => {
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: pageTitle,
    pageStyle: `
      @page { size: auto; margin: 30px 20px; }
      body { background: white; }
    `,
  });

  const isTwoColumn = layout === "2-column";
  const rows = isTwoColumn
    ? Array.from({ length: Math.ceil(barcodes.length / 2) }, (_, i) =>
        barcodes.slice(i * 2, i * 2 + 2)
      )
    : barcodes.map((b) => [b]);

  return (
    <div>
      <div className="flex justify-between print:hidden p-4 bg-white border-b">
        <Button
          label="Go Back"
          onClick={onBack}
          icon="mdi:arrow-back"
          variant="default"
        />
        <Button
          label="Print"
          onClick={handlePrint}
          icon="mdi:printer"
          variant="submitStyle"
        />
      </div>
      <div ref={componentRef} className="p-8 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold text-purple mb-4">{pageTitle}</h1>
        {description && <p className="mb-6 text-gray-600">{description}</p>}
        <Divider />
        <div
          className={
            isTwoColumn
              ? "grid grid-cols-2 gap-x-8 gap-y-12"
              : "flex flex-col gap-12"
          }
        >
          {rows.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((barcode) => (
                <div
                  key={barcode._id}
                  className="flex flex-col items-center border-b border-gray-300 pb-8"
                >
                  <Barcode
                    value={barcode._id}
                    height={60}
                    width={2}
                    displayValue={false}
                  />
                  <div className="mt-2 text-center">
                    <div className="font-bold text-xl text-gray-900">
                      {barcode.barcodeName}
                    </div>
                    <div className="text-gray-500 text-base">
                      {barcode.assistanceCategory?.sectionId?.name}
                      {barcode.assistanceCategory?.sectionId?.name && ": "}
                      {barcode.assistanceCategory?.name}
                    </div>
                    <div className="text-green-700 font-bold text-lg">
                      {barcode.assistanceAmount} {barcode.assistanceUnit?.name}
                    </div>
                    {barcode.assistanceDescription && (
                      <div className="text-xs text-gray-400">
                        {barcode.assistanceDescription}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintBarcodesPreview;
