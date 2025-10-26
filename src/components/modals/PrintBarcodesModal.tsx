import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  setSelectedBarcodeIds,
  setLayout,
  setPageTitle,
  setDescription,
  setIncludeConfirm,
} from "@/redux/barcodePrintSlice";
import Button from "@/components/ui/Button";
import ModalWrapper from "@/components/ui/ModalWrapper";
import { groupBarcodesBySection } from "@/utils/commonFunc";
import type { AssistanceBarcode } from "@/types";

const initialState = {
  localSelected: {} as Record<string, string[]>,
  pageTitle: "",
  description: "",
  layout: "1-column",
  includeConfirm: true,
};

const PrintBarcodesModal = ({
  isOpen,
  onClose,
  allBarcodes,
  onPrint,
}: {
  isOpen: boolean;
  onClose: () => void;
  allBarcodes: AssistanceBarcode[];
  onPrint: (selectedBarcodeIds: string[]) => void;
}) => {
  const dispatch = useDispatch();
  const [state, setState] = useState(initialState);

  // Reset state on open
  useEffect(() => {
    if (isOpen) setState(initialState);
  }, [isOpen]);

  const grouped = groupBarcodesBySection(allBarcodes);

  // Section select helpers
  const handleSectionSelect = (section: string, checked: boolean) => {
    setState((s) => ({
      ...s,
      localSelected: {
        ...s.localSelected,
        [section]: checked ? grouped[section].map((b) => b._id) : [],
      },
    }));
  };

  const handleBarcodeSelect = (
    section: string,
    id: string,
    checked: boolean
  ) => {
    setState((s) => ({
      ...s,
      localSelected: {
        ...s.localSelected,
        [section]: checked
          ? [...(s.localSelected[section] || []), id]
          : (s.localSelected[section] || []).filter((bid) => bid !== id),
      },
    }));
  };

  const allSelectedIds = Object.values(state.localSelected).flat();

  const handlePrint = () => {
    dispatch(setSelectedBarcodeIds(allSelectedIds));
    dispatch(setLayout(state.layout));
    dispatch(setPageTitle(state.pageTitle));
    dispatch(setDescription(state.description));
    dispatch(setIncludeConfirm(state.includeConfirm));
    onPrint(allSelectedIds);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Print Assistance Barcodes"
      widthClass="max-w-xl"
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            label="Print Barcodes"
            variant="submitStyle"
            onClick={handlePrint}
            disabled={!state.pageTitle || allSelectedIds.length === 0}
          />
          <Button label="Cancel" variant="dangerStyle" onClick={onClose} />
        </div>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Page Title <span className="text-primary">*</span>
          </label>
          <input
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple border-gray-300"
            value={state.pageTitle}
            onChange={(e) =>
              setState((s) => ({ ...s, pageTitle: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple border-gray-300 resize-none"
            value={state.description}
            onChange={(e) =>
              setState((s) => ({ ...s, description: e.target.value }))
            }
          />
        </div>
        <div>
          <span className="font-semibold">Page Layout</span>
          <div className="flex mt-1 w-fit border border-gray-300 rounded-lg">
            <Button
              label="1 Column"
              variant={state.layout === "1-column" ? "submitStyle" : "default"}
              onClick={() => setState((s) => ({ ...s, layout: "1-column" }))}
              type="button"
              className="border-none !rounded-r-none"
            />
            <Button
              label="2 Columns"
              variant={state.layout === "2-column" ? "submitStyle" : "default"}
              onClick={() => setState((s) => ({ ...s, layout: "2-column" }))}
              type="button"
              className="border-none !rounded-l-none    "
            />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.includeConfirm}
              onChange={(e) =>
                setState((s) => ({ ...s, includeConfirm: e.target.checked }))
              }
              className="accent-purple"
            />
            Include Confirm Assistance Barcode
          </label>
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Select Barcodes To Include
          </label>
          <div className="border border-purple/30  px-3 shadow-md rounded p-2  bg-white">
            {Object.entries(grouped).map(([section, barcodes]) => (
              <div key={section} className="mb-2">
                <div className="flex items-center gap-2 font-bold text-purple">
                  <input
                    type="checkbox"
                    checked={
                      (state.localSelected[section]?.length || 0) ===
                      barcodes.length
                    }
                    onChange={(e) =>
                      handleSectionSelect(section, e.target.checked)
                    }
                    className="accent-purple"
                  />
                  {section}
                </div>
                <div className="pl-6">
                  {barcodes.map((b) => (
                    <label
                      key={b._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={
                          state.localSelected[section]?.includes(b._id) || false
                        }
                        onChange={(e) =>
                          handleBarcodeSelect(section, b._id, e.target.checked)
                        }
                        className="accent-purple"
                      />
                      {b.barcodeName}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default PrintBarcodesModal;
