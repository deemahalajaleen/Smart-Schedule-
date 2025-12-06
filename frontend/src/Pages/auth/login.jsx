import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // ✅ كل المستخدمين يجب أن يرسلوا الإيميل + الباسورد + كود OTP
      const payload = { email, password, otp };

      const res = await apiClient.post("/auth/login", payload);

      if (res.data.token) {
        login(res.data.token);
        setSuccess("✅ Login successful! Redirecting...");

        setTimeout(() => {
          const decoded = JSON.parse(atob(res.data.token.split(".")[1]));
          if (decoded.role === "faculty") navigate("/faculty");
          else if (decoded.role === "registrar") navigate("/registrar");
          else if (decoded.role === "schedule_committee")
            navigate("/schedule_committee");
          else if (decoded.role === "student") navigate("/student");
          else if (decoded.role === "load_committee")
            navigate("/load_committee");
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "❌ Invalid credentials or OTP code"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-info">
      <div
        className="card shadow p-4 bg-white"
        style={{ minWidth: "350px", borderRadius: "15px" }}
      >
        <h3 className="text-center mb-4 text-info">SmartSchedule Login</h3>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-bold">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="form-label fw-bold">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ✅ OTP field always visible */}
          <div className="mb-3">
            <label className="form-label fw-bold">
              OTP (Google Authenticator)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          <div className="text-end mb-3">
            <Link
              to="/forgot-password"
              className="text-decoration-none text-info fw-semibold small"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-info w-100 text-white fw-bold"
            disabled={loading}
          >
            {loading && (
              <span className="spinner-border spinner-border-sm me-2"></span>
            )}
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center mt-3">
            <span className="small">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="text-decoration-none text-info fw-semibold"
              >
                Sign up here
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
