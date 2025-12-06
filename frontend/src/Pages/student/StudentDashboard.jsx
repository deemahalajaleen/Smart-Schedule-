import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import { Spinner, Toast, ToastContainer } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [studentLevel, setStudentLevel] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const timeBlocks = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];

  // Helper to clean time (08:00:00+03 → 08:00)
  const fmt = (t) => {
    if (!t) return "";
    try {
      const clean = t.split("+")[0].trim();
      const parts = clean.split(":");
      return `${parts[0]}:${parts[1]}`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (user?.id) fetchDefaultSchedule(user.id);
  }, [user]);

  const fetchDefaultSchedule = async (userId) => {
    try {
      setPageLoading(true);
      const { data } = await apiClient.get(
        `/students/schedule/default/${userId}`
      );
      setGroups(data.groups || []);
      setSelectedGroup(data.selected_group?.id || null);
      setStudentLevel(data.level_id || null);
      setSchedule(data.schedule || []);
    } catch (err) {
      console.error("❌ Failed to load schedule:", err);
      showToast("Failed to load schedule. Please try again.", "danger");
    } finally {
      setPageLoading(false);
    }
  };

  const handleGroupChange = async (groupId) => {
    setSelectedGroup(groupId);
    if (!groupId) return;
    try {
      setPageLoading(true);
      const { data } = await apiClient.get(`/students/sections`, {
        params: { level_id: studentLevel, group_id: groupId },
      });

      setSchedule(data || []);
    } catch (err) {
      console.error("❌ Error fetching group schedule:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred.";
      showToast(message, "danger");
    } finally {
      setPageLoading(false);
    }
  };

  // Loader
  if (pageLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <Spinner
          animation="border"
          variant="info"
          style={{ width: "3rem", height: "3rem" }}
        />
      </div>
    );
  }

  return (
    <div>
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

      <h4 className="fw-bold text-info mb-4">My Schedule</h4>

      {/* Group Selector */}
      <div className="d-flex align-items-center mb-4">
        <label className="me-2 fw-semibold text-secondary">Select Group:</label>
        <select
          className="form-select"
          style={{ width: "250px" }}
          value={selectedGroup || ""}
          onChange={(e) => handleGroupChange(e.target.value)}
          disabled={groups.length === 0}
        >
          {groups.length === 0 ? (
            <option>No groups available</option>
          ) : (
            groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* 🩵 If there’s no schedule yet */}
      {(!schedule || schedule.length === 0) && (
        <div
          className="text-center p-5 mt-4 border rounded-4 shadow-sm"
          style={{
            backgroundColor: "#fff",
            color: "#00CFFF",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <InfoCircle size={38} className="mb-3" />
          <h5 className="fw-semibold mb-2">No Schedule Available Yet</h5>
          <p className="mb-0 fs-6">
            There is currently no schedule assigned for your level and group.
            Please check back later.
          </p>
        </div>
      )}

      {/* Schedule Table */}
      {schedule && schedule.length > 0 && (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered text-center align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Day</th>
                    <th>8:00 - 9:00</th>
                    <th>9:00 - 10:00</th>
                    <th>10:00 - 11:00</th>
                    <th>11:00 - 12:00</th>
                    <th>12:00 - 1:00</th>
                    <th>1:00 - 2:00</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const sections = schedule
                      .filter((s) => s.day_of_week === day)
                      .sort((a, b) => a.start_time.localeCompare(b.start_time));

                    const drawn = new Set();

                    return (
                      <tr key={day}>
                        <td className="fw-bold">{day}</td>

                        {timeBlocks.map((block, i) => {
                          if (drawn.has(block)) return null;
                          const next = timeBlocks[i + 1] || "14:00";

                          const cls = sections.find((s) => {
                            const start = fmt(s.start_time);
                            const end = fmt(s.end_time);
                            return (
                              start === block || (start < next && end > block)
                            );
                          });

                          // Break cell
                          if (block === "12:00") {
                            drawn.add(block);
                            return (
                              <td
                                key={block}
                                className="bg-light text-info fw-semibold"
                              >
                                Break
                              </td>
                            );
                          }

                          // Course cell
                          if (cls) {
                            const start = fmt(cls.start_time);
                            const end = fmt(cls.end_time);
                            const startIdx = timeBlocks.findIndex(
                              (t) => t === start
                            );
                            const endIdx = timeBlocks.findIndex(
                              (t) => t === end
                            );
                            let span =
                              endIdx > startIdx ? endIdx - startIdx : 1;
                            if (start < "12:00" && end > "12:00") span--;

                            for (let j = 0; j < span; j++)
                              drawn.add(timeBlocks[i + j]);

                            return (
                              <td
                                key={block}
                                colSpan={span}
                                style={{
                                  backgroundColor: "#e3f2fd",
                                  border: "1px solid #b6e0ff",
                                }}
                              >
                                <strong>{cls.course_code}</strong>
                                <div className="text-muted small">
                                  Room {cls.room_name || "TBD"} –{" "}
                                  {cls.group_name}
                                </div>
                              </td>
                            );
                          }

                          // Empty cell
                          drawn.add(block);
                          return <td key={block}>—</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
