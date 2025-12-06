import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import apiClient from "../../Services/apiClient";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");
    try {
      const res = await apiClient.post("/auth/reset-password", { token, newPassword });
      setMessage("✅ Password reset successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "❌ Invalid or expired token");
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-info">
      <div className="card shadow p-4 bg-white" style={{ minWidth: "350px", borderRadius: "15px" }}>
        <h4 className="text-center text-info mb-4">Reset Password</h4>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="form-label fw-bold">New Password</label>
          <input
            type="password"
            className="form-control mb-3"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-info text-white w-100 fw-bold">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
