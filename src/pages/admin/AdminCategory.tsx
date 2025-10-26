import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import PageFooter from "@components/PageFooter";
import { toast } from "react-toastify";
import { categoryService } from "@/services/categoryService";
import CategoryModal from "@components/modals/CategoryModal";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { CASES_PER_PAGE } from "@/utils/constants";
import Loader from "@/components/ui/Loader";
import { ERROR_MESSAGES, STATIC_TEXTS } from "@/utils/textConstants";
import type { Category } from "@/types";
import InfoText from "@/components/InfoText";
import { CategoryCard } from "@/components/CategoryCard";
import ManageCategorySectionModal from "@/components/modals/CategoySectionModal";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import DeleteCaseModal from "@/components/modals/DeleteCaseModal";

const AdminCategories: React.FC = () => {
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
  const [isManageSectionModalOpen, setIsManageSectionModalOpen] =
    useState(false);

  const { data: userData } = useSelector((state: RootState) => state?.user);
  const { canUpdateCategories, canDeleteCategories } = useRoleAccess();

  const fetchCategories = async (page: number = 1): Promise<void> => {
    setLoading(true);
    try {
      if (!userData || !userData?.userId) {
        toast.error("User authentication data missing.");
        return;
      }
      let res;
      res = await categoryService.getCategories(
        page,
        pagination.limit,
        userData?.userId,
        userData?.activeLocation ?? ""
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
      setPagination(
        res.data.pagination || {
          page: 1,
          limit: CASES_PER_PAGE,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (e: any | string) {
      toast.error(e || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pagination && typeof pagination.page === "number") {
      fetchCategories(pagination.page);
    }
  }, [pagination.page]);

  const handleAddCategory = () => {
    setModalInitialData(null);
    setModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setModalInitialData(category);
    setModalOpen(true);
  };

  const handleModalSave = async (data: Category) => {
    try {
      if (!userData || !userData?.userId) {
        toast.error("User authentication data missing.");
        return;
      }
      if (modalInitialData?._id) {
        if (!canUpdateCategories) {
          toast.error(ERROR_MESSAGES.AUTH.PERMISSION_DENIED_UPDATE_CATEGORIES);
          return;
        }
        await categoryService.updateCategory(
          modalInitialData._id,
          data,
          userData?.userId,
          userData?.activeLocation ?? ""
        );
        toast.success(STATIC_TEXTS.CATEGORIES.UPDATE_SUCCESS);
      } else {
        if (!canUpdateCategories) {
          toast.error(ERROR_MESSAGES.AUTH.PERMISSION_DENIED_CREATE_CATEGORIES);
          return;
        }
        await categoryService.createCategory(
          data,
          userData?.userId,
          userData?.activeLocation ?? ""
        );
        toast.success(STATIC_TEXTS.CATEGORIES.CREATE_SUCCESS);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error((error || error.message) ?? ERROR_MESSAGES.SAVE.GENERIC);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!selectedCategory || !selectedCategory._id) return;
    try {
      if (!userData || !userData?.userId) {
        toast.error("User authentication data missing.");
        return;
      }
      await categoryService.deleteCategory(
        selectedCategory._id,
        userData?.userId,
        userData?.activeLocation ?? ""
      );
      toast.success("Category deleted successfully.");
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to delete category"
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-purpleLight overflow-auto">
        <div className="bg-white p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold hidden md:block text-pink">
            Categories
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAddCategory}
              icon="mdi:plus"
              label={STATIC_TEXTS.CATEGORIES.ADD_CATEGORY}
              variant="submitStyle"
              className="w-full md:w-fit !justify-center py-3 md:py-2"
            />
            <Button
              onClick={() => setIsManageSectionModalOpen(true)}
              icon="mdi:plus"
              label={"Manage Category Section"}
              variant="submitStyle"
              className="w-full md:w-fit !justify-center py-3 md:py-2"
            />
          </div>
        </div>
        <div className="mx-auto p-4 sm:p-6">
          <InfoText />
          {loading ? (
            <div>
              <Loader />
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
                  <h2 className="text-2xl font-bold text-pink mb-2">
                    {section}
                  </h2>
                  {cats.map((category: Category) => (
                    <CategoryCard
                      key={category._id}
                      category={category}
                      canUpdateCategories={canUpdateCategories}
                      canDeleteCategories={canDeleteCategories}
                      onEdit={handleEditCategory}
                      onDelete={() => handleDeleteCategory(category)}
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
        forceVisibleToAllAgencies={true}
      />
      <ManageCategorySectionModal
        isOpen={isManageSectionModalOpen}
        onClose={() => setIsManageSectionModalOpen(false)}
      />
      <DeleteCaseModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        onConfirmDelete={confirmDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${selectedCategory?.name}"? This action cannot be undone.`}
        confirmLabel="DELETE"
        confirmButtonLabel="Delete Category"
      />
    </div>
  );
};
export default AdminCategories;
