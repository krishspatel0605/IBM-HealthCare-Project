import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaKey, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import healthcareImage from "../assets/healthcare.jpg"; // Use correct image path

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "";
  const [name, domain] = email.split("@");
  if (name.length < 2) return `*@${domain}`;
  return `${name[0]}${"*".repeat(Math.max(1, name.length - 1))}@${domain}`;
};

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchParams] = useSearchParams();
  const [timer, setTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setError("Missing activation parameters. Please try registering again.");
      setTimeout(() => navigate("/register"), 2000);
    }
  }, [token, email, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    if (timer === 0) setIsResendDisabled(false);

    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
      // Auto-submit when all OTP digits are entered
      if (newOtp.join("").length === 6) {
        handleVerify(newOtp.join(""));
      }
    }
  };

  const handleBackspace = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleVerify = async (otpCode) => {
    if (!token || !email || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/activate/`,
        {
          token: token.trim(),
          email_otp: otpCode.trim() // Match backend expected parameter name
        }
      );

      if (response.data.success) {
        setSuccess("✅ Account activated successfully!");
        // Clear any existing auth tokens
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(response.data.error || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Invalid OTP or expired token.";
      setError(errorMsg);
      if (errorMsg.toLowerCase().includes("expired")) {
        setTimeout(() => navigate("/register"), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError("Email address is missing. Please try registering again.");
      return;
    }

    setTimer(30);
    setIsResendDisabled(true);
    setError("");
    setSuccess("");
  
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/resend-activation-otp/`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.message) {
        setSuccess("✅ OTP resent successfully!");
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP. Please try again.");
      setIsResendDisabled(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6">
      <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Left image section */}
        <div className="hidden md:block md:w-1/2 relative">
          <img src={healthcareImage} alt="Verify OTP" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-blue-800/50 flex items-end p-6 text-white">
            <div>
              <h2 className="text-2xl font-bold mb-2">Email Verification</h2>
              <p className="opacity-90">Check your inbox for a 6-digit OTP</p>
            </div>
          </div>
        </div>

        {/* Right form section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-6">
            <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
              <FaKey className="text-2xl text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify Email</h1>
            <p className="text-gray-600">
              Enter the OTP sent to <strong>{maskEmail(email)}</strong>
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={digit}
                maxLength={1}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleBackspace(index, e)}
                className="w-12 h-12 text-center text-xl font-semibold text-gray-800 border border-gray-300 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 p-3 rounded-lg text-red-600 mb-2">
              <FaExclamationTriangle className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 p-3 rounded-lg text-green-600 mb-2">
              <FaCheckCircle className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            onClick={() => handleVerify(otp.join(""))}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="text-center mt-6 text-sm">
            {timer > 0 ? (
              <span className="text-gray-500">Resend OTP in {timer}s</span>
            ) : (
              <button
                onClick={handleResendOTP}
                disabled={isResendDisabled}
                className={`font-medium ${
                  isResendDisabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:underline"
                }`}
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
