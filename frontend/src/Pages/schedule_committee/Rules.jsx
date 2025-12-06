import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Save, XCircle, RefreshCw } from "lucide-react";
import apiClient from "../../Services/apiClient";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function SchedulingRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [formData, setFormData] = useState({ rule_key: "", rule_value: "", data_type: "text" });
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap("scheduling_rules");

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      fetchRules();
    }
  }, [sharedData]);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/rules");
      setRules(res.data || []);
    } catch (err) {
      showToast("❌ Failed to load rules", "danger");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchRules();
      showToast("✅ Rules refreshed successfully", "success");
      
      // 🔊 Broadcast change to other users
      updateField("lastChange", { 
        type: "reload", 
        action: "manual_refresh",
        timestamp: Date.now()
      });
    } catch (err) {
      showToast("❌ Failed to refresh rules", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule) => {
    setEditingKey(rule.rule_key);
    setFormData({
      rule_key: rule.rule_key,
      rule_value: rule.rule_value,
      data_type: rule.data_type,
    });
  };

  const handleSave = async () => {
    if (!formData.rule_key || formData.rule_value === "") {
      showToast("⚠️ Please fill all fields", "warning");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/rules", formData);
      showToast(editingKey ? "✅ Rule updated!" : "✅ Rule created!", "success");
      setEditingKey(null);
      setFormData({ rule_key: "", rule_value: "", data_type: "text" });
      await fetchRules();

      // 🔊 Broadcast change to other users
      updateField("lastChange", { 
        type: "reload", 
        action: editingKey ? "rule_updated" : "rule_created",
        timestamp: Date.now(),
        ruleKey: formData.rule_key
      });
    } catch (err) {
      console.error(err);
      showToast("❌ Error saving rule", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;
    try {
      await apiClient.delete(`/rules/${key}`);
      showToast("🗑️ Rule deleted successfully", "success");
      await fetchRules();

      // 🔊 Broadcast change to other users
      updateField("lastChange", { 
        type: "reload", 
        action: "rule_deleted",
        timestamp: Date.now(),
        ruleKey: key
      });
    } catch (err) {
      console.error(err);
      showToast("❌ Error deleting rule", "danger");
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setFormData({ rule_key: "", rule_value: "", data_type: "text" });
  };

  const handleNewRule = () => {
    setEditingKey(null);
    setFormData({ rule_key: "", rule_value: "", data_type: "text" });
  };

  return (
    <div className="container py-4" style={{ maxWidth: "950px" }}>
      {/* Toast */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div
            className={`alert alert-${toast.type} shadow-lg fade show`}
            role="alert"
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="text-info fw-bold mb-1">Scheduling Rules</h3>
          <p className="text-muted small mb-0">
            Manage system rules dynamically and flexibly
            {sharedData?.lastChange && (
              <span className="text-info ms-2">🔄 Real-time updates active</span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-info d-flex align-items-center"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={18} className="me-2" />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="btn btn-info text-white d-flex align-items-center"
            onClick={handleNewRule}
          >
            <Plus size={18} className="me-2" /> New Rule
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded shadow-sm p-4 mb-4 border border-light">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-info mb-0">
            {editingKey ? "✏️ Edit Rule" : "➕ Add New Rule"}
          </h5>
          {sharedData?.lastChange?.timestamp && (
            <small className="text-muted">
              Last update: {new Date(sharedData.lastChange.timestamp).toLocaleTimeString()}
            </small>
          )}
        </div>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-info fw-semibold">Rule Key</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., work_start"
              value={formData.rule_key}
              disabled={!!editingKey}
              onChange={(e) =>
                setFormData({ ...formData, rule_key: e.target.value })
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-info fw-semibold">Value</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., 08:00"
              value={formData.rule_value}
              onChange={(e) =>
                setFormData({ ...formData, rule_value: e.target.value })
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label text-info fw-semibold">Data Type</label>
            <select
              className="form-select"
              value={formData.data_type}
              onChange={(e) =>
                setFormData({ ...formData, data_type: e.target.value })
              }
            >
              <option value="text">Text</option>
              <option value="int">Integer</option>
              <option value="time">Time</option>
              <option value="text[]">Text Array</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>
        </div>
        <div className="mt-4 d-flex justify-content-end gap-3">
          {editingKey && (
            <button className="btn btn-outline-secondary" onClick={handleCancel}>
              <XCircle size={18} className="me-2" />
              Cancel
            </button>
          )}
          <button
            className="btn btn-info text-white"
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={18} className="me-2" />
            {loading ? "Saving..." : "Save Rule"}
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="text-info mb-0 fw-semibold">
            🧩 Current Rules ({rules.length})
          </h5>
          {sharedData?.lastChange?.action && (
            <small className="text-muted">
              {sharedData.lastChange.action === "rule_created" && "✅ New rule added"}
              {sharedData.lastChange.action === "rule_updated" && "✏️ Rule updated"}
              {sharedData.lastChange.action === "rule_deleted" && "🗑️ Rule deleted"}
            </small>
          )}
        </div>
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading rules...</span>
              </div>
            </div>
          ) : rules.length > 0 ? (
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-info">Rule Key</th>
                  <th className="text-info">Value</th>
                  <th className="text-info">Type</th>
                  <th className="text-info text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, i) => (
                  <tr key={i}>
                    <td className="fw-semibold">{rule.rule_key}</td>
                    <td>
                      <span
                        className="badge bg-info-subtle text-info border border-info"
                        style={{
                          fontSize: "0.9rem",
                          padding: "6px 10px",
                          backgroundColor: "#e0f7fa",
                        }}
                      >
                        {rule.rule_value}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {rule.data_type}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-outline-warning btn-sm me-2"
                        onClick={() => handleEdit(rule)}
                        title="Edit rule"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(rule.rule_key)}
                        title="Delete rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-muted py-5">
              No rules found — add your first one above.
            </div>
          )}
        </div>
      </div>

      {/* Real-time Status */}
      {sharedData?.lastChange && (
        <div className="mt-3 text-center">
          <small className="text-info">
            🔄 Rules are being synchronized in real-time across all users
          </small>
        </div>
      )}
    </div>
  );
}