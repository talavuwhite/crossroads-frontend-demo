import React from "react";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  showPagination?: boolean;
  onPageChange: (page: number) => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  showPagination = true,
  onPageChange,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="bg-black text-white p-2 flex justify-between items-center text-sm">
      <div className="flex-1 flex justify-between max-w-full">
        <span>
          {showPagination
            ? `${startIndex + 1}-${endIndex} of ${totalItems} Agents`
            : `${totalItems} Agents`}
        </span>
        <div className="flex items-center space-x-2">
          {showPagination && (
            <>
              <button
                className={`px-2 ${
                  currentPage === 1 ? "text-gray-500" : "text-white"
                }`}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ‹ Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    className={`px-2 ${
                      currentPage === page ? "bg-blue-500" : ""
                    }`}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                className={`px-2 ${
                  currentPage === totalPages ? "text-gray-500" : "text-white"
                }`}
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next ›
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaginationBar;
