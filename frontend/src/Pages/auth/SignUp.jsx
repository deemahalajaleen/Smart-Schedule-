import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import apiClient from "../../Services/apiClient";

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
    name: "",
    level_id: "",
    dept_id: "",
  });

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpUrl, setOtpUrl] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch levels only
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const levelsRes = await apiClient.get("/dropdowns/levels");
        setLevels(levelsRes.data);
      } catch {
        setLevels([]);
      }
    };
    fetchDropdowns();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setOtpUrl("");
    setOtpCode("");
    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "student") {
        payload.name = formData.name;
        payload.level_id = formData.level_id;
        payload.dept_id = formData.dept_id;
      } else if (formData.role === "faculty") {
        payload.name = formData.name;
        payload.dept_id = formData.dept_id;
      }

      const res = await apiClient.post("auth/signup", payload);

      if (res.data.otp_url) {
        setSuccess(
          "✅ Account created successfully! Scan this QR code in Google Authenticator before logging in."
        );
        setOtpUrl(res.data.otp_url);
        setOtpCode(res.data.otp_code);
        setShowModal(true);
      } else {
        setSuccess("✅ Account created successfully!");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err.response?.data?.error || "❌ Failed to create account");
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
        <h3 className="text-center mb-4 text-info">SmartSchedule Sign Up</h3>

        {success && !showModal && (
          <div className="alert alert-success">{success}</div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-bold">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label fw-bold">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Role */}
          <div className="mb-3">
            <label className="form-label fw-bold">Role</label>
            <select
              className="form-select"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="registrar">Registrar</option>
              <option value="schedule_committee">Schedule_committee</option>
              <option value="load_committee">Load Committee</option>
            </select>
          </div>

          {(formData.role === "student" || formData.role === "faculty") && (
            <>
              <div className="mb-3">
                <label className="form-label fw-bold">Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {formData.role === "student" && (
            <div className="mb-3">
              <label className="form-label fw-bold">Level</label>
              <select
                className="form-select"
                name="level_id"
                value={formData.level_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-info w-100 text-white fw-bold"
            disabled={loading}
          >
            {loading && (
              <span className="spinner-border spinner-border-sm me-2"></span>
            )}
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-3">
          <span className="small">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-decoration-none text-info fw-semibold"
            >
              Login here
            </Link>
          </span>
        </div>
      </div>

      {/* Modal for QR Code */}
      {showModal && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 text-center">
              <h5 className="fw-bold text-success mb-3">
                Scan this QR code in Google Authenticator
              </h5>

              <div className="d-flex justify-content-center mb-3">
                <QRCodeCanvas
                  value={otpUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="small text-muted">
                Or enter this code manually: <b>{otpCode}</b>
              </p>

              <div className="mt-3 d-flex justify-content-center gap-3">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  className="btn btn-info text-white fw-bold"
                  onClick={() => navigate("/login")}
                >
                  Continue to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
