import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { getVariantClasses } from "@/utils/commonFunc";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "submitStyle" | "dangerStyle" | "warningStyle" | "infoStyle";
  label?: React.ReactNode;
  onClick?: () => void;
  icon?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = "default",
  label,
  className = "",
  onClick,
  icon,
  ...props
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg  transition-colors duration-200 flex items-center gap-2 ${getVariantClasses(
        variant
      )} ${className} cursor-pointer`}
      {...props}
    >
      {icon && <Icon icon={icon} width="20" height="20" />}
      {label && label}
    </button>
  );
};

export default Button;
