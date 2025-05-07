import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaKey, FaExclamationTriangle } from "react-icons/fa";
import healthcareImage from "../assets/healthcare.jpg";

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
    if (!email) {
      setError("Email is missing. Please try logging in again.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (token) {
      const role = localStorage.getItem("user_role");
      if (role === "doctor") {
        navigate("/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/userhome", { replace: true });
      }
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
        localStorage.setItem("auth_token", access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("user_role", role);
        window.dispatchEvent(new Event("storage"));

        const redirectUrl = sessionStorage.getItem('redirectUrl');
        sessionStorage.removeItem('redirectUrl');

        if (redirectUrl && redirectUrl !== '/login') {
          navigate(redirectUrl, { replace: true });
        } else {
          if (role === "doctor") {
            navigate("/dashboard", { replace: true });
          } else if (role === "admin") {
            navigate("/admin-dashboard", { replace: true });
          } else {
            navigate("/userhome", { replace: true });
          }
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
        {/* Image Section */}
        <div className="hidden md:block md:w-1/2 relative">
          <img src={healthcareImage} alt="Verify OTP" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-blue-800/50 flex items-end p-6 text-white">
            <div>
              <h3 className="text-2xl font-bold mb-2">Almost there!</h3>
              <p className="text-sm opacity-90">Enter the OTP sent to your email to complete login.</p>
            </div>
          </div>
        </div>

        {/* OTP Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-6">
            <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
              <FaKey className="text-2xl text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h1>
            <p className="text-gray-600">Enter the OTP sent to <strong>{maskEmail(email)}</strong></p>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleBackspace(index, e)}
                maxLength={1}
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

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all"
          >
            {loading ? "Verifying..." : "Verify OTP"}
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

          <div className="text-center mt-4">
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
  );
};

export default VerifyLoginOTP;
