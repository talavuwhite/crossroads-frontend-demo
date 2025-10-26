import { Icon } from "@iconify-icon/react/dist/iconify.js";

interface IconButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  className?: string;
  colorClass?: string;
  type?: "button" | "submit";
  as?: "button" | "a";
  href?: string;
  download?: string;
  title?: string;
  target?: string;
  rel?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  onClick,
  className = "",
  colorClass = "",
  type = "button",
  as = "button",
  href,
  download,
  title,
  target,
  rel,
}) => {
  if (as === "a" && href) {
    return (
      <a
        href={href}
        download={download}
        className={`sm:p-1 flex items-center gap-2 border border-purpleLight p-2 px-3 rounded-xl sm:rounded-full ${colorClass} ${className}`}
        title={title}
        target={target}
        rel={rel}
      >
        <Icon icon={icon} width="20" height="20" />
        <p className="block sm:hidden">{label}</p>
      </a>
    );
  }
  return (
    <button
      type={type}
      className={`sm:p-1 flex items-center gap-2 border border-purpleLight p-2 px-3 rounded-xl sm:rounded-full ${colorClass} ${className}`}
      onClick={onClick}
      title={title}
    >
      <Icon icon={icon} width="20" height="20" />
      <p className="block sm:hidden">{label}</p>
    </button>
  );
};
