import { categoryTypes } from "@/utils/constants";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

const InfoText = () => {
  return (
    <div className="mb-8">
      <div className="font-semibold text-base text-blue-900 mb-2">
        Category Visibility
      </div>
      <div className="flex flex-col gap-2 p-3 rounded bg-blue-100 border border-blue-200 text-sm text-blue-900">
        {categoryTypes.map((type, index) => (
          <span
            key={index}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
          >
            <div className="flex gap-1">
              <Icon
                icon={type.icon}
                width="22"
                height="22"
                className={`align-middle ${type.color}`}
                aria-label={type.label}
              />
              <span className="font-semibold">{type.label}</span>
            </div>
            <span className="text-gray-600">— {type.description}</span>
          </span>
        ))}
      </div>
      <div className="border-b border-blue-100 mt-4" />
    </div>
  );
};

export default InfoText;
