import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import MasterLayout from "./components/MasterLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ManageFaculties from "./pages/school_admin/ManageFaculties";
import ManageStudents from "./pages/school_admin/ManageStudents";
import ManageClasses from "./pages/school_admin/ManageClasses";
import ManageEnrollments from "./pages/school_admin/ManageEnrollments";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageSchools from "./pages/admin/ManageSchools";
import ManageModules from "./pages/admin/ManageModules";
import ManageClassesAdmin from "./pages/admin/ManageClasses";
import ManageSubjectsAdmin from "./pages/admin/ManageSubjects";
import ManageSubjects from "./pages/school_admin/ManageSubjects";
import ClassesPage from "./pages/ClassesPage";
import AttendanceReport from "./pages/school_admin/AttendanceReport";
import StudentAttendancePage from "./pages/student/StudentAttendancePage";
import StudentClassPage from "./pages/student/StudentClassPage";
import GradebookPage from "./pages/faculty/GradebookPage";
import GradebookSubject from "./pages/faculty/GradebookSubject";
import FacultyAttendancePage from "./pages/faculty/FacultyAttendancePage";
import StudentGradebookPage from "./pages/student/StudentGradebookPage";
import SchoolSettings from "./pages/school_admin/SchoolSettings";
import SettingsPage from "./pages/SettingsPage";

import { useAuth } from "./context/AuthContext";

const SettingsRoute = () => {
  const { user } = useAuth();
  if (user?.role === "school_admin") {
    return <SchoolSettings />;
  }
  return <SettingsPage />;
};

const ClassesRoute = () => {
  const { user } = useAuth();
  if (user?.role === "super_admin") {
    return <ManageClassesAdmin />;
  }
  if (user?.role === "school_admin") {
    return <ManageClasses />;
  }
  if (user?.role === "student") {
    return <StudentClassPage />;
  }
  return <ClassesPage role="faculty" />;
};

const SubjectsRoute = () => {
  const { user } = useAuth();
  if (user?.role === "super_admin") {
    return <ManageSubjectsAdmin />;
  }
  if (user?.role === "school_admin") {
    return <ManageSubjects />;
  }
  // faculty and student - read-only view
  return <ManageSubjectsAdmin />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<MasterLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="schools" element={<ManageSchools />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="faculties" element={<ManageFaculties />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="classes" element={<ClassesRoute />} />
              <Route path="enrollments" element={<ManageEnrollments />} />
              <Route path="modules" element={<ManageModules />} />
              <Route path="subjects" element={<SubjectsRoute />} />
              <Route path="attendance-report" element={<AttendanceReport />} />
              <Route path="student-attendance" element={<StudentAttendancePage />} />
              <Route path="attendance" element={<FacultyAttendancePage />} />
              <Route path="gradebook" element={<GradebookPage />} />
              <Route path="gradebook/:classId/:subjectId" element={<GradebookSubject />} />
              <Route path="reports" element={<PlaceholderPage />} />
              <Route path="settings" element={<SettingsRoute />} />
              <Route path="grades" element={<StudentGradebookPage />} />
              <Route path="schedule" element={<PlaceholderPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
