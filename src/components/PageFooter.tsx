import React from "react";
import ReactPaginate from "react-paginate";
import type { FooterProps } from "@/types";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

const Footer: React.FC<FooterProps> = ({
  label,
  currentPage = 1,
  totalPages = 1,
  onPrevious,
  onNext,
  // Optional items per page functionality
  itemsPerPage,
  onItemsPerPageChange,
  showItemsPerPage = false,
}) => {
  const handlePageClick = (selectedItem: { selected: number }) => {
    const selectedPage = selectedItem.selected + 1;

    if (selectedPage > currentPage) {
      onNext?.();
    } else if (selectedPage < currentPage) {
      onPrevious?.();
    }
  };

  return (
    <div className="bg-white w-full p-3 px-4 sm:px-6 border-t border-purple/20">
      {/* Mobile: Stack vertically, Desktop: Flex horizontally */}
      <div className="flex flex-col  justify-start items-start sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        {/* Label - Full width on mobile, left-aligned on desktop */}
        <span className="text-sm text-purple font-medium text-center sm:text-left">
          {label} {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
        </span>

        {/* Controls - Centered on mobile, right-aligned on desktop */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          {/* Items per page selector - Responsive layout */}
          {showItemsPerPage && itemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <label className="text-sm text-gray-600 whitespace-nowrap">
                Show :
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent min-w-[80px]"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          )}

          {/* Pagination - Responsive with smaller buttons on mobile */}
          {totalPages >= 1 && (
            <div className="w-full sm:w-auto !justify-start flex sm:justify-start">
              <ReactPaginate
                breakLabel={"..."}
                breakClassName="text-purple px-1 sm:px-2"
                pageCount={totalPages}
                forcePage={currentPage - 1}
                marginPagesDisplayed={2}
                pageRangeDisplayed={2}
                onPageChange={handlePageClick}
                containerClassName="flex items-center space-x-1"
                pageClassName="text-white text-xs sm:text-sm"
                pageLinkClassName="p-1.5 sm:p-2 px-2 sm:px-3 rounded bg-purple hover:bg-purple/90 transition-colors cursor-pointer"
                previousClassName=""
                previousLinkClassName="p-1.5 sm:p-2 rounded-full bg-purple hover:bg-purple/90 transition-colors text-white flex items-center justify-center"
                nextClassName=""
                nextLinkClassName="p-1.5 sm:p-2 rounded-full bg-purple hover:bg-purple/90 transition-colors text-white flex items-center justify-center"
                disabledClassName="opacity-60 cursor-not-allowed"
                activeLinkClassName="bg-purple text-white"
                previousLabel={
                  <Icon
                    icon="mdi:chevron-left"
                    width="16"
                    height="16"
                    className="sm:w-5 sm:h-5"
                  />
                }
                nextLabel={
                  <Icon
                    icon="mdi:chevron-right"
                    width="16"
                    height="16"
                    className="sm:w-5 sm:h-5"
                  />
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Footer;
