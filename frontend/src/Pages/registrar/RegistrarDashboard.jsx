import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Form,
  Modal,
  Spinner,
  Badge,
  Alert,
} from "react-bootstrap";
import { FaEdit, FaTrashAlt, FaPlus, FaSync } from "react-icons/fa";
import Select from "react-select";
import apiClient from "../../Services/apiClient";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function RegistrarDashboard() {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap(
    "registrar_irregular_students"
  );

  const [form, setForm] = useState({
    student_id: "",
    remaining_courses: [],
    required_courses: [],
  });

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      fetchIrregularStudents();
    }
  }, [sharedData]);

  // ====== API calls ======
  const fetchCourses = async () => {
    const res = await apiClient.get("/courses");
    setCourses(res.data || []);
  };

  const fetchAllStudents = async () => {
    const res = await apiClient.get("/dropdowns/students");
    setAllStudents(res.data || []);
  };

  const fetchIrregularStudents = async () => {
    const res = await apiClient.get("/irregular");
    const data = res.data || [];
    setStudents(data);

    // build levels list from data
    const unique = [];
    const seen = new Set();
    for (const row of data) {
      if (row.level_name && !seen.has(row.level_name)) {
        seen.add(row.level_name);
        unique.push({ id: row.level_name, name: row.level_name });
      }
    }
    setLevels(unique);
  };

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      setLoading(true);
      setPageError("");
      try {
        await Promise.all([
          fetchCourses(),
          fetchAllStudents(),
          fetchIrregularStudents(),
        ]);
      } catch (err) {
        console.error("❌ Page load error:", err);
        if (mounted)
          setPageError("Failed to load data. Check the console/network tab.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCourses(),
        fetchAllStudents(),
        fetchIrregularStudents(),
      ]);

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "manual_refresh",
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("❌ Refresh error:", err);
      setPageError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  // ====== derived options ======
  const studentOptions = useMemo(
    () =>
      Array.isArray(allStudents)
        ? allStudents.map((s) => ({
            value: s.id,
            label: s.name,
          }))
        : [],
    [allStudents]
  );

  const courseOptions = useMemo(
    () =>
      Array.isArray(courses)
        ? courses.map((c) => ({
            id: c.id,
            label: `${c.course_code} – ${c.course_name}`,
            code: c.course_code,
          }))
        : [],
    [courses]
  );

  // ====== filters ======
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesLevel = !selectedLevel || s.level_name === selectedLevel;
      const matchesSearch =
        !search ||
        s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id?.toString().includes(search);
      return matchesLevel && matchesSearch;
    });
  }, [students, selectedLevel, search]);

  // ====== modal helpers ======
  const openModal = (student = null) => {
    setPageError("");
    if (student) {
      setEditing(student);
      setForm({
        student_id: student.student_id,
        remaining_courses: Array.isArray(student.remaining_courses)
          ? student.remaining_courses
          : [],
        required_courses: Array.isArray(student.required_courses)
          ? student.required_courses
          : [],
      });
    } else {
      setEditing(null);
      setForm({
        student_id: "",
        remaining_courses: [],
        required_courses: [],
      });
    }
    setShowModal(true);
  };

  const handleCourseToggle = (type, courseId) => {
    setForm((prev) => {
      const exists = prev[type].includes(courseId);
      return {
        ...prev,
        [type]: exists
          ? prev[type].filter((x) => x !== courseId)
          : [...prev[type], courseId],
      };
    });
  };

  // ====== save / delete ======
  const handleSave = async () => {
    try {
      if (!form.student_id) {
        setPageError("Please select a student first.");
        return;
      }

      const payload = { ...form };

      if (editing) {
        await apiClient.put(`/irregular/${editing.id}`, payload);
      } else {
        await apiClient.post(`/irregular`, payload);
      }

      setShowModal(false);
      await fetchIrregularStudents();

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: editing ? "student_updated" : "student_added",
        timestamp: Date.now(),
        studentId: editing?.id || "new",
      });
    } catch (err) {
      console.error("❌ Failed to save irregular student:", err);
      setPageError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to save irregular student."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    try {
      await apiClient.delete(`/irregular/${id}`);
      await fetchIrregularStudents();

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "student_deleted",
        timestamp: Date.now(),
        studentId: id,
      });
    } catch (err) {
      console.error("❌ Failed to delete student:", err);
      setPageError("Failed to delete student.");
    }
  };

  // ====== display helper ======
  const getCourseCodeById = (id) => {
    const c = courses.find((x) => x.id === id);
    return c ? c.course_code : id;
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: "#6f42c1" }}>
            🎓 Irregular Students Management
          </h4>
          {sharedData?.lastChange && (
            <small className="text-info">🔄 Real-time updates active</small>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FaSync className="me-1" />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="primary" onClick={() => openModal()}>
            <FaPlus className="me-1" /> Add Irregular Student
          </Button>
        </div>
      </div>

      <div className="mb-2 text-muted small">
        Loaded: {courses.length} courses | {allStudents.length} students |{" "}
        {students.length} irregular students
        {sharedData?.lastChange?.timestamp && (
          <span className="ms-2 text-info">
            • Last update:{" "}
            {new Date(sharedData.lastChange.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {pageError && (
        <Alert variant="warning" className="py-2">
          {pageError}
        </Alert>
      )}

      {/* Filters */}
      <div className="d-flex gap-3 mb-3">
        <Form.Control
          style={{ maxWidth: "250px" }}
          placeholder="🔍 Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Form.Select
          style={{ maxWidth: "200px" }}
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="">All Levels</option>
          {levels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.name}
            </option>
          ))}
        </Form.Select>
      </div>

      {/* Table */}
      <div className="table-responsive shadow-sm rounded-4">
        <Table hover className="align-middle text-center mb-0">
          <thead
            style={{
              background: "linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)",
              color: "white",
            }}
          >
            <tr>
              <th>Student Name</th>
              <th>Level</th>
              <th>Remaining Courses</th>
              <th>Needed Courses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">
                  <div className="d-flex justify-content-center align-items-center py-3">
                    <Spinner
                      animation="border"
                      variant="primary"
                      className="me-2"
                    />
                    <span>Loading students...</span>
                  </div>
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-muted py-3">
                  No irregular students found
                  {(selectedLevel || search) && " matching your filters"}
                </td>
              </tr>
            ) : (
              filteredStudents.map((st) => (
                <tr key={st.id}>
                  <td className="fw-semibold">{st.student_name}</td>
                  <td>
                    <Badge bg="secondary">{st.level_name}</Badge>
                  </td>
                  <td>
                    {Array.isArray(st.remaining_courses) &&
                    st.remaining_courses.length > 0 ? (
                      st.remaining_courses.map((id, idx) => (
                        <Badge
                          key={idx}
                          bg="warning"
                          text="dark"
                          className="me-1 mb-1"
                        >
                          {getCourseCodeById(id)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {Array.isArray(st.required_courses) &&
                    st.required_courses.length > 0 ? (
                      st.required_courses.map((id, idx) => (
                        <Badge
                          key={idx}
                          bg="info"
                          text="dark"
                          className="me-1 mb-1"
                        >
                          {getCourseCodeById(id)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <FaEdit
                        color="#0d6efd"
                        size={18}
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(st)}
                        title="Edit student"
                      />
                      <FaTrashAlt
                        color="#dc3545"
                        size={16}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleDelete(st.id)}
                        title="Delete student"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editing ? "Edit Irregular Student" : "Add Irregular Student"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Student</Form.Label>
              <Select
                options={studentOptions}
                value={
                  studentOptions.find((opt) => opt.value === form.student_id) ||
                  null
                }
                onChange={(opt) =>
                  setForm({ ...form, student_id: opt?.value || "" })
                }
                placeholder="Search or select a student..."
                isClearable
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Label className="fw-bold">Remaining Courses</Form.Label>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: 200, overflowY: "auto" }}
                >
                  {courseOptions.map((c) => (
                    <Form.Check
                      key={c.id}
                      type="checkbox"
                      label={c.label}
                      checked={form.remaining_courses.includes(c.id)}
                      onChange={() =>
                        handleCourseToggle("remaining_courses", c.id)
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="col-md-6">
                <Form.Label className="fw-bold">Needed Courses</Form.Label>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: 200, overflowY: "auto" }}
                >
                  {courseOptions.map((c) => (
                    <Form.Check
                      key={c.id}
                      type="checkbox"
                      label={c.label}
                      checked={form.required_courses.includes(c.id)}
                      onChange={() =>
                        handleCourseToggle("required_courses", c.id)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editing ? "Save Changes" : "Add Student"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
