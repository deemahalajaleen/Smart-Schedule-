import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import { Spinner, Toast, ToastContainer } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_courses: 0, total_sections: 0 });
  const [schedule, setSchedule] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      setPageLoading(true);
      try {
        const [statsRes, scheduleRes] = await Promise.all([
          apiClient.get(`/faculty/${user.id}/stats`),
          apiClient.get(`/faculty/${user.id}/schedule`),
        ]);
        setStats(statsRes.data);
        setSchedule(scheduleRes.data || []);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        const msg =
          err.response?.data?.error || "Failed to load dashboard data";
        showToast(msg, "danger");
      } finally {
        setPageLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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

  // Days & time blocks
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const timeBlocks = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];

  // Helper to safely format time from DB ("08:00:00+03" → "08:00")
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

      <h2 className="fw-bold text-info mb-4">Faculty Dashboard</h2>

      {/* Stats */}
      <div
        className="d-flex justify-content-center mb-4 flex-wrap"
        style={{ gap: "6rem" }}
      >
        <div className="text-center">
          <div className="fs-3 fw-bold text-info">{stats.total_courses}</div>
          <div className="text-info small">Courses</div>
        </div>
        <div className="text-center">
          <div className="fs-3 fw-bold text-info">{stats.total_sections}</div>
          <div className="text-info small">Sections</div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body">
          <h5 className="fw-semibold mb-3 text-info">My Weekly Schedule</h5>

          {/* 🩵 No schedule yet message */}
          {(!schedule || schedule.length === 0) ? (
            <div
              className="text-center p-5 mt-3 border rounded-4 shadow-sm"
              style={{
                backgroundColor: "#fff",
                color: "#00CFFF",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <InfoCircle size={38} className="mb-3" />
              <h5 className="fw-semibold mb-2">No Schedule Assigned Yet</h5>
              <p className="mb-0 fs-6">
                You don’t have any scheduled sections at the moment.
                Please check back later once your timetable is published.
              </p>
            </div>
          ) : (
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

                          // Break
                          if (block === "12:00") {
                            drawn.add(block);
                            return (
                              <td
                                key={block}
                                className="bg-light text-secondary fw-semibold"
                              >
                                Break
                              </td>
                            );
                          }

                          // Course
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

                            for (let j = 0; j < span; j++) {
                              const covered = timeBlocks[i + j];
                              if (covered) drawn.add(covered);
                            }

                            return (
                              <td
                                key={block}
                                colSpan={span}
                                style={{
                                  backgroundColor: "#e3f2fd",
                                  border: "1px solid #b6e0ff",
                                  minWidth: "100px",
                                }}
                              >
                                <strong>{cls.course_code}</strong>
                                <div className="text-muted small">
                                  {cls.room_name || "TBD"} – Level {cls.level}
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
          )}
        </div>
      </div>
    </div>
  );
}
