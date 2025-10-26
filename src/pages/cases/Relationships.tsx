import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Footer from "@components/PageFooter";
import { HEADINGS, STATIC_TEXTS } from "@utils/textConstants";
import AddRelationshipModal from "@/components/modals/AddRelationshipModal";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import AddCaseModal from "@/components/modals/AddCaseModal";
import { toast } from "react-toastify";
import {
  fetchCaseRelationships,
  deleteCaseRelationship,
} from "@/services/CaseApi";
import Loader from "@/components/ui/Loader";
import DeleteCaseModal from "@/components/modals/DeleteCaseModal";
import type { Relationship, RelationshipsResponseData } from "@/types/case";
import { Link } from "react-router-dom";

export const Relationships = () => {
  const [isAddRelModalOpen, setIsAddRelModalOpen] = useState(false);
  const [isAddnewPerson, setIsAddNewPerson] = useState<boolean>(false);
  const [relationships, setRelationships] =
    useState<RelationshipsResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [relationshipToEdit, setRelationshipToEdit] =
    useState<Relationship | null>(null);
  const { data: caseData } = useSelector((state: RootState) => state.case);
  const { data: userData } = useSelector((state: RootState) => state.user);

  const [isDeleteRelModalOpen, setIsDeleteRelModalOpen] = useState(false);
  const [relationshipToDeleteId, setRelationshipToDeleteId] = useState<
    string | null
  >(null);

  const fetchRelationships = async (page: number) => {
    if (!caseData?.caseId) return;

    try {
      setLoading(true);
      const data = await fetchCaseRelationships(caseData.caseId, page, undefined, userData?.userId, userData?.activeLocation);

      const relationshipMap: {
        [id: string]: Relationship & {
          showDependantTag?: boolean;
          livesTogether?: boolean;
        };
      } = {};
      [
        ...data.relationships.dependant,
        ...data.relationships.live_with,
        ...data.relationships.related,
      ].forEach((rel) => {
        if (!relationshipMap[rel.id]) {
          relationshipMap[rel.id] = { ...rel };
        }
      });

      data.relationships.dependant.forEach((rel) => {
        if (relationshipMap[rel.id]) {
          relationshipMap[rel.id].showDependantTag = true;
        }
      });

      data.relationships.live_with.forEach((rel) => {
        if (relationshipMap[rel.id]) {
          relationshipMap[rel.id].livesTogether = true;
        }
      });

      const processedRelationships: RelationshipsResponseData = {
        relationships: {
          dependant: [],
          live_with: [],
          related: [],
        },
        pagination: data.pagination,
      };

      Object.values(relationshipMap).forEach((rel) => {
        if (rel.livesTogether) {
          processedRelationships.relationships.live_with.push(rel);
        } else {
          processedRelationships.relationships.related.push(rel);
        }
      });

      setRelationships(processedRelationships);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching relationships:", error);
      toast.error("Failed to fetch relationships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships(1);
  }, [caseData?.caseId]);

  const handleEditRelationship = (relationship: Relationship) => {
    setRelationshipToEdit(relationship);
    setIsAddRelModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddRelModalOpen(false);
    setRelationshipToEdit(null);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchRelationships(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (
      relationships?.pagination &&
      currentPage < relationships.pagination.totalPages
    ) {
      fetchRelationships(currentPage + 1);
    }
  };

  const handleDeleteRelationshipClick = (relationshipId: string) => {
    setRelationshipToDeleteId(relationshipId);
    setIsDeleteRelModalOpen(true);
  };

  const handleConfirmDeleteRelationship = async () => {
    if (
      !relationshipToDeleteId ||
      !userData?.userId
    ) {
      toast.error("Missing information for deletion.");
      return;
    }

    try {
      await deleteCaseRelationship(
        relationshipToDeleteId,
        userData.userId,
        userData.activeLocation
      );
      toast.success("Relationship deleted successfully.");
      fetchRelationships(currentPage);
      setIsDeleteRelModalOpen(false);
      setRelationshipToDeleteId(null);
    } catch (error) {
      console.error("Error deleting relationship:", error);
      toast.error("Failed to delete relationship.");
    }
  };

  if (!caseData) {
    toast.error("Something went wrong!!");
    return null;
  }

  const renderRelationshipSection = (
    title: string,
    relationships: Relationship[]
  ) => {
    if (relationships.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="bg-purple/70 text-white text-sm px-4 py-2 rounded-t-lg">
          {title} {caseData?.firstName + " " + caseData?.lastName}
        </div>
        <div className="bg-white border border-gray-200 rounded-b-lg divide-y divide-gray-200">
          {relationships.map((relationship) => (
            <div key={relationship.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {relationship.isCaseBPrivate ? <span className="text-black font-semibold">{relationship.name}</span> : <Link
                      to={`/cases/${relationship?.caseBId}/alerts`}
                      className="text-purple hover:text-purple/60 font-semibold"
                    >
                      {relationship.name}
                    </Link>}

                    <span className="text-sm text-gray-500">—</span>
                    <span className="text-sm text-gray-700">
                      {relationship.customLabelAtoB}
                      {relationship?.showDependantTag && (
                        <span>, Dependant</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>DOB:</span>
                      {<span>
                        {relationship.dob ? relationship.dob : "None"} — {relationship.age ? relationship.age : "age unknown"}
                      </span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    onClick={() => handleEditRelationship(relationship)}
                  >
                    <Icon icon="mdi:pencil" width="20" height="20" />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                    onClick={() =>
                      handleDeleteRelationshipClick(relationship.id)
                    }
                  >
                    <Icon icon="mdi:delete" width="20" height="20" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full ">
        <div className="flex-1 bg-gray-100 overflow-auto !hide-scrollbar">
          <div className="flex flex-col sm:flex-row bg-white p-6 justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-pink">
                {HEADINGS.RELATIONSHIPS.TITLE} with{" "}
                {caseData?.firstName + " " + caseData?.lastName}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="submitStyle"
                icon="mdi:plus"
                label={STATIC_TEXTS.RELATIONSHIPS.ADD_RELATIONSHIP}
                onClick={() => setIsAddRelModalOpen(true)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader />
                </div>
              ) : (
                <>
                  {renderRelationshipSection(
                    "Dependants",
                    relationships?.relationships.dependant || []
                  )}
                  {renderRelationshipSection(
                    "Living with",
                    relationships?.relationships.live_with || []
                  )}
                  {renderRelationshipSection(
                    "Related to",
                    relationships?.relationships.related || []
                  )}
                </>
              )}
            </div>
            {!loading && relationships?.pagination.total === 0 && (
              <div className="flex justify-center items-center p-6 text-center text-gray-500">
                No relationships found for this case.
              </div>
            )}
          </div>
        </div>
        {relationships?.pagination && relationships.pagination.total > 0 && (
          <div className="border-t border-gray-200 bg-white">
            <Footer
              count={relationships?.pagination.total || 0}
              label={
                relationships?.pagination.total +
                " " +
                HEADINGS.RELATIONSHIPS.TITLE
              }
              hasPrevious={
                !!(
                  relationships?.pagination && relationships.pagination.page > 1
                )
              }
              hasNext={
                !!(
                  relationships?.pagination &&
                  relationships.pagination.page <
                  (relationships.pagination.totalPages || 1)
                )
              }
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
            />
          </div>
        )}
      </div>
      <AddRelationshipModal
        isOpen={isAddRelModalOpen}
        onClose={handleModalClose}
        initialPerson={caseData}
        setIsAddNewPerson={setIsAddNewPerson}
        editMode={!!relationshipToEdit}
        relationshipToEdit={relationshipToEdit || undefined}
        onSuccess={() => fetchRelationships(currentPage)}
      />
      <AddCaseModal
        isOpen={isAddnewPerson}
        onClose={() => {
          setIsAddNewPerson(!isAddnewPerson);
          setIsAddRelModalOpen(!isAddRelModalOpen);
        }}
      />
      <DeleteCaseModal
        isOpen={isDeleteRelModalOpen}
        onClose={() => setIsDeleteRelModalOpen(false)}
        onConfirmDelete={handleConfirmDeleteRelationship}
        title="Confirm Relationship Deletion"
        message="Are you sure you want to permanently delete this relationship? This action cannot be undone."
        confirmButtonLabel="Delete Relationship"
      />
    </>
  );
};
