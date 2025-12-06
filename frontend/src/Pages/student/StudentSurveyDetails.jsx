import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import apiClient from "../../Services/apiClient";
import { useAuth } from "../../Hooks/AuthContext";

export default function StudentSurveyDetails() {
  const { surveyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [choices, setChoices] = useState({
    first_choice: "",
    second_choice: "",
    third_choice: "",
  });

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  // 🔹 Fetch survey and its courses
  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/surveys/${surveyId}`);
      setSurvey(data.survey);
      setCourses(data.courses || []);
    } catch (err) {
      console.error("❌ Failed to load survey:", err);
      setMessage({
        type: "danger",
        text: err.response?.data?.error || "Failed to load survey.",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle voting submission
  const handleVote = async () => {
    const { first_choice, second_choice, third_choice } = choices;

    // 🧩 Validation
    if (!first_choice || !second_choice || !third_choice) {
      return setMessage({
        type: "warning",
        text: "Please select all three choices before submitting.",
      });
    }

    const unique = new Set([first_choice, second_choice, third_choice]);
    if (unique.size !== 3) {
      return setMessage({
        type: "warning",
        text: "Please select three different courses.",
      });
    }

    try {
      setSubmitting(true);
      setMessage(null);

      // ✅ Send to backend (using correct column names)
      await apiClient.post(`/surveys/${surveyId}/vote`, {
        student_id: user.id,
        first_course: first_choice,
        second_course: second_choice,
        third_course: third_choice,
      });

      setMessage({
        type: "success",
        text: "✅ Vote submitted successfully! Redirecting...",
      });

      // Redirect after success
      setTimeout(() => navigate("/student/surveys"), 2000);
    } catch (err) {
      console.error("❌ Vote submit error:", err);
      setMessage({
        type: "danger",
        text: err.response?.data?.error || "Failed to submit vote.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  // 🔹 Loading State
  if (loading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border text-info"
          style={{ width: "3rem", height: "3rem" }}
        />
        <p className="mt-3 text-info">Loading survey...</p>
      </div>
    );
  }

  // 🔹 No survey found
  if (!survey) {
    return (
      <div className="text-center py-5">
        <AlertCircle size={64} className="text-danger mb-3" />
        <h5 className="text-muted">Survey not found</h5>
        <button
          className="btn btn-info text-white mt-3"
          onClick={() => navigate("/student/surveys")}
        >
          Back to Surveys
        </button>
      </div>
    );
  }

  // 🔹 Page Content
  return (
    <div className="container" style={{ maxWidth: "900px" }}>
      <button
        className="btn btn-link text-info mb-3"
        onClick={() => navigate("/student/surveys")}
      >
        <ArrowLeft size={20} className="me-1" />
        Back to Surveys
      </button>

      {/* Survey Info */}
      <div className="bg-light p-4 rounded-3 shadow-sm mb-4">
        <h3 className="text-info mb-3">{survey.title}</h3>
        <div className="d-flex align-items-center text-muted mb-2">
          <Calendar size={18} className="me-2" />
          {formatDate(survey.start_date)} - {formatDate(survey.end_date)}
        </div>
        <div className="d-flex align-items-center text-muted">
          <BookOpen size={18} className="me-2" />
          Select your top 3 elective preferences
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`alert alert-${message.type} d-flex align-items-center`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} className="me-2" />
          ) : (
            <AlertCircle size={20} className="me-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="card border-0 shadow-sm p-4">
        <h5 className="text-info mb-4">Your Preferences</h5>

        {["first_choice", "second_choice", "third_choice"].map((key, index) => (
          <div className="mb-3" key={key}>
            <label className="form-label fw-semibold text-info">
              {index + 1}. {key.replace("_", " ").replace("choice", "Choice")}
            </label>
            <select
              className="form-select"
              value={choices[key]}
              onChange={(e) =>
                setChoices({ ...choices, [key]: e.target.value })
              }
              disabled={submitting}
            >
              <option value="">-- Select Course --</option>
              {courses.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                  disabled={Object.values(choices)
                    .filter((v, k) => v && k !== key)
                    .includes(String(c.id))}
                >
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          className="btn btn-info text-white w-100 mt-3"
          onClick={handleVote}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Vote"}
        </button>
      </div>
    </div>
  );
}
