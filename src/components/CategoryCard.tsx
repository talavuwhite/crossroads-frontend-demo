import type { Category } from "@/types";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "@/components/ui/Button";
import { getAgenciesAndSubAgencies } from "@/services/AgencyApi";
import type { BaseAgency } from "@/types/agency";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  category: Category;
  canUpdateCategories: boolean;
  canDeleteCategories: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  categoryList?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  canUpdateCategories,
  canDeleteCategories,
  onEdit,
  onDelete,
  categoryList = false,
}) => {
  const [agencies, setAgencies] = useState<BaseAgency[]>([]);
  const fetchAgencies = async () => {
    try {
      const data = await getAgenciesAndSubAgencies();
      setAgencies(data.data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load agencies";
      toast.error(message);
    } finally {
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  return (
    <div
      className={`bg-white p-4 px-5 rounded-lg shadow-sm mb-3 transition group
        ${
          category.visibleTo === "All Agencies"
            ? "hover:bg-green-50/50"
            : "hover:bg-yellow-50/50"
        }
        hover:shadow-lg
      `}
    >
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Icon
            icon={category.visibleTo === "All Agencies" ? "mdi:earth" : "mdi:folder"}
            className={
              category.visibleTo === "All Agencies"
                ? "text-green-700"
                : "text-yellow-600"
            }
            width="22"
            height="22"
            aria-label={
              category.visibleTo === "All Agencies"
                ? "Global Category"
                : "Agency Category"
            }
            title={
              category.visibleTo === "All Agencies"
                ? "Global Category — Available to all agencies"
                : "Agency Category — Available to a specific agency"
            }
          />
          <span
            className={`font-bold text-lg group-hover:underline break-words truncate max-w-[160px] sm:max-w-[220px] md:max-w-[320px] lg:max-w-[400px] ${
              category.visibleTo === "All Agencies"
                ? "text-green-700"
                : "text-yellow-600"
            }`}
            title={category.name}
          >
            {category.name}
          </span>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          {canUpdateCategories && (
            <Button
              onClick={() => onEdit(category)}
              icon="mdi:pencil"
              className="p-2 !px-2 !border-transparent !rounded-full !text-purple hover:!text-white hover:!bg-purple"
            />
          )}
          {canDeleteCategories && (
            <Button
              onClick={() => onDelete(category)}
              icon="mdi:delete"
              className="p-2 !px-2 !border-transparent !rounded-full !text-primary hover:!text-white hover:!bg-primary"
            />
          )}
        </div>
      </div>
      <div className="text-sm text-gray-500">
        {category.description || "No description provided"}
      </div>
      {category.visibleTo === "Agency Only" && !categoryList && (
        <div className="text-xs mt-1 text-gray-400">
          Created by{" "}
          <Link
            to={`/agencies/${
              agencies.find((a) => a.name === category.createdBy?.companyName)?.id
            }
          `}
          >
            <span className="text-pink">
              {category.createdBy?.companyName || "Unknown"}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
};
