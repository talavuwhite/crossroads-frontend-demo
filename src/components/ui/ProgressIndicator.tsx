import React from "react";

interface ProgressStep {
  number: number;
  label: string;
}

interface ProgressIndicatorProps {
  currentStep: number;
  steps: ProgressStep[];
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  steps,
  className = "",
}) => {
  return (
    <div
      className={`sticky top-0 z-40 bg-white border-b border-purple/10 rounded-t-lg shadow-sm py-3 ${className}`}
    >
      <div className="flex items-center justify-center space-x-3 md:space-x-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex items-center">
              <div
                className={`w-5 md:w-10 h-5 md:h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 ${
                  currentStep >= step.number
                    ? "bg-purple text-white shadow-purple/25"
                    : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                }`}
              >
                {step.number}
              </div>
              <div
                className={`ml-3 text-sm font-semibold transition-colors duration-300 ${
                  currentStep >= step.number ? "text-purple" : "text-gray-400"
                }`}
              >
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-10 md:w-16 h-1 rounded-full transition-all duration-300 ${
                  currentStep > step.number
                    ? "bg-purple shadow-sm"
                    : "bg-gray-200"
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;
