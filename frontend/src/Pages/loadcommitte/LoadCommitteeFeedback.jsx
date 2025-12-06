import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import {
  Spinner,
  Toast,
  ToastContainer,
  Button,
  Offcanvas,
  Form,
} from "react-bootstrap";
import { FaTrashAlt } from "react-icons/fa";
import { CheckCircle, XCircle } from "lucide-react";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function LoadCommitteeFeedback() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("write");

  // 📝 Write feedback states
  const [feedbackText, setFeedbackText] = useState("");
  const [sending, setSending] = useState(false);
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // 👁️ View feedback states
  const [feedbacks, setFeedbacks] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap(
    "load_committee_feedback"
  );

  // 🔔 Toast
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "info" }),
      2500
    );
  };

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type, tab } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      if (tab === "write" || !tab) {
        fetchUserFeedbacks();
      }
      if (tab === "view" || !tab) {
        fetchFeedbacks();
      }
    }
  }, [sharedData]);

  // ✅ Fetch committee's own feedbacks (faculty_schedule)
  const fetchUserFeedbacks = async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get(`/feedback/user/${user.id}`);
      setUserFeedbacks(res.data || []);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      showToast("Failed to load feedbacks", "danger");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFeedbacks();
  }, [user]);

  // ✉️ Send feedback
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      showToast("Please write your feedback before sending", "warning");
      return;
    }

    setSending(true);
    try {
      const res = await apiClient.post("/feedback", {
        auth_id: user.id,
        type: "faculty_schedule",
        text: feedbackText,
      });
      setUserFeedbacks((prev) => [res.data, ...prev]);
      setFeedbackText("");
      showToast("✅ Feedback sent successfully", "success");

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        tab: "write",
        action: "new_feedback",
        timestamp: Date.now(),
        userId: user.id,
      });
    } catch (err) {
      console.error("Error sending feedback:", err);
      showToast("Failed to send feedback", "danger");
    } finally {
      setSending(false);
    }
  };

  // 🗑️ Delete feedback
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?"))
      return;
    setLoading(true);
    try {
      await apiClient.delete(`/feedback/${id}`);
      setUserFeedbacks((prev) => prev.filter((f) => f.id !== id));
      showToast("🗑️ Feedback deleted successfully", "success");

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        tab: "write",
        action: "delete_feedback",
        timestamp: Date.now(),
        userId: user.id,
      });
    } catch (err) {
      console.error("Error deleting feedback:", err);
      showToast("Failed to delete feedback", "danger");
    } finally {
      setLoading(false);
    }
  };

  // 🧾 Fetch assignment feedbacks (for View tab)
  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/feedback/type/assignment");
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      showToast("❌ Failed to load feedback", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "view") fetchFeedbacks();
  }, [activeTab]);

  // 💬 Save reply (for assignment tab)
  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      showToast("⚠️ Please enter a reply", "warning");
      return;
    }

    setReplySaving(true);
    try {
      await apiClient.patch(`/feedback/${selectedFeedback.id}/reply`, {
        reply: replyText.trim(),
      });
      showToast("✅ Reply saved successfully", "success");
      await fetchFeedbacks();
      setSelectedFeedback((prev) => ({ ...prev, reply: replyText.trim() }));

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        tab: "view",
        action: "reply_added",
        timestamp: Date.now(),
        feedbackId: selectedFeedback.id,
      });
    } catch (err) {
      console.error("Error saving reply:", err);
      showToast("❌ Failed to save reply", "danger");
    } finally {
      setReplySaving(false);
    }
  };

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    if (activeTab === "write") {
      await fetchUserFeedbacks();
      showToast("Feedback list refreshed", "success");
    } else {
      await fetchFeedbacks();
      showToast("Assignment feedback refreshed", "success");
    }

    // 🔊 Broadcast refresh to other users
    updateField("lastChange", {
      type: "reload",
      tab: activeTab,
      action: "manual_refresh",
      timestamp: Date.now(),
      refreshedBy: user?.email,
    });
  };

  return (
    <div
      className="container py-4"
      style={{ maxWidth: "1000px", backgroundColor: "#fff" }}
    >
      {/* Toast */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg={toast.type}
          show={toast.show}
          onClose={() => setToast({ show: false })}
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-info mb-0">Feedback</h4>
        {sharedData?.lastChange && (
          <small className="text-info">🔄 Real-time updates active</small>
        )}
      </div>

      {/* Tabs */}
      <div className="d-flex gap-3 border-bottom mb-4">
        <button
          className={`btn btn-link text-decoration-none pb-2 ${
            activeTab === "write"
              ? "text-info fw-semibold border-bottom border-info"
              : "text-muted"
          }`}
          onClick={() => setActiveTab("write")}
        >
          Write Feedback
        </button>
        <button
          className={`btn btn-link text-decoration-none pb-2 ${
            activeTab === "view"
              ? "text-info fw-semibold border-bottom border-info"
              : "text-muted"
          }`}
          onClick={() => setActiveTab("view")}
        >
          View Feedback
        </button>
      </div>

      {/* ✍️ Write Feedback */}
      {activeTab === "write" && (
        <div
          className="container py-4 px-4"
          style={{
            maxWidth: "950px",
            background: "linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%)",
            borderRadius: "16px",
          }}
        >
          <div className="text-center mb-4">
            <h2 className="fw-bold text-info mb-2">Load Committee Feedback</h2>
            <p className="text-muted">
              Provide feedback on faculty schedules only 💬
            </p>
          </div>

          {/* Feedback Form */}
          <div className="card border-0 shadow-sm mb-5">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-semibold text-secondary mb-0">
                  Submit New Feedback
                </h5>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />{" "}
                      Refreshing...
                    </>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>

              <div className="mb-3">
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    checked
                    readOnly
                    id="facultySchedule"
                  />
                  <label
                    className="form-check-label text-info fw-semibold"
                    htmlFor="facultySchedule"
                  >
                    On Faculty Schedule
                  </label>
                </div>
                <small className="text-muted">
                  Load Committee can only provide feedback on faculty schedules.
                </small>
              </div>

              <textarea
                className="form-control shadow-sm"
                rows="5"
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

              <div className="text-end mt-3">
                <Button
                  variant="info"
                  className="text-white px-4 py-2"
                  disabled={sending}
                  onClick={handleSendFeedback}
                >
                  {sending ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />{" "}
                      Sending...
                    </>
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Feedback History */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-info mb-0">My Submitted Feedback</h5>
              {sharedData?.lastChange?.refreshedBy && (
                <small className="text-muted">
                  Last refreshed by: {sharedData.lastChange.refreshedBy}
                </small>
              )}
            </div>
            {pageLoading ? (
              <div className="text-center py-5">
                <Spinner
                  animation="border"
                  variant="info"
                  style={{ width: "3rem", height: "3rem" }}
                />
              </div>
            ) : userFeedbacks.length === 0 ? (
              <div className="text-center text-muted py-5">
                <h6>No feedback submitted yet</h6>
                <p>Your previous feedback will appear here once submitted.</p>
              </div>
            ) : (
              <div className="row g-4">
                {userFeedbacks.map((f) => (
                  <div key={f.id} className="col-12">
                    <div
                      className="p-4 rounded shadow-sm position-relative"
                      style={{
                        backgroundColor: "#ffffff",
                        borderLeft: "5px solid #0dcaf0",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="badge bg-info me-2">
                            Faculty Schedule
                          </span>
                          <small className="text-muted">
                            {new Date(f.created_at).toLocaleDateString()} •{" "}
                            {new Date(f.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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

                      <p
                        className="text-dark mb-2"
                        style={{ whiteSpace: "pre-line" }}
                      >
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
      )}

      {/* 👁️ View Feedback */}
      {activeTab === "view" && (
        <div className="bg-white rounded-3 shadow-sm p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-info mb-0">Assignment Feedback</h5>
            <div className="d-flex gap-2 align-items-center">
              {sharedData?.lastChange?.refreshedBy && (
                <small className="text-muted me-2">
                  Last refresh: {sharedData.lastChange.refreshedBy}
                </small>
              )}
              <Button
                variant="outline-info"
                size="sm"
                disabled={actionLoading}
                onClick={handleRefresh}
              >
                {actionLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />{" "}
                    Refreshing...
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner
                animation="border"
                variant="info"
                style={{ width: "3rem", height: "3rem" }}
              />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center text-muted py-5">
              No assignment feedback found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle text-center">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Type</th>
                    <th>Feedback</th>
                    <th>Date</th>
                    <th>Reply</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((f) => (
                    <tr key={f.id}>
                      <td>{f.id}</td>
                      <td>{f.email}</td>
                      <td>{f.role}</td>
                      <td>
                        <span className="badge bg-success">{f.type}</span>
                      </td>
                      <td>
                        {f.text.length > 50
                          ? f.text.slice(0, 50) + "…"
                          : f.text}
                      </td>
                      <td>{new Date(f.created_at).toLocaleDateString()}</td>
                      <td>
                        {f.reply ? (
                          <CheckCircle color="#0d6efd" size={20} />
                        ) : (
                          <XCircle color="#adb5bd" size={20} />
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => {
                            setSelectedFeedback(f);
                            setReplyText(f.reply || "");
                            setShowDetail(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(f.id)}
                        >
                          <FaTrashAlt size={13} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 📋 Feedback Detail Offcanvas */}
      <Offcanvas
        show={showDetail}
        onHide={() => setShowDetail(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Feedback Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedFeedback ? (
            <>
              <p>
                <strong>Email:</strong> {selectedFeedback.email}
              </p>
              <p>
                <strong>Role:</strong> {selectedFeedback.role}
              </p>
              <p>
                <strong>Type:</strong>{" "}
                <span className="badge bg-success">
                  {selectedFeedback.type}
                </span>
              </p>
              <p>
                <strong>Feedback:</strong>
              </p>
              <div className="border rounded p-2 bg-light mb-3">
                {selectedFeedback.text}
              </div>
              <p>
                <strong>Reply:</strong>
              </p>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="mt-3 text-end">
                <Button
                  variant="info"
                  className="text-white"
                  disabled={replySaving}
                  onClick={handleReplySubmit}
                >
                  {replySaving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Send Reply"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted">No feedback selected</p>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
