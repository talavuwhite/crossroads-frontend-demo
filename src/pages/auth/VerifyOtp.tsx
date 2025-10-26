import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { verifyOTP, resendOTP } from "@/services/authApi";
import { useDispatch } from "react-redux";
import { setUserData } from "@/redux/userSlice";

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/auth/login");
      return;
    }

    // Start countdown for resend
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Copy-paste functionality
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, ""); // Remove non-digits

    if (pastedData.length === 6) {
      const digits = pastedData.split("");
      setOtp(digits);

      // Focus the last input after paste
      setTimeout(() => {
        inputRefs.current[5]?.focus();
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(email, otpString);
      if (response.success && response.data) {
        // Transform the backend response to match expected format
        const userData = {
          userId: response.data.user.userId,
          email: response.data.user.email,
          userName: response.data.user.userName,
          role: response.data.user.propertyRole,
          propertyRole: response.data.user.propertyRole,
          activeLocation: response.data.user.activeLocation,
          companyId: response.data.user.companyId,
          type: "user",
          isActive: response.data.user.isActive,
          allowPrivateCases: response.data.user.allowPrivateCases,
          userType: response.data.user.userType,
          locations: response.data.user.locations,
          orgName: response.data.user.orgName,
        };

        // Store user data in Redux (will be automatically persisted by redux-persist)
        dispatch(setUserData(userData));

        toast.success("Login successful!");
        navigate("/");
      } else {
        toast.error(response.message || "Invalid OTP");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.message || "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      const response = await resendOTP(email);
      if (response.success) {
        setCountdown(30);
        toast.success("New OTP sent to your email");
      } else {
        toast.error(response.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purpleLight px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-purple rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Icon icon="mdi:shield-check" className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-gray-600 text-sm">
            We've sent a 6-digit code to{" "}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        {/* OTP Card */}
        <div className="bg-white rounded-xl shadow-lg border border-border p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter the 6-digit code
              </label>

              {/* OTP Input Fields */}
              <div className="flex justify-center space-x-3 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple focus:border-purple transition-all duration-200 bg-white"
                    disabled={loading}
                    placeholder="•"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full bg-purple text-white py-3 px-4 rounded-lg font-medium hover:bg-pink focus:outline-none focus:ring-2 focus:ring-purple focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Icon icon="mdi:check-circle" width="18" height="18" />
                    Verify Code
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Resend Button */}
          <div className="text-center">
            <button
              onClick={handleResendOTP}
              disabled={countdown > 0 || resendLoading}
              className="text-purple hover:text-purple-700 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {resendLoading ? (
                <div className="flex items-center justify-center">
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin mr-1"
                    width="14"
                    height="14"
                  />
                  Sending...
                </div>
              ) : countdown > 0 ? (
                <div className="flex items-center justify-center">
                  <Icon
                    icon="mdi:clock-outline"
                    className="mr-1"
                    width="14"
                    height="14"
                  />
                  Resend code in {countdown}s
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Icon
                    icon="mdi:refresh"
                    className="mr-1"
                    width="14"
                    height="14"
                  />
                  Resend code
                </div>
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              onClick={() => navigate("/auth/login")}
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-700 text-sm transition-colors"
            >
              <Icon icon="mdi:arrow-left" width="14" height="14" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
