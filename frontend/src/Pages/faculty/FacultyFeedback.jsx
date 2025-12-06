import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import { Spinner, Toast, ToastContainer } from "react-bootstrap";
import { FaTrashAlt } from "react-icons/fa";

export default function FacultyFeedback() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackType, setFeedbackType] = useState("schedule");
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  // 🟢 Fetch user feedbacks
  useEffect(() => {
    if (!user?.id) return;
    const fetchFeedbacks = async () => {
      try {
        const res = await apiClient.get(`/feedback/user/${user.id}`);
        setFeedbacks(res.data);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
        showToast("Failed to load feedbacks", "danger");
      } finally {
        setPageLoading(false);
      }
    };
    fetchFeedbacks();
  }, [user]);

  // ✉️ Submit feedback
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      showToast("Please write your feedback before sending", "warning");
      return;
    }

    setSending(true);
    try {
      const res = await apiClient.post("/feedback", {
        auth_id: user.id,
        type: feedbackType,
        text: feedbackText,
      });
      setFeedbacks((prev) => [res.data, ...prev]);
      setFeedbackText("");
      showToast("✅ Feedback sent successfully", "success");
    } catch (err) {
      console.error("Error sending feedback:", err);
      showToast("Failed to send feedback", "danger");
    } finally {
      setSending(false);
    }
  };

  // 🗑️ Delete feedback
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    setLoading(true);
    try {
      await apiClient.delete(`/feedback/${id}`);
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      showToast("🗑️ Feedback deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting feedback:", err);
      showToast("Failed to delete feedback", "danger");
    } finally {
      setLoading(false);
    }
  };

  // 🌀 Loading Spinner
  if (pageLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <Spinner animation="border" variant="info" style={{ width: "3rem", height: "3rem" }} />
      </div>
    );
  }

  return (
    <div
      className="container py-5 px-4"
      style={{
        maxWidth: "950px",
        background: "linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%)",
        borderRadius: "16px",
      }}
    >
      {/* Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.type} show={toast.show} onClose={() => setToast({ show: false })}>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="fw-bold text-info mb-2">Feedback Center</h2>
        <p className="text-muted">
          Share your thoughts or report issues regarding your schedule or assignments 💬
        </p>
      </div>

      {/* Feedback Form */}
      <div
        className="card border-0 shadow-sm mb-5"
        style={{
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="card-body">
          <h5 className="fw-semibold text-secondary mb-3">Submit New Feedback</h5>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold text-muted">Feedback Type</label>
              <select
                className="form-select shadow-sm"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <option value="schedule">On Schedule</option>
                <option value="assignment">On Assignment</option>
              </select>
            </div>

            <div className="col-md-8">
              <label className="form-label fw-semibold text-muted">Your Message</label>
              <textarea
                className="form-control shadow-sm"
                rows="4"
                placeholder="Write your feedback here..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                style={{
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  resize: "none",
                }}
              />
            </div>
          </div>

          <div className="text-end mt-3">
            <button
              className="btn btn-info text-white fw-semibold px-4 py-2 shadow-sm"
              onClick={handleSendFeedback}
              disabled={sending}
              style={{ borderRadius: "8px" }}
            >
              {sending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Sending...
                </>
              ) : (
                "Send Feedback"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Feedback History */}
      <div className="mb-4">
        <h5 className="fw-bold text-info mb-3">My Submitted Feedback</h5>
        {feedbacks.length === 0 ? (
          <div className="text-center text-muted py-5">
            <h6>No feedback submitted yet</h6>
            <p>Your previous feedback will appear here once submitted.</p>
          </div>
        ) : (
          <div className="row g-4">
            {feedbacks.map((f) => (
              <div key={f.id} className="col-12">
                <div
                  className="p-4 rounded shadow-sm position-relative"
                  style={{
                    backgroundColor: "#ffffff",
                    borderLeft: f.type === "schedule" ? "5px solid #0dcaf0" : "5px solid #198754",
                    transition: "transform 0.2s ease-in-out",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span
                        className={`badge ${
                          f.type === "schedule" ? "bg-info" : "bg-success"
                        } me-2`}
                      >
                        {f.type === "schedule" ? "Schedule" : "Assignment"}
                      </span>
                      <small className="text-muted">
                        {new Date(f.created_at).toLocaleDateString()} •{" "}
                        {new Date(f.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center"
                      onClick={() => handleDelete(f.id)}
                      disabled={loading}
                      style={{ width: "30px", height: "30px" }}
                      title="Delete Feedback"
                    >
                      <FaTrashAlt size={13} />
                    </button>
                  </div>

                  <p className="text-dark mb-2" style={{ whiteSpace: "pre-line" }}>
                    {f.text}
                  </p>

                  {f.reply && (
                    <div
                      className="mt-3 p-3 rounded-3"
                      style={{
                        backgroundColor: "#f0faff",
                        borderLeft: "3px solid #0dcaf0",
                      }}
                    >
                      <small className="fw-semibold text-info d-block mb-1">
                        Admin Reply
                      </small>
                      <p className="mb-0 text-muted">{f.reply}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
