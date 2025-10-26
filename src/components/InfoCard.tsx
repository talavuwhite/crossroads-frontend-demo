import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

interface InfoCardProps {
  icon: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  title,
  children,
  className,
}) => {
  return (
    <div
      className={`bg-white rounded-lg p-6 shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${className}`}
    >
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-800">
        <Icon
          icon={icon}
          className="text-purple transform transition-transform duration-300 hover:rotate-12"
          width="24"
          height="24"
        />
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

export default InfoCard;
