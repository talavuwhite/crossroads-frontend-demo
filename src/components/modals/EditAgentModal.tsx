import React, { useEffect, useState } from "react";
import ModalWrapper from "@ui/ModalWrapper";
import { Icon } from "@iconify-icon/react/dist/iconify.js";

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => void;
  agentData?: AgentFormData;
}

interface AgentFormData {
  firstName: string;
  lastName: string;
  primaryPhone: string[];
  primaryExt: string;
  alternatePhone: string[];
  alternateExt: string;
  email: string;
  role: "Agent" | "Agency Administrator" | "Network Administrator";
  disableLogin: boolean;
  profileImage?: string;
}

const EditAgentModal: React.FC<EditAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  agentData,
}) => {
  const initialFormData: AgentFormData = {
    firstName: "",
    lastName: "",
    primaryPhone: ["", "", ""],
    primaryExt: "",
    alternatePhone: ["", "", ""],
    alternateExt: "",
    email: "",
    role: "Agent",
    disableLogin: false,
    profileImage: undefined,
  };

  const [formData, setFormData] = useState<AgentFormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (agentData) {
      setFormData({
        ...initialFormData,
        ...agentData,
        primaryPhone: agentData.primaryPhone || ["", "", ""],
        alternatePhone: agentData.alternatePhone || ["", "", ""],
      });
    }
    setErrors({});
  }, [agentData, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.primaryPhone.some((part) => part && !/^\d+$/.test(part))) {
      newErrors.primaryPhone = "Phone numbers must contain only digits";
    }
    if (formData.alternatePhone.some((part) => part && !/^\d+$/.test(part))) {
      newErrors.alternatePhone = "Phone numbers must contain only digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handlePhoneChange = (
    type: "primary" | "alternate",
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type === "primary" ? "primaryPhone" : "alternatePhone"]: prev[
        type === "primary" ? "primaryPhone" : "alternatePhone"
      ].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Agent"
      widthClass="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors duration-200"
          >
            <Icon icon="mdi:check" width="18" height="18" />
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="bg-primary hover:bg-red-700 text-white px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors duration-200"
          >
            <Icon icon="mdi:close" width="18" height="18" />
            Cancel
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className={`w-full px-3 py-2 border ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className={`w-full px-3 py-2 border ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              required
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Phone
            </label>
            <div className="flex gap-2">
              {formData.primaryPhone.map((part, index) => (
                <input
                  key={index}
                  type="text"
                  value={part}
                  onChange={(e) =>
                    handlePhoneChange("primary", index, e.target.value)
                  }
                  className={`w-full px-3 py-2 border ${
                    errors.primaryPhone ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  maxLength={index === 0 ? 3 : 4}
                />
              ))}
            </div>
            {errors.primaryPhone && (
              <p className="text-red-500 text-xs mt-1">{errors.primaryPhone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ext.
            </label>
            <input
              type="text"
              value={formData.primaryExt}
              onChange={(e) =>
                setFormData({ ...formData, primaryExt: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alternate Phone
            </label>
            <div className="flex gap-2">
              {formData.alternatePhone.map((part, index) => (
                <input
                  key={index}
                  type="text"
                  value={part}
                  onChange={(e) =>
                    handlePhoneChange("alternate", index, e.target.value)
                  }
                  className={`w-full px-3 py-2 border ${
                    errors.alternatePhone ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  maxLength={index === 0 ? 3 : 4}
                />
              ))}
            </div>
            {errors.alternatePhone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.alternatePhone}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ext.
            </label>
            <input
              type="text"
              value={formData.alternateExt}
              onChange={(e) =>
                setFormData({ ...formData, alternateExt: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-primary">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={`w-full px-3 py-2 border ${
              errors.email ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role <span className="text-primary">*</span>
          </label>
          <div className="space-y-2">
            {["Agent", "Agency Administrator", "Network Administrator"].map(
              (role) => (
                <div key={role} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={role}
                    checked={formData.role === role}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        role: role as AgentFormData["role"],
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={role} className="text-sm text-gray-900">
                    {role}
                  </label>
                  <Icon
                    icon="mdi:information"
                    className="text-gray-400 cursor-help"
                    width="16"
                    height="16"
                    title={`${role} permissions information`}
                  />
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image
          </label>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
              {formData.profileImage ? (
                <img
                  src={formData.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon
                    icon="mdi:account"
                    className="text-gray-400"
                    width="48"
                    height="48"
                  />
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => document.getElementById("profileImage")?.click()}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <Icon icon="mdi:camera" width="16" height="16" />
                Click to change image
              </button>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="disableLogin"
            checked={formData.disableLogin}
            onChange={(e) =>
              setFormData({ ...formData, disableLogin: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="disableLogin"
            className="ml-2 block text-sm text-gray-900"
          >
            Disable login for this agent?
          </label>
        </div>

        <div className="pt-2">
          <a
            href="#"
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            Click here to resend the welcome email
          </a>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default EditAgentModal;
