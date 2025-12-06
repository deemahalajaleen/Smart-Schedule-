import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  X,
  Upload,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import apiClient from "../../Services/apiClient";
import { useParams } from "react-router-dom";
import { Modal, Offcanvas, Spinner, Card, Badge } from "react-bootstrap";
import Select from "react-select";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function ScheduleDetails() {
  const { schedule_id } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [sections, setSections] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const [aiSections, setAiSections] = useState([]);
  const [generating, setGenerating] = useState(false);

  // 🔐 Versioning state
  const [savingVersion, setSavingVersion] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState(null);

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap(
    `schedule_details_${schedule_id}`
  );

  const [dropdowns, setDropdowns] = useState({
    faculty: [],
    rooms: [],
    courses: [],
  });

  const [form, setForm] = useState({
    section_code: "",
    course_id: "",
    faculty_id: "",
    room_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    type: "lecture",
  });

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
    if (
      type === "reload" &&
      (!scheduleId || scheduleId === parseInt(schedule_id))
    ) {
      fetchAllData();
    }
  }, [sharedData]);

  useEffect(() => {
    fetchAllData();
  }, [schedule_id]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSchedule(), fetchSections(), fetchDropdowns()]);
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
    }
  };

  const fetchSections = async () => {
    try {
      const res = await apiClient.get(`/sections?schedule_id=${schedule_id}`);
      setSections(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error("❌ Error loading sections:", err);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [facultyRes, roomsRes, coursesRes] = await Promise.all([
        apiClient.get("/dropdowns/faculty"),
        apiClient.get("/dropdowns/rooms"),
        apiClient.get("/dropdowns/courses"),
      ]);

      setDropdowns({
        faculty: facultyRes.data.map((f) => ({ value: f.id, label: f.label })),
        rooms: roomsRes.data.map((r) => ({ value: r.id, label: r.label })),
        courses: coursesRes.data.map((c) => ({ value: c.id, label: c.label })),
      });
    } catch (err) {
      console.error("❌ Error fetching dropdowns:", err);
    }
  };

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchAllData();
      alert("✅ Data refreshed successfully!");

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        scheduleId: parseInt(schedule_id),
        action: "manual_refresh",
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("❌ Error refreshing data:", err);
      alert("❌ Failed to refresh data");
    } finally {
      setLoading(false);
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

  const handleDelete = async (sectionId) => {
    if (!window.confirm("Are you sure you want to delete this section?"))
      return;
    try {
      await apiClient.delete(`/sections/${sectionId}`);
      await fetchSections();

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        scheduleId: parseInt(schedule_id),
        action: "section_deleted",
        timestamp: Date.now(),
        sectionId: sectionId,
      });
    } catch (err) {
      console.error("❌ Error deleting section:", err);
    }
  };

  const openModal = (section = null) => {
    setEditingSection(section);
    if (section) {
      setForm({
        section_code: section.section_code || "",
        course_id: section.course_id,
        faculty_id: section.faculty_id,
        room_id: section.room_id,
        day_of_week: section.day_of_week,
        start_time: section.start_time,
        end_time: section.end_time,
        type: section.type,
      });
    } else {
      setForm({
        section_code: "",
        course_id: "",
        faculty_id: "",
        room_id: "",
        day_of_week: "",
        start_time: "",
        end_time: "",
        type: "lecture",
      });
    }
    setShowModal(true);
  };

  const openDetails = (section) => {
    setSelectedSection(section);
    setShowDetails(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        schedule_id,
        section_group: schedule?.group_id,
      };

      if (editingSection)
        await apiClient.put(`/sections/${editingSection.id}`, payload);
      else await apiClient.post("/sections", payload);

      await fetchSections();
      setShowModal(false);

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        scheduleId: parseInt(schedule_id),
        action: editingSection ? "section_updated" : "section_created",
        timestamp: Date.now(),
        sectionId: editingSection?.id || "new",
      });
    } catch (err) {
      console.error("❌ Error saving section:", err);
      alert(err.response?.data?.error || "Error saving section");
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Are you sure you want to publish this schedule?"))
      return;
    try {
      setPublishing(true);
      await apiClient.patch(`/schedules/${schedule_id}/publish`);
      await fetchSchedule();

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        scheduleId: parseInt(schedule_id),
        action: "schedule_published",
        timestamp: Date.now(),
      });

      alert("✅ Schedule published successfully!");
    } catch (err) {
      console.error("❌ Error publishing schedule:", err);
      alert("Error publishing schedule.");
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateAISections = async () => {
    if (!schedule) {
      alert("Schedule data not loaded yet");
      return;
    }

    try {
      setGenerating(true);
      console.log("Sending request with:", {
        level_id: schedule.level_id,
        group_id: schedule.group_id,
        schedule_id: schedule_id,
      });

      const response = await apiClient.post("/ai/generate-smart-sections", {
        level_id: schedule.level_id,
        group_id: schedule.group_id,
        schedule_id: parseInt(schedule_id),
      });

      console.log("AI Response:", response.data);
      setAiSections(response.data || []);
      setShowAIModal(true);
    } catch (err) {
      console.error("❌ Error generating AI sections:", err);
      console.error("Error details:", err.response?.data);
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error generating sections with AI"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAISections = async () => {
    if (aiSections.length === 0) return;

    try {
      const sectionsToSave = aiSections.map((section) => ({
        ...section,
        schedule_id: parseInt(schedule_id),
        section_group: schedule?.group_id,
      }));

      console.log("Saving sections:", sectionsToSave);

      // Save sections one by one to handle potential errors
      for (const section of sectionsToSave) {
        await apiClient.post("/sections", section);
      }

      await fetchSections();
      setShowAIModal(false);

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        scheduleId: parseInt(schedule_id),
        action: "ai_sections_saved",
        timestamp: Date.now(),
        sectionsCount: aiSections.length,
      });

      alert(
        `✅ ${aiSections.length} AI-generated sections saved successfully!`
      );
    } catch (err) {
      console.error("❌ Error saving AI sections:", err);
      console.error("Error details:", err.response?.data);
      alert(
        "Error saving AI sections: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  // ✨ Save schedule version
  const handleSaveVersion = async () => {
    try {
      if (!schedule) {
        alert("Schedule not loaded yet.");
        return;
      }

      setSavingVersion(true);

      const snapshot = {
        schedule,
        sections,
      };

      await apiClient.post(`/schedule-history/${schedule_id}/save`, {
        // backend currently uses jsondiffpatch(diff)
        // and we modified it to store full snapshot if no diff
        oldData: snapshot,
        newData: snapshot,
      });

      // Broadcast to other users (optional)
      updateField("lastChange", {
        type: "reload",
        scheduleId: parseInt(schedule_id),
        action: "version_saved",
        timestamp: Date.now(),
      });

      alert("✅ Version saved successfully!");
    } catch (err) {
      console.error("❌ Error saving version:", err);
      alert("❌ Failed to save version.");
    } finally {
      setSavingVersion(false);
    }
  };

  // 📜 Load version history
  const openHistoryModal = async () => {
    try {
      setShowHistoryModal(true);
      setHistoryLoading(true);
      const res = await apiClient.get(
        `/schedule-history/${schedule_id}/versions`
      );
      setVersions(res.data || []);
    } catch (err) {
      console.error("❌ Error loading versions:", err);
      alert("Failed to load version history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // ♻ Restore a version
  const handleRestoreVersion = async (versionId) => {
    const confirm = window.confirm(
      "Are you sure you want to restore this version? Current schedule will be replaced."
    );
    if (!confirm) return;

    try {
      setRestoringVersionId(versionId);
      await apiClient.post(`/schedule-history/restore/${versionId}`);

      await fetchAllData();

      updateField("lastChange", {
        type: "reload",
        scheduleId: parseInt(schedule_id),
        action: "version_restored",
        versionId,
        timestamp: Date.now(),
      });

      alert("✅ Version restored successfully.");
      setShowHistoryModal(false);
    } catch (err) {
      console.error("❌ Error restoring version:", err);
      alert("Failed to restore version.");
    } finally {
      setRestoringVersionId(null);
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

  const getAISectionColor = (type) => {
    const typeLower = type?.toLowerCase();
    switch (typeLower) {
      case "lecture":
        return "primary";
      case "lab":
        return "warning";
      case "tutorial":
        return "success";
      case "elective":
        return "info";
      default:
        return "secondary";
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

  const getCourseName = (courseId) => {
    const course = dropdowns.courses.find((c) => c.value === courseId);
    return course ? course.label : `Course ${courseId}`;
  };

  const getFacultyName = (facultyId) => {
    const faculty = dropdowns.faculty.find((f) => f.value === facultyId);
    return faculty ? faculty.label : `Faculty ${facultyId}`;
  };

  const getRoomName = (roomId) => {
    const room = dropdowns.rooms.find((r) => r.value === roomId);
    return room ? room.label : `Room ${roomId}`;
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
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
      {/* Header Card */}
      {schedule && (
        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body d-flex justify-content-between align-items-center flex-wrap">
            <div className="mb-2">
              <h5 className="text-info fw-bold mb-1">{schedule.title}</h5>
              <p className="text-muted mb-0">
                {schedule.level_name} — {schedule.group_name}
              </p>
              <small className="text-secondary">
                Level ID: {schedule.level_id} | Group ID: {schedule.group_id}
              </small>
              <br />
              <small className="text-secondary">
                Total Sections: {sections.length}
              </small>
              {sharedData?.lastChange && (
                <small className="text-info d-block mt-1">
                  🔄 Real-time updates active
                </small>
              )}
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-outline-info d-flex align-items-center gap-1"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw size={16} />
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                className="btn btn-outline-secondary d-flex align-items-center gap-1"
                onClick={handleSaveVersion}
                disabled={savingVersion || !schedule}
              >
                <Upload size={16} />
                {savingVersion ? "Saving..." : "Save Version"}
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={openHistoryModal}
              >
                Versions
              </button>

              {schedule.status === "draft" && (
                <span className="badge bg-secondary px-3 py-2">Draft</span>
              )}

              {schedule.status === "approved" && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="btn btn-success d-flex align-items-center gap-1"
                >
                  <Upload size={18} />
                  {publishing ? "Publishing..." : "Publish"}
                </button>
              )}

              {schedule.status === "published" && (
                <span className="badge bg-success px-3 py-2">Published</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search + Buttons */}
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

        <div className="d-flex gap-2">
          <button
            className="btn btn-warning text-white d-flex align-items-center gap-1"
            onClick={handleGenerateAISections}
            disabled={generating || !schedule}
          >
            <Sparkles size={18} />
            {generating ? "Generating..." : "Generate with AI"}
          </button>

          <button
            className="btn btn-info text-white d-flex align-items-center gap-1"
            onClick={() => openModal()}
          >
            <PlusCircle size={18} /> New Section
          </button>
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
                        <td
                          key={block}
                          className="bg-light text-info fw-semibold"
                        >
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
                              onClick={() => openDetails(cls)}
                              className="cursor-pointer"
                            />
                            <Edit
                              size={15}
                              onClick={() => openModal(cls)}
                              className="cursor-pointer"
                            />
                            <Trash2
                              size={15}
                              onClick={() => handleDelete(cls.id)}
                              className="cursor-pointer text-danger"
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

      {/* Section Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingSection ? "Edit Section" : "Create New Section"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Section Code</label>
              <input
                type="text"
                className="form-control"
                value={form.section_code}
                onChange={(e) =>
                  setForm({ ...form, section_code: e.target.value })
                }
                placeholder="e.g., SEC-001"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Course</label>
              <Select
                options={dropdowns.courses}
                value={dropdowns.courses.find(
                  (c) => c.value === form.course_id
                )}
                onChange={(selected) =>
                  setForm({ ...form, course_id: selected?.value || "" })
                }
                placeholder="Select course..."
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Faculty</label>
              <Select
                options={dropdowns.faculty}
                value={dropdowns.faculty.find(
                  (f) => f.value === form.faculty_id
                )}
                onChange={(selected) =>
                  setForm({ ...form, faculty_id: selected?.value || "" })
                }
                placeholder="Select faculty..."
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Room</label>
              <Select
                options={dropdowns.rooms}
                value={dropdowns.rooms.find((r) => r.value === form.room_id)}
                onChange={(selected) =>
                  setForm({ ...form, room_id: selected?.value || "" })
                }
                placeholder="Select room..."
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Day of Week</label>
              <select
                className="form-select"
                value={form.day_of_week}
                onChange={(e) =>
                  setForm({ ...form, day_of_week: e.target.value })
                }
              >
                <option value="">Select day...</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Lab</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Start Time</label>
              <select
                className="form-select"
                value={form.start_time}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
              >
                <option value="">Select start time...</option>
                {TIMES.slice(0, -1).map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">End Time</label>
              <select
                className="form-select"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              >
                <option value="">Select end time...</option>
                {TIMES.slice(1).map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {editingSection ? "Update Section" : "Create Section"}
          </button>
        </Modal.Footer>
      </Modal>

      {/* AI Generated Sections Modal */}
      <Modal show={showAIModal} onHide={() => setShowAIModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <Sparkles className="text-warning" />
            AI Generated Sections
            <Badge bg="primary" className="ms-2">
              {aiSections.length} sections
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {aiSections.length > 0 ? (
            <div className="row g-3">
              {aiSections.map((section, index) => (
                <div key={index} className="col-md-6">
                  <Card className="h-100 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title text-primary mb-0">
                          {section.section_code}
                        </h6>
                        <Badge bg={getAISectionColor(section.type)}>
                          {section.type}
                        </Badge>
                      </div>

                      <div className="mb-2">
                        <strong>Course:</strong>{" "}
                        {getCourseName(section.course_id)}
                      </div>

                      <div className="mb-2">
                        <strong>Faculty:</strong>{" "}
                        {getFacultyName(section.faculty_id)}
                      </div>

                      <div className="mb-2">
                        <strong>Room:</strong> {getRoomName(section.room_id)}
                      </div>

                      <div className="mb-2">
                        <strong>Time:</strong> {section.day_of_week}{" "}
                        {section.start_time} - {section.end_time}
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No sections generated yet.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAIModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={handleSaveAISections}
            disabled={aiSections.length === 0}
          >
            Save All Sections ({aiSections.length})
          </button>
        </Modal.Footer>
      </Modal>

      {/* Versions History Modal */}
      <Modal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Schedule Versions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {historyLoading ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" variant="info" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-muted mb-0">
              No versions saved yet. Use <strong>Save Version</strong> to store
              a snapshot.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Version</th>
                    <th>Created At</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v, idx) => (
                    <tr key={v.id}>
                      <td>{idx + 1}</td>
                      <td>{v.version}</td>
                      <td>{formatDateTime(v.created_at)}</td>
                      <td>{v.created_by || "—"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleRestoreVersion(v.id)}
                          disabled={restoringVersionId === v.id}
                        >
                          {restoringVersionId === v.id
                            ? "Restoring..."
                            : "Restore"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Section Details Offcanvas */}
      <Offcanvas
        show={showDetails}
        onHide={() => setShowDetails(false)}
        placement="end"
      >
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
                <strong>Faculty:</strong>{" "}
                {selectedSection.faculty_name || "—"}
              </p>
              <p>
                <strong>Room:</strong> {selectedSection.room_name || "—"}
              </p>
              <p>
                <strong>Day:</strong> {selectedSection.day_of_week}
              </p>
              <p>
                <strong>Time:</strong> {selectedSection.start_time} -{" "}
                {selectedSection.end_time}
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
