import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Form,
  Button,
  Spinner,
  Alert,
  InputGroup,
} from "react-bootstrap";
import { FaEdit, FaSave, FaTimes, FaSync } from "react-icons/fa";
import apiClient from "../../Services/apiClient";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function CourseCapacity() {
  const [courses, setCourses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newCapacity, setNewCapacity] = useState("");
  const [message, setMessage] = useState("");

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap("course_capacity");

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      fetchCourses();
    }
  }, [sharedData]);

  // ✅ Fetch courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/courses");
      setCourses(res.data || []);

      // extract unique levels
      const uniqueLevels = [];
      const seen = new Set();
      for (const c of res.data) {
        if (c.level_name && !seen.has(c.level_name)) {
          seen.add(c.level_name);
          uniqueLevels.push({ id: c.level_id, name: c.level_name });
        }
      }
      setLevels(uniqueLevels);
    } catch (err) {
      console.error("❌ Failed to load courses:", err);
      setMessage("Failed to load courses. Check console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetchCourses();
      setMessage("✅ Courses refreshed successfully");

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "manual_refresh",
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("❌ Refresh error:", err);
      setMessage("❌ Failed to refresh courses");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter logic
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesLevel = !filterLevel || c.level_id === Number(filterLevel);
      const matchesSearch =
        !search ||
        c.course_code.toLowerCase().includes(search.toLowerCase()) ||
        c.course_name.toLowerCase().includes(search.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [courses, filterLevel, search]);

  // ✅ Start editing
  const startEditing = (course) => {
    setEditingId(course.id);
    setNewCapacity(course.capacity);
    setMessage("");
  };

  // ✅ Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setNewCapacity("");
  };

  // ✅ Save new capacity
  const saveCapacity = async (courseId) => {
    try {
      if (!newCapacity || isNaN(newCapacity) || Number(newCapacity) < 0) {
        setMessage("⚠️ Please enter a valid capacity number.");
        return;
      }

      await apiClient.put(`/courses/${courseId}/capacity`, {
        capacity: Number(newCapacity),
      });
      setMessage("✅ Capacity updated successfully.");
      await fetchCourses();
      setEditingId(null);

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "capacity_updated",
        timestamp: Date.now(),
        courseId: courseId,
        newCapacity: Number(newCapacity),
      });
    } catch (err) {
      console.error("❌ Failed to update capacity:", err);
      setMessage("❌ Failed to update capacity. Check console.");
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0" style={{ color: "#6f42c1" }}>
          🧮 Course Capacity Management
        </h4>
        {sharedData?.lastChange && (
          <small className="text-info">🔄 Real-time updates active</small>
        )}
      </div>

      {message && (
        <Alert
          variant={
            message.startsWith("✅")
              ? "success"
              : message.startsWith("⚠️")
              ? "warning"
              : "danger"
          }
          className="py-2"
        >
          {message}
        </Alert>
      )}

      {/* Filters */}
      <div className="d-flex flex-wrap gap-3 mb-3 align-items-center">
        <Form.Control
          placeholder="🔍 Search by course code or name"
          style={{ maxWidth: "250px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Form.Select
          style={{ maxWidth: "200px" }}
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="">All Levels</option>
          {levels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.name}
            </option>
          ))}
        </Form.Select>

        <div className="d-flex gap-2">
          {sharedData?.lastChange?.timestamp && (
            <small className="text-muted align-self-center">
              Last update:{" "}
              {new Date(sharedData.lastChange.timestamp).toLocaleTimeString()}
            </small>
          )}
          <Button
            variant="outline-primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FaSync className="me-1" />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
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
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Level</th>
              <th>Capacity</th>
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
                    <span>Loading courses...</span>
                  </div>
                </td>
              </tr>
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-muted py-3">
                  No courses found
                  {(filterLevel || search) && " matching your filters"}
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td className="fw-semibold">{course.course_code}</td>
                  <td>{course.course_name}</td>
                  <td>
                    <span className="badge bg-secondary">
                      {course.level_name}
                    </span>
                  </td>
                  <td>
                    {editingId === course.id ? (
                      <InputGroup
                        size="sm"
                        style={{ maxWidth: "120px", margin: "0 auto" }}
                      >
                        <Form.Control
                          type="number"
                          value={newCapacity}
                          onChange={(e) => setNewCapacity(e.target.value)}
                          min="0"
                          step="1"
                        />
                      </InputGroup>
                    ) : (
                      <span
                        className={course.capacity ? "fw-bold" : "text-muted"}
                      >
                        {course.capacity || "Not set"}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === course.id ? (
                      <div className="d-flex justify-content-center gap-1">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => saveCapacity(course.id)}
                          title="Save capacity"
                        >
                          <FaSave /> Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={cancelEditing}
                          title="Cancel editing"
                        >
                          <FaTimes /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => startEditing(course)}
                        title="Edit capacity"
                      >
                        <FaEdit /> Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Summary */}
      <div className="mt-3 text-muted small">
        Showing {filteredCourses.length} of {courses.length} courses
        {sharedData?.lastChange?.action === "capacity_updated" && (
          <span className="text-info ms-2">
            • Capacity updated in real-time
          </span>
        )}
      </div>
    </div>
  );
}
