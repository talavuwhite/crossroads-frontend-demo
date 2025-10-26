import { useState, useEffect } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { toast } from "react-toastify";
import PageFooter from "@components/PageFooter";
import { ERROR_MESSAGES, STATIC_TEXTS } from "@utils/textConstants";
import { CASES_PER_PAGE } from "@/utils/constants";
import CategoryModal from "@components/modals/CategoryModal";
import DeleteCaseModal from "@components/modals/DeleteCaseModal";
import { categoryService } from "@/services/categoryService";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import type { Category } from "@/types";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import Button from "@/components/ui/Button";
import InfoText from "@/components/InfoText";
import { CategoryCard } from "@/components/CategoryCard";
import { useParams } from "react-router-dom";
import Loader from "@/components/ui/Loader";

export const CategoriesList = () => {
  const [categoriesBySection, setCategoriesBySection] = useState<
    Record<string, Category[]>
  >({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: CASES_PER_PAGE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [modalInitialData, setModalInitialData] = useState<Category | null>(
    null
  );
  const { data: userData } = useSelector((state: RootState) => state?.user);
  const { canUpdateCategories, canDeleteCategories } = useRoleAccess();
  const { id } = useParams();
  const fetchCategories = async () => {
    setLoading(true);
    try {
      if (!userData?.userId) {
        toast.error("User authentication or location data missing.");
        return;
      }
      const res = await categoryService.agencyCategories(
        id
          ? id
          : userData.activeLocation
          ? userData.activeLocation
          : userData.companyId,
        userData.userId,
        id ? id : userData.activeLocation ?? ""
      );
      const grouped: Record<string, Category[]> = {};
      const categories = Array.isArray(res.data.data) ? res.data.data : [];
      if (categories.length > 0) {
        categories.forEach((cat: Category) => {
          const section = cat.section || cat.sectionId?.name || "Uncategorized";
          if (!grouped[section]) grouped[section] = [];
          grouped[section].push(cat);
        });
      }
      setCategoriesBySection(grouped);
      const paginationData = (res.data as any).pagination;
      if (paginationData) {
        setPagination(paginationData);
      } else {
        setPagination((prev) => ({
          ...prev,
          total: categories.length,
          totalPages: 1,
          page: 1,
        }));
      }
    } catch (error: any) {
      toast.error(error.message ?? ERROR_MESSAGES.FETCH.GENERIC);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [userData, id]);

  const handleAddCategory = () => {
    setModalInitialData(null);
    setModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setModalInitialData(category);
    setModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!selectedCategory || !selectedCategory._id) return;
    try {
      if (!userData?.userId) {
        toast.error("User authentication or location data missing.");
        return;
      }
      await categoryService.deleteCategory(
        selectedCategory._id,
        userData.userId,
        id ? id : userData.activeLocation ?? ""
      );
      toast.success(STATIC_TEXTS.CATEGORIES.DELETE_SUCCESS);
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      setTimeout(() => {
        fetchCategories();
      }, 500);
    } catch (error: any) {
      toast.error(error?.message || ERROR_MESSAGES.DELETE.GENERIC);
    }
  };

  const handleModalSave = async (data: Category) => {
    try {
      if (modalInitialData?._id) {
        if (!canUpdateCategories) {
          toast.error(ERROR_MESSAGES.AUTH.PERMISSION_DENIED_UPDATE_CATEGORIES);
          return;
        }
        if (!userData?.userId) {
          toast.error("User authentication or location data missing.");
          return;
        }
        await categoryService.updateCategory(
          modalInitialData._id,
          data,
          userData.userId,
          id ? id : userData.activeLocation
        );
        toast.success(STATIC_TEXTS.CATEGORIES.UPDATE_SUCCESS);
      } else {
        if (!canUpdateCategories) {
          toast.error(ERROR_MESSAGES.AUTH.PERMISSION_DENIED_CREATE_CATEGORIES);
          return;
        }
        if (!userData?.userId) {
          toast.error("User authentication or location data missing.");
          return;
        }

        await categoryService.createCategory(
          data,
          userData.userId,
          id ? id : userData.activeLocation
        );
        toast.success(STATIC_TEXTS.CATEGORIES.CREATE_SUCCESS);
      }
      setModalOpen(false);
      setTimeout(() => {
        fetchCategories();
      }, 500);
    } catch (error: any) {
      toast.error(error?.message || ERROR_MESSAGES.SAVE.GENERIC);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto">
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold hidden md:block text-pink">
            Categories
          </h1>
          {canUpdateCategories && (
            <Button
              onClick={handleAddCategory}
              icon="mdi:plus"
              label={STATIC_TEXTS.CATEGORIES.ADD_CATEGORY}
              variant="submitStyle"
              className="w-full md:w-fit !justify-center py-3 md:py-2"
            />
          )}
        </div>
        <div className="mx-auto p-4 sm:p-6">
          <InfoText />
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span>
                <Loader />
              </span>
            </div>
          ) : Object.keys(categoriesBySection).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Icon
                icon="ant-design:folder-open-outlined"
                className="mb-4 text-gray-400"
                width={56}
                height={56}
              />
              <div className="text-lg font-medium">No categories found.</div>
              <div className="text-sm mt-1">
                Try adding a new category to get started.
              </div>
            </div>
          ) : (
            Object.entries(categoriesBySection).map(
              ([section, cats]: [string, Category[]]) => (
                <div key={section} className="mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-pink mb-2">
                    {section}
                  </h2>
                  {cats.map((category: Category) => (
                    <CategoryCard
                      key={category._id}
                      category={category}
                      canUpdateCategories={
                        canUpdateCategories &&
                        category.visibleTo === "Agency Only"
                      }
                      canDeleteCategories={
                        canDeleteCategories &&
                        category.visibleTo === "Agency Only"
                      }
                      onEdit={handleEditCategory}
                      onDelete={handleDeleteCategory}
                      categoryList={true}
                    />
                  ))}
                </div>
              )
            )
          )}
        </div>
      </div>

      {pagination.total > 0 && (
        <PageFooter
          count={pagination.limit}
          label={`${(pagination.page - 1) * pagination.limit + 1}-${Math.min(
            pagination.page * pagination.limit,
            pagination.total
          )} of ${pagination.total} Categories`}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasPrevious={pagination.page > 1}
          hasNext={pagination.page < pagination.totalPages}
          onPrevious={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          onNext={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
        />
      )}
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        initialData={modalInitialData}
      />
      <DeleteCaseModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        onConfirmDelete={confirmDeleteCategory}
        title={STATIC_TEXTS.CATEGORIES.DELETE_CATEGORY}
        message={STATIC_TEXTS.CATEGORIES.DELETE_CATEGORY_CONFIRM}
        confirmLabel="DELETE"
        confirmButtonLabel={STATIC_TEXTS.CATEGORIES.DELETE_CATEGORY}
      />
    </div>
  );
};
