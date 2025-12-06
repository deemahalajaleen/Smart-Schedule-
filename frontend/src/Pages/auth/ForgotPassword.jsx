import React, { useState } from "react";
import apiClient from "../../Services/apiClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");
    try {
      const res = await apiClient.post("/auth/request-password-reset", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset link");
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-info">
      <div className="card shadow p-4 bg-white" style={{ minWidth: "350px", borderRadius: "15px" }}>
        <h4 className="text-center text-info mb-4">Forgot Password</h4>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="form-label fw-bold">Enter your email</label>
          <input
            type="email"
            className="form-control mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-info text-white w-100 fw-bold">
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}
