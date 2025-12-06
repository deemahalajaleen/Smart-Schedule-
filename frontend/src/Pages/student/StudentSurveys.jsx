import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";

export default function StudentSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) fetchSurveys();
  }, [user]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/surveys/available/${user.id}`);
      setSurveys(data || []);
    } catch (err) {
      console.error("❌ Failed to load surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isActive = (survey) => {
    const now = new Date();
    const endDate = new Date(survey.end_date);
    return endDate >= now && !survey.has_voted;
  };

  return (
    <div className="container" style={{ maxWidth: "900px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4 pt-3">
        <div>
          <h3 className="text-info mb-1">My Surveys</h3>
          <p className="text-muted mb-0">
            Available surveys: {surveys.filter((s) => !s.has_voted).length}
          </p>
        </div>
        <Calendar size={36} className="text-info" strokeWidth={1.5} />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div
            className="spinner-border text-info"
            style={{ width: "3rem", height: "3rem" }}
          />
          <p className="mt-3 text-info">Loading surveys...</p>
        </div>
      ) : surveys.length > 0 ? (
        <div className="row g-3">
          {surveys.map((survey) => {
            const active = isActive(survey);
            return (
              <div key={survey.id} className="col-12">
                <div
                  className="card border-0 shadow-sm h-100"
                  style={{
                    borderLeft: survey.has_voted
                      ? "4px solid #28a745"
                      : active
                      ? "4px solid #17a2b8"
                      : "4px solid #6c757d",
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="flex-grow-1">
                        <h5 className="text-info mb-2">{survey.title}</h5>
                        <div className="d-flex align-items-center text-muted small mb-2">
                          <Clock size={14} className="me-1" />
                          <span>
                            {formatDate(survey.start_date)} -{" "}
                            {formatDate(survey.end_date)}
                          </span>
                        </div>
                      </div>
                      {survey.has_voted ? (
                        <div className="d-flex align-items-center gap-2">
                          <CheckCircle size={20} className="text-success" />
                          <span className="badge bg-success">Voted</span>
                        </div>
                      ) : active ? (
                        <span className="badge bg-info">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Closed</span>
                      )}
                    </div>

                    {survey.has_voted ? (
                      <div className="alert alert-success mb-0 py-2 d-flex align-items-center">
                        <CheckCircle size={18} className="me-2" />
                        <span>Thank you for participating in this survey!</span>
                      </div>
                    ) : active ? (
                      <button
                        className="btn btn-info text-white w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={() =>
                          navigate(`/student/surveys/${survey.id}`)
                        }
                      >
                        <AlertCircle size={18} />
                        Vote Now
                      </button>
                    ) : (
                      <div className="alert alert-secondary mb-0 py-2">
                        <small>This survey has ended</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-5">
          <Calendar size={64} className="text-muted mb-3" />
          <h5 className="text-muted">No Surveys Available</h5>
          <p className="text-muted mb-0">Check back later for new surveys</p>
        </div>
      )}
    </div>
  );
}
