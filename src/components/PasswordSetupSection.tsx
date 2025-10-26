import React from "react";
import FormInput from "@ui/FormInput";
import { Icon } from "@iconify-icon/react";

interface PasswordSetupSectionProps {
  formik: any;
}

const PasswordSetupSection: React.FC<PasswordSetupSectionProps> = ({
  formik,
}) => {
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="relative">
          <FormInput
            label="New Password"
            name="password"
            type={showNewPassword ? "text" : "password"}
            formik={formik}
            required
            maxLength={50}
            className="pr-10"
          />
          <Icon
            icon={showNewPassword ? "mdi:eye-off" : "mdi:eye"}
            className="absolute right-3 top-9 text-gray-500 cursor-pointer"
            onClick={() => setShowNewPassword(!showNewPassword)}
            width="20"
            height="20"
          />
        </div>
        <div className="relative">
          <FormInput
            label="Confirm New Password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            formik={formik}
            required
            maxLength={50}
            className="pr-10"
          />
          <Icon
            icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"}
            className="absolute right-3 top-9 text-gray-500 cursor-pointer"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            width="20"
            height="20"
          />
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupSection;
