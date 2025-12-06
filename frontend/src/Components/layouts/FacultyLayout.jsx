import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../Hooks/AuthContext";
import { Bell, Frown } from "lucide-react";
import apiClient from "../../Services/apiClient";

function SideLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end
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

export default function FacultyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ✅ Fetch notifications
  useEffect(() => {
    if (user?.id && user?.role) fetchNotifications();
  }, [user]);

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

  return (
    <div className="container-fluid">
      <div className="row flex-nowrap min-vh-100">
        {/* Sidebar */}
        <aside className="col-lg-2 d-none d-lg-flex bg-info text-white p-3 flex-column">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="h3 mb-0">SmartSchedule</span>
          </div>

          <nav>
            <ul className="nav nav-pills flex-column mb-auto gap-1">
              <li>
                <SideLink
                  to="/faculty"
                  label="Dashboard"
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
                  to="/faculty/courses"
                  label="My Courses"
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
                  to="/faculty/sections"
                  label="My Sections"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M12 2 1 7l11 5 11-5z" />
                      <path d="M1 12l11 5 11-5v3l-11 5L1 15z" />
                    </svg>
                  }
                />
              </li>

              <li>
                <SideLink
                  to="/faculty/feedback"
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
              type="button"
              className="btn btn-outline-light w-100"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Offcanvas Sidebar (mobile/tablet) */}
        <div
          className="offcanvas offcanvas-start text-white bg-info"
          tabIndex={-1}
          id="facultyOffcanvas"
          aria-labelledby="facultyOffcanvasLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="facultyOffcanvasLabel">
              SmartSchedule
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body">
            <ul className="nav nav-pills flex-column mb-auto gap-1">
              <li data-bs-dismiss="offcanvas">
                <SideLink
                  to="/faculty"
                  label="Dashboard"
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
              <li data-bs-dismiss="offcanvas">
                <SideLink
                  to="/faculty/courses"
                  label="My Courses"
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
              <li data-bs-dismiss="offcanvas">
                <SideLink
                  to="/faculty/sections"
                  label="My Sections"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M12 2 1 7l11 5 11-5z" />
                      <path d="M1 12l11 5 11-5v3l-11 5L1 15z" />
                    </svg>
                  }
                />
              </li>
              <li data-bs-dismiss="offcanvas">
                <SideLink
                  to="/faculty/feedback"
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

            {/* Logout inside offcanvas */}
            <button
              type="button"
              className="btn btn-outline-light w-100 mt-3"
              onClick={handleLogout}
              data-bs-dismiss="offcanvas"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main column */}
        <div className="col px-0 d-flex flex-column">
          {/* Top navbar */}
          <nav className="navbar navbar-light bg-light px-3 shadow-sm sticky-top">
            {/* Hamburger icon (mobile) */}
            <button
              type="button"
              className="p-0 border-0 bg-transparent d-lg-none me-2 text-info d-inline-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40 }}
              data-bs-toggle="offcanvas"
              data-bs-target="#facultyOffcanvas"
              aria-controls="facultyOffcanvas"
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

            {/* Brand */}
            <span className="navbar-brand mb-0 h4">Faculty Dashboard</span>

            {/* Right side: Notifications + Email */}
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

              {/* Email */}
              <span
                className="d-inline-block text-primary fw-semibold text-truncate"
                style={{ maxWidth: 260 }}
                title={user?.email}
              >
                {user?.email || ""}
              </span>

              {/* Notifications dropdown */}
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
                      <div key={n.id} className="border-bottom small py-2 px-2">
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

          {/* Main content */}
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
