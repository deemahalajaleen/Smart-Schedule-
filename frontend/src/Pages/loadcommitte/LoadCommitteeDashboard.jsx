import React, { useState, useEffect } from "react";
import {
  Calendar,
  Eye,
  Layers,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoadCommitteeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [selectedLevel, setSelectedLevel] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    perStatus: {},
    perLevel: {},
  });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // 🔹 Fetch all schedules
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/schedules");
      const data = res.data || [];
      setSchedules(data);
      setFiltered(data);
      calculateStats(data);
    } catch (error) {
      console.error("❌ Error fetching schedules:", error);
      showToast("Failed to load schedules", "danger");
    } finally {
      setLoading(false);
    }
  };

  // 🧮 Calculate statistics
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

  // 🔹 Navigate to schedule details
  const handleViewSchedule = (id) => {
    navigate(`/load_committee/schedules/${id}`);
  };

  // 🔹 Filter schedules by level
  const handleLevelFilter = (e) => {
    const level = e.target.value;
    setSelectedLevel(level);
    if (level === "all") {
      setFiltered(schedules);
    } else {
      const filteredList = schedules.filter(
        (s) => s.level_name === `Level ${level}`
      );
      setFiltered(filteredList);
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
      <span className={`badge bg-${map[status] || "secondary"}`}>{status}</span>
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
      <div className="d-flex justify-content-between align-items-center mb-4 pt-3 flex-wrap gap-2">
        <div>
          <h3 className="text-info mb-1">Load Committee Dashboard</h3>
          <p className="text-muted mb-0">
            Overview and statistics of schedules
          </p>
        </div>

        {/* 🔹 Level Filter */}
        <div>
          <select
            className="form-select border-info"
            style={{ minWidth: "180px" }}
            value={selectedLevel}
            onChange={handleLevelFilter}
          >
            <option value="all">All Levels</option>
            {[3, 4, 5, 6, 7, 8].map((lvl) => (
              <option key={lvl} value={lvl}>
                Level {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🌟 STATISTIC CARDS */}
      <div className="row g-4 mb-4">
        {/* Total Schedules */}
        <div className="col-md-4 col-sm-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
              <Layers size={36} className="text-info mb-2" />
              <h5 className="fw-bold mb-1">Total Schedules</h5>
              <h3 className="text-info fw-bold">{stats.total}</h3>
            </div>
          </div>
        </div>

        {/* Schedules by Status */}
        <div className="col-md-4 col-sm-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
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
        </div>

        {/* Schedules by Level */}
        <div className="col-md-4 col-sm-12">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body text-center">
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
      </div>

      {/* LIST VIEW */}
      <div className="bg-white rounded shadow-sm p-4">
        <h5 className="text-info mb-4">
          {selectedLevel === "all"
            ? "All Schedules"
            : `Schedules for Level ${selectedLevel}`}
        </h5>

        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border text-info"
              style={{ width: "3rem", height: "3rem" }}
            />
            <p className="mt-3 text-info fw-semibold">Loading schedules...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <Calendar size={64} className="text-muted mb-3" />
            <p className="text-muted">No schedules found for this level.</p>
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
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-bold">{s.title}</td>
                    <td>{s.level_name}</td>
                    <td>{s.group_name}</td>
                    <td>{getStatusBadge(s.status)}</td>
                    <td>{s.created_by_email || "—"}</td>
                    <td>{s.approved_by_email || "—"}</td>
                    <td>{formatDate(s.created_at)}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info d-flex align-items-center gap-1 mx-auto"
                        onClick={() => handleViewSchedule(s.id)}
                      >
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
