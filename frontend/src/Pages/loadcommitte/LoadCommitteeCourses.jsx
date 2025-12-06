import React, { useState, useEffect } from "react";
import Select from "react-select";
import apiClient from "../../Services/apiClient";
import { Spinner } from "react-bootstrap";
import { InfoCircle } from "react-bootstrap-icons";

export default function LoadCommitteeCourses() {
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const timeBlocks = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
  ];

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fmt = (t) => (t ? t.split(":").slice(0, 2).join(":") : "");

  // 🧑‍🏫 Fetch faculty list
  const fetchFaculties = async () => {
    try {
      const { data } = await apiClient.get("/dropdowns/faculty");
      setFaculties(data.map((f) => ({ value: f.id, label: f.label })));
    } catch (err) {
      console.error("Error fetching faculties:", err);
    }
  };

  // 🗓️ Fetch sections (schedule) for selected faculty
  const fetchFacultySections = async (facultyId) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/faculty/${facultyId}/sections`);
      setSchedule(data || []);
    } catch (err) {
      console.error("Error loading faculty sections:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h4 className="text-info fw-bold mb-3">Faculty Schedules</h4>

      <div className="mb-4" style={{ maxWidth: "400px" }}>
        <label className="fw-semibold text-secondary mb-2">
          Select Faculty:
        </label>
        <Select
          options={faculties}
          onChange={(opt) => {
            setSelectedFaculty(opt);
            if (opt) fetchFacultySections(opt.value);
            else setSchedule([]); // Clear if unselected
          }}
          placeholder="Search faculty..."
          isClearable
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="info" />
        </div>
      ) : selectedFaculty ? (
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="text-center text-secondary mb-3">
              Schedule for{" "}
              <span className="text-info">{selectedFaculty.label}</span>
            </h5>

            <table className="table table-bordered text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th>Day</th>
                  {timeBlocks.map((t, i) => (
                    <th key={i}>
                      {t} - {timeBlocks[i + 1] || "15:00"}
                    </th>
                  ))}
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
                        const next = timeBlocks[i + 1] || "15:00";
                        const cls = sections.find((s) => {
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
                          const startIdx = timeBlocks.findIndex((t) => t === start);
                          const endIdx = timeBlocks.findIndex((t) => t === end);
                          let span = endIdx > startIdx ? endIdx - startIdx : 1;
                          if (start < "12:00" && end > "12:00") span--;

                          for (let j = 0; j < span; j++) drawn.add(timeBlocks[i + j]);

                          return (
                            <td key={block} colSpan={span} className="bg-info-subtle">
                              <strong>{cls.course_code}</strong>
                              <div className="small text-muted">
                                {cls.section_code} - Room {cls.room_name || "TBD"}
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
        </div>
      ) : (
        // 💎 Clean, white background with cyan text
        <div
          className="text-center p-5 mt-4 border rounded-4 shadow-sm"
          style={{
            backgroundColor: "#fff",
            color: "#00CFFF",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <InfoCircle size={38} className="mb-3" />
          <h5 className="fw-semibold mb-2">No Faculty Selected</h5>
          <p className="mb-0 fs-6">
            Please choose a faculty member from the dropdown above to view their schedule.
          </p>
        </div>
      )}
    </div>
  );
}
