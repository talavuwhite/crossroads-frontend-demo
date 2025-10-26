import React from "react";
interface loaderProps {
  height?: Number;
  width?: Number;
}
const Loader: React.FC<loaderProps> = ({ height = 12, width = 12 }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className={`animate-spin rounded-full h-${height} w-${width} border-b-2 border-purple`}
      ></div>
    </div>
  );
};

export default Loader;
