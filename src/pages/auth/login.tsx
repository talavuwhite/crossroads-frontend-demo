import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { sendOTP } from "@/services/authApi";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }

    // Only validate if email has been touched and has content
    if (isEmailTouched && value.trim()) {
      if (!validateEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  };

  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    if (email.trim() && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Please enter your email address");
      setIsEmailTouched(true);
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      setIsEmailTouched(true);
      return;
    }

    setLoading(true);
    try {
      const response = await sendOTP(email);
      if (response.success) {
        toast.success("OTP sent to your email address");
        // Navigate to OTP verification page with email
        navigate("/auth/verify-otp", { state: { email } });
      } else {
        toast.error(response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Icon icon="mdi:charity" className="text-purple text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Enter your email to receive a verification code
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              className={`appearance-none relative block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:z-10 sm:text-sm transition-colors duration-200 ${
                emailError
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-purple focus:border-purple"
              } placeholder-gray-500 text-gray-900`}
              placeholder="Enter your email address"
              disabled={loading}
            />
            {emailError && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <Icon
                  icon="mdi:alert-circle"
                  className="mr-1"
                  width="16"
                  height="16"
                />
                {emailError}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !!emailError}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:!cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <Icon icon="mdi:loading" className="animate-spin mr-2" />
                  Sending OTP...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:send" />
                  Send Verification Code
                </div>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-4">
            Need help signing in?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <a
              href="mailto:support@crossroadspro.org"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white border border-gray-200 shadow-sm hover:border-purple hover:bg-purple-50 hover:text-purple-700 transition duration-200"
            >
              <Icon
                icon="mdi:email-outline"
                className="text-purple"
                width="18"
                height="18"
              />
              <span className="text-sm font-medium">Email Support</span>
            </a>

            {/* Phone */}
            <a
              href="tel:+17692180012"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white border border-gray-200 shadow-sm hover:border-purple hover:bg-purple-50 hover:text-purple-700 transition duration-200"
            >
              <Icon
                icon="mdi:phone-outline"
                className="text-purple"
                width="18"
                height="18"
              />
              <span className="text-sm font-medium">Call Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
