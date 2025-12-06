// src/layouts/ScheduleCommitteeLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../Hooks/AuthContext";
import { Bell } from "lucide-react";
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

export default function ScheduleCommitteeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // 🔹 Fetch notifications on mount
  useEffect(() => {
    if (user?.id && user?.role) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get(
        `/notifications/user/${user.id}/${user.role}`
      );
      setNotifications(res.data || []);
    } catch (err) {
      console.error("❌ Error loading notifications:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
                  to="/schedule_committee"
                  label="Dashboard"
                  icon={<i className="bi bi-speedometer2"></i>}
                />
              </li>
              <li>
                <SideLink
                  to="/schedule_committee/rules"
                  label="Rules"
                  icon={<i className="bi bi-list-check"></i>}
                />
              </li>
              <li>
                <SideLink
                  to="/schedule_committee/schedules"
                  label="Schedules"
                  icon={<i className="bi bi-calendar3"></i>}
                />
              </li>
              <li>
                <SideLink
                  to="/schedule_committee/surveys"
                  label="Surveys"
                  icon={<i className="bi bi-clipboard-data"></i>}
                />
              </li>
              <li>
                <SideLink
                  to="/schedule_committee/feedback"
                  label="Feedback"
                  icon={<i className="bi bi-chat-dots"></i>}
                />
              </li>
              <li>
                <SideLink
                  to="/schedule_committee/notifications"
                  label="Notifications"
                  icon={<i className="bi bi-bell"></i>}
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

        {/* ====== Main Layout Area ====== */}
        <div className="col px-0 d-flex flex-column">
          {/* Navbar */}
          <nav className="navbar navbar-light bg-white px-3 shadow-sm sticky-top d-flex align-items-center">
            <span className="navbar-brand mb-0 h5 text-info">
              Schedule Committee Dashboard
            </span>

            <div className="ms-auto d-flex align-items-center gap-4 position-relative">
              {/* 🔔 Notification Bell */}
              <div className="position-relative">
                <Bell
                  size={22}
                  className="text-info cursor-pointer"
                  onClick={() => setShowDropdown((prev) => !prev)}
                />
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.6rem" }}
                  >
                    {unreadCount}
                  </span>
                )}

                {/* Dropdown */}
                {showDropdown && (
                  <div
                    className="position-absolute end-0 mt-2 bg-white shadow rounded-3 border p-2"
                    style={{
                      width: "320px",
                      zIndex: 1000,
                      maxHeight: "300px",
                      overflowY: "auto",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold text-secondary">
                        Notifications
                      </span>
                      <button
                        className="btn btn-sm btn-light text-info"
                        onClick={() => setShowDropdown(false)}
                      >
                        Close
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center text-muted small py-3">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2 rounded-2 mb-2 ${
                            n.is_read ? "bg-light" : "bg-info bg-opacity-10"
                          }`}
                        >
                          <div className="fw-semibold small text-dark">
                            {n.title || "Notification"}
                          </div>
                          <div className="small text-muted">
                            {n.message || ""}
                          </div>
                          <div className="small text-end text-secondary mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Info */}
              <span
                className="d-inline-block text-primary fw-semibold text-truncate"
                style={{ maxWidth: 260 }}
                title={user?.email}
              >
                {user?.email || ""}
              </span>
            </div>
          </nav>

          {/* Main Content */}
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
