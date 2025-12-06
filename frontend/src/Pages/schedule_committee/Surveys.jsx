import React, { useState, useEffect } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSharedMap } from "../../Hooks/useSharedMap"; // 🟣 real-time sync

export default function Surveys() {
  const [activeTab, setActiveTab] = useState("create");

  // Create Survey Form
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    dept_id: 1,
    level_id: "",
    start_date: "",
    end_date: "",
    course_ids: [],
  });

  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchCourse, setSearchCourse] = useState("");
  const [creating, setCreating] = useState(false);

  // View Results
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🟣 Connect to Y.js shared map for real-time synchronization
  const { data: sharedData, updateField } = useSharedMap("surveys_management");

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  const API_BASE_URL = "http://localhost:5001/api/surveys";

  // 🟣 React to incoming Y.js updates from other users
  useEffect(() => {
    if (!sharedData?.lastChange) return;
    const { type } = sharedData.lastChange;

    console.log("📨 Yjs update received:", sharedData.lastChange);

    if (type === "reload") {
      if (activeTab === "view") {
        fetchAllSurveys();
        if (selectedSurvey) {
          handleViewResults(selectedSurvey);
        }
      }
    }
  }, [sharedData]);

  // Load all levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/dropdowns/levels");
        const data = await res.json();
        setLevels(data || []);
      } catch (err) {
        console.error("❌ Failed to load levels:", err);
      }
    };
    fetchLevels();
  }, []);

  // Load elective courses for selected level
  useEffect(() => {
    if (!newSurvey.level_id) return;
    const fetchCourses = async () => {
      try {
        const res = await fetch(
          `http://localhost:5001/api/courses?level_id=${newSurvey.level_id}`
        );
        const data = await res.json();
        const electives = data.filter((c) => c.type === "ELECTIVE");
        setCourses(electives);
      } catch (err) {
        console.error("❌ Failed to load courses:", err);
      }
    };
    fetchCourses();
  }, [newSurvey.level_id]);

  // Fetch all surveys when viewing tab
  useEffect(() => {
    if (activeTab === "view") fetchAllSurveys();
  }, [activeTab]);

  const fetchAllSurveys = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch surveys");
      const data = await response.json();
      setSurveys(data);
    } catch (error) {
      showToast("Error loading surveys: " + error.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (activeTab === "view") {
        await fetchAllSurveys();
        if (selectedSurvey) {
          await handleViewResults(selectedSurvey);
        }
      }
      showToast("✅ Data refreshed successfully", "success");

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "manual_refresh",
        timestamp: Date.now(),
        tab: activeTab,
      });
    } catch (error) {
      showToast("❌ Failed to refresh data", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (courseId) => {
    setNewSurvey((prev) => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter((id) => id !== courseId)
        : [...prev.course_ids, courseId],
    }));
  };

  const handlePublish = async () => {
    if (
      !newSurvey.title ||
      !newSurvey.start_date ||
      !newSurvey.end_date ||
      !newSurvey.level_id
    ) {
      showToast("Please fill all required fields", "warning");
      return;
    }
    if (newSurvey.course_ids.length === 0) {
      showToast("Please select at least one elective course", "warning");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSurvey),
      });

      if (!response.ok) throw new Error("Failed to create survey");
      await response.json();

      showToast("✅ Survey published successfully!", "success");

      // Reset form
      setNewSurvey({
        title: "",
        dept_id: 1,
        level_id: "",
        start_date: "",
        end_date: "",
        course_ids: [],
      });
      setCourses([]);

      setActiveTab("view");
      await fetchAllSurveys();

      // 🔊 Broadcast change to other users
      updateField("lastChange", {
        type: "reload",
        action: "survey_created",
        timestamp: Date.now(),
        tab: "view",
      });
    } catch (error) {
      showToast("Error creating survey: " + error.message, "danger");
    } finally {
      setCreating(false);
    }
  };

  const handleViewResults = async (survey) => {
    setSelectedSurvey(survey);
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${survey.id}/results`);
      if (!response.ok) throw new Error("Failed to fetch results");
      const data = await response.json();
      setResults(data);
    } catch (error) {
      showToast("Error loading results: " + error.message, "danger");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter courses by search term
  const filteredCourses = courses.filter(
    (c) =>
      c.course_code.toLowerCase().includes(searchCourse.toLowerCase()) ||
      c.course_name.toLowerCase().includes(searchCourse.toLowerCase())
  );

  return (
    <div className="container" style={{ maxWidth: "900px" }}>
      {/* Toast */}
      {toast.show && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`toast show align-items-center text-white bg-${toast.type} border-0`}
            role="alert"
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
      <div className="d-flex justify-content-between align-items-center mb-4 pt-3">
        <div>
          <h3 className="text-info mb-1">Scheduling Committee Survey</h3>
          {sharedData?.lastChange && (
            <small className="text-info">🔄 Real-time updates active</small>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          {sharedData?.lastChange?.timestamp && (
            <small className="text-muted">
              Last update:{" "}
              {new Date(sharedData.lastChange.timestamp).toLocaleTimeString()}
            </small>
          )}
          <button
            className="btn btn-outline-info d-flex align-items-center gap-1"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <Calendar size={36} className="text-info" strokeWidth={1.5} />
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item" style={{ flex: 1 }}>
          <button
            className={`nav-link w-100 ${
              activeTab === "create" ? "active text-info" : "text-secondary"
            }`}
            onClick={() => {
              setActiveTab("create");
              setSelectedSurvey(null);
            }}
            style={{
              border: "none",
              borderBottom:
                activeTab === "create"
                  ? "3px solid #0dcaf0"
                  : "1px solid #dee2e6",
              background: "transparent",
            }}
          >
            Create Survey
          </button>
        </li>
        <li className="nav-item" style={{ flex: 1 }}>
          <button
            className={`nav-link w-100 ${
              activeTab === "view" ? "active text-info" : "text-secondary"
            }`}
            onClick={() => setActiveTab("view")}
            style={{
              border: "none",
              borderBottom:
                activeTab === "view"
                  ? "3px solid #0dcaf0"
                  : "1px solid #dee2e6",
              background: "transparent",
            }}
          >
            View Results
          </button>
        </li>
      </ul>

      {/* Create Survey Tab */}
      {activeTab === "create" && (
        <div className="bg-light p-4 rounded">
          <div className="mb-4">
            <label className="form-label text-info fw-semibold">Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="Sem 1 Survey"
              value={newSurvey.title}
              onChange={(e) =>
                setNewSurvey({ ...newSurvey, title: e.target.value })
              }
            />
          </div>

          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <label className="form-label text-info fw-semibold">
                Start date
              </label>
              <input
                type="date"
                className="form-control"
                value={newSurvey.start_date}
                onChange={(e) =>
                  setNewSurvey({ ...newSurvey, start_date: e.target.value })
                }
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-info fw-semibold">
                End date
              </label>
              <input
                type="date"
                className="form-control"
                value={newSurvey.end_date}
                onChange={(e) =>
                  setNewSurvey({ ...newSurvey, end_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-info fw-semibold">Level</label>
            <select
              className="form-select"
              value={newSurvey.level_id}
              onChange={(e) =>
                setNewSurvey({ ...newSurvey, level_id: e.target.value })
              }
            >
              <option value="">Select Level</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Elective Courses Section */}
          {newSurvey.level_id && (
            <div className="mb-4">
              <label className="form-label text-info fw-semibold">
                Elective Courses
              </label>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Search courses..."
                value={searchCourse}
                onChange={(e) => setSearchCourse(e.target.value)}
              />
              <div
                className="border rounded p-2"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <div key={course.id} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={newSurvey.course_ids.includes(course.id)}
                        onChange={() => handleCourseToggle(course.id)}
                        id={`course-${course.id}`}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`course-${course.id}`}
                      >
                        {course.course_code} - {course.course_name}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small mb-0">No courses found.</p>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-info text-white"
            onClick={handlePublish}
            disabled={creating}
          >
            {creating ? "Publishing..." : "Publish"}
          </button>
        </div>
      )}

      {/* View Results Tab */}
      {activeTab === "view" && (
        <div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : !selectedSurvey ? (
            <>
              {sharedData?.lastChange?.action === "survey_created" && (
                <div className="alert alert-info mb-3 py-2">
                  ✅ New survey created and updated in real-time
                </div>
              )}

              {surveys.map((survey) => (
                <div key={survey.id} className="bg-light p-4 mb-3 rounded">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className="text-info mb-1">{survey.title}</h5>
                      <p className="text-muted small mb-1">
                        Created on {formatDate(survey.start_date)}
                      </p>
                      <p className="text-muted small mb-1">
                        Status:{" "}
                        <span
                          className={`badge bg-${
                            survey.status === "active"
                              ? "success"
                              : survey.status === "closed"
                              ? "secondary"
                              : "warning"
                          }`}
                        >
                          {survey.status}
                        </span>
                      </p>
                      <p className="text-muted small mb-0">
                        Level {survey.level_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-info text-white"
                      onClick={() => handleViewResults(survey)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
              {surveys.length === 0 && (
                <div className="text-center text-muted py-5">
                  No surveys found
                </div>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-link text-info mb-3 p-0 text-decoration-none"
                onClick={() => setSelectedSurvey(null)}
              >
                ← Back
              </button>
              <h5 className="text-info mb-4">{selectedSurvey.title}</h5>

              {results.length > 0 ? (
                <div className="bg-light p-4 rounded">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="text-info mb-0">Survey Results by Course</h6>
                    {sharedData?.lastChange && (
                      <small className="text-muted">
                        Results updated in real-time
                      </small>
                    )}
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={results}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="course_code" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="first_choice_count"
                        fill="#4fd1c5"
                        name="First Choice"
                        radius={[10, 10, 0, 0]}
                      />
                      <Bar
                        dataKey="second_choice_count"
                        fill="#3ba9c9"
                        name="Second Choice"
                        radius={[10, 10, 0, 0]}
                      />
                      <Bar
                        dataKey="third_choice_count"
                        fill="#0077b6"
                        name="Third Choice"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  No results available
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
