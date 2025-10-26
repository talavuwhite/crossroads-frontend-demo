import React, { useState } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import ReactPaginate from "react-paginate";
import Bulletin from "./Bulletin";

interface DashboardBulletinSectionProps {
  openAddBulletin: () => void;
  openEditBulletin: (bulletin: any) => void;
}

const DashboardBulletinSection: React.FC<DashboardBulletinSectionProps> = ({
  openAddBulletin,
  openEditBulletin,
}) => {
  const [bulletinsCurrentPage, setBulletinsCurrentPage] = useState(0);
  const [bulletinsPerPage, setBulletinsPerPage] = useState(5);
  const exampleBulletins = [
    {
      title: "WELCOME JACKSON FREE CLINIC",
      content: "We are so excited to have you all share in the sharing!",
      postedBy: "Petalumas WHITE",
      date: "Tue, Apr 16, 2024 at 6:41 p.m.",
      onClickEdit: () =>
        openEditBulletin({
          title: "WELCOME JACKSON FREE CLINIC",
          description:
            "SWe are so excited to have you all share in the sharing!",
          expirationDate: "2024-05-01",
          sendEmail: true,
          file: null,
        }),
    },
    {
      title: "GLOBAL FEEDING SCHEDULE",
      content: "We are so excited to have you all share in the sharing!",
      postedBy: "Petalumas WHITE",
      date: "Mon, Jul 6, 2020 at 8:46 a.m.",
    },
  ];
  const totalBulletins = exampleBulletins.length;
  const totalBulletinsPages = Math.ceil(totalBulletins / bulletinsPerPage);

  const handleBulletinsPageChange = (selectedItem: { selected: number }) => {
    setBulletinsCurrentPage(selectedItem.selected);
  };

  const handleBulletinsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setBulletinsPerPage(Number(e.target.value));
    setBulletinsCurrentPage(0);
  };

  const bulletinsStartIndex = bulletinsCurrentPage * bulletinsPerPage + 1;
  const bulletinsEndIndex = Math.min(
    bulletinsStartIndex + bulletinsPerPage - 1,
    totalBulletins
  );

  const currentBulletins = exampleBulletins.slice(
    bulletinsCurrentPage * bulletinsPerPage,
    (bulletinsCurrentPage + 1) * bulletinsPerPage
  );

  return (
    <div className="bg-purpleLight rounded-xl shadow-md border border-border my-6">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Icon
            icon="mdi:folder-account"
            className="text-pink"
            width="28"
            height="28"
          />
          Bulletins
        </h3>
        <div className="flex items-center gap-2">
          <button
            className="bg-purple space-x-2 flex items-center text-white px-3 py-2 rounded-lg text-sm hover:bg-pink transition-colors"
            onClick={openAddBulletin}
          >
            <span>Add Bulletin</span>
            <Icon icon="mdi:plus" width="18" height="18" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-border p-6 space-y-3">
        {currentBulletins.map((bulletin, index) => (
          <Bulletin
            key={index}
            title={bulletin.title}
            content={bulletin.content}
            postedBy={bulletin.postedBy}
            date={bulletin.date}
            onClickEdit={bulletin.onClickEdit}
            onClickDelete={() => {}}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-sm text-gray-600 p-4">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            className="border rounded px-2 py-1 bg-white"
            value={bulletinsPerPage}
            onChange={handleBulletinsPerPageChange}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span>
            {bulletinsStartIndex}-{bulletinsEndIndex} of {totalBulletins}
          </span>
          <ReactPaginate
            pageCount={totalBulletinsPages}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            onPageChange={handleBulletinsPageChange}
            containerClassName="flex gap-1"
            pageClassName="px-2 py-1 rounded cursor-pointer"
            activeClassName="bg-purple text-white"
            previousClassName="text-gray-400 hover:text-gray-600 cursor-pointer"
            nextClassName="text-gray-400 hover:text-gray-600 cursor-pointer"
            disabledClassName="text-gray-300 cursor-not-allowed"
            previousLabel={
              <Icon icon="mdi:chevron-left" width="20" height="20" />
            }
            nextLabel={<Icon icon="mdi:chevron-right" width="20" height="20" />}
            forcePage={bulletinsCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardBulletinSection;
