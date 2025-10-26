import { Icon } from "@iconify-icon/react/dist/iconify.js";
import type { SortDirection } from "@tanstack/react-table";

const ColumnHeader = ({
  title,
  className,
  isSorting = false,
  sortDirection,
  onClick,
}: {
  title: string;
  className?: string;
  isSorting?: boolean;
  sortDirection?: SortDirection;
  onClick?: () => void;
}) => {
  const renderSortIcon = () => {
    if (sortDirection === "asc")
      return <Icon icon="mdi:chevron-up" width={16} height={16} />;
    if (sortDirection === "desc")
      return <Icon icon="mdi:chevron-down" width={16} height={16} />;
    return <Icon icon="mdi:chevron-up-down" width={16} height={16} />;
  };

  return (
    <div
      className={`text-white flex items-center gap-1 select-none ${className} ${isSorting ? "cursor-pointer" : ""
        }`}
      onClick={isSorting ? onClick : undefined}
    >
      {title}
      {isSorting && renderSortIcon()}
    </div>
  );
};

export default ColumnHeader;
