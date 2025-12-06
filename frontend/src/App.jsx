import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layouts
import FacultyLayout from "./Components/layouts/FacultyLayout";
import StudentLayout from "./Components/layouts/StudentLayout";
import RegistrarLayout from "./Components/layouts/RegistrarLayout";

// Pages (Auth)
import Login from "./Pages/auth/login";
import ForgotPassword from "./Pages/auth/ForgotPassword";
import ResetPassword from "./Pages/auth/ResetPassword";
import SignUp from "./Pages/auth/SignUp";

// Pages (Faculty)
import FacultyDashboard from "./Pages/faculty/FacultyDashboard";

import FacultyCourses from "./Pages/faculty/FacultyCourses";
import FacultySections from "./Pages/faculty/FacultySections";
import FacultyFeedback from "./Pages/faculty/FacultyFeedback";

// Pages (Student)
import StudentDashboard from "./Pages/student/StudentDashboard";
import AllLevelsSchedules from "./Pages/student/AllLevelsSchedules";

import StudentSurveys from "./Pages/student/StudentSurveys";
import StudentSurveyDetails from "./Pages/student/StudentSurveyDetails";
import StudentFeedback from "./Pages/student/StudentFeedback";

// Pages (Registrar)
import RegistrarDashboard from "./Pages/registrar/RegistrarDashboard";
import CourseCapacity from "./Pages/registrar/CourseCapacity";

// Pages (schedule_committee)
import ScheduleCommitteeDashboard from "./Pages/schedule_committee/ScheduleCommitteeDashboard";


import Schedules from "./Pages/schedule_committee/Schedules";
import ScheduleDetails from "./Pages/schedule_committee/ScheduleDetails";

import Surveys from "./Pages/schedule_committee/Surveys";
import Feedback from "./Pages/schedule_committee/Feedback";
import Notifications from "./Pages/schedule_committee/Notifications";
import Rules from "./Pages/schedule_committee/Rules";


//load committee
import LoadCommitteeDashboard from "./Pages/loadcommitte/LoadCommitteeDashboard";
import LoadCommitteeCourses from "./Pages/loadcommitte/LoadCommitteeCourses";
import LoadCommitteeFeedback from "./Pages/loadcommitte/LoadCommitteeFeedback";
import LoadCommitteeLayout from "./Components/layouts/LoadCommitteLayout";
import ScheduleCommitteeLayout from "./Components/layouts/ScheduleCommitteeLayout";
import LoadScheduleDetails from "./Pages/loadcommitte/LoadScheduleDetails";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Redirect Root to Committee (ممكن تغيريها حسب اللي تحبي) */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Faculty Routes */}
        <Route path="/faculty" element={<FacultyLayout />}>
          <Route index element={<FacultyDashboard />} /> {/* /faculty */}
          <Route path="courses" element={<FacultyCourses />} />
          <Route path="sections" element={<FacultySections />} />
          <Route path="feedback" element={<FacultyFeedback />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} /> {/* /students */}
          <Route path="all_levels" element={<AllLevelsSchedules />} />
          <Route path="surveys" element={<StudentSurveys />} />
          <Route
            path="surveys/:surveyId"
            element={<StudentSurveyDetails key={window.location.pathname} />}
          />
          <Route path="feedback" element={<StudentFeedback />} />
        </Route>

        {/* Registrar Routes */}
        <Route path="/registrar" element={<RegistrarLayout />}>
          <Route index element={<RegistrarDashboard />} /> {/* /registrar */}
          <Route path="course-capacity" element={<CourseCapacity />} />
        </Route>

        <Route path="/load_committee" element={<LoadCommitteeLayout />}>
          <Route index element={<LoadCommitteeDashboard />} />
          <Route path="faculty_schedules" element={<LoadCommitteeCourses />} />
          <Route path="feedback" element={<LoadCommitteeFeedback />} />
          <Route
            path="schedules/:schedule_id"
            element={<LoadScheduleDetails />}
          />
        </Route>

        {/* schedule_committee Routes */}
        <Route path="/schedule_committee" element={<ScheduleCommitteeLayout />}>
          <Route index element={<ScheduleCommitteeDashboard />} />
          <Route path="schedules" element={<Schedules />} />
          <Route path="schedules/:schedule_id" element={<ScheduleDetails />} />
         
          <Route path="surveys" element={<Surveys />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="rules" element={<Rules />} />
        
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
