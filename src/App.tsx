import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FeaturesProvider } from "./context/FeaturesContext";
import FeatureGate from "./components/FeatureGate";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import MasterLayout from "./components/MasterLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ManageFaculties from "./pages/school_admin/ManageFaculties";
import ManageStudents from "./pages/school_admin/ManageStudents";
import StudentAcademicRecordPage from "./pages/school_admin/StudentAcademicRecordPage";
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
import AdvisoryReportCardsPage from "./pages/faculty/AdvisoryReportCardsPage";
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
  // Subjects are per-school: the super admin has no subjects page of their own.
  if (user?.role === "super_admin") {
    return <Navigate to="/dashboard" replace />;
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
      <FeaturesProvider>
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
                <Route
                  path="students/:studentId/academic-record"
                  element={<ProtectedRoute allowedRoles={["school_admin", "faculty"]} />}
                >
                  <Route
                    index
                    element={
                      <FeatureGate feature="academic_record">
                        <StudentAcademicRecordPage />
                      </FeatureGate>
                    }
                  />
                </Route>
                <Route path="classes" element={<ClassesRoute />} />
                <Route
                  path="classes/:classId/report-cards"
                  element={<ProtectedRoute allowedRoles={["school_admin", "faculty"]} />}
                >
                  <Route
                    index
                    element={
                      <FeatureGate feature="academic_record">
                        <AdvisoryReportCardsPage />
                      </FeatureGate>
                    }
                  />
                </Route>
                <Route
                  path="enrollments"
                  element={
                    <FeatureGate feature="enrollments">
                      <ManageEnrollments />
                    </FeatureGate>
                  }
                />
                <Route path="modules" element={<ManageModules />} />
                <Route path="subjects" element={<SubjectsRoute />} />
                <Route
                  path="attendance-report"
                  element={
                    <FeatureGate feature="attendance_reports">
                      <AttendanceReport />
                    </FeatureGate>
                  }
                />
                <Route
                  path="student-attendance"
                  element={
                    <FeatureGate feature="attendance">
                      <StudentAttendancePage />
                    </FeatureGate>
                  }
                />
                <Route
                  path="attendance"
                  element={
                    <FeatureGate feature="attendance">
                      <FacultyAttendancePage />
                    </FeatureGate>
                  }
                />
                <Route
                  path="gradebook"
                  element={
                    <FeatureGate feature="gradebook">
                      <GradebookPage />
                    </FeatureGate>
                  }
                />
                <Route
                  path="gradebook/:classId/:subjectId"
                  element={
                    <FeatureGate feature="gradebook">
                      <GradebookSubject />
                    </FeatureGate>
                  }
                />
                <Route path="reports" element={<PlaceholderPage />} />
                <Route path="settings" element={<SettingsRoute />} />
                <Route
                  path="grades"
                  element={
                    <FeatureGate feature="gradebook">
                      <StudentGradebookPage />
                    </FeatureGate>
                  }
                />
                <Route path="schedule" element={<PlaceholderPage />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </FeaturesProvider>
    </AuthProvider>
  );
}
