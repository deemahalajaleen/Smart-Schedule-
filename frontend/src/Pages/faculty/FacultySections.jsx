import React, { useEffect, useState } from "react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";
import { Spinner, Toast, ToastContainer } from "react-bootstrap";

export default function FacultySections() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 2500);
  };

  useEffect(() => {
    const fetchSections = async () => {
      if (!user?.id) return;
      setPageLoading(true);
      try {
        const res = await apiClient.get(`/faculty/${user.id}/sections`);
        setSections(res.data);
      } catch (err) {
        console.error("Error loading sections:", err);
        const msg = err.response?.data?.error || "Failed to load sections";
        showToast(msg, "danger");
      } finally {
        setPageLoading(false);
      }
    };

    fetchSections();
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

      <h2 className="fw-bold text-info mb-4">My Sections</h2>

      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body">
          <h5 className="fw-semibold mb-3 text-info">Assigned Sections</h5>
          <div className="table-responsive">
            <table className="table table-bordered text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "15%" }}>Section </th>
                  <th style={{ width: "15%" }}>Course </th>
                  <th style={{ width: "20%" }}>Day</th>
                  <th style={{ width: "25%" }}>Time</th>
                  <th style={{ width: "25%" }}>Room</th>
                </tr>
              </thead>
              <tbody>
                {sections.length > 0 ? (
                  sections.map((sec, index) => (
                    <tr key={index}>
                      <td className="fw-semibold text-info">
                        {sec.section_code}
                      </td>
                      <td>{sec.course_code}</td>
                      <td>{sec.day_of_week}</td>
                      <td>
                        {sec.start_time} - {sec.end_time}
                      </td>
                      <td>{sec.room_name || "TBD"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted py-3">
                      No sections found
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
