import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify-icon/react";
import Button from "@components/ui/Button";
import { toast } from "react-toastify";
import Barcode from "react-barcode";
import PageFooter from "@components/PageFooter";
import AddEditBarcodeModal from "@components/modals/AddEditBarcodeModal";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories, groupBarcodes } from "@/utils/commonFunc";
import type { AssistanceBarcode, SimplifiedCategory } from "@/types";
import { HEADINGS, STATIC_TEXTS } from "@/utils/textConstants";
import {
  fetchBarcodes,
  createBarcode,
  updateBarcode,
  deleteBarcode,
  fetchFilteredBarcodes,
} from "@/services/AssistanceBarcodeApi";
import Loader from "@/components/ui/Loader";
import DeleteCaseModal from "@components/modals/DeleteCaseModal";
import PrintBarcodesPreview from "@/components/PrintBarcodesPreview";
import { reset as resetPrintState } from "@/redux/barcodePrintSlice";
import PrintBarcodesModal from "@/components/modals/PrintBarcodesModal";
import type { RootState } from "@/redux/store";
import { CASES_PER_PAGE } from "@/utils/constants";

type GroupedBarcodes = {
  id: string;
  section: string;
  items: AssistanceBarcode[];
};

interface BarcodesProps {
  visibleTo?: "All Agencies" | "Agency Only";
}

const canEditOrDelete = (userData: any, barcode: AssistanceBarcode) => {
  if (userData.propertyRole === "Network Administrator") return true;
  if (userData.propertyRole === "Agency Administrator") {
    // Assuming barcode has an agencyId or similar property
    return (
      (barcode.companyId === userData.activeLocation ||
        (!userData.activeLocation &&
          barcode.companyId === userData.companyId)) &&
      barcode.visibleTo === "Agency Only"
    );
  }
  return false;
};

const canCreate = (userData: any) =>
  userData.propertyRole === "Network Administrator" ||
  userData.propertyRole === "Agency Administrator";

