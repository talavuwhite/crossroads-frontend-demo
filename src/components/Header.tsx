import React from "react";
import type { HeadreProps } from "@/types";

const Header: React.FC<HeadreProps> = ({ user = { name: "Dhruven GHL" } }) => {
  return (
    <header className="bg-gradient-to-r from-[#E5E7EB] to-[#D1D5DB] py-4 px-6 flex flex-col md:flex-row justify-between items-center shadow-2xl">
      <div className="flex items-center space-x-4 w-full lg:w-auto">
        <div>
          <div className="flex items-center space-x-1">
            <h5 className="text-2xl mt-5 font-bold text-[#1F2937] drop-shadow-md">
              {user.name}
            </h5>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
