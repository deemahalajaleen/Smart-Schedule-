import React, { useEffect, useState } from "react";
import { Table, Spinner, Alert } from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../../Services/apiClient";

export default function ScheduleCommitteeDashboard() {
  const [statusRatio, setStatusRatio] = useState([]);
  const [studentsByLevel, setStudentsByLevel] = useState([]);
  const [irregularStudents, setIrregularStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const COLORS = ["#4bc0c0", "#36a2eb", "#9966ff", "#ff6384", "#ff9f40"];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [statusRes, levelRes, irregularRes] = await Promise.all([
          apiClient.get("/reports/students/status-ratio"),
          apiClient.get("/reports/students/by-level"),
          apiClient.get("/irregular"),
        ]);

        setStatusRatio(statusRes.data || []);
        setStudentsByLevel(levelRes.data || []);
        setIrregularStudents(irregularRes.data || []);
      } catch (err) {
        console.error("❌ Failed to load dashboard:", err);
        setError("Failed to load dashboard data. Check the console or API.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4" style={{ color: "#6f42c1" }}>
        🧩 Schedule Committee Dashboard
      </h4>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="secondary" />
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="row mb-4">
            {/* Pie Chart - Student Status Ratio */}
            <div className="col-md-6">
              <div className="bg-white shadow-sm rounded-4 p-3 text-center">
                <h6 className="fw-semibold mb-3 text-muted">
                  Regular vs Irregular Students
                </h6>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusRatio.map((s) => ({
                        name: s.status,
                        value: Number(s.total),
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusRatio.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart - Students by Level */}
            <div className="col-md-6">
              <div className="bg-white shadow-sm rounded-4 p-3 text-center">
                <h6 className="fw-semibold mb-3 text-muted">
                  Students by Level
                </h6>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={studentsByLevel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="level_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="student_count"
                      fill="#8884d8"
                      name="Students"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Irregular Students Table */}
          <div className="bg-white shadow-sm rounded-4 p-3">
            <h6 className="fw-semibold mb-3 text-muted">
              Irregular Students Data
            </h6>
            <div className="table-responsive">
              <Table hover className="align-middle text-center mb-0">
                <thead
                  style={{
                    background:
                      "linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)",
                    color: "white",
                  }}
                >
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Remaining Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {irregularStudents.length > 0 ? (
                    irregularStudents.map((st) => (
                      <tr key={st.id}>
                        <td>{st.student_id}</td>
                        <td>{st.student_name}</td>
                        <td>{st.level_name}</td>
                        <td>
                          {Array.isArray(st.remaining_courses)
                            ? st.remaining_courses.join(", ")
                            : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-muted py-3">
                        No irregular students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