const Barcodes: React.FC<BarcodesProps> = ({ visibleTo = "Agency Only" }) => {
  const [barcodes, setBarcodes] = useState<GroupedBarcodes[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<AssistanceBarcode | null>(null);
  const [categories, setCategories] = useState<SimplifiedCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const userData = useSelector((state: any) => state.user.data);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<AssistanceBarcode | null>(null);
  const printState = useSelector((state: RootState) => state.barcodePrint);
  console.log("🚀 ~ Barcodes ~ printState:", printState);
  const dispatch = useDispatch();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printBarcodes, setPrintBarcodes] = useState<AssistanceBarcode[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = CASES_PER_PAGE; // or whatever number you want per page

  const loadBarcodes = async () => {
    setLoading(true);
    try {
      const response = await fetchBarcodes(
        visibleTo,
        userData.userId,
        userData?.activeLocation,
        currentPage,
        limit
      );

      const grouped = groupBarcodes(response?.barcodes);
      setBarcodes(grouped);
    } catch (error) {
      console.error("Failed to load barcodes", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!userData?.userId) {
      toast.error("User authentication data missing.");
      return;
    }

    loadBarcodes();
  }, [userData?.userId, currentPage]);

  useEffect(() => {
    fetchCategories(userData, setLoadingCategories, setCategories);
  }, [userData?.userId, userData?.activeLocation, modalOpen]);

  const handleEdit = (barcode: AssistanceBarcode) => {
    if (!canEditOrDelete(userData, barcode)) return;
    setEditData(barcode);
    setModalOpen(true);
  };

  const handleDelete = (barcode: AssistanceBarcode) => {
    if (!canEditOrDelete(userData, barcode)) return;
    setDeleteModalOpen(true);
    setDeleteData(barcode);
  };

  const handleAdd = () => {
    if (!canCreate(userData)) return;
    setEditData(null);
    setModalOpen(true);
  };

  const totalBarcodes = barcodes.reduce(
    (acc, group) => acc + group.items.length,
    0
  );
  const paginationLabel = `${totalBarcodes} Barcodes`;

  const handleModalSubmit = async (values: any) => {
    if (!userData?.userId) {
      toast.error("User authentication data missing.");
      return;
    }
    try {
      if (editData) {
        // Edit mode
        await updateBarcode(
          editData._id,
          {
            barcodeName: values.name,
            assistanceCategory: values.category,
            assistanceAmount: values.amount,
            allowEditAmount: values.allowEditAmount,
            assistanceUnit: values.unit,
            assistanceDescription: values.description,
            // Add other fields if needed
          },
          userData.userId,
          userData.activeLocation
        );
        toast.success(STATIC_TEXTS.BARCODES.BARCODE_UPDATED);
      } else {
        // Add mode
        await createBarcode(
          {
            barcodeName: values.name,
            assistanceCategory: values.category,
            assistanceAmount: values.amount,
            allowEditAmount: values.allowEditAmount,
            assistanceUnit: values.unit,
            assistanceDescription: values.description,
            visibleTo,
          },
          userData.userId,
          userData.activeLocation
        );
        toast.success(STATIC_TEXTS.BARCODES.BARCODE_ADDED);
      }
      setModalOpen(false);
      setEditData(null);
      await loadBarcodes();
    } catch (error) {
      toast.error("Failed to save barcode");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteData || !userData?.userId) {
      toast.error(STATIC_TEXTS.ASSISTANCE.MISSING_DELETE_INFO);
      return;
    }
    try {
      await deleteBarcode(
        deleteData?._id,
        userData.userId,
        userData.activeLocation
      );
      toast.success("Barcode deleted Successfully!");
      setDeleteModalOpen(false);
      setDeleteData(null);
      loadBarcodes();
    } catch (error: any) {
      console.error("Error deleting barcodes:", error);
      toast.error(error || "Error deleting barcodes:");
    }
  };

  const handlePrint = useCallback(
    async (selectedBarcodeIds: string[]) => {
      setShowPrintModal(false);
      console.log("Selected barcode IDs:", selectedBarcodeIds);

      // Validate that we have selected barcodes
      if (!selectedBarcodeIds || selectedBarcodeIds.length === 0) {
        toast.error("Please select at least one barcode to print.");
        return;
      }

      const barcodes = await fetchFilteredBarcodes(
        selectedBarcodeIds,
        userData.userId,
        userData.activeLocation,
        visibleTo
      );
      setPrintBarcodes(barcodes);
      setShowPrintPreview(true);
    },
    [userData.userId, userData.activeLocation, visibleTo]
  );

  const handleBackFromPreview = () => {
    setShowPrintPreview(false);
    dispatch(resetPrintState());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto !hide-scrollbar">
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full shadow-sm flex items-center justify-center">
              <Icon
                icon="ic:outline-barcode"
                className="text-purple"
                width="24"
                height="24"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-pink">
                {HEADINGS.BARCODES.TITLE}
              </h1>
              <p className="text-gray-600">
                {visibleTo === "All Agencies"
                  ? "Manage and print barcodes"
                  : HEADINGS.BARCODES.SUBTITLE}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowPrintModal(true)}
              label={STATIC_TEXTS.BARCODES.PRINT_BARCODES}
              icon="mdi:printer"
              variant="submitStyle"
            />
            {canCreate(userData) && (
              <Button
                onClick={handleAdd}
                label={STATIC_TEXTS.BARCODES.ADD_BARCODE}
                icon="mdi:plus"
                variant="submitStyle"
              />
            )}
          </div>
        </div>

        <div className="mx-auto p-4 sm:p-6">
          {visibleTo !== "All Agencies" && (
            <div className="bg-yellow-100 border border-yellow-200 rounded-md p-3 mb-6 text-sm flex flex-col gap-1 text-yellow-700">
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:earth"
                  className="text-green-500"
                  width="18"
                  height="18"
                />
                <span>
                  <b className="font-bold">
                    {STATIC_TEXTS.BARCODES.GLOBAL_BARCODES_TITLE}
                  </b>{" "}
                  – {STATIC_TEXTS.BARCODES.GLOBAL_BARCODES_DESC}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon
                  icon="mdi:folder"
                  className="text-yellow-500"
                  width="18"
                  height="18"
                />
                <span>
                  <b className="font-bold">
                    {STATIC_TEXTS.BARCODES.AGENCY_BARCODES_TITLE}
                  </b>{" "}
                  – {STATIC_TEXTS.BARCODES.AGENCY_BARCODES_DESC}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {loading ? (
              <Loader />
            ) : barcodes?.length === 0 ? (
              <p>No Data found</p>
            ) : (
              barcodes.map((group) => (
                <div key={group.id}>
                  <h2 className="text-3xl font-bold text-pink mb-3">
                    {group.section}
                  </h2>
                  <div className="grid gap-5 my-2 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => {
                      return (
                        <div
                          key={item._id}
                          className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 mb-4 flex flex-col relative flex-1"
                        >
                          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-b-purple/20">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon={
                                  item.visibleTo === "All Agencies"
                                    ? "mdi:earth" // All
                                    : "mdi:folder" // Agency Only
                                }
                                className={
                                  item.visibleTo === "All Agencies"
                                    ? "text-green-700"
                                    : "text-purple"
                                }
                                width="22"
                                height="22"
                              />
                              <span className="font-semibold text-lg text-purple truncate">
                                {item.barcodeName}
                              </span>
                            </div>
                            <div className="flex gap-4">
                              {canEditOrDelete(userData, item) && (
                                <>
                                  <Button
                                    onClick={() => handleEdit(item)}
                                    className="text-purple hover:text-purple-400 !bg-transparent !border-none !rounded-full !p-0"
                                    icon="mdi:pencil"
                                  />
                                  <Button
                                    onClick={() => handleDelete(item)}
                                    className="text-red-600 hover:!text-red-700 !bg-transparent !border-none !rounded-full !p-0"
                                    icon="mdi:delete"
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          <div className="p-4 flex flex-col flex-1">
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex items-center justify-center w-full mb-3">
                              <Barcode
                                value={"A-" + item._id}
                                height={60}
                                width={2}
                                displayValue={false}
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              {" "}
                              <span className="text-xs font-bold w-fit mb-1 inline-flex items-center px-2.5 py-1.5 rounded-full bg-green-100 text-green-800">
                                {item?.assistanceUnit?.name === "Dollars"
                                  ? "$"
                                  : item?.assistanceUnit?.name || ""}{" "}
                                {item.assistanceAmount}
                              </span>
                              <span className="text-sm font-semibold text-gray-600">
                                for {item?.assistanceCategory?.sectionId?.name}:{" "}
                                {item?.assistanceCategory?.name}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {item.assistanceDescription}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {barcodes.length > 0 && !showPrintPreview && (
        <PageFooter
          count={totalBarcodes}
          label={paginationLabel}
          currentPage={currentPage}
          totalPages={Math.ceil(totalBarcodes / limit)}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < Math.ceil(totalBarcodes / limit)}
          onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() =>
            setCurrentPage((p) =>
              Math.min(Math.ceil(totalBarcodes / limit), p + 1)
            )
          }
        />
      )}

      <AddEditBarcodeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editData}
        categories={categories}
        loadingCategories={loadingCategories}
      />
      <DeleteCaseModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteData(null);
        }}
        onConfirmDelete={handleConfirmDelete}
        title="Delete Barcode"
        message="Are you sure you want to delete this barcode? This action cannot be undone."
        confirmLabel="DELETE"
        confirmButtonLabel="Delete Barcode"
      />

      <PrintBarcodesModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        allBarcodes={barcodes.flatMap((group) => group.items)}
        onPrint={handlePrint}
      />

      {showPrintPreview && (
        <PrintBarcodesPreview
          barcodes={printBarcodes}
          layout={printState.layout}
          pageTitle={printState.pageTitle}
          description={printState.description}
          onBack={handleBackFromPreview}
        />
      )}
    </div>
  );
};

export default Barcodes;
