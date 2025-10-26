import React, { useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import Button from "@ui/Button";
import { useFormik } from "formik";
import * as Yup from "yup";
import { passwordRegex } from "@/utils/constants";
import { updateUser } from "@services/UserApi";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "@redux/store";
import type { UserData } from "@/types/user";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentData: UserData;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  agentData,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const userData = useSelector((state: RootState) => state.user.data);

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .required("Password is required")
        .min(8, "Password must be at least 8 characters long")
        .matches(
          passwordRegex,
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        ),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords do not match")
        .required("Confirm Password is required"),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      if (!userData || !userData.userId || !userData.activeLocation) {
        toast.error("User authentication or location data missing.");
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("password", values.password);
      if (agentData.locations && Array.isArray(agentData.locations)) {
        agentData.locations.forEach((location) => {
          if (typeof location === "string") {
            formData.append("locationIds[]", location);
          } else if (
            location &&
            typeof location === "object" &&
            "name" in location &&
            location.name
          ) {
            formData.append("locationIds[]", location.name);
          }
        });
      }

      try {
        const response = await updateUser(
          agentData?.userId,
          formData,
          userData.userId,
          userData.activeLocation
        );
        toast.success(response?.message || "Password changed successfully!");
        onClose();
        resetForm();
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to change password.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Change Password"
      widthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="submitStyle"
            label={"Save Changes"}
            type="submit"
            onClick={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
          />
          <Button
            variant="default"
            label="Cancel"
            onClick={onClose}
            disabled={formik.isSubmitting}
          />
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4" noValidate>
        <div className="text-sm text-gray-600 mb-4">
          Change password for{" "}
          <span className="font-medium">{agentData?.userName}</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-3 py-2 border ${
                formik.touched.password && formik.errors.password
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-describedby="password-error"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              <Icon
                icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
                width="20"
                height="20"
              />
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p id="password-error" className="text-red-500 text-xs mt-1">
              {formik.errors.password}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-3 py-2 border ${
                formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-describedby="confirm-password-error"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              tabIndex={-1}
            >
              <Icon
                icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"}
                width="20"
                height="20"
              />
            </button>
          </div>
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p
              id="confirm-password-error"
              className="text-red-500 text-xs mt-1"
            >
              {formik.errors.confirmPassword}
            </p>
          )}
        </div>
      </form>
    </ModalWrapper>
  );
};

export default ChangePasswordModal;
