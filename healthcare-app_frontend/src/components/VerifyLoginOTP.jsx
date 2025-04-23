import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaKey, FaExclamationTriangle } from "react-icons/fa";
import healthcareImage from "../assets/healthcare.jpg"; // Ensure correct path

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "";
  const [name, domain] = email.split("@");
  if (name.length < 2) return `*@${domain}`;
  return `${name[0]}${"*".repeat(Math.max(1, name.length - 1))}@${domain}`;
};

const VerifyLoginOTP = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const email = searchParams.get("email");

  useEffect(() => {
    // Redirect to login if no email is present
    if (!email) {
      setError("Email is missing. Please try logging in again.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    // Check if already authenticated
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (token) {
      const role = localStorage.getItem("user_role");
      navigate(role === "doctor" ? "/dashboard" : "/userhome", { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) document.getElementById(`otp-${index + 1}`).focus();
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

  const handleVerify = async () => {
    const otpCode = otp.join("");
    
    if (!email || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
  
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/verify-login-otp/`,
        { email, email_otp: otpCode.trim() },
        { withCredentials: true }
      );
  
      const { access, refresh, role } = response.data;
  
      if (access && refresh && role) {
        // Store tokens
        localStorage.setItem("auth_token", access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("user_role", role);
        
        // Trigger storage event for other components
        window.dispatchEvent(new Event("storage"));

        // Check for redirect URL
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        sessionStorage.removeItem('redirectUrl'); // Clean up

        // Navigate to the appropriate route
        if (redirectUrl && redirectUrl !== '/login') {
          navigate(redirectUrl, { replace: true });
        } else {
          navigate(role === "doctor" ? "/dashboard" : "/userhome", { replace: true });
        }
      } else {
        setError("Invalid response from server. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error verifying OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    setTimer(30);
    setIsResendDisabled(true);
    setError("");

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/resend-login-otp/`,
        { email },
        { withCredentials: true }
      );
      alert("✅ OTP resent successfully!");
    } catch (err) {
      setError("Failed to resend OTP. Please try again later.");
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
              <h3 className="text-2xl font-bold mb-2">Almost there!</h3>
              <p className="text-sm opacity-90">Enter the OTP sent to your email to complete login.</p>
            </div>
          </div>
        </div>

        {/* Right form section */}
        <div className="w-full md:w-1/2 p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h2>
            <p className="text-gray-600">
              Enter the code sent to {maskEmail(email)}
            </p>
          </div>

          <div className="space-y-6">
            {/* OTP Input Fields */}
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  id={`otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleBackspace(index, e)}
                  maxLength={1}
                  className="w-12 h-12 text-center text-2xl border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
                <FaExclamationTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading}
              className={`w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <button
                onClick={handleResendOTP}
                disabled={isResendDisabled}
                className={`text-blue-600 hover:text-blue-800 ${
                  isResendDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Resend OTP {timer > 0 && `(${timer}s)`}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <button
                onClick={() => navigate("/login")}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyLoginOTP;
