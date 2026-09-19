import { useAuth } from "../context/AuthContext";
import SuperAdminDashboard from "./admin/SuperAdminDashboard";
import SchoolAdminDashboard from "./school_admin/SchoolAdminDashboard";
import FacultyDashboard from "./faculty/FacultyDashboard";
import StudentDashboard from "./student/StudentDashboard";

const dashboards = {
  super_admin: SuperAdminDashboard,
  school_admin: SchoolAdminDashboard,
  faculty: FacultyDashboard,
  student: StudentDashboard,
};

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const DashboardComponent = dashboards[user.role];

  if (!DashboardComponent) {
    return (
      <div className="dash-page">
        <h1 className="dash-title">Unknown Role</h1>
        <p className="dash-subtitle">Your role ({user.role}) is not recognized.</p>
      </div>
    );
  }

  return <DashboardComponent />;
}
