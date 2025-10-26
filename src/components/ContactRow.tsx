import { Icon } from "@iconify-icon/react/dist/iconify.js";
import React from "react";

export const ContactRow: React.FC<{
  icon: string;
  value: React.ReactNode;
}> = ({ icon, value }) => (
  <div className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200">
    <Icon icon={icon} className="text-gray-400" width="20" />
    <span className="break-words">{value}</span>
  </div>
);
