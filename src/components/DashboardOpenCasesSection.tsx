import React, { useState } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import ReactPaginate from "react-paginate";

const DashboardOpenCasesSection: React.FC = () => {
  const [casesCurrentPage, setCasesCurrentPage] = useState(0);
  const [casesPerPage, setCasesPerPage] = useState(5);
  const totalCases = 2;
  const totalCasesPages = Math.ceil(totalCases / casesPerPage);

  const handleCasesPageChange = (selectedItem: { selected: number }) => {
    setCasesCurrentPage(selectedItem.selected);
  };

  const handleCasesPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCasesPerPage(Number(e.target.value));
    setCasesCurrentPage(0);
  };

  const casesStartIndex = casesCurrentPage * casesPerPage + 1;
  const casesEndIndex = Math.min(
    casesStartIndex + casesPerPage - 1,
    totalCases
  );

  return (
    <div className="bg-purpleLight rounded-xl shadow-md border border-border">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Icon
            icon="mdi:folder-account"
            className="text-pink"
            width="28"
            height="28"
          />
          My Open Cases
        </h3>
        <div className="flex items-center gap-2">
          <button className="text-gray-500 hover:text-gray-700 cursor-pointer">
            <Icon icon="mdi:arrow-expand" width="16" height="16" />
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-5">
          <div className="block bg-purpleLight rounded-xl shadow border border-border p-5 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-purple/20 rounded-full p-3 shadow hover:shadow-lg transition-shadow duration-300 flex items-center justify-center">
                  <Icon
                    icon="mdi:account"
                    className="text-purple"
                    width="28"
                    height="28"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-lg text-pink group-hover:text-purple transition-colors">
                    Jordan Rawls
                  </h4>
                  <p className="text-xs text-gray-500">ID: #123456</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Last updated: 2 days ago
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-semibold bg-border text-purple rounded-full shadow-sm">
                Active
              </span>
            </div>
          </div>
          <div className="block bg-purpleLight rounded-xl shadow border border-border p-5 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-purple/20 rounded-full p-3 shadow hover:shadow-lg transition-shadow duration-300 flex items-center justify-center">
                  <Icon
                    icon="mdi:account"
                    className="text-purple"
                    width="28"
                    height="28"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-purple group-hover:text-pink transition-colors">
                    Sarah Johnson
                  </h4>
                  <p className="text-xs text-gray-500">ID: #123457</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Last updated: 5 days ago
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-semibold bg-border text-purple rounded-full shadow-sm">
                Pending
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              className="border rounded px-2 py-1"
              value={casesPerPage}
              onChange={handleCasesPerPageChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>
              {casesStartIndex}-{casesEndIndex} of {totalCases}
            </span>
            <ReactPaginate
              pageCount={totalCasesPages}
              pageRangeDisplayed={3}
              marginPagesDisplayed={1}
              onPageChange={handleCasesPageChange}
              containerClassName="flex gap-1"
              pageClassName="px-2 py-1 rounded cursor-pointer"
              activeClassName="bg-purple text-white"
              previousClassName="text-gray-400 hover:text-gray-600 cursor-pointer"
              nextClassName="text-gray-400 hover:text-gray-600 cursor-pointer"
              disabledClassName="text-gray-300 cursor-not-allowed"
              previousLabel={
                <Icon icon="mdi:chevron-left" width="20" height="20" />
              }
              nextLabel={
                <Icon icon="mdi:chevron-right" width="20" height="20" />
              }
              forcePage={casesCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOpenCasesSection;
