import React, { useEffect, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import type { RootState } from "@redux/store";
import ModalWrapper from "@ui/ModalWrapper";
import FormInput from "@ui/FormInput";
import PasswordSetupSection from "@/components/PasswordSetupSection";
import { MAX_FILE_SIZE_MB, passwordRegex } from "@/utils/constants";
import Button from "@ui/Button";
import FileInput from "@ui/FileInput";
import { createUser, updateUser } from "@services/UserApi";
import { createAgentRequest } from "@services/AgentRequestApi";
import { toast } from "react-toastify";
import type { UserData } from "@/types/user";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface AgentFormData {
  firstName: string;
  lastName: string;
  primaryPhone: string;
  alternatePhone?: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  disableLogins?: boolean;
  image?: string | File | null;
}

interface AddAgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AgentFormData) => void;
  agentData?: UserData | null;
  allowedRolesToAssign?: string[];
}

const createValidationSchema = (isEditing: boolean) => {
  const shape: Yup.ObjectShape = {
    firstName: Yup.string()
      .trim()
      .required("First name is required")
      .min(2, "Minimum 2 characters")
      .max(50, "Maximum 50 characters"),
    lastName: Yup.string()
      .trim()
      .required("Last name is required")
      .min(2, "Minimum 2 characters")
      .max(50, "Maximum 50 characters"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    primaryPhone: Yup.string()
      .required("Phone number is required")
      .matches(/^\d*$/, "Phone number must contain only digits")
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number cannot exceed 15 digits"),
    alternatePhone: Yup.string()
      .matches(/^\d*$/, "Phone number must contain only digits")
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number cannot exceed 15 digits")
      .nullable(),
    role: isEditing
      ? Yup.string().required("Role is required")
      : Yup.string().nullable(),
    disableLogins: Yup.boolean().nullable(),
    image: Yup.mixed()
      .nullable()
      .test("fileType", "Unsupported file type", (value: any) => {
        if (!value) return true;
        if (typeof value === "string") return true;
        return ["image/png", "image/jpeg", "image/jpg"].includes(value.type);
      })
      .test(
        "fileSize",
        `File must be <= ${MAX_FILE_SIZE_MB}MB`,
        (value: any) => {
          if (!value || typeof value === "string") return true;
          return value.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
        }
      ),
  };

  if (!isEditing) {
    shape.password = Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(20, "Maximum 20 characters")
      .matches(
        passwordRegex,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
    shape.confirmPassword = Yup.string()
      .required("Confirm password is required")
      .oneOf([Yup.ref("password")], "Passwords do not match")
      .max(20, "Maximum 20 characters");
  }

  return Yup.object().shape(shape);
};

const AddAgentForm: React.FC<AddAgentFormProps> = ({
  isOpen,
  onClose,
  onSave,
  agentData,
  allowedRolesToAssign: allowedRolesToAssignProp,
}) => {
  const userData = useSelector((state: RootState) => state.user.data);
  const {
    canCreateUsers,
    canUpdateUsers,
    canUpdateRoles,
    canUpdateStatus,
    canAssignRole,
    allowedRolesToAssign: allowedRolesToAssignDefault,
    canModifyUser,
    currentRole,
    canUpdateOwnProfile,
  } = useRoleAccess();

  const allowedRolesToAssign =
    allowedRolesToAssignProp || allowedRolesToAssignDefault;

  const initialValues: AgentFormData = useMemo(() => {
    return agentData
      ? {
          firstName: agentData.firstName ?? "",
          lastName: agentData.lastName ?? "",
          primaryPhone: agentData.phone ?? "",
          alternatePhone: agentData.alternatePhoneNumber ?? "",
          email: agentData.email ?? "",
          password: "",
          confirmPassword: "",
          role: agentData.propertyRole ?? "Agent",
          disableLogins: !agentData.isActive,
          image: agentData.profileImage ?? null,
        }
      : {
          firstName: "",
          lastName: "",
          primaryPhone: "",
          alternatePhone: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "Agent",
          disableLogins: false,
          image: null,
        };
  }, [agentData]);

  const validationSchema = useMemo(
    () => createValidationSchema(!!agentData),
    [agentData]
  );

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (!userData || !userData.userId) {
          throw new Error("User authentication data missing");
        }

        if (agentData) {
          if (
            !canUpdateUsers &&
            !(agentData.userId === userData?.userId && canUpdateOwnProfile)
          ) {
            throw new Error("You don't have permission to update users");
          }

          if (
            !canModifyUser(agentData.propertyRole as any) &&
            !(agentData.userId === userData?.userId && canUpdateOwnProfile)
          ) {
            throw new Error("You don't have permission to modify this user");
          }

          if (values.role && values.role !== agentData.propertyRole) {
            if (!canUpdateRoles) {
              throw new Error("You don't have permission to update roles");
            }
            if (!canAssignRole(values.role as any)) {
              throw new Error("You don't have permission to assign this role");
            }
          }

          if (values.disableLogins !== !agentData.isActive) {
            if (!canUpdateStatus) {
              throw new Error(
                "You don't have permission to update user status"
              );
            }
            if (
              agentData.propertyRole === "Network Administrator" &&
              currentRole === "Agency Administrator"
            ) {
              throw new Error("Cannot modify Network Administrator status");
            }
          }
        } else {
          // Check if user is Agency Administrator - they need to create requests
          if (currentRole === "Agency Administrator") {
            if (!canCreateUsers) {
              throw new Error("You don't have permission to create users");
            }

            if (values.role && !canAssignRole(values.role as any)) {
              throw new Error("You don't have permission to assign this role");
            }
          } else {
            // Network Administrator can create users directly
            if (!canCreateUsers) {
              throw new Error("You don't have permission to create users");
            }

            if (values.role && !canAssignRole(values.role as any)) {
              throw new Error("You don't have permission to assign this role");
            }
          }
        }

        if (agentData) {
          const formData = new FormData();
          formData.append("firstName", values.firstName);
          formData.append("lastName", values.lastName);
          formData.append("email", values.email);
          formData.append("phone", values.primaryPhone);
          if (values.alternatePhone)
            formData.append("alternatePhoneNumber", values.alternatePhone);

          if (
            values.role &&
            values.role !== agentData.propertyRole &&
            canUpdateRoles
          )
            formData.append("propertyRole", values.role);

          if (
            values.disableLogins !== !agentData.isActive &&
            canUpdateStatus(agentData?.propertyRole as any)
          )
            formData.append("isActive", (!values.disableLogins).toString());

          if (values.image instanceof File)
            formData.append("profileImage", values.image);

          if (agentData.locations && Array.isArray(agentData.locations))
            agentData.locations.forEach((location) => {
              const locationId =
                typeof location === "string" ? location : undefined;
              if (locationId) formData.append("locationIds[]", locationId);
            });

          if (agentData.companyId)
            formData.append("companyId", agentData.companyId);

          const response = await updateUser(
            agentData.userId,
            formData,
            userData.userId,
            userData.activeLocation
          );
          toast.success(response?.message || "Agent updated successfully");
        } else {
          if (currentRole === "Agency Administrator") {
            // Create agent approval request to backend
            const requestPayload = {
              companyId: String(userData.companyId),
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              password: values.password || "Temp@1234",
              role: "user",
              type: "account",
              userType: userData?.activeLocation ? "SubAgency" : "Agency",
              propertyRole: values.role || "Agent",
              locationIds: [String(userData.activeLocation)],
            };

            await createAgentRequest(
              requestPayload,
              userData.userId,
              userData.activeLocation
            );
            toast.success(
              "Agent request submitted successfully! It will be reviewed by a Network Administrator."
            );
          } else {
            // Network Administrator creates user directly
            const userPayload = {
              companyId: userData.companyId,
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              password: values.password || "",
              phone: values.primaryPhone,
              type: "account",
              role: "user",
              locationIds: [userData.activeLocation],
              propertyRole: values.role || "Agent",
              permissions: {
                campaignsEnabled: false,
                contactsEnabled: false,
              },
              userType: userData?.activeLocation ? "SubAgency" : "Agency",
            };

            const response = await createUser(
              userPayload,
              userData.userId,
              userData.activeLocation
            );
            toast.success(response?.message || "Agent created successfully");
          }
        }

        onSave(values);
      } catch (error: any) {
        toast.error(
          error?.data?.message || "An error occurred while saving agent."
        );
      }
    },
    enableReinitialize: true,
  });

  useEffect(() => {
    formik.resetForm({
      values: initialValues,
    });
  }, [isOpen, initialValues]);

  const roleOptions = useMemo(() => {
    let roles = allowedRolesToAssign;
    if (agentData && currentRole === "Agency Administrator") {
      roles = roles.filter((role) => role !== "Agency Administrator");
    }
    return roles.map((role) => ({
      label: role,
      value: role,
    }));
  }, [allowedRolesToAssign, agentData, currentRole]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={
        agentData
          ? "Edit Agent"
          : currentRole === "Agency Administrator"
          ? "Request New Agent"
          : "Add Agent"
      }
      widthClass="max-w-xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="submitStyle"
            label={
              agentData
                ? "Save Changes"
                : currentRole === "Agency Administrator"
                ? "Submit Request"
                : "Add Agent"
            }
            type="submit"
            onClick={formik.handleSubmit}
            disabled={formik.isSubmitting}
          />
          <Button
            variant="default"
            label="Cancel"
            onClick={() => {
              formik.resetForm();
              onClose();
            }}
            disabled={formik.isSubmitting}
          />
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="First Name"
            name="firstName"
            formik={formik}
            required
            maxLength={50}
          />
          <FormInput
            label="Last Name"
            name="lastName"
            formik={formik}
            required
            maxLength={50}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Primary Phone"
            name="primaryPhone"
            formik={formik}
            required
            maxLength={15}
            value={formik?.values?.primaryPhone}
          />
          <FormInput
            label="Alternate Phone"
            name="alternatePhone"
            formik={formik}
            maxLength={15}
            value={formik?.values?.alternatePhone}
          />
        </div>
        <FormInput
          label="Email"
          name="email"
          type="email"
          formik={formik}
          required
          readOnly={!!agentData}
          className={`${
            agentData
              ? "bg-gray-200 !ring-0  focus-!ring-0 cursor-not-allowed"
              : ""
          }`}
        />
        {agentData && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-primary">*</span>
            </label>
            {(currentRole === "Agent" &&
              agentData.userId === userData?.userId) ||
            (agentData.propertyRole === "Agency Administrator" &&
              currentRole === "Agency Administrator") ? (
              <input
                type="text"
                value={agentData.propertyRole}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-200 cursor-not-allowed"
              />
            ) : (
              <select
                name="role"
                value={formik.values.role}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={
                  currentRole === "Agent" &&
                  agentData.userId === userData?.userId
                }
                className={`w-full px-3 py-2 border ${
                  formik.touched.role && formik.errors.role
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-purple ${
                  currentRole === "Agent" &&
                  agentData.userId === userData?.userId
                    ? "bg-gray-200 cursor-not-allowed"
                    : ""
                }`}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {formik.touched.role && formik.errors.role && (
              <p className="text-red-500 text-xs mt-1">{formik.errors.role}</p>
            )}
          </div>
        )}
        {agentData && canUpdateStatus(agentData?.propertyRole as any) && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="disableLogins"
              name="disableLogins"
              checked={formik.values.disableLogins}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={
                currentRole === "Agent" && agentData.userId === userData?.userId
              }
              className="h-4 w-4 !accent-purple rounded"
            />
            <label
              htmlFor="disableLogins"
              className="ml-2 block text-sm text-gray-900"
            >
              Disable login for this agent?
            </label>
            {formik.touched.disableLogins && formik.errors.disableLogins && (
              <p className="text-red-500 text-xs mt-1">
                {formik.errors.disableLogins}
              </p>
            )}
          </div>
        )}
        {!agentData && <PasswordSetupSection formik={formik} />}

        {agentData && (
          <FileInput
            label="Profile Image"
            name="image"
            formik={formik}
            allowedTypes={["image/png", "image/jpeg", "image/jpg"]}
          />
        )}
      </div>
    </ModalWrapper>
  );
};

export default AddAgentForm;
