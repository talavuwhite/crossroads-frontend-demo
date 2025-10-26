import React from "react";
import { Icon } from "@iconify-icon/react";

interface SidebarButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  className?: string;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  label,
  onClick,
  className,
}) => {
  return (
    <button
      className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <Icon icon={icon} width="20" height="20" />
      {label}
    </button>
  );
};

export default SidebarButton;
