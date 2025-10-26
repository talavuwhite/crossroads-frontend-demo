import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import type { SearchBarProps } from "@/types";

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple border-gray-300"
      />
      <Icon
        icon="material-symbols:search"
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        width="20"
        height="20"
      />
    </div>
  );
};

export default SearchBar;
