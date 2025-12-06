import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, Frown } from "lucide-react";
import { useAuth } from "../../Hooks/AuthContext";
import apiClient from "../../Services/apiClient";

function SideLink({ to, label, icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        "nav-link d-flex align-items-center gap-2 position-relative rounded-3 px-3 py-2 " +
        (isActive ? "bg-white text-info fw-semibold" : "text-white")
      }
    >
      <span
        aria-hidden="true"
        style={{ display: "inline-grid", placeItems: "center" }}
      >
        {icon}
      </span>
      <span className="text-truncate">{label}</span>
    </NavLink>
  );
}

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const email = user?.email || "";

  useEffect(() => {
    if (user?.id) {
      fetchStudent();
      fetchNotifications();
    }
  }, [user]);

  const fetchStudent = async () => {
    try {
      const res = await apiClient.get(`/students/${user.id}`);
      setStudentInfo(res.data);
    } catch (error) {
      console.error("Failed to fetch student:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get(
        `/notifications/user/${user.id}/${user.role}`
      );
      setNotifications(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch notifications:", err);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate logout delay
      logout();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row flex-nowrap min-vh-100">
        {/* Sidebar */}
        <aside className="col-lg-2 d-none d-lg-flex bg-info text-white p-3 flex-column">
          <div className="d-flex align-items-center gap-2 mb-3">
            <span className="h3 mb-0">SmartSchedule</span>
          </div>

          <nav>
            <ul className="nav nav-pills flex-column mb-auto gap-1">
              <li>
                <SideLink
                  to="/student"
                  label="Dashboard"
                  end={true}
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
                    </svg>
                  }
                />
              </li>
              <li>
                <SideLink
                  to="/student/all_levels"
                  label="All level"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M4 3h12a3 3 0 0 1 3 3v14h-2V6a1 1 0 0 0-1-1H4z" />
                      <path d="M4 5h10a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2z" />
                    </svg>
                  }
                />
              </li>
              <li>
                <SideLink
                  to="/student/surveys"
                  label="Surveys"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M3 3h18v2H3zM3 8h18v2H3zM3 13h18v2H3zM3 18h18v2H3z" />
                    </svg>
                  }
                />
              </li>
              <li>
                <SideLink
                  to="/student/feedback"
                  label="Feedback"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M4 4h16v11H7l-3 3z" />
                    </svg>
                  }
                />
              </li>
            </ul>
          </nav>

          {/* Logout */}
          <div className="mt-auto">
            <button
              className="btn btn-outline-light w-100"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading && (
                <span className="spinner-border spinner-border-sm me-2"></span>
              )}
              {loading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        {/* Main Column */}
        <div className="col px-0 d-flex flex-column">
          {/* Navbar */}
          <nav className="navbar navbar-light bg-light px-3 shadow-sm sticky-top">
            <div className="d-flex align-items-center">
              {/* Mobile menu */}
              <button
                type="button"
                className="p-0 border-0 bg-transparent d-lg-none me-2 text-info"
                data-bs-toggle="offcanvas"
                data-bs-target="#studentOffcanvas"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="26"
                  height="26"
                  fill="currentColor"
                >
                  <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
                </svg>
              </button>
              <span className="navbar-brand mb-0 h4">Student Dashboard</span>
            </div>

            {/* Right Side: Notifications + User */}
            <div className="ms-auto d-flex align-items-center gap-3 position-relative">
              {/* Bell Icon */}
              <div
                className="position-relative cursor-pointer"
                style={{ cursor: "pointer" }}
                onClick={() => setShowNotif(!showNotif)}
              >
                <Bell size={22} className="text-info" />
                {notifications.length > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {notifications.length}
                  </span>
                )}
              </div>

              {/* User info */}
              <div className="text-end">
                <div
                  className="text-primary fw-semibold text-truncate"
                  style={{ maxWidth: 220 }}
                >
                  {studentInfo?.name || "Loading..."}
                </div>
                <small
                  className="text-muted d-block text-truncate"
                  style={{ maxWidth: 220 }}
                >
                  {email}
                </small>
              </div>

              {/* Notifications Dropdown */}
              {showNotif && (
                <div
                  className="position-absolute bg-white shadow rounded-3 p-2"
                  style={{
                    top: "100%",
                    right: 0,
                    width: "300px",
                    maxHeight: "350px",
                    overflowY: "auto",
                    zIndex: 1000,
                  }}
                >
                  {notifications.length === 0 ? (
                    <div className="text-center text-muted py-3">
                      <Frown size={20} className="mb-1" /> <br />
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="border-bottom small py-2 px-2"
                        style={{ cursor: "default" }}
                      >
                        <strong className="text-info d-block">{n.title}</strong>
                        <span className="text-muted">{n.description}</span>
                        <div className="text-end">
                          <small className="text-secondary">
                            {new Date(n.created_at).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Content */}
          <main className="p-3 p-md-4 bg-light flex-grow-1">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="bg-white border-top text-muted small py-2 px-3 text-center">
            © {new Date().getFullYear()} SmartSchedule
          </footer>
        </div>
      </div>
    </div>
  );
}
