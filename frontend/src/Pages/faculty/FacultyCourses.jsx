import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import { Spinner, Toast, ToastContainer } from "react-bootstrap";

export default function FacultyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;

      setPageLoading(true);
      try {
        const res = await apiClient.get(`/faculty/${user.id}/courses`);
        if (res.data?.courses) {
          setCourses(res.data.courses);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
        const msg = err.response?.data?.error || "Failed to load courses";
        showToast(msg, "danger");
      } finally {
        setPageLoading(false);
      }
    };

    fetchCourses();
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

      {/* Title */}
      <h2 className="fw-bold text-info mb-4">My Courses</h2>

      {/* Card container */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body">
          <h5 className="fw-semibold mb-3 text-info">Courses Taught</h5>
          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "15%" }}>Code</th>
                  <th style={{ width: "45%" }}>Name</th>
                  <th style={{ width: "20%" }}>Credits</th>
                  <th style={{ width: "20%" }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {courses.length > 0 ? (
                  courses.map((course, index) => (
                    <tr key={index}>
                      <td className="fw-semibold text-info">
                        {course.course_code}
                      </td>
                      <td>{course.course_name}</td>
                      <td>{course.credit_hours}</td>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            course.type === "Elective"
                              ? "bg-info text-white"
                              : "bg-secondary text-white"
                          }`}
                        >
                          {course.type}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted py-3">
                      No courses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
