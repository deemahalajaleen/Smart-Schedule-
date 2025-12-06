import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { Spinner, Toast, ToastContainer } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";

export default function AllLevelsSchedule() {
  const [levels, setLevels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // 🔹 Toast helper
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const timeBlocks = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];

  // 🔹 Format DB time ("08:00:00+03" → "08:00")
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

  // 🔹 Fetch all levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const { data } = await apiClient.get("/dropdowns/levels");
        setLevels(data || []);
      } catch (err) {
        console.error("❌ Failed to load levels:", err);
        showToast("Failed to load levels list.", "danger");
      }
    };
    fetchLevels();
  }, []);

  // 🔹 Fetch groups when level changes
  const handleLevelChange = async (levelId) => {
    setSelectedLevel(levelId);
    setSelectedGroup("");
    setSchedule([]);

    if (!levelId) return;

    try {
      setLoading(true);
      const { data } = await apiClient.get(`/students/level-groups/${levelId}`);
      setGroups(data || []);

      if (data?.length > 0) {
        setSelectedGroup(data[0].id);
        handleGroupChange(data[0].id, levelId);
      }
    } catch (err) {
      console.error("❌ Failed to load groups:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load groups for this level.";
      showToast(message, "danger");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch schedule by level + group
  const handleGroupChange = async (groupId, customLevel = null) => {
    const levelId = customLevel || selectedLevel;
    setSelectedGroup(groupId);
    if (!levelId || !groupId) return;

    try {
      setLoading(true);
      const { data } = await apiClient.get(`/students/sections`, {
        params: { level_id: levelId, group_id: groupId },
      });
      setSchedule(data || []);
    } catch (err) {
      console.error("❌ Error fetching schedule:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred.";
      showToast(message, "danger");
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Loading spinner
  if (loading) {
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

      <h4 className="fw-bold text-info mb-4">All Levels' Schedules</h4>

      {/* Filters */}
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <div>
          <label className="fw-semibold text-secondary me-2">
            Select Level:
          </label>
          <select
            className="form-select"
            style={{ width: "200px" }}
            value={selectedLevel}
            onChange={(e) => handleLevelChange(e.target.value)}
          >
            <option value="">Select Level</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="fw-semibold text-secondary me-2">
            Select Group:
          </label>
          <select
            className="form-select"
            style={{ width: "200px" }}
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
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

      {/* If no level selected, show elegant message */}
      {!selectedLevel ? (
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
          <h5 className="fw-semibold mb-2">No Level Selected</h5>
          <p className="mb-0 fs-6">
            Please choose a level from the dropdown above to view its schedule.
          </p>
        </div>
      ) : (
        // Schedule Table
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

                  {/* No schedule row */}
                  {schedule.length === 0 && selectedLevel && (
                    <tr>
                      <td
                        colSpan={timeBlocks.length + 1}
                        className="text-center text-muted py-4"
                      >
                        No schedule available for this level and group.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
