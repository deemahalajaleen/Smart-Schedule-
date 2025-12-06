import React, { useEffect, useState } from "react";
import {
  Spinner,
  Offcanvas,
  Toast,
  ToastContainer,
  Button,
  Form,
} from "react-bootstrap";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import api from "../../Services/apiClient";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  // Offcanvas
  const [showDetail, setShowDetail] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap("feedback_management");

  // Toast (messages)
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
    const { type } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      fetchFeedbacks();
      // If we have a selected feedback open, refresh its data too
      if (selectedFeedback) {
        const updatedFeedback = feedbacks.find(
          (f) => f.id === selectedFeedback.id
        );
        if (updatedFeedback) {
          setSelectedFeedback(updatedFeedback);
          setReplyText(updatedFeedback.reply || "");
        }
      }
    }
  }, [sharedData]);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/feedback/type/non-assignment");
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to load feedback", "danger");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setActionLoading(true);
    try {
      await fetchFeedbacks();
      showToast("✅ Feedback refreshed successfully", "success");

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "manual_refresh",
        timestamp: Date.now(),
      });
    } catch (err) {
      showToast("❌ Failed to refresh feedback", "danger");
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ Apply filters
  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchType = typeFilter ? f.type === typeFilter : true;
    const matchRole = roleFilter ? f.role === roleFilter : true;
    const matchSearch = f.text.toLowerCase().includes(search.toLowerCase());
    return matchType && matchRole && matchSearch;
  });

  // ✅ Handle reply submission
  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      showToast("⚠️ Please enter a reply", "warning");
      return;
    }

    setReplySaving(true);
    try {
      await api.patch(`/feedback/${selectedFeedback.id}/reply`, {
        reply: replyText.trim(),
      });
      showToast("✅ Reply saved successfully", "success");

      // Refresh feedback list
      await fetchFeedbacks();

      // Update selected feedback immediately
      setSelectedFeedback((prev) => ({ ...prev, reply: replyText.trim() }));

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "reply_added",
        timestamp: Date.now(),
        feedbackId: selectedFeedback.id,
        hasReply: true,
      });
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to save reply", "danger");
    } finally {
      setReplySaving(false);
    }
  };

  // Handle opening feedback details
  const handleViewFeedback = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyText(feedback.reply || "");
    setShowDetail(true);
  };

  return (
    <div>
      {/* 🔔 Toast messages */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg={toast.type}
          show={toast.show}
          onClose={() => setToast({ show: false })}
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="text-info m-0">Feedback Management</h3>
          {sharedData?.lastChange && (
            <small className="text-info">🔄 Real-time updates active</small>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          {sharedData?.lastChange?.timestamp && (
            <small className="text-muted">
              Last update:{" "}
              {new Date(sharedData.lastChange.timestamp).toLocaleTimeString()}
            </small>
          )}
          <Button
            variant="outline-info"
            size="sm"
            disabled={actionLoading}
            onClick={handleRefresh}
          >
            <RefreshCw size={16} className="me-1" />
            {actionLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Real-time Activity Indicator */}
      {sharedData?.lastChange?.action && (
        <div className="alert alert-info py-2 mb-3">
          {sharedData.lastChange.action === "reply_added" && (
            <>
              💬 New reply added to feedback #{sharedData.lastChange.feedbackId}
            </>
          )}
          {sharedData.lastChange.action === "manual_refresh" && (
            <>🔄 Feedback list refreshed</>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <select
          className="form-select w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="suggestion">Suggestion</option>
          <option value="bug">Bug</option>
          <option value="question">Question</option>
          <option value="assignment">Assignment</option>
        </select>

        <select
          className="form-select w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="committee">Committee</option>
          <option value="registrar">Registrar</option>
        </select>

        <input
          type="text"
          className="form-control w-auto"
          placeholder="Search in feedback..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div className="mb-3 text-muted small">
        Showing {filteredFeedbacks.length} of {feedbacks.length} feedback
        entries
        {sharedData?.lastChange && (
          <span className="text-info ms-2">• Real-time sync active</span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner
            animation="border"
            variant="info"
            style={{ width: "3rem", height: "3rem" }}
          />
          <p className="mt-2 text-muted">Loading feedback...</p>
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
                <th>Text (Preview)</th>
                <th>Date</th>
                <th>Has Reply</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.map((f) => (
                <tr key={f.id}>
                  <td className="fw-semibold">{f.id}</td>
                  <td>{f.email}</td>
                  <td>
                    <span className="badge bg-secondary">{f.role}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        f.type === "bug"
                          ? "bg-danger"
                          : f.type === "suggestion"
                          ? "bg-info"
                          : f.type === "assignment"
                          ? "bg-success"
                          : "bg-warning"
                      }`}
                    >
                      {f.type}
                    </span>
                  </td>
                  <td>
                    {f.text.length > 50
                      ? f.text.substring(0, 50) + "…"
                      : f.text}
                  </td>
                  <td>{new Date(f.created_at).toLocaleDateString()}</td>

                  {/* Has Reply Icon */}
                  <td>
                    {f.reply ? (
                      <CheckCircle
                        color="#0d6efd"
                        size={20}
                        title="Has reply"
                      />
                    ) : (
                      <XCircle color="#adb5bd" size={20} title="No reply yet" />
                    )}
                  </td>

                  <td>
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => handleViewFeedback(f)}
                      title="View feedback details"
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredFeedbacks.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-muted text-center py-4">
                    No feedback found
                    {(typeFilter || roleFilter || search) &&
                      " matching your filters"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Offcanvas Detail */}
      <Offcanvas
        show={showDetail}
        onHide={() => setShowDetail(false)}
        placement="end"
        size="lg"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Feedback Details
            {sharedData?.lastChange && (
              <small className="text-info ms-2">🔄 Live</small>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedFeedback ? (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <p>
                    <strong>Email:</strong> {selectedFeedback.email}
                  </p>
                </div>
                <div className="col-md-3">
                  <p>
                    <strong>Role:</strong> {selectedFeedback.role}
                  </p>
                </div>
                <div className="col-md-3">
                  <p>
                    <strong>Type:</strong>{" "}
                    <span className="badge bg-info">
                      {selectedFeedback.type}
                    </span>
                  </p>
                </div>
              </div>

              <p>
                <strong>Feedback Text:</strong>
              </p>
              <div className="border rounded p-3 bg-light mb-4">
                {selectedFeedback.text}
              </div>

              <p>
                <strong>Admin Reply:</strong>
              </p>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Write your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="mb-3"
              />

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Created:{" "}
                  {new Date(selectedFeedback.created_at).toLocaleString()}
                </small>
                <Button
                  variant="info"
                  className="text-white"
                  disabled={replySaving}
                  onClick={handleReplySubmit}
                >
                  {replySaving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    "Send Reply"
                  )}
                </Button>
              </div>

              {selectedFeedback.reply && (
                <div className="mt-4 p-3 bg-success bg-opacity-10 rounded border border-success">
                  <h6 className="text-success mb-2">Current Reply:</h6>
                  <p className="mb-0">{selectedFeedback.reply}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted">No feedback selected</p>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}
