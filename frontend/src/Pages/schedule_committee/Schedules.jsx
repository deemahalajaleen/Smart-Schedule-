import React, { useState, useEffect } from "react";
import {
  Calendar,
  Eye,
  Trash2,
  ClipboardList,
  Layers,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function ScheduleManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap("schedule_management");

  const [formData, setFormData] = useState({
    title: "",
    level_id: "",
    group_id: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    perStatus: {},
    perLevel: {},
  });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      fetchSchedules();
    }
  }, [sharedData]);

  useEffect(() => {
    fetchSchedules();
    fetchLevels();
  }, []);

  // 🔹 Fetch all schedules
  const fetchSchedules = async () => {
    try {
      const res = await apiClient.get("/schedules");
      const data = res.data || [];
      setSchedules(data);
      calculateStats(data);
    } catch (error) {
      console.error("❌ Error fetching schedules:", error);
    }
  };

  // 🔹 Calculate statistics
  const calculateStats = (data) => {
    const total = data.length;
    const perStatus = data.reduce((acc, s) => {
      const key = s.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const perLevel = data.reduce((acc, s) => {
      const key = s.level_name || "Unknown Level";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    setStats({ total, perStatus, perLevel });
  };

  // 🔹 Fetch levels
  const fetchLevels = async () => {
    try {
      const res = await apiClient.get("/dropdowns/levels");
      setLevels(res.data || []);
    } catch (error) {
      console.error("❌ Error fetching levels:", error);
    }
  };

  // 🔹 Fetch groups for selected level
  const fetchGroups = async (level_id) => {
    try {
      if (!level_id) return;
      const res = await apiClient.get(`/students/level-groups/${level_id}`);
      setGroups(res.data || []);
    } catch (error) {
      console.error("❌ Error fetching groups:", error);
      setGroups([]);
    }
  };

  // 🔹 Handle level change
  const handleLevelChange = (e) => {
    const level_id = e.target.value;
    setFormData({ ...formData, level_id, group_id: "" });
    fetchGroups(level_id);
  };

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchSchedules();
      showToast("✅ Data refreshed successfully", "success");

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "manual_refresh",
        timestamp: Date.now(),
        refreshedBy: user?.email,
      });
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
      showToast("❌ Failed to refresh data", "danger");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create schedule
  const handleCreateSchedule = async () => {
    if (!formData.title || !formData.level_id || !formData.group_id) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/schedules", {
        ...formData,
        created_by: user?.id,
      });

      showToast(
        res.data.message || "✅ Schedule created successfully",
        "success"
      );
      setFormData({ title: "", level_id: "", group_id: "" });
      setViewMode("list");
      await fetchSchedules();

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "schedule_created",
        timestamp: Date.now(),
        scheduleId: res.data.id,
        createdBy: user?.email,
      });
    } catch (error) {
      showToast(
        error.response?.data?.error || "Error creating schedule",
        "danger"
      );
      console.error("❌ Error creating schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 View schedule details
  const handleViewSchedule = (id) => {
    navigate(`/schedule_committee/schedules/${id}`);
  };

  // 🔹 Delete schedule
  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?"))
      return;
    try {
      await apiClient.delete(`/schedules/${id}`);
      showToast("🗑️ Schedule deleted successfully", "success");
      await fetchSchedules();

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "schedule_deleted",
        timestamp: Date.now(),
        scheduleId: id,
        deletedBy: user?.email,
      });
    } catch (error) {
      showToast("❌ Error deleting schedule", "danger");
    }
  };

  // 🔹 Publish schedule
  const handlePublishSchedule = async (id) => {
    if (!window.confirm("Publish this schedule? Students will be notified."))
      return;
    try {
      await apiClient.patch(`/schedules/${id}/publish`);
      showToast("📢 Schedule published successfully", "success");
      await fetchSchedules();

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "schedule_published",
        timestamp: Date.now(),
        scheduleId: id,
        publishedBy: user?.email,
      });
    } catch (error) {
      showToast("❌ Error publishing schedule", "danger");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: "secondary",
      published: "info",
      approved: "success",
    };
    return (
      <span className={`badge bg-${map[status] || "secondary"}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="container" style={{ maxWidth: "1200px" }}>
      {/* Toast */}
      {toast.show && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`toast show align-items-center text-white bg-${toast.type} border-0`}
          >
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast({ show: false })}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pt-3">
        <div>
          <h3 className="text-info mb-1">Schedule Management</h3>
          <p className="text-muted mb-0">
            Manage, create, and review schedules efficiently
            {sharedData?.lastChange && (
              <span className="text-info ms-2">
                🔄 Real-time updates active
              </span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {sharedData?.lastChange?.refreshedBy && (
            <small className="text-muted">
              Last refresh: {sharedData.lastChange.refreshedBy}
            </small>
          )}
          <button
            className="btn btn-outline-info d-flex align-items-center gap-1"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <div className="btn-group">
            <button
              className={`btn ${
                viewMode === "list" ? "btn-info text-white" : "btn-outline-info"
              }`}
              onClick={() => setViewMode("list")}
            >
              All Schedules
            </button>
            <button
              className={`btn ${
                viewMode === "create"
                  ? "btn-info text-white"
                  : "btn-outline-info"
              }`}
              onClick={() => setViewMode("create")}
            >
              Create New
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 STATISTIC CARDS */}
      {viewMode === "list" && (
        <div className="row g-4 mb-4">
          {/* Total Schedules */}
          <div className="col-md-4 col-sm-6">
            <div className="card shadow-sm border-0 h-100 text-center p-3">
              <Layers size={36} className="text-info mb-2" />
              <h5 className="fw-bold mb-1">Total Schedules</h5>
              <h3 className="text-info fw-bold mb-0">{stats.total}</h3>
              {sharedData?.lastChange && (
                <small className="text-muted">Updated in real-time</small>
              )}
            </div>
          </div>

          {/* Schedules per Status */}
          <div className="col-md-4 col-sm-6">
            <div className="card shadow-sm border-0 h-100 text-center p-3">
              <ClipboardList size={36} className="text-info mb-2" />
              <h5 className="fw-bold mb-3">Schedules per Status</h5>
              {Object.keys(stats.perStatus).length === 0 ? (
                <p className="text-muted mb-0">No data</p>
              ) : (
                Object.entries(stats.perStatus).map(([status, count]) => (
                  <p key={status} className="mb-1">
                    <span className="text-capitalize fw-semibold">
                      {status}
                    </span>
                    : <span className="text-info fw-bold">{count}</span>
                  </p>
                ))
              )}
            </div>
          </div>

          {/* Schedules by Level */}
          <div className="col-md-4 col-sm-12">
            <div className="card shadow-sm border-0 h-100 text-center p-3">
              <CheckCircle2 size={36} className="text-info mb-2" />
              <h5 className="fw-bold mb-3">Schedules by Level</h5>
              {Object.keys(stats.perLevel).length === 0 ? (
                <p className="text-muted mb-0">No data</p>
              ) : (
                Object.entries(stats.perLevel).map(([level, count]) => (
                  <p key={level} className="mb-1">
                    <span className="fw-semibold">{level}</span>:{" "}
                    <span className="text-info fw-bold">{count}</span>
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="bg-white rounded shadow-sm p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="text-info mb-0">All Schedules</h5>
            {sharedData?.lastChange?.action === "schedule_created" && (
              <small className="text-success">
                ✅ New schedule created by {sharedData.lastChange.createdBy}
              </small>
            )}
          </div>
          {schedules.length === 0 ? (
            <div className="text-center py-5">
              <Calendar size={64} className="text-muted mb-3" />
              <p className="text-muted">
                No schedules found. Create your first schedule!
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="text-info">Title</th>
                    <th className="text-info">Level</th>
                    <th className="text-info">Group</th>
                    <th className="text-info">Status</th>
                    <th className="text-info">Created By</th>
                    <th className="text-info">Approved By</th>
                    <th className="text-info">Created At</th>
                    <th className="text-info text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-bold">{s.title}</td>
                      <td>{s.level_name}</td>
                      <td>{s.group_name}</td>
                      <td>{getStatusBadge(s.status)}</td>
                      <td>{s.created_by_email || "—"}</td>
                      <td>{s.approved_by_email || "—"}</td>
                      <td>{formatDate(s.created_at)}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                            onClick={() => handleViewSchedule(s.id)}
                          >
                            <Eye size={16} /> View
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={() => handleDeleteSchedule(s.id)}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE VIEW */}
      {viewMode === "create" && (
        <div className="bg-light p-4 rounded mb-4 shadow-sm">
          <h5 className="text-info mb-4">Create New Schedule</h5>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label text-info fw-semibold">Title</label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter schedule title"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label text-info fw-semibold">Level</label>
              <select
                className="form-select"
                value={formData.level_id}
                onChange={handleLevelChange}
              >
                <option value="">Select Level</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label text-info fw-semibold">Group</label>
              <select
                className="form-select"
                value={formData.group_id}
                onChange={(e) =>
                  setFormData({ ...formData, group_id: e.target.value })
                }
                disabled={!groups.length}
              >
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="btn btn-info text-white"
            onClick={handleCreateSchedule}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Schedule"}
          </button>
        </div>
      )}
    </div>
  );
}
