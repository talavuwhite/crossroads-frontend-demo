import React from "react";
import type { StatCardProps } from "@/types";

const StatCard: React.FC<StatCardProps> = ({ value, label, bgColor }) => {
  return (
    <div
      className="p-6 rounded-xl flex flex-col items-center gap-y-3 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
      style={{
        background: `linear-gradient(to bottom right, ${bgColor}, ${bgColor}CC)`,
      }}
    >
      <h2 className="text-3xl font-extrabold text-gray-900 drop-shadow-sm">
        {value}
      </h2>
      <p className="text-sm font-medium text-gray-700">{label}</p>
    </div>
  );
};

export default StatCard;
