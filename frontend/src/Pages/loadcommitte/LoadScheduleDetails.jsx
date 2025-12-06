import React, { useState, useEffect } from "react";
import { Search, Eye, CheckCircle } from "lucide-react";
import apiClient from "../../Services/apiClient";
import { useParams } from "react-router-dom";
import { Offcanvas, Spinner } from "react-bootstrap";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function LoadScheduleDetails() {
  const { schedule_id } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [sections, setSections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap("schedule_details");

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const TIMES = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
  ];

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type, scheduleId } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    // Only reload if the change is for this specific schedule
    if (type === "reload" && (!scheduleId || scheduleId === parseInt(schedule_id))) {
      fetchAllData();
    }
  }, [sharedData]);

  useEffect(() => {
    fetchAllData();
  }, [schedule_id]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSchedule(), fetchSections()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await apiClient.get(`/schedules/${schedule_id}`);
      setSchedule(res.data.schedule || res.data);
    } catch (err) {
      console.error("❌ Error loading schedule:", err);
      alert("Failed to load schedule");
    }
  };

  const fetchSections = async () => {
    try {
      const res = await apiClient.get(`/sections?schedule_id=${schedule_id}`);
      setSections(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error("❌ Error loading sections:", err);
      alert("Failed to load sections");
    }
  };

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setSearch(q);
    if (!q) return setFiltered(sections);
    setFiltered(
      sections.filter(
        (s) =>
          s.course_code?.toLowerCase().includes(q) ||
          s.course_name?.toLowerCase().includes(q) ||
          s.section_code?.toLowerCase().includes(q)
      )
    );
  };

  // 🔹 Approve schedule (for DRAFT only)
  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this schedule?")) return;
    try {
      setApproving(true);
      await apiClient.patch(`/schedules/${schedule_id}/approve`, {
        approved_by: schedule?.approved_by || null,
      });
      
      alert("✅ Schedule approved successfully!");
      await fetchSchedule();

      // 🔊 Broadcast change to other users
      updateField("lastChange", { 
        type: "reload", 
        scheduleId: parseInt(schedule_id),
        action: "approved",
        timestamp: Date.now() 
      });
    } catch (err) {
      console.error("❌ Error approving schedule:", err);
      const backendMsg = err.response?.data?.error || "Error approving schedule";
      alert(backendMsg);
    } finally {
      setApproving(false);
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "lecture":
        return "bg-info text-white";
      case "lab":
        return "bg-warning text-dark";
      case "tutorial":
        return "bg-success text-white";
      default:
        return "bg-secondary text-white";
    }
  };

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

  // 🌀 Loader
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "70vh" }}
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
    <div className="container py-4">
      {/* Header */}
      {schedule && (
        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap">
            <div className="mb-2">
              <h5 className="text-info fw-bold mb-1">{schedule.title}</h5>
              <p className="text-muted mb-0">
                {schedule.level_name} — {schedule.group_name}
              </p>
              <small className="text-secondary">
                Total Sections: {sections.length}
              </small>
              {sharedData?.lastChange && (
                <small className="text-info d-block mt-1">
                  🔄 Real-time updates active
                </small>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              {schedule.status === "draft" ? (
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="btn btn-success d-flex align-items-center gap-1"
                >
                  <CheckCircle size={18} />
                  {approving ? "Approving..." : "Approve Schedule"}
                </button>
              ) : (
                <span className={`badge px-3 py-2 ${
                  schedule.status === "approved" ? "bg-warning text-dark" : 
                  schedule.status === "published" ? "bg-success text-light" : 
                  "bg-secondary text-light"
                }`}>
                  {schedule.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="input-group" style={{ maxWidth: "450px", flex: "1" }}>
          <span className="input-group-text bg-light">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by code, course, or name..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Schedule Table */}
      <div className="table-responsive shadow-sm rounded-3">
        <table className="table table-bordered align-middle text-center">
          <thead className="table-light">
            <tr>
              <th>Day</th>
              {TIMES.slice(0, -1).map((time, i) => (
                <th key={i}>
                  {time} - {TIMES[i + 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const daySections = filtered
                .filter((s) => s.day_of_week === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              const drawn = new Set();

              return (
                <tr key={day}>
                  <td className="fw-semibold">{day}</td>
                  {TIMES.slice(0, -1).map((block, i) => {
                    if (drawn.has(block)) return null;
                    const next = TIMES[i + 1] || "15:00";

                    const cls = daySections.find((s) => {
                      const start = fmt(s.start_time);
                      const end = fmt(s.end_time);
                      return start === block || (start < next && end > block);
                    });

                    if (block === "12:00") {
                      drawn.add(block);
                      return (
                        <td key={block} className="bg-light text-info fw-semibold">
                          Break
                        </td>
                      );
                    }

                    if (cls) {
                      const start = fmt(cls.start_time);
                      const end = fmt(cls.end_time);
                      const startIdx = TIMES.findIndex((t) => t === start);
                      const endIdx = TIMES.findIndex((t) => t === end);
                      let span = endIdx > startIdx ? endIdx - startIdx : 1;
                      if (start < "12:00" && end > "12:00") span--;

                      for (let j = 0; j < span; j++) drawn.add(TIMES[i + j]);

                      return (
                        <td
                          key={block}
                          colSpan={span}
                          className={`rounded p-1 ${getColor(cls.type)}`}
                        >
                          <div className="fw-bold">{cls.course_code}</div>
                          <div className="small">{cls.section_code}</div>
                          <small>
                            {cls.room_name || "—"} — {cls.faculty_name || "—"}
                          </small>
                          <div className="mt-1 d-flex justify-content-center gap-2">
                            <Eye
                              size={15}
                              onClick={() => {
                                setSelectedSection(cls);
                                setShowDetails(true);
                              }}
                              className="cursor-pointer"
                            />
                          </div>
                        </td>
                      );
                    }

                    drawn.add(block);
                    return <td key={block}>—</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Section Details Offcanvas */}
      <Offcanvas show={showDetails} onHide={() => setShowDetails(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Section Details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedSection ? (
            <>
              <p>
                <strong>Section Code:</strong> {selectedSection.section_code}
              </p>
              <p>
                <strong>Course:</strong> {selectedSection.course_code}
              </p>
              <p>
                <strong>Faculty:</strong> {selectedSection.faculty_name || "—"}
              </p>
              <p>
                <strong>Room:</strong> {selectedSection.room_name || "—"}
              </p>
              <p>
                <strong>Day:</strong> {selectedSection.day_of_week}
              </p>
              <p>
                <strong>Time:</strong> {selectedSection.start_time} - {selectedSection.end_time}
              </p>
              <p>
                <strong>Type:</strong> {selectedSection.type}
              </p>
            </>
          ) : (
            <p>No section selected</p>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}