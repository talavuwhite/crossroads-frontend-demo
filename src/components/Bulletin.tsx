import React from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import type { BulletinProps } from "@/types";

interface BulletinExtendedProps extends BulletinProps {
  onClickEdit?: () => void;
  onClickDelete?: () => void;
}

const Bulletin: React.FC<BulletinExtendedProps> = ({
  title,
  content,
  postedBy,
  date,
  onClickEdit,
  onClickDelete,
}) => {
  return (
    <div className="block bg-purpleLight rounded-xl shadow border border-border p-5 group">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple mb-2">{title}</h3>
          <p className="text-gray-600 mb-3">{content}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Posted by {postedBy} from Jackson Resource Center</span>
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onClickEdit && (
            <button
              onClick={onClickEdit}
              className="text-purple hover:text-pink transition-colors"
              aria-label={`Edit ${title}`}
              type="button"
            >
              <Icon icon="mdi:pencil" width="20" height="20" />
            </button>
          )}
          {onClickDelete && (
            <button
              onClick={onClickDelete}
              className="text-red-600 hover:text-red-800 transition-colors"
              aria-label={`Delete ${title}`}
              type="button"
            >
              <Icon icon="mdi:delete" width="20" height="20" />
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button
          className="text-purple flex items-center text-sm hover:underline gap-1"
          type="button"
        >
          <Icon icon="iconamoon:comment-thin" width="20" height="20" />
          <span>1 comment</span>
        </button>
      </div>
    </div>
  );
};

export default Bulletin;
