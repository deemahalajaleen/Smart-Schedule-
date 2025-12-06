import React, { useEffect, useState } from "react";
import { Button, Spinner, Modal } from "react-bootstrap";
import { RefreshCw } from "lucide-react";
import api from "../../Services/apiClient";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  // Modal create
  const [showCreate, setShowCreate] = useState(false);
  const [newNotif, setNewNotif] = useState({
    title: "",
    description: "",
    role: "",
    user_id: "",
  });
  const [creating, setCreating] = useState(false);

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap("notifications_management");

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      fetchNotifications();
    }
  }, [sharedData]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchNotifications();
      
      // 🔊 Broadcast change to other users
      updateField("lastChange", { 
        type: "reload", 
        action: "manual_refresh",
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("❌ Error refreshing notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?"))
      return;
    try {
      await api.delete(`/notifications/${id}`);
      await fetchNotifications();

      // 🔊 Broadcast change to other users
      updateField("lastChange", { 
        type: "reload", 
        action: "notification_deleted",
        timestamp: Date.now(),
        notificationId: id
      });
    } catch (err) {
      console.error("❌ Error deleting notification:", err);
    }
  };

  // ✅ Publish/Unpublish handler
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "draft" ? "published" : "draft";
    try {
      await api.patch(`/notifications/${id}/status`, { status: newStatus });
      await fetchNotifications();

      // 🔊 Broadcast change to other users
      updateField("lastChange", { 
        type: "reload", 
        action: "notification_status_changed",
        timestamp: Date.now(),
        notificationId: id,
        newStatus: newStatus
      });
    } catch (err) {
      console.error("❌ Error updating status:", err);
    }
  };

  // ✅ Create new notification
  const handleCreate = async () => {
    if (!newNotif.title || !newNotif.description) return;
    setCreating(true);
    try {
      const response = await api.post("/notifications", newNotif);
      setShowCreate(false);
      setNewNotif({ title: "", description: "", role: "", user_id: "" });
      await fetchNotifications();

      // 🔊 Broadcast change to other users
      updateField("lastChange", { 
        type: "reload", 
        action: "notification_created",
        timestamp: Date.now(),
        notificationId: response.data.id,
        title: newNotif.title
      });
    } catch (err) {
      console.error("❌ Error creating notification:", err);
    } finally {
      setCreating(false);
    }
  };

  // Filters
  const filtered = notifications.filter((n) => {
    const matchRole = roleFilter ? n.role === roleFilter : true;
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="text-info mb-1">Notifications</h3>
          {sharedData?.lastChange && (
            <small className="text-info">🔄 Real-time updates active</small>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-info"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} className="me-1" />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="info"
            className="text-white"
            onClick={() => setShowCreate(true)}
          >
            + Create Notification
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <select
          className="form-select w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="schedule_committee">Schedule Committee</option>
          <option value="registrar">Registrar</option>
          <option value="all">All</option>
        </select>
        <input
          type="text"
          className="form-control w-auto"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {sharedData?.lastChange?.timestamp && (
          <small className="text-muted">
            Last update: {new Date(sharedData.lastChange.timestamp).toLocaleTimeString()}
          </small>
        )}
      </div>

      {/* Real-time Activity Indicator */}
      {sharedData?.lastChange?.action && (
        <div className="alert alert-info py-2 mb-3">
          {sharedData.lastChange.action === "notification_created" && (
            <>✅ New notification created: "{sharedData.lastChange.title}"</>
          )}
          {sharedData.lastChange.action === "notification_status_changed" && (
            <>📢 Notification status updated</>
          )}
          {sharedData.lastChange.action === "notification_deleted" && (
            <>🗑️ Notification deleted</>
          )}
          {sharedData.lastChange.action === "manual_refresh" && (
            <>🔄 Notifications refreshed</>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="info" />
          <p className="text-muted mt-2">Loading notifications...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle text-center">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Role</th>
                <th>User</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id}>
                  <td className="fw-semibold">{n.id}</td>
                  <td className="fw-bold">{n.title}</td>
                  <td>
                    {n.description.length > 50
                      ? n.description.slice(0, 50) + "…"
                      : n.description}
                  </td>
                  <td>
                    <span className="badge bg-secondary">{n.role || "all"}</span>
                  </td>
                  <td>{n.user_id || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        n.status === "published" ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {n.status}
                    </span>
                  </td>
                  <td>{new Date(n.created_at).toLocaleString()}</td>
                  <td>
                    <Button
                      size="sm"
                      variant={n.status === "draft" ? "outline-success" : "outline-warning"}
                      className="me-2"
                      onClick={() => handleToggleStatus(n.id, n.status)}
                      title={n.status === "draft" ? "Publish notification" : "Unpublish notification"}
                    >
                      {n.status === "draft" ? "Publish" : "Unpublish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(n.id)}
                      title="Delete notification"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    No notifications found
                    {(roleFilter || search) && " matching your filters"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mt-3 text-muted small">
        Showing {filtered.length} of {notifications.length} notifications
        {sharedData?.lastChange && (
          <span className="text-info ms-2">
            • Real-time synchronization active
          </span>
        )}
      </div>

      {/* Create Modal */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-control"
              value={newNotif.title}
              onChange={(e) =>
                setNewNotif({ ...newNotif, title: e.target.value })
              }
              placeholder="Enter notification title"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description *</label>
            <textarea
              className="form-control"
              rows="3"
              value={newNotif.description}
              onChange={(e) =>
                setNewNotif({ ...newNotif, description: e.target.value })
              }
              placeholder="Enter notification description"
            ></textarea>
          </div>
          <div className="mb-3">
            <label className="form-label">Role (Optional)</label>
            <select
              className="form-select"
              value={newNotif.role}
              onChange={(e) =>
                setNewNotif({ ...newNotif, role: e.target.value })
              }
            >
              <option value="all">All</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="schedule_committee">Schedule Committee</option>
              <option value="load_committee">Load Committee</option>
              <option value="registrar">Registrar</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">User ID (Optional)</label>
            <input
              type="number"
              className="form-control"
              value={newNotif.user_id}
              onChange={(e) =>
                setNewNotif({ ...newNotif, user_id: e.target.value })
              }
              placeholder="Specific user ID (leave empty for all)"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
          <Button
            variant="info"
            className="text-white"
            onClick={handleCreate}
            disabled={creating || !newNotif.title || !newNotif.description}
          >
            {creating ? <Spinner size="sm" animation="border" /> : "Create Notification"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}