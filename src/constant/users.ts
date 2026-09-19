export type UserRole = "super_admin" | "school_admin" | "faculty" | "student";

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  school_admin: "School Admin",
  faculty: "Faculty",
  student: "Student",
};

export const ROLE_SIDEBAR: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { label: "Schools", path: "/dashboard/schools", icon: "schools" },
    { label: "Modules", path: "/dashboard/modules", icon: "modules" },
    { label: "Subjects", path: "/dashboard/subjects", icon: "modules" },
    { label: "Users", path: "/dashboard/users", icon: "users" },
    { label: "Reports", path: "/dashboard/reports", icon: "reports" },
    { label: "Settings", path: "/dashboard/settings", icon: "settings" },
  ],
  school_admin: [
    { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { label: "Faculties", path: "/dashboard/faculties", icon: "faculties" },
    { label: "Students", path: "/dashboard/students", icon: "students" },
    { label: "Classes", path: "/dashboard/classes", icon: "classes" },
    { label: "Enrollments", path: "/dashboard/enrollments", icon: "classes" },
    { label: "Modules", path: "/dashboard/modules", icon: "modules" },
    { label: "Subjects", path: "/dashboard/subjects", icon: "modules" },
    { label: "Reports", path: "/dashboard/reports", icon: "reports" },
    { label: "Settings", path: "/dashboard/settings", icon: "settings" },
  ],
  faculty: [
    { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { label: "My Classes", path: "/dashboard/classes", icon: "classes" },
    { label: "Attendance", path: "/dashboard/attendance", icon: "reports" },
    { label: "Gradebook", path: "/dashboard/gradebook", icon: "grades" },
    { label: "Reports", path: "/dashboard/reports", icon: "reports" },
  ],
  student: [
    { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
    { label: "My Class", path: "/dashboard/classes", icon: "classes" },
    { label: "My Attendance", path: "/dashboard/student-attendance", icon: "reports" },
    { label: "Grades", path: "/dashboard/grades", icon: "grades" },
    { label: "Schedule", path: "/dashboard/schedule", icon: "schedule" },
  ],
};
